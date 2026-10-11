# 地形与海拔分层数据说明

## 当前图层

- 海拔分层：`data/environment/elevation-bands.png`
- 元数据：`data/environment/elevation-metadata.json`
- 生成程序：`scripts/build_elevation_overlay.py`
- 分级：小于 100 m、100–300 m、300–800 m、800 m 及以上。

## 来源与方法

原始高程来自 AWS Registry of Open Data 上的 Mapzen Terrain Tiles（Terrarium 编码）：

```text
https://registry.opendata.aws/terrain-tiles/
https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
```

脚本在 Web Mercator 第 8 级瓦片上解码高程，将结果重分类为四个海拔带，再裁剪到北京、天津、河北省级边界。网页中的地形阴影使用 MapLibre 官方示例提供的 DEM TileJSON，以增强山脊、谷地和坡面辨识。

## 解释边界

海拔是开发利用条件之一，但不能单独作为“可开发土地”结论。至少还需要叠加坡度、地质灾害、水源保护、生态红线、永久基本农田、洪涝风险、建设用地规划与交通可达性。当前图层适合宏观比较天津与冀中南低地、燕山—太行山地及张家口高地，不适合地块级选址。
