# 首都都市圈空间研究

第二个 Lab 项目。以京津冀为区域比较与产业协同背景，重点展示官方规划中的首都都市圈功能圈和雄安新区。后续按主题增加交通、产业、人口、住房、公共服务、自然环境和规划图层。

网页默认定位雄安新区，顶部提供“京津冀全域”“首都都市圈”“雄安新区”三个一键视图。石家庄等功能圈以外城市仍保留在背景行政图层中。

## 当前目录

```text
capital-metro-atlas/
├─ data/
│  ├─ administrative/
│  ├─ environment/
│  └─ planning/
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
python lab/capital-metro-atlas/scripts/build_scope_layers.py
```

第二个脚本需要 Pillow，第三个脚本会生成首都都市圈功能圈与雄安新区规划范围。脚本完成后，将生成的数据文件与源码一起提交。

## 后续扩展原则

所有客观空间对象继续放在 `data/` 下并按主题组织，不按亦庄、通州等区域重复建立数据库。网页逻辑只负责加载、筛选、查询和渲染。所有新增图层都应在 `sources/` 中记录来源、下载日期、坐标系、许可、处理方式和质量限制。

首都都市圈及雄安新区的范围、数据来源和更新方法见 `sources/administrative.md`。范围变化时优先修改 `scripts/build_scope_layers.py`，不要直接在网页代码里手工画边界。

