/* 网站内容配置中心：修改个人资料、链接、简介、荣誉和论文时，只需编辑本文件。空链接不会显示为可点击按钮。 */
window.SITE_CONTENT = {
  profile: {
    name: "Kellen",
    avatar: "https://avatars.githubusercontent.com/u/166420522?v=4",
    identity: "PhD Candidate",
    affiliation: "University of Chinese Academy of Sciences (UCAS)",
    email: "07212709@cumt.edu.cn",
    location: "China",
    researchDirections: ["Remote Sensing", "Geospatial Data Analysis", "Scientific Computing"]
  },
  links: [
    { label: "GitHub", url: "https://github.com/Kellen-Workspace" },
    { label: "Google Scholar", url: "" },
    { label: "ORCID", url: "" }
  ],
  introduction: [
    "I am a PhD candidate at the University of Chinese Academy of Sciences. My research focuses on remote sensing, geospatial data analysis, and scientific computing.",
    "I am interested in extracting reliable information from multi-source Earth observation data and using reproducible methods to study environmental and land-surface processes.",
    "Alongside academic research, I develop lightweight research tools and maintain notes on data processing, programming, and quantitative analysis. This website serves as a growing archive of my work and experiments."
  ],
  honors: [
    { year: "—", title: "Honors and awards will be added here", detail: "奖学金、竞赛获奖与学术荣誉可在 content.js 中添加。" }
  ],
  publications: [
    { year: "—", title: "Publication list forthcoming", authors: "在 content.js 中填写作者、题目、期刊、年份和链接。", venue: "", url: "" }
  ]
};

window.SITE_COLLECTIONS = {
  blog: { label: "BLOG", title: "Blog", description: "Technical notes, paper reading, method reproduction, and research workflows.", emptyText: "第一篇技术文章将在这里出现。", items: [] },
  lab: {
    label: "LAB", title: "Lab", description: "Experiments, prototypes, algorithm demonstrations, and small ideas in progress.", emptyText: "第一个实验项目将在这里出现。",
    items: [
      { title: "蛇亚目系统发育图谱", description: "用可展开的系统发育树学习蛇类主要演化分支，并为感兴趣的节点建立照片档案。", meta: "Biology · Interactive", url: "serpent-phylogeny/" }
    ]
  },
  tool: {
    label: "TOOL", title: "Tools", description: "Research utilities and practical web tools developed for daily work.", emptyText: "新的研究工具将在这里出现。",
    items: [
      { title: "全球卫星影像", description: "浏览卫星底图、定位经纬度，并加载实测站点与 SHP 图层。", meta: "Geospatial · Live", url: "../tools/satellite-map/" },
      { title: "图片公式识别", description: "识别公式图片，并导出或复制可编辑公式到 Word。每次使用时输入自己的 API Key，页面不会保存密钥。", meta: "OCR · Live", url: "formula-image-to-word/?v=20260919-3" }
    ]
  },
  invest: { label: "INVEST", title: "Invest", description: "Economic data, market observations, and reproducible quantitative analysis.", emptyText: "第一项经济数据分析将在这里出现。", items: [] }
};
