// Design Archive 服务工作者
// 提供离线支持和缓存功能

const CACHE_NAME = "design-archive-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/data.json",
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=800&q=80",
];

// 安装事件
self.addEventListener("install", (event) => {
  console.log("Service Worker 安装中...");

  // 预缓存关键资源
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("缓存关键资源");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("所有资源已缓存");
        return self.skipWaiting();
      })
  );
});

// 激活事件
self.addEventListener("activate", (event) => {
  console.log("Service Worker 激活中...");

  // 清除旧缓存
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("删除旧缓存:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker 已激活");
        return self.clients.claim();
      })
  );
});

// 获取事件
self.addEventListener("fetch", (event) => {
  // 忽略非GET请求
  if (event.request.method !== "GET") return;

  // 忽略扩展请求
  if (event.request.url.indexOf("chrome-extension") !== -1) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果缓存中有，返回缓存内容
      if (response) {
        return response;
      }

      // 否则从网络获取
      return fetch(event.request)
        .then((response) => {
          // 检查响应是否有效
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // 克隆响应以进行缓存
          const responseToCache = response.clone();

          // 缓存新资源
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.log("网络请求失败:", error);
          // 对于HTML请求，返回缓存的首页
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/index.html");
          }

          // 对于图片请求，返回一个占位图
          if (event.request.headers.get("accept").includes("image")) {
            return new Response(
              '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f5f5f7"/><text x="200" y="150" text-anchor="middle" fill="#999" font-family="Arial" font-size="16">图片加载中...</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
        });
    })
  );
});

// 后台同步（如果浏览器支持）
self.addEventListener("sync", (event) => {
  console.log("后台同步:", event.tag);
});

// 推送通知（如果浏览器支持）
self.addEventListener("push", (event) => {
  console.log("推送通知:", event);

  const options = {
    body: "Design Archive 有新的设计作品更新！",
    icon: "icons/icon-192x192.png",
    badge: "icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "探索新设计",
      },
      {
        action: "close",
        title: "关闭",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Design Archive", options)
  );
});

// 通知点击事件
self.addEventListener("notificationclick", (event) => {
  console.log("通知点击:", event.notification.tag);
  event.notification.close();

  if (event.action === "explore") {
    // 打开应用
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((windowClients) => {
        for (let client of windowClients) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});
