# 照片目录

每个系统发育节点使用自己的 `id` 作为照片文件夹名。例如：

```text
taxa/
  python-bivittatus/
    photos/
      01.jpg
      02.webp
  boa-constrictor/
    photos/
      adult.jpg
  ophiophagus-hannah/
    photos/
      portrait.png
```

节点 ID 可在上一级的 `tree-data.js` 中查看。新增物种时，先在树数据中添加唯一 `id`，再到 `taxa/` 下建立同名节点文件夹，并在其中创建 `photos/`。

支持 `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.avif`。照片文件名会自动转成页面标题；建议使用有意义的英文或中文文件名。

照片放好后，在网站根目录运行：

```powershell
python scripts/update_serpent_photos.py
```

该命令会重新生成 `photos/manifest.js`。提交照片和清单文件后，GitHub Pages 才能显示新照片。纯静态网页无法直接列出服务器文件夹，因此不能省略这一步。
