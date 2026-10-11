# 首都都市圈空间研究

第二个 Lab 项目。第一阶段建立京津冀的行政与地形骨架，后续按主题增加交通、产业、人口、住房、公共服务、自然环境和规划图层。

## 当前目录

```text
capital-metro-atlas/
├─ data/
│  ├─ administrative/
│  └─ environment/
├─ scripts/
├─ sources/
├─ index.html
├─ styles.css
└─ app.js
```

## 重新生成数据

在网站根目录执行：

```powershell
python lab/capital-metro-atlas/scripts/fetch_administrative.py
python lab/capital-metro-atlas/scripts/build_elevation_overlay.py
```

第二个脚本需要 Pillow。脚本完成后，将生成的数据文件与源码一起提交。

## 后续扩展原则

所有客观空间对象继续放在 `data/` 下并按主题组织，不按亦庄、通州等区域重复建立数据库。网页逻辑只负责加载、筛选、查询和渲染。所有新增图层都应在 `sources/` 中记录来源、下载日期、坐标系、许可、处理方式和质量限制。
