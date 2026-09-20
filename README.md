# Kellen Academic Homepage

这是部署在 `https://kellen-workspace.github.io/` 的个人学术主页。网站为纯静态结构，可以直接通过 GitHub 修改，不需要安装程序或数据库。

## 页面结构

- `/`：个人主页，包含个人资料、研究方向、简介、荣誉和论文。
- `/blog/`：技术博客文章集合。
- `/lab/`：实验、原型与功能演示集合。
- `/tool/`：实用工具集合。
- `/tool/formula-image-to-word/`：图片公式识别与 Word 导出工具，无需 ChatGPT 登录。
- `/invest/`：全英文投资研究入口，分为 Policy、Banking、Commodities、Real Estate、Industries、Cycles、A-Shares 七个模块。
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

## Invest 与 Industries 数据看板

Invest 的七个模块入口直接维护在 `invest/index.html`。目前 Industries 的第一个看板已经启用，其他模块均已建立英文占位页，后续可继续添加多个分析功能。

行业看板的数据文件位于：

```text
invest/industries/data/sw-industry.json
```

更新程序位于 `scripts/update_sw_industry.py`。它会：

1. 读取最新申万三级行业及成分股分类；
2. 读取最近八个已完成报告期的 A 股业绩报表；
3. 计算各行业营业总收入同比、净利润同比和正增长公司数量；
4. 以申万三级行业指数的季度涨幅作为行业平均股价表现的稳定代理；
5. 输出供 GitHub Pages 直接读取的静态 JSON。

仓库内的 `.github/workflows/update-industry-data.yml` 默认每月 5 日自动刷新，也可以在 GitHub 的 Actions 页面手动运行。自动更新不需要任何 API Key。公开数据源偶尔可能调整网页结构；如果自动任务失败，先查看 Actions 日志，再按 AKShare 最新字段修改脚本。

本地手动更新命令：

```powershell
pip install -r requirements-industry.txt
python scripts/update_sw_industry.py --refresh
```

统计口径说明：财务同比为报告期累计口径下的行业成分股合计值同比（根据公司披露的当期值与同比重建上年同期合计值）；历史数据使用当前申万三级成分映射，存在分类变更与幸存者偏差；价格表现使用行业指数季度涨幅而不是逐只股票简单平均。页面底部也展示了同样的方法说明。
