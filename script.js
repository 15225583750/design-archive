// Design Archive - 主脚本文件
// 使用模块化设计模式

// --- 全局配置 ---
const CONFIG = {
  ITEMS_PER_PAGE: 12,
  LAZY_LOAD_THRESHOLD: 100, // 像素，用于懒加载
  DEBOUNCE_DELAY: 300, // 防抖延迟（毫秒）
  STORAGE_KEY: "designArchiveFavorites",
  STORAGE_THEME_KEY: "designArchiveTheme",
};

// --- 状态管理 ---
class DesignArchiveState {
  constructor() {
    // 数据状态
    this.designs = [];
    this.filteredDesigns = [];
    this.displayedDesigns = [];

    // 用户状态
    this.favorites = new Set();
    this.currentPage = 1;
    this.hasMore = true;

    // 筛选状态
    this.filters = {
      search: "",
      category: "",
      decade: "",
      region: "",
      sort: "relevance",
    };

    // UI状态
    this.isShowingFavorites = false;
    this.currentModalItem = null;
    this.isDarkMode = false;
    this.isLoading = false;
  }

  // 获取收藏数量
  get favoritesCount() {
    return this.favorites.size;
  }

  // 获取总设计数量
  get totalCount() {
    return this.designs.length;
  }

  // 获取当前筛选后的数量
  get filteredCount() {
    return this.filteredDesigns.length;
  }
}

// --- 主应用 ---
class DesignArchiveApp {
  constructor() {
    this.state = new DesignArchiveState();
    this.elements = this.cacheElements();
    this.init();
  }

  // 缓存DOM元素
  cacheElements() {
    return {
      // 导航
      navbar: document.querySelector(".navbar"),
      themeToggle: document.getElementById("theme-toggle"),
      mobileMenuToggle: document.getElementById("mobile-menu-toggle"),
      navLinks: document.getElementById("nav-links"),

      // 关于模态框
      aboutModal: document.getElementById("about-modal"),
      closeAboutModal: document.querySelector(".close-info-modal"),

      // 搜索与筛选
      searchInput: document.getElementById("search-input"),
      clearSearch: document.getElementById("clear-search"),
      filterCategory: document.getElementById("filter-category"),
      filterDecade: document.getElementById("filter-decade"),
      filterRegion: document.getElementById("filter-region"),
      filterSort: document.getElementById("filter-sort"),
      activeFilters: document.getElementById("active-filters"),

      // 控制按钮
      favoritesToggle: document.getElementById("favorites-toggle"),
      resetFilters: document.getElementById("reset-filters"),
      resetSearch: document.getElementById("reset-search"),

      // 统计
      totalCount: document.getElementById("total-count"),
      filteredCount: document.getElementById("filtered-count"),
      favoritesCount: document.getElementById("favorites-count"),

      // 画廊
      gallery: document.getElementById("gallery"),
      loadingIndicator: document.getElementById("loading-indicator"),
      noResults: document.getElementById("no-results"),
      loadMoreContainer: document.getElementById("load-more-container"),
      loadMoreBtn: document.getElementById("load-more-btn"),

      // 详情模态框
      modal: document.getElementById("modal"),
      closeBtn: document.querySelector(".close-btn"),
      modalImg: document.getElementById("modal-img"),
      modalCategory: document.getElementById("modal-category"),
      modalTitle: document.getElementById("modal-title"),
      modalAuthor: document.getElementById("modal-author"),
      modalYear: document.getElementById("modal-year"),
      modalRegion: document.getElementById("modal-region"),
      modalDesc: document.getElementById("modal-desc"),
      modalImpact: document.getElementById("modal-impact"),
      modalMaterials: document.getElementById("modal-materials"),
      modalStyles: document.getElementById("modal-styles"),
      relatedDesigns: document.getElementById("related-designs"),
      modalFavoriteBtn: document.getElementById("modal-favorite"),
      modalShareBtn: document.getElementById("modal-share"),

      // 分享工具提示
      shareTooltip: document.getElementById("share-tooltip"),

      // 页脚链接
      footerLinks: document.querySelectorAll('.footer-link[href^="#"]'),
    };
  }

  // 初始化应用
  async init() {
    try {
      // 加载设计数据
      await this.loadDesignData();

      // 加载用户偏好
      this.loadUserPreferences();

      // 初始化事件监听
      this.initEventListeners();

      // 初始渲染
      this.applyFilters();
      this.updateStats();

      // 初始化图片懒加载观察器
      this.initLazyLoadObserver();

      console.log("Design Archive 应用初始化完成");
    } catch (error) {
      console.error("初始化失败:", error);
      this.showError("无法加载设计数据，请刷新页面重试。");
    }
  }

  // 加载设计数据
  async loadDesignData() {
    try {
      // 模拟API延迟
      this.showLoading(true);

      // 实际部署时应从JSON文件加载
      const response = await fetch("data.json");
      if (!response.ok) throw new Error("数据加载失败");

      const data = await response.json();
      this.state.designs = data.designs || data;

      // 为每个设计添加唯一ID（如果不存在）
      this.state.designs.forEach((design, index) => {
        if (!design.id) design.id = index + 1;
        // 确保有默认图像
        if (!design.image)
          design.image = `https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80`;
      });

      this.showLoading(false);
    } catch (error) {
      // 如果无法加载外部数据，使用内置数据
      console.warn("使用内置数据:", error);
      this.state.designs = this.getDefaultDesignData();
      this.showLoading(false);
    }
  }

  // 获取默认设计数据（回退）
  getDefaultDesignData() {
    return [
      {
        id: 1,
        title: "Braun T3 Pocket Radio",
        designer: "Dieter Rams",
        author: "Dieter Rams",
        year: "1958",
        category: "Industrial",
        region: "Europe",
        image:
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
        description:
          "博朗 T3 收音机是极简主义设计的典范。Dieter Rams 奉行的'少即是多'原则直接影响了后来的 Apple iPod 设计。其简单的转盘和网格设计至今仍不过时。",
        materials: ["塑料", "金属"],
        style: ["极简主义", "功能主义"],
        impact: "定义了现代消费电子产品的设计语言",
      },
      {
        id: 2,
        title: "Smartisan T1",
        designer: "Smartisan",
        author: "Smartisan",
        year: "2014",
        category: "Product",
        region: "Asia",
        image:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        description:
          "蕴繁于简，至曲近乎。Smartisan T1 是对对称美学的极致追求，背板边缘微妙的曲面过渡反射出玉石般的温润质感，用细致入微的思考和非凡的工艺创造极致的简洁美感。",
        materials: ["3D玻璃", "不锈钢中框"],
        style: ["对称美学", "拟物化", "现代主义"],
        impact: "重新定义了智能手机的美学标准",
      },
      {
        id: 3,
        title: "Helvetica Typeface",
        designer: "Max Miedinger",
        author: "Max Miedinger",
        year: "1957",
        category: "Graphic",
        region: "Europe",
        image:
          "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=800&q=80",
        description:
          "Helvetica 字体是瑞士风格平面设计的代表。它的中性、清晰和客观性使其成为世界上最著名的字体，广泛应用于各种品牌标识中，包括纽约地铁系统。",
        materials: ["字体设计"],
        style: ["瑞士风格", "现代主义"],
        impact: "成为全球最广泛使用的无衬线字体",
      },
      {
        id: 4,
        title: "Leica M3",
        designer: "Leitz",
        author: "Leitz",
        year: "1954",
        category: "Industrial",
        region: "Europe",
        image:
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        description:
          "徕卡 M3 被认为是历史上最伟大的相机之一。它确立了旁轴相机的标准，其机械结构的精密程度令人叹为观止，是摄影师眼中的精密仪器。",
        materials: ["金属", "皮革"],
        style: ["功能主义", "精密工程"],
        impact: "确立了专业相机的设计标准",
      },
      {
        id: 5,
        title: "Sony Walkman TPS-L2",
        designer: "Norio Ohga",
        author: "Sony",
        year: "1979",
        category: "Consumer",
        region: "Asia",
        image:
          "https://images.unsplash.com/photo-1598301257983-0cbe50a2e48c?auto=format&fit=crop&w=800&q=80",
        description:
          "索尼 Walkman 改变了人们听音乐的方式，音乐从此变得私人化和便携化。其蓝银配色的设计既未来又复古，开启了移动音乐时代。",
        materials: ["塑料", "金属"],
        style: ["未来主义", "便携设计"],
        impact: "开创了个人便携音乐播放器市场",
      },
      {
        id: 6,
        title: "Macintosh 128K",
        designer: "Jerry Manock",
        author: "Apple",
        year: "1984",
        category: "Digital",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80",
        description:
          "第一台 Macintosh 电脑。它那友好的'笑脸'开机画面和一体化米色机身，让计算机从冷冰冰的机器变成了平易近人的家用电器。",
        materials: ["塑料", "金属"],
        style: ["友好设计", "一体化设计"],
        impact: "普及了图形用户界面和个人计算机",
      },
      {
        id: 7,
        title: "iPhone",
        designer: "Apple",
        author: "Apple",
        year: "2007",
        category: "Consumer",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        description:
          "第一代 iPhone 重新定义了智能手机。它将 iPod 的音乐功能、手机的通话功能和互联网通信设备整合到一个手持设备中，开启了移动计算的新时代。",
        materials: ["玻璃", "金属"],
        style: ["现代主义", "极简主义"],
        impact: "彻底改变了智能手机行业和移动计算",
      },
      {
        id: 8,
        title: "Apple Watch Series",
        designer: "Apple",
        author: "Apple",
        year: "2015",
        category: "Consumer",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1434493650001-5d43a6fea0a6?auto=format&fit=crop&w=800&q=80",
        description:
          "Apple Watch 重新定义了可穿戴设备。它将健康监测、通讯和个人助理功能集成到优雅的腕表设计中，成为最成功的智能手表。",
        materials: ["陶瓷", "金属", "蓝宝石"],
        style: ["可穿戴设计", "健康科技"],
        impact: "推动了可穿戴设备和健康监测技术的发展",
      },
      {
        id: 9,
        title: "PlayStation 5",
        designer: "Sony",
        author: "Sony",
        year: "2020",
        category: "Consumer",
        region: "Asia",
        image:
          "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
        description:
          "PlayStation 5 拥有大胆且富有未来感的设计，体现了其跨越几代的演变历程。凭借其先进技术、多层次生态系统以及简洁流畅的建筑造型语言，它有潜力将游戏体验推向新的高度。",
        materials: ["塑料", "金属"],
        style: ["未来主义", "游戏设计"],
        impact: "展示了游戏主机设计的未来方向",
      },
      {
        id: 10,
        title: "Eames Lounge Chair",
        designer: "Charles and Ray Eames",
        author: "Herman Miller",
        year: "1956",
        category: "Furniture",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
        description:
          "伊姆斯休闲椅是现代家具设计的标志。它将豪华的舒适感与简洁的现代美学相结合，使用模压胶合板和皮革创造了一个既舒适又美观的座椅。",
        materials: ["胶合板", "皮革", "铝"],
        style: ["现代主义", "有机设计"],
        impact: "成为20世纪最具代表性的家具设计之一",
      },
      {
        id: 11,
        title: "Coca-Cola Contour Bottle",
        designer: "Earl R. Dean",
        author: "Coca-Cola",
        year: "1915",
        category: "Product",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
        description:
          "可口可乐弧形瓶是包装设计的经典之作。其独特的曲线设计即使在黑暗中也能被识别，成为品牌识别的完美典范。",
        materials: ["玻璃", "塑料"],
        style: ["经典", "品牌设计"],
        impact: "创造了最具辨识度的产品包装之一",
      },
      {
        id: 12,
        title: "Barcelona Chair",
        designer: "Ludwig Mies van der Rohe",
        author: "Knoll",
        year: "1929",
        category: "Furniture",
        region: "Europe",
        image:
          "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80",
        description:
          "巴塞罗那椅是现代主义设计的标志。它最初为1929年巴塞罗那国际博览会德国馆设计，体现了'少即是多'的设计哲学。",
        materials: ["不锈钢", "皮革"],
        style: ["现代主义", "国际风格"],
        impact: "定义了现代奢华家具的标准",
      },
      {
        id: 13,
        title: "Google Home",
        designer: "Google",
        author: "Google",
        year: "2016",
        category: "Digital",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80",
        description:
          "Google Home 智能音箱将人工智能助手带入家庭环境。其织物外壳和简约设计使其能够融入各种家居风格，同时提供强大的语音交互功能。",
        materials: ["塑料", "织物"],
        style: ["友好设计", "现代主义"],
        impact: "推动了智能家居和语音助手的普及",
      },
      {
        id: 14,
        title: "Nike Air Max",
        designer: "Tinker Hatfield",
        author: "Nike",
        year: "1987",
        category: "Product",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        description:
          "Nike Air Max 系列运动鞋通过可见的气垫技术革新了鞋类设计。其创新的设计不仅提供了卓越的缓震性能，也成为了街头文化的标志。",
        materials: ["皮革", "网眼", "气垫"],
        style: ["运动设计", "街头文化"],
        impact: "将运动鞋从功能产品转变为文化符号",
      },
      {
        id: 15,
        title: "iMac G3",
        designer: "Jonathan Ive",
        author: "Apple",
        year: "1998",
        category: "Digital",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        description:
          "iMac G3 通过其半透明的邦迪蓝外壳彻底改变了个人电脑的外观。它将显示器和主机集成在一起，并提供了多种鲜艳的颜色选择。",
        materials: ["塑料", "CRT显示屏"],
        style: ["色彩设计", "一体化"],
        impact: "拯救了苹果公司并重新定义了个人电脑设计",
      },
      {
        id: 16,
        title: "Volkswagen Beetle",
        designer: "Ferdinand Porsche",
        author: "Volkswagen",
        year: "1938",
        category: "Industrial",
        region: "Europe",
        image:
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
        description:
          "大众甲壳虫是历史上最著名的汽车设计之一。其圆润的形状、后置发动机和耐用性使其成为全球最畅销的汽车之一。",
        materials: ["钢", "玻璃"],
        style: ["流线型", "经典"],
        impact: "成为汽车设计史上最易识别的形状之一",
      },
      {
        id: 17,
        title: "MUJI CD Player",
        designer: "Naoto Fukasawa",
        author: "MUJI",
        year: "1999",
        category: "Product",
        region: "Asia",
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        description:
          "无印良品壁挂式CD播放器以其极简设计和直观操作而闻名。它通过一根拉绳控制播放，将复杂技术隐藏在简洁形式之下。",
        materials: ["塑料", "金属"],
        style: ["极简主义", "无意识设计"],
        impact: "展示了日本极简主义设计的精髓",
      },
      {
        id: 18,
        title: "London Underground Map",
        designer: "Harry Beck",
        author: "Harry Beck",
        year: "1933",
        category: "Graphic",
        region: "Europe",
        image:
          "https://images.unsplash.com/photo-1590691565924-90d0a14443b3?auto=format&fit=crop&w=800&q=80",
        description:
          "伦敦地铁图是信息设计的里程碑。它放弃了地理准确性，采用电路图式的抽象设计，使复杂的交通网络变得清晰易懂。",
        materials: ["印刷设计"],
        style: ["信息设计", "现代主义"],
        impact: "成为全球交通地图设计的标准",
      },
      {
        id: 19,
        title: "Airbnb Logo",
        designer: "DesignStudio",
        author: "Airbnb",
        year: "2014",
        category: "Graphic",
        region: "Global",
        image:
          "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?auto=format&fit=crop&w=800&q=80",
        description:
          "Airbnb 的 Bélo 符号代表了归属感。它结合了人物、地点和爱的象征，创建了一个可以全球识别的新标志。",
        materials: ["品牌设计"],
        style: ["符号设计", "现代主义"],
        impact: "展示了数字时代品牌标识的演变",
      },
      {
        id: 20,
        title: "Tesla Model S",
        designer: "Franz von Holzhausen",
        author: "Tesla",
        year: "2012",
        category: "Industrial",
        region: "North America",
        image:
          "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
        description:
          "特斯拉 Model S 重新定义了电动汽车设计。它拥有流畅的空气动力学外形、极简的内饰和巨大的触摸屏界面，将性能与可持续性相结合。",
        materials: ["铝", "玻璃", "皮革"],
        style: ["未来主义", "空气动力学"],
        impact: "推动了电动汽车的普及和设计创新",
      },
    ];
  }

  // 加载用户偏好
  loadUserPreferences() {
    // 加载收藏
    const savedFavorites = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites);
        this.state.favorites = new Set(favorites);
      } catch (e) {
        console.error("无法解析收藏数据:", e);
        this.state.favorites = new Set();
      }
    }

    // 加载主题偏好
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_THEME_KEY);
    if (savedTheme === "dark") {
      this.enableDarkMode();
    } else if (savedTheme === "light") {
      this.enableLightMode();
    } else {
      // 检查系统偏好
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        this.enableDarkMode();
      } else {
        this.enableLightMode();
      }
    }
  }

  // 初始化事件监听
  initEventListeners() {
    // 导航事件
    this.elements.themeToggle.addEventListener("click", () =>
      this.toggleTheme()
    );
    this.elements.mobileMenuToggle.addEventListener("click", () =>
      this.toggleMobileMenu()
    );

    // 关于模态框
    document.querySelectorAll('.nav-link[href="#about"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.openAboutModal();
      });
    });

    this.elements.closeAboutModal.addEventListener("click", () =>
      this.closeAboutModal()
    );
    this.elements.aboutModal.addEventListener("click", (e) => {
      if (e.target === this.elements.aboutModal) this.closeAboutModal();
    });

    // 搜索事件
    this.elements.searchInput.addEventListener(
      "input",
      this.debounce(() => this.handleSearch(), CONFIG.DEBOUNCE_DELAY)
    );

    this.elements.clearSearch.addEventListener("click", () =>
      this.clearSearch()
    );

    // 筛选事件
    this.elements.filterCategory.addEventListener("change", () =>
      this.handleFilterChange()
    );
    this.elements.filterDecade.addEventListener("change", () =>
      this.handleFilterChange()
    );
    this.elements.filterRegion.addEventListener("change", () =>
      this.handleFilterChange()
    );
    this.elements.filterSort.addEventListener("change", () =>
      this.handleFilterChange()
    );

    // 控制按钮事件
    this.elements.favoritesToggle.addEventListener("click", () =>
      this.toggleFavoritesView()
    );
    this.elements.resetFilters.addEventListener("click", () =>
      this.resetAllFilters()
    );
    this.elements.resetSearch.addEventListener("click", () =>
      this.resetAllFilters()
    );

    // 模态框事件
    this.elements.closeBtn.addEventListener("click", () => this.closeModal());
    this.elements.modal.addEventListener("click", (e) => {
      if (e.target === this.elements.modal) this.closeModal();
    });

    this.elements.modalFavoriteBtn.addEventListener("click", () =>
      this.toggleFavoriteInModal()
    );
    this.elements.modalShareBtn.addEventListener("click", () =>
      this.shareDesign()
    );

    // 键盘事件
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.elements.modal.style.display === "flex") {
          this.closeModal();
        }
        if (this.elements.aboutModal.classList.contains("show")) {
          this.closeAboutModal();
        }
      }
    });

    // 无限滚动/加载更多
    this.elements.loadMoreBtn.addEventListener("click", () => this.loadMore());

    // 页脚锚点链接
    this.elements.footerLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    // 导航栏滚动效果
    window.addEventListener(
      "scroll",
      this.debounce(() => this.handleScroll(), 100)
    );
  }

  // --- 筛选与搜索逻辑 ---

  // 处理搜索
  handleSearch() {
    const searchTerm = this.elements.searchInput.value.trim().toLowerCase();
    this.state.filters.search = searchTerm;

    // 显示/隐藏清除按钮
    if (searchTerm) {
      this.elements.clearSearch.classList.add("visible");
    } else {
      this.elements.clearSearch.classList.remove("visible");
    }

    this.applyFilters();
  }

  // 清除搜索
  clearSearch() {
    this.elements.searchInput.value = "";
    this.elements.clearSearch.classList.remove("visible");
    this.state.filters.search = "";
    this.applyFilters();
  }

  // 处理筛选变化
  handleFilterChange() {
    this.state.filters.category = this.elements.filterCategory.value;
    this.state.filters.decade = this.elements.filterDecade.value;
    this.state.filters.region = this.elements.filterRegion.value;
    this.state.filters.sort = this.elements.filterSort.value;

    this.applyFilters();
  }

  // 应用所有筛选
  applyFilters() {
    // 重置分页
    this.state.currentPage = 1;
    this.state.displayedDesigns = [];

    // 获取基础数据集
    let filteredData = this.state.isShowingFavorites
      ? this.state.designs.filter((item) => this.state.favorites.has(item.id))
      : [...this.state.designs];

    // 应用文本搜索
    if (this.state.filters.search) {
      filteredData = filteredData.filter(
        (item) =>
          item.title.toLowerCase().includes(this.state.filters.search) ||
          item.designer.toLowerCase().includes(this.state.filters.search) ||
          (item.author &&
            item.author.toLowerCase().includes(this.state.filters.search)) ||
          item.year.includes(this.state.filters.search) ||
          item.category.toLowerCase().includes(this.state.filters.search) ||
          (item.description &&
            item.description
              .toLowerCase()
              .includes(this.state.filters.search)) ||
          (item.style &&
            item.style.some((s) =>
              s.toLowerCase().includes(this.state.filters.search)
            ))
      );
    }

    // 应用分类筛选
    if (this.state.filters.category) {
      filteredData = filteredData.filter(
        (item) => item.category === this.state.filters.category
      );
    }

    // 应用年代筛选
    if (this.state.filters.decade) {
      const decadeStart = parseInt(this.state.filters.decade);
      const decadeEnd = decadeStart + 9;
      filteredData = filteredData.filter((item) => {
        const year = parseInt(item.year);
        return year >= decadeStart && year <= decadeEnd;
      });
    }

    // 应用地区筛选
    if (this.state.filters.region) {
      filteredData = filteredData.filter(
        (item) => item.region === this.state.filters.region
      );
    }

    // 应用排序
    switch (this.state.filters.sort) {
      case "year-desc":
        filteredData.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        break;
      case "year-asc":
        filteredData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
        break;
      case "name-asc":
        filteredData.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default: // relevance
        if (this.state.filters.search) {
          filteredData.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(
              a,
              this.state.filters.search
            );
            const bScore = this.calculateRelevanceScore(
              b,
              this.state.filters.search
            );
            return bScore - aScore;
          });
        }
        break;
    }

    this.state.filteredDesigns = filteredData;
    this.state.hasMore = filteredData.length > CONFIG.ITEMS_PER_PAGE;

    // 更新UI
    this.updateActiveFiltersDisplay();
    this.updateStats();
    this.renderGallery();

    // 检查是否有结果
    if (filteredData.length === 0) {
      this.elements.noResults.style.display = "block";
      this.elements.loadMoreContainer.style.display = "none";
    } else {
      this.elements.noResults.style.display = "none";
      this.elements.loadMoreContainer.style.display = "block";
    }
  }

  // 计算相关性分数
  calculateRelevanceScore(item, searchTerm) {
    let score = 0;

    if (item.title.toLowerCase().includes(searchTerm)) score += 10;
    if (item.designer.toLowerCase().includes(searchTerm)) score += 8;
    if (item.author && item.author.toLowerCase().includes(searchTerm))
      score += 6;
    if (item.category.toLowerCase().includes(searchTerm)) score += 4;
    if (item.description && item.description.toLowerCase().includes(searchTerm))
      score += 3;
    if (
      item.style &&
      item.style.some((s) => s.toLowerCase().includes(searchTerm))
    )
      score += 2;

    return score;
  }

  // 重置所有筛选
  resetAllFilters() {
    // 重置筛选状态
    this.state.filters = {
      search: "",
      category: "",
      decade: "",
      region: "",
      sort: "relevance",
    };

    // 重置UI
    this.elements.searchInput.value = "";
    this.elements.clearSearch.classList.remove("visible");
    this.elements.filterCategory.value = "";
    this.elements.filterDecade.value = "";
    this.elements.filterRegion.value = "";
    this.elements.filterSort.value = "relevance";

    // 重置收藏视图状态
    this.state.isShowingFavorites = false;
    this.elements.favoritesToggle.classList.remove("active");

    // 重新应用筛选
    this.applyFilters();
  }

  // --- 渲染逻辑 ---

  // 渲染画廊
  renderGallery() {
    // 计算要显示的项目
    const startIndex = 0;
    const endIndex = Math.min(
      this.state.currentPage * CONFIG.ITEMS_PER_PAGE,
      this.state.filteredDesigns.length
    );

    const itemsToShow = this.state.filteredDesigns.slice(startIndex, endIndex);

    // 清空画廊
    this.elements.gallery.innerHTML = "";

    if (itemsToShow.length === 0) {
      return;
    }

    // 渲染卡片
    itemsToShow.forEach((item, index) => {
      this.renderCard(item, index);
    });

    // 更新加载更多按钮状态
    this.updateLoadMoreButton();

    // 初始化图片懒加载
    this.initLazyLoadForNewCards();
  }

  // 渲染单个卡片
  renderCard(item, index) {
    const isFavorite = this.state.favorites.has(item.id);
    const cardId = `card-${item.id}`;

    // 创建卡片元素
    const card = document.createElement("div");
    card.className = "card";
    card.id = cardId;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `查看 ${item.title} 的详细信息`);
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
            <div class="card-favorite ${isFavorite ? "active" : ""}" data-id="${
      item.id
    }" aria-label="${isFavorite ? "取消收藏" : "收藏"} ${item.title}">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </div>
            <div class="card-image-wrapper">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNGNUY1RjciLz48cGF0aCBkPSJNMTYwIDEyMEMxNjAgMTMzLjI1NSAxNDkuMjU1IDE0NCAxMzYgMTQ0QzEyMi43NDUgMTQ0IDExMiAxMzMuMjU1IDExMiAxMjBDMTEyIDEwNi43NDUgMTIyLjc0NSA5NiAxMzYgOTZDMTQ5LjI1NSA5NiAxNjAgMTA2Ljc0NSAxNjAgMTIwWiIgZmlsbD0iI0QyRDJENyIvPjxwYXRoIGQ9Ik0xOTIgMTYwSDEyOEMxMjEuMzcyIDE2MCAxMTYgMTU0LjYyOCAxMTYgMTQ4VjE0OEgxOTJWMTQ4QzE5MiAxNTQuNjI4IDE4Ni42MjggMTYwIDE4MCAxNjBaIiBmaWxsPSIjRDJEMkQ3Ii8+PC9zdmc+" data-src="${
                  item.image
                }" alt="${item.title}" loading="lazy">
            </div>
            <div class="card-info">
                <div class="card-category">${item.category}</div>
                <h3 class="card-title">${item.title}</h3>
                <div class="card-meta">
                    <span>${item.designer || item.author}</span>
                    <span>${item.year}</span>
                </div>
            </div>
        `;

    // 添加事件监听
    card.addEventListener("click", () => this.openModal(item));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.openModal(item);
      }
    });

    const favoriteIcon = card.querySelector(".card-favorite");
    favoriteIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleFavorite(item.id, favoriteIcon);
    });

    this.elements.gallery.appendChild(card);
  }

  // 加载更多项目
  loadMore() {
    if (this.state.isLoading || !this.state.hasMore) return;

    this.state.currentPage += 1;

    // 计算要显示的项目
    const startIndex = (this.state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = Math.min(
      this.state.currentPage * CONFIG.ITEMS_PER_PAGE,
      this.state.filteredDesigns.length
    );

    const itemsToShow = this.state.filteredDesigns.slice(startIndex, endIndex);

    // 渲染新卡片
    itemsToShow.forEach((item, index) => {
      const cardIndex = startIndex + index;
      this.renderCard(item, cardIndex);
    });

    // 更新加载更多按钮状态
    this.updateLoadMoreButton();

    // 初始化新卡片的图片懒加载
    this.initLazyLoadForNewCards();
  }

  // 更新加载更多按钮状态
  updateLoadMoreButton() {
    const hasMoreItems =
      this.state.filteredDesigns.length >
      this.state.currentPage * CONFIG.ITEMS_PER_PAGE;

    if (hasMoreItems) {
      this.elements.loadMoreBtn.textContent = "加载更多";
      this.elements.loadMoreBtn.disabled = false;
    } else {
      this.elements.loadMoreBtn.textContent = "已加载全部";
      this.elements.loadMoreBtn.disabled = true;
    }

    this.state.hasMore = hasMoreItems;
  }

  // --- 详情模态框 ---

  // 打开详情模态框
  openModal(item) {
    this.state.currentModalItem = item;

    // 设置模态框内容
    this.elements.modalImg.src = item.image;
    this.elements.modalImg.alt = item.title;
    this.elements.modalCategory.textContent = item.category;
    this.elements.modalTitle.textContent = item.title;
    this.elements.modalAuthor.textContent = item.designer || item.author;
    this.elements.modalYear.textContent = item.year;
    this.elements.modalRegion.textContent = item.region;
    this.elements.modalDesc.textContent = item.description;

    // 设置设计影响（如果存在）
    if (item.impact) {
      this.elements.modalImpact.textContent = item.impact;
      this.elements.modalImpact.parentElement.style.display = "block";
    } else {
      this.elements.modalImpact.parentElement.style.display = "none";
    }

    // 设置材质标签
    this.elements.modalMaterials.innerHTML = "";
    if (item.materials && item.materials.length > 0) {
      item.materials.forEach((material) => {
        const tag = document.createElement("span");
        tag.className = "modal-tag";
        tag.textContent = material;
        this.elements.modalMaterials.appendChild(tag);
      });
      this.elements.modalMaterials.parentElement.style.display = "block";
    } else {
      this.elements.modalMaterials.parentElement.style.display = "none";
    }

    // 设置风格标签
    this.elements.modalStyles.innerHTML = "";
    if (item.style && item.style.length > 0) {
      item.style.forEach((style) => {
        const tag = document.createElement("span");
        tag.className = "modal-tag";
        tag.textContent = style;
        this.elements.modalStyles.appendChild(tag);
      });
      this.elements.modalStyles.parentElement.style.display = "block";
    } else {
      this.elements.modalStyles.parentElement.style.display = "none";
    }

    // 设置相关作品
    this.elements.relatedDesigns.innerHTML = "";
    if (item.related && item.related.length > 0) {
      item.related.forEach((relatedId) => {
        const relatedDesign = this.state.designs.find(
          (d) => d.id === relatedId
        );
        if (relatedDesign) {
          const relatedElement = document.createElement("div");
          relatedElement.className = "related-design";
          relatedElement.textContent = relatedDesign.title;
          relatedElement.addEventListener("click", () => {
            this.closeModal();
            setTimeout(() => this.openModal(relatedDesign), 300);
          });
          this.elements.relatedDesigns.appendChild(relatedElement);
        }
      });
      this.elements.relatedDesigns.parentElement.style.display = "block";
    } else {
      this.elements.relatedDesigns.parentElement.style.display = "none";
    }

    // 更新收藏按钮状态
    this.updateModalFavoriteButton();

    // 显示模态框
    this.elements.modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // 强制重绘以触发动画
    setTimeout(() => {
      this.elements.modal.classList.add("show");
    }, 10);

    // 将焦点移动到关闭按钮
    setTimeout(() => {
      this.elements.closeBtn.focus();
    }, 300);
  }

  // 关闭详情模态框
  closeModal() {
    this.elements.modal.classList.remove("show");

    setTimeout(() => {
      this.elements.modal.style.display = "none";
      document.body.style.overflow = "auto";
      this.state.currentModalItem = null;

      // 将焦点返回到之前聚焦的卡片
      const activeElement = document.activeElement;
      if (
        activeElement === this.elements.closeBtn ||
        activeElement === this.elements.modalFavoriteBtn ||
        activeElement === this.elements.modalShareBtn
      ) {
        const lastCard = document.querySelector(".card:focus");
        if (lastCard) lastCard.focus();
      }
    }, 260);
  }

  // 更新模态框收藏按钮状态
  updateModalFavoriteButton() {
    if (!this.state.currentModalItem) return;

    const isFavorite = this.state.favorites.has(this.state.currentModalItem.id);

    if (isFavorite) {
      this.elements.modalFavoriteBtn.classList.add("active");
      this.elements.modalFavoriteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                已收藏
            `;
      this.elements.modalFavoriteBtn.setAttribute(
        "aria-label",
        `取消收藏 ${this.state.currentModalItem.title}`
      );
    } else {
      this.elements.modalFavoriteBtn.classList.remove("active");
      this.elements.modalFavoriteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                收藏设计
            `;
      this.elements.modalFavoriteBtn.setAttribute(
        "aria-label",
        `收藏 ${this.state.currentModalItem.title}`
      );
    }
  }

  // --- 收藏功能 ---

  // 切换收藏状态
  toggleFavorite(id, element = null) {
    if (this.state.favorites.has(id)) {
      this.state.favorites.delete(id);
      if (element) {
        element.classList.remove("active");
        element.setAttribute("aria-label", `收藏 ${this.getDesignTitle(id)}`);
      }
    } else {
      this.state.favorites.add(id);
      if (element) {
        element.classList.add("active");
        element.setAttribute(
          "aria-label",
          `取消收藏 ${this.getDesignTitle(id)}`
        );
      }
    }

    // 保存到 localStorage
    this.saveFavorites();

    // 如果当前正在显示收藏视图，更新画廊
    if (this.state.isShowingFavorites) {
      this.applyFilters();
    }

    // 如果当前有打开的模态框，更新其收藏按钮
    if (this.state.currentModalItem && this.state.currentModalItem.id === id) {
      this.updateModalFavoriteButton();
    }

    // 更新统计和收藏按钮
    this.updateStats();
    this.updateFavoritesToggleButton();
  }

  // 在模态框中切换收藏
  toggleFavoriteInModal() {
    if (this.state.currentModalItem) {
      this.toggleFavorite(
        this.state.currentModalItem.id,
        this.elements.modalFavoriteBtn
      );
    }
  }

  // 切换收藏视图
  toggleFavoritesView() {
    this.state.isShowingFavorites = !this.state.isShowingFavorites;

    if (this.state.isShowingFavorites) {
      this.elements.favoritesToggle.classList.add("active");
      this.elements.favoritesToggle.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                我的收藏 (${this.state.favorites.size})
            `;
    } else {
      this.elements.favoritesToggle.classList.remove("active");
      this.elements.favoritesToggle.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                我的收藏
            `;
    }

    // 清空筛选（除了收藏状态）
    this.state.filters.search = "";
    this.elements.searchInput.value = "";
    this.elements.clearSearch.classList.remove("visible");

    this.applyFilters();
  }

  // 保存收藏到 localStorage
  saveFavorites() {
    const favoritesArray = Array.from(this.state.favorites);
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(favoritesArray));
  }

  // 根据ID获取设计标题
  getDesignTitle(id) {
    const design = this.state.designs.find((item) => item.id === id);
    return design ? design.title : "";
  }

  // 更新收藏按钮状态
  updateFavoritesToggleButton() {
    if (this.state.favorites.size > 0) {
      this.elements.favoritesToggle.classList.add("active");
      this.elements.favoritesToggle.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                我的收藏 (${this.state.favorites.size})
            `;
    } else {
      this.elements.favoritesToggle.classList.remove("active");
      this.elements.favoritesToggle.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                我的收藏
            `;
    }
  }

  // --- 分享功能 ---

  // 分享设计
  async shareDesign() {
    if (!this.state.currentModalItem) return;

    const design = this.state.currentModalItem;
    const shareUrl = window.location.href.split("#")[0];
    const shareText = `查看设计作品：${design.title} (${design.year}) - ${design.designer}`;

    // 检查Web Share API是否可用
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${design.title} | Design Archive`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.log("Web Share API失败:", err);
      }
    }

    // 回退方案：复制到剪贴板
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      this.showShareTooltip();
    } catch (err) {
      console.error("复制到剪贴板失败:", err);
      // 最后的手段：提示用户手动复制
      prompt("复制链接分享：", shareUrl);
    }
  }

  // 显示分享工具提示
  showShareTooltip() {
    this.elements.shareTooltip.classList.add("show");

    setTimeout(() => {
      this.elements.shareTooltip.classList.remove("show");
    }, 2000);
  }

  // --- 主题功能 ---

  // 切换主题
  toggleTheme() {
    if (this.state.isDarkMode) {
      this.enableLightMode();
    } else {
      this.enableDarkMode();
    }

    // 保存主题偏好
    localStorage.setItem(
      CONFIG.STORAGE_THEME_KEY,
      this.state.isDarkMode ? "dark" : "light"
    );
  }

  // 启用暗色模式
  enableDarkMode() {
    document.documentElement.setAttribute("data-theme", "dark");
    this.state.isDarkMode = true;
  }

  // 启用浅色模式
  enableLightMode() {
    document.documentElement.setAttribute("data-theme", "light");
    this.state.isDarkMode = false;
  }

  // --- 关于模态框 ---

  // 打开关于模态框
  openAboutModal() {
    this.elements.aboutModal.style.display = "flex";

    setTimeout(() => {
      this.elements.aboutModal.classList.add("show");
    }, 10);

    // 关闭移动菜单（如果打开）
    this.closeMobileMenu();
  }

  // 关闭关于模态框
  closeAboutModal() {
    this.elements.aboutModal.classList.remove("show");

    setTimeout(() => {
      this.elements.aboutModal.style.display = "none";
    }, 300);
  }

  // --- 移动菜单 ---

  // 切换移动菜单
  toggleMobileMenu() {
    this.elements.navLinks.classList.toggle("show");
    this.elements.mobileMenuToggle.classList.toggle("active");

    // 如果菜单打开，禁用body滚动
    if (this.elements.navLinks.classList.contains("show")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  // 关闭移动菜单
  closeMobileMenu() {
    this.elements.navLinks.classList.remove("show");
    this.elements.mobileMenuToggle.classList.remove("active");
    document.body.style.overflow = "";
  }

  // --- 图片懒加载 ---

  // 初始化图片懒加载观察器
  initLazyLoadObserver() {
    // 使用Intersection Observer API实现懒加载
    if ("IntersectionObserver" in window) {
      this.imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadImage(img);
              this.imageObserver.unobserve(img);
            }
          });
        },
        {
          rootMargin: "100px 0px", // 提前100px开始加载
          threshold: 0.01,
        }
      );

      // 观察现有图片
      document.querySelectorAll("img[data-src]").forEach((img) => {
        this.imageObserver.observe(img);
      });
    } else {
      // 不支持IntersectionObserver的回退方案：立即加载所有图片
      document.querySelectorAll("img[data-src]").forEach((img) => {
        this.loadImage(img);
      });
    }
  }

  // 为新卡片初始化懒加载
  initLazyLoadForNewCards() {
    if (this.imageObserver) {
      document.querySelectorAll(".card img[data-src]").forEach((img) => {
        if (!img.src || img.src.includes("data:image/svg+xml")) {
          this.imageObserver.observe(img);
        }
      });
    }
  }

  // 加载单个图片
  loadImage(imgElement) {
    const src = imgElement.getAttribute("data-src");
    if (!src) return;

    const imageLoader = new Image();
    imageLoader.onload = () => {
      imgElement.src = src;
      imgElement.classList.add("loaded");
      imgElement.removeAttribute("data-src");
    };
    imageLoader.onerror = () => {
      // 图片加载失败时使用占位图
      imgElement.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNGNUY1RjciLz48cGF0aCBkPSJNMTYwIDEyMEMxNjAgMTMzLjI1NSAxNDkuMjU1IDE0NCAxMzYgMTQ0QzEyMi43NDUgMTQ0IDExMiAxMzMuMjU1IDExMiAxMjBDMTEyIDEwNi43NDUgMTIyLjc0NSA5NiAxMzYgOTZDMTQ5LjI1NSA5NiAxNjAgMTA2Ljc0NSAxNjAgMTIwWiIgZmlsbD0iI0QyRDJENyIvPjxwYXRoIGQ9Ik0xOTIgMTYwSDEyOEMxMjEuMzcyIDE2MCAxMTYgMTU0LjYyOCAxMTYgMTQ4VjE0OEgxOTJWMTQ4QzE5MiAxNTQuNjI4IDE4Ni42MjggMTYwIDE4MCAxNjBaIiBmaWxsPSIjRDJEMkQ3Ii8+PC9zdmc+";
      imgElement.alt = "图片加载失败";
    };
    imageLoader.src = src;
  }

  // --- 工具函数 ---

  // 更新统计信息
  updateStats() {
    this.elements.totalCount.textContent = this.state.totalCount;
    this.elements.filteredCount.textContent = this.state.filteredCount;
    this.elements.favoritesCount.textContent = this.state.favoritesCount;
  }

  // 更新已选筛选标签显示
  updateActiveFiltersDisplay() {
    this.elements.activeFilters.innerHTML = "";

    Object.entries(this.state.filters).forEach(([key, value]) => {
      if (value && key !== "sort") {
        let label = "";
        let displayValue = "";

        switch (key) {
          case "search":
            if (!value) return;
            label = "搜索";
            displayValue = `"${value}"`;
            break;
          case "category":
            label = "分类";
            displayValue =
              document.querySelector(
                `#filter-category option[value="${value}"]`
              )?.textContent || value;
            break;
          case "decade":
            label = "年代";
            displayValue =
              document.querySelector(`#filter-decade option[value="${value}"]`)
                ?.textContent || value;
            break;
          case "region":
            label = "地区";
            displayValue =
              document.querySelector(`#filter-region option[value="${value}"]`)
                ?.textContent || value;
            break;
        }

        if (displayValue) {
          const tag = document.createElement("div");
          tag.className = "filter-tag";
          tag.innerHTML = `
                        ${label}: ${displayValue}
                        <button class="filter-tag-remove" data-filter="${key}" aria-label="移除 ${label} 筛选">
                            &times;
                        </button>
                    `;
          this.elements.activeFilters.appendChild(tag);
        }
      }
    });

    // 为移除按钮添加事件
    this.elements.activeFilters
      .querySelectorAll(".filter-tag-remove")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const filterKey =
            e.target.closest(".filter-tag-remove").dataset.filter;

          // 清除筛选
          if (filterKey === "search") {
            this.clearSearch();
          } else {
            this.state.filters[filterKey] = "";
            document.getElementById(`filter-${filterKey}`).value = "";
            this.applyFilters();
          }
        });
      });
  }

  // 处理滚动事件
  handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // 导航栏滚动效果
    if (scrollTop > 100) {
      this.elements.navbar.style.boxShadow = "var(--shadow-md)";
      this.elements.navbar.style.padding = "var(--space-2) 0";
    } else {
      this.elements.navbar.style.boxShadow = "var(--shadow-sm)";
      this.elements.navbar.style.padding = "var(--space-4) 0";
    }

    // 无限滚动（自动加载更多）
    if (this.state.hasMore && !this.state.isLoading) {
      const scrollPosition = window.innerHeight + scrollTop;
      const pageHeight = document.documentElement.scrollHeight;
      const threshold = 500; // 距离底部500px时触发

      if (pageHeight - scrollPosition < threshold) {
        this.loadMore();
      }
    }
  }

  // 显示加载状态
  showLoading(show) {
    if (show) {
      this.state.isLoading = true;
      this.elements.loadingIndicator.style.display = "block";
    } else {
      this.state.isLoading = false;
      this.elements.loadingIndicator.style.display = "none";
    }
  }

  // 显示错误信息
  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--color-red-500);
            color: white;
            padding: var(--space-4) var(--space-6);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: var(--z-tooltip);
            animation: fadeInDown 0.3s var(--ease-micro);
        `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.style.opacity = "0";
      errorDiv.style.transform = "translateX(-50%) translateY(-20px)";
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 300);
    }, 3000);
  }

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// --- 初始化应用 ---
document.addEventListener("DOMContentLoaded", () => {
  // 创建应用实例
  window.designArchiveApp = new DesignArchiveApp();
});
