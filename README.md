# Kellen Academic Homepage

这是部署在 `https://kellen-workspace.github.io/` 的个人学术主页。网站为纯静态结构，可以直接通过 GitHub 修改，不需要安装程序或数据库。

## 页面结构

- `/`：个人主页，包含个人资料、研究方向、简介、荣誉和论文。
- `/blog/`：技术博客文章集合。
- `/lab/`：实验、原型与功能演示集合。
- `/lab/serpent-phylogeny/`：蛇亚目系统发育图谱与节点照片档案。
- `/tool/`：实用工具集合。
- `/tool/formula-image-to-word/`：图片公式识别与 Word 导出工具，无需 ChatGPT 登录。
- `/invest/`：中文投资研究入口，分为政策、银行、大宗商品、房地产、行业、周期、A股七个模块。
- `/invest/industries/`：申万三级行业财务增速与价格表现看板。
- `/tools/satellite-map/`：现有全球卫星影像工具。

图片公式识别工具要求使用者每次打开页面时输入自己的 DeepSeek API Key。Key 只保存在当前页面内存中，不写入浏览器存储；关闭或刷新页面后会被清空。API 地址固定为 DeepSeek 官方接口。

在线版本直接从浏览器向 DeepSeek 发出识别请求；本地版本则使用项目自带的本地转发服务。不要将 API Key 写进 `content.js`、HTML 或其他仓库文件。

顶部导航只包含 Blog、Lab、Tool、Invest。四个集合页之间可以互相访问，但没有返回主页按钮。

## 日常修改只编辑 `content.js`

网站中经常变化的内容都集中在根目录的 `content.js`。

### 修改姓名、头像、身份、单位、邮箱和研究方向

找到 `SITE_CONTENT.profile`：

```js
profile: {
  name: "Kellen",
  avatar: "头像图片地址",
  identity: "PhD Candidate",
  affiliation: "University of Chinese Academy of Sciences (UCAS)",
  email: "your-email@example.com",
  location: "China",
  researchDirections: ["方向一", "方向二", "方向三"]
}
```

如果以后将头像保存到仓库的 `assets/avatar.jpg`，可以把 `avatar` 改为 `assets/avatar.jpg`。

### 添加或修改个人跳转链接

编辑 `SITE_CONTENT.links`。复制一行即可增加新链接：

```js
links: [
  { label: "GitHub", url: "https://github.com/Kellen-Workspace" },
  { label: "Google Scholar", url: "https://scholar.google.com/你的地址" },
  { label: "ORCID", url: "https://orcid.org/你的编号" },
  { label: "ResearchGate", url: "https://你的地址" }
]
```

`url` 留空时，主页会显示“待补充”，但不会产生无效链接。

### 修改个人介绍

编辑 `SITE_CONTENT.introduction`。数组中的每一段文字会显示为一个独立段落：

```js
introduction: [
  "第一段个人介绍。",
  "第二段研究说明。",
  "第三段个人项目说明。"
]
```

### 添加个人荣誉

在 `SITE_CONTENT.honors` 中添加对象：

```js
{ year: "2026", title: "荣誉名称", detail: "颁发单位或补充说明" }
```

最新项目建议放在数组最上方。

### 添加已发表文章

在 `SITE_CONTENT.publications` 中添加对象：

```js
{
  year: "2026",
  title: "文章标题",
  authors: "作者列表",
  venue: "期刊或会议名称",
  url: "https://doi.org/文章地址"
}
```

没有网页链接时可以将 `url` 留空。

## 向四个功能区添加内容

四个集合都在 `SITE_COLLECTIONS` 中：`blog`、`lab`、`tool`、`invest`。在对应的 `items` 数组里添加条目：

```js
{
  title: "条目标题",
  description: "一句话介绍内容",
  meta: "分类 · 年份",
  url: "目标页面或外部链接"
}
```

### 添加仓库内的新文章或子网页

例如新建 `blog/python-data/index.html` 后，在 Blog 的 `items` 中添加：

```js
{
  title: "Python 数据处理笔记",
  description: "常用的数据清理和批处理方法。",
  meta: "Python · 2026",
  url: "python-data/"
}
```

集合为空时会自动显示准备中的提示，不需要手动修改页面 HTML。

## 主要文件说明

- `content.js`：所有可编辑文字、链接和列表数据。
- `index.html`：主页结构。
- `styles.css`：主页样式。
- `collection.js`：四个功能区的统一列表生成逻辑。
- `collection.css`：四个功能区的统一样式。
- `blog/`、`lab/`、`tool/`、`invest/`：四个功能区入口。

修改 `content.js` 并提交到 `main` 分支后，GitHub Pages 会自动重新部署。

## 蛇亚目系统发育图谱

树的节点和说明集中在 `lab/serpent-phylogeny/tree-data.js`。每个节点必须有唯一 `id`；增加感兴趣的物种时，在对应科或亚科的 `children` 中增加节点即可。

照片按节点 ID 分文件夹保存，例如：

```text
lab/serpent-phylogeny/taxa/python-bivittatus/photos/
lab/serpent-phylogeny/taxa/boa-constrictor/photos/
lab/serpent-phylogeny/taxa/ophiophagus-hannah/photos/
```

支持 JPG、PNG、WebP、GIF 和 AVIF。放入照片后运行：

```powershell
python scripts/update_serpent_photos.py
```

脚本会更新 `lab/serpent-phylogeny/photos/manifest.js`。照片文件与该清单需要一并提交。浏览器不能自动列出 GitHub Pages 文件夹，因此只放照片但不更新清单时，网页不会显示新图片。

照片浏览器会把当前图片放在中央并保持清晰；已看图片移到左侧，未看图片位于右侧，两侧图片会缩小并虚化。可以点击左右箭头、键盘方向键或直接点击两侧图片切换。

## 投资与行业数据看板

投资区的七个模块入口直接维护在 `invest/index.html`。目前“行业”的第一个看板已经启用，其他模块均已建立中文占位页，后续可继续添加多个分析功能。

行业看板的数据文件位于：

```text
invest/industries/data/sw-industry.json
```

更新程序位于 `scripts/update_sw_industry.py`。它会：

1. 读取最新申万三级行业及成分股分类；
2. 读取最近八个已完成报告期的 A 股业绩报表；
3. 不做异常过滤，使用全部能够反推上年同期金额的有效公司计算行业营业收入同比和净利润同比；
4. 统计净利润、营业收入同比大于零的公司；
5. 输出公司级财务数据，供网页展示当前、前一期和前两期的同比与具体金额；
6. 以申万三级行业指数的季度涨幅作为行业平均股价表现的稳定代理；
7. 输出供 GitHub Pages 直接读取的静态 JSON。

仓库内的 `.github/workflows/update-industry-data.yml` 默认每月 5 日自动刷新，也可以在 GitHub 的 Actions 页面手动运行。自动更新不需要任何 API Key。公开数据源偶尔可能调整网页结构；如果自动任务失败，先查看 Actions 日志，再按 AKShare 最新字段修改脚本。

本地手动更新命令：

```powershell
pip install -r requirements-industry.txt
python scripts/update_sw_industry.py --refresh
```

## 修改统计口径

所有计算公式和中文解释统一放在：

```text
scripts/industry_calculation_method.py
```

这是统计口径的唯一逻辑文件。目前明确关闭所有异常过滤：不根据同比大小、基期大小或离群程度剔除公司。修改后运行数据更新程序即可重新生成全部结果，不要在网页 JavaScript 或 `update_sw_industry.py` 中另写一套公式，以免统计口径不一致。

当前统计口径：先根据每家公司当期金额与披露同比反推上年同期金额，再分别合计全部有效公司的当期金额与上年同期金额并计算行业同比。同比恰好为 -100% 时无法仅依靠四舍五入后的当期金额反推基期，因此作为无法计算数据处理，而不是异常过滤。历史数据使用当前申万三级成分映射，存在分类变更与幸存者偏差；价格表现使用行业指数季度涨幅。页面底部也展示了简化版说明。

网页中净利润、营业收入同比增长公司数量可以点击。弹窗仅列出所选报告期同比大于零的公司，并同时显示本期、前一期、前两期的同比和具体金额；较早报告期没有足够历史数据时显示“—”。

## 蛇谱：物种档案、照片与日志

蛇谱入口位于 `lab/serpent-phylogeny/`。选择节点会高亮该节点到“蛇亚目”根节点的完整路径；“寻找最近共同祖先”可以比较任意两个已经录入的物种。树中的争议关系使用虚线显示。

物种的结构化内容集中在 `lab/serpent-phylogeny/species-data.js`。每个物种拥有独立网址和文件夹：

```text
lab/serpent-phylogeny/taxa/物种ID/index.html
lab/serpent-phylogeny/taxa/物种ID/photos/
lab/serpent-phylogeny/taxa/物种ID/logs/
```

### 新增照片

直接在 GitHub 网页把图片上传到该物种的 `photos/` 文件夹。工作流 `.github/workflows/update-serpent-assets.yml` 会自动更新照片清单，不再要求手动运行命令。

### 新增观察或学习日志

1. 复制 `lab/serpent-phylogeny/_templates/observation-log.html`。
2. 新日志保存为 `taxa/物种ID/logs/YYYY-MM-DD-英文短名/index.html`。
3. 修改页面顶部的 `log-date`、`log-title`、`log-summary` 和 `log-type`。
4. 编辑正文后提交。GitHub Actions 会自动更新日志清单，网页按照 `log-date` 从新到旧排列。

如果需要在本地手动刷新照片和日志清单，在网站根目录运行：

```powershell
python scripts/update_serpent_photos.py
```

