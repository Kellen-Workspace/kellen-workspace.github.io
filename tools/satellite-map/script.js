// ============================================================
//  地图初始化
// ============================================================
const map = L.map('map', {
  zoomControl: true,
  worldCopyJump: true,
  minZoom: 2,
  maxZoom: 18,
}).setView([20, 0], 2);

// ============================================================
//  底图定义 & 切换器
// ============================================================
const basemaps = {
  esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: '&copy; Esri | World Imagery',
  }),
  osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
  }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenTopoMap',
  }),
  carto: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
  }),
};

let currentBasemap = 'esri';
basemaps[currentBasemap].addTo(map);

// 切换器点击事件
document.querySelectorAll('.layer-option').forEach((opt) => {
  opt.addEventListener('click', () => {
    const key = opt.dataset.layer;
    if (key === currentBasemap) return;

    map.removeLayer(basemaps[currentBasemap]);
    basemaps[key].addTo(map);
    currentBasemap = key;

    document.querySelectorAll('.layer-option').forEach((o) => o.classList.remove('active'));
    opt.classList.add('active');
  });
});

// ============================================================
//  区域快捷跳转
// ============================================================
document.getElementById('regionPanel').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || !btn.dataset.lat) return;
  const lat = parseFloat(btn.dataset.lat);
  const lng = parseFloat(btn.dataset.lng);
  const zoom = parseInt(btn.dataset.zoom, 10);
  map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
});

// ============================================================
//  经纬度定位
// ============================================================
document.getElementById('coordGoBtn').addEventListener('click', () => {
  const lat = parseFloat(document.getElementById('latInput').value);
  const lng = parseFloat(document.getElementById('lngInput').value);
  let zoom = parseInt(document.getElementById('zoomInput').value, 10);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    alert('请输入有效的经纬度（纬度 -90~90，经度 -180~180）。');
    return;
  }
  if (isNaN(zoom) || zoom < 2) zoom = 12;
  if (zoom > 18) zoom = 18;

  map.flyTo([lat, lng], zoom, { animate: true, duration: 1.0 });

  L.popup()
    .setLatLng([lat, lng])
    .setContent(`<strong>${lat.toFixed(6)}, ${lng.toFixed(6)}</strong>`)
    .openOn(map);
});

// 回车触发定位
['latInput', 'lngInput', 'zoomInput'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('coordGoBtn').click();
  });
});

// ============================================================
//  鼠标坐标显示
// ============================================================
const lngEl = document.getElementById('lngDisplay');
const latEl = document.getElementById('latDisplay');
const zoomEl = document.getElementById('zoomDisplay');

map.on('mousemove', (e) => {
  lngEl.textContent = e.latlng.lng.toFixed(4);
  latEl.textContent = e.latlng.lat.toFixed(4);
});

map.on('zoomend', () => {
  zoomEl.textContent = map.getZoom();
});

// ============================================================
//  IndexedDB 封装
// ============================================================
const DB_NAME = 'GlobalMapSHP';
const DB_VERSION = 1;
const STORE_NAME = 'layers';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function dbPut(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

// ============================================================
//  SHP 图层运行时状态
// ============================================================
// { id, name, geojson, visible, color, leafletLayer }
let shpLayers = [];

// 预定义图层色板
const LAYER_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9a6324', '#800000', '#aaffc3',
  '#808000', '#ffd8b1', '#000075', '#a9a9a9', '#ff6f61',
];
let colorIdx = 0;

function nextColor() {
  const c = LAYER_COLORS[colorIdx % LAYER_COLORS.length];
  colorIdx++;
  return c;
}

// ============================================================
//  渲染 SHP 图层管理列表
// ============================================================
const layerListEl = document.getElementById('shpLayerList');

function renderLayerList() {
  if (shpLayers.length === 0) {
    layerListEl.innerHTML = '<div class="shp-empty">暂无上传图层</div>';
    return;
  }
  layerListEl.innerHTML = shpLayers
    .map(
      (l, i) => `
      <div class="shp-layer-item">
        <span class="shp-layer-color" style="background:${l.color};" title="${l.name}"></span>
        <span class="shp-layer-name" title="${l.name}">${l.name}</span>
        <button class="btn-eye${l.visible ? '' : ' off'}" data-action="toggle" data-idx="${i}" title="显示/隐藏">👁</button>
        <button class="btn-delete" data-action="delete" data-idx="${i}" title="删除">✕</button>
      </div>`
    )
    .join('');
}

layerListEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const idx = parseInt(btn.dataset.idx, 10);
  const layer = shpLayers[idx];
  if (!layer) return;

  if (action === 'toggle') {
    layer.visible = !layer.visible;
    if (layer.visible) {
      layer.leafletLayer.addTo(map);
    } else {
      map.removeLayer(layer.leafletLayer);
    }
    await dbPut({ id: layer.id, name: layer.name, geojson: layer.geojson, visible: layer.visible, color: layer.color });
    renderLayerList();
  }

  if (action === 'delete') {
    map.removeLayer(layer.leafletLayer);
    shpLayers.splice(idx, 1);
    await dbDelete(layer.id);
    renderLayerList();
  }
});

// ============================================================
//  从 GeoJSON 创建 Leaflet 图层
// ============================================================
function createGeoJSONLayer(geojson, color) {
  return L.geoJSON(geojson, {
    style: () => ({
      color: color,
      weight: 2,
      opacity: 0.8,
      fillColor: color,
      fillOpacity: 0.25,
    }),
    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 5,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.4,
      });
    },
    onEachFeature: (feature, layer) => {
      if (feature.properties) {
        const props = Object.entries(feature.properties)
          .slice(0, 12)
          .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${v}</td></tr>`)
          .join('');
        layer.bindPopup(`<table style="font-size:12px;">${props}</table>`, { maxWidth: 300 });
      }
    },
  });
}

// ============================================================
//  添加 SHP 图层到地图
// ============================================================
async function addSHPLayer(name, geojson) {
  const color = nextColor();
  const leafletLayer = createGeoJSONLayer(geojson, color);
  leafletLayer.addTo(map);

  // 自适应视野
  try {
    const bounds = leafletLayer.getBounds();
    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1.0 });
    }
  } catch (_) { /* ignore */ }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const layerMeta = { id, name, geojson, visible: true, color, leafletLayer };
  shpLayers.push(layerMeta);

  // 持久化到 IndexedDB
  await dbPut({ id, name, geojson, visible: true, color });
  renderLayerList();
}

// ============================================================
//  SHP 文件上传处理
// ============================================================
const shpFileInput = document.getElementById('shpFileInput');
const shpLoading = document.getElementById('shpLoading');

document.getElementById('shpUploadBtn').addEventListener('click', () => {
  shpFileInput.click();
});

shpFileInput.addEventListener('change', async () => {
  const files = Array.from(shpFileInput.files);
  if (files.length === 0) return;

  // 检查 shpjs 库是否加载
  if (typeof shp === 'undefined') {
    alert('SHP 解析库加载失败，请刷新页面后重试。\n\n如果持续出现此问题，请检查网络是否能访问 cdn.jsdelivr.net。');
    shpFileInput.value = '';
    return;
  }

  shpLoading.style.display = 'block';
  shpFileInput.value = '';

  try {
    let geojson;

    // 单个 .zip 文件
    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
      const buffer = await files[0].arrayBuffer();
      geojson = await shp(buffer);
    }
    // 多个独立文件 (.shp, .shx, .dbf, .prj)
    else {
      const buffers = {};
      for (const f of files) {
        const ext = f.name.split('.').pop().toLowerCase();
        if (['shp', 'shx', 'dbf', 'prj'].includes(ext)) {
          buffers[ext] = await f.arrayBuffer();
        }
      }
      if (!buffers.shp) {
        throw new Error('未找到 .shp 文件，请至少选择一个 .shp 文件。');
      }
      geojson = await shp(buffers);
    }

    // 提取图层名称
    const baseName = files[0].name.replace(/\.(zip|shp)$/i, '');
    await addSHPLayer(baseName, geojson);
  } catch (err) {
    console.error('SHP 解析失败:', err);
    alert('SHP 文件解析失败：' + (err.message || '未知错误'));
  } finally {
    shpLoading.style.display = 'none';
  }
});

// ============================================================
//  从 IndexedDB 恢复图层
// ============================================================
async function restoreLayers() {
  try {
    const stored = await dbGetAll();
    for (const item of stored) {
      const leafletLayer = createGeoJSONLayer(item.geojson, item.color);
      if (item.visible) {
        leafletLayer.addTo(map);
      }
      shpLayers.push({
        id: item.id,
        name: item.name,
        geojson: item.geojson,
        visible: item.visible,
        color: item.color,
        leafletLayer,
      });
      // 恢复色板索引避免颜色重复
      const usedIdx = LAYER_COLORS.indexOf(item.color);
      if (usedIdx >= 0 && usedIdx >= colorIdx) {
        colorIdx = usedIdx + 1;
      }
    }
    renderLayerList();
  } catch (err) {
    console.warn('IndexedDB 恢复失败，将使用空白图层列表:', err);
    // IndexedDB 不可用时（如隐私模式），静默降级
  }
}

restoreLayers();

// ============================================================
//  实测站点加载（数据来自 stations_data.js）
// ============================================================
let insituLayerGroup = null;

const loadInsituBtn = document.getElementById('loadInsituBtn');
const insituStatus = document.getElementById('insituStatus');

loadInsituBtn.addEventListener('click', () => {
  // 清除旧图层
  if (insituLayerGroup) {
    map.removeLayer(insituLayerGroup);
    insituLayerGroup = null;
    loadInsituBtn.classList.remove('loaded');
    loadInsituBtn.textContent = '加载实测站点数据';
    insituStatus.style.display = 'none';
    return;
  }

  const stations = window.__STATIONS__ || [];
  if (stations.length === 0) {
    insituStatus.style.display = 'block';
    insituStatus.textContent = '无站点数据，请先运行 generate_stations.py';
    return;
  }

  insituLayerGroup = L.layerGroup();
  const markersLatLngs = [];

  stations.forEach((s) => {
    const marker = L.circleMarker([s.lat, s.lng], {
      radius: 8,
      fillColor: '#ff6b35',
      color: '#fff',
      weight: 2,
      fillOpacity: 0.9,
    });

    marker.bindPopup(
      '<table style="font-size:12px;">' +
      `<tr><td><strong>station_name</strong></td><td>${s.name}</td></tr>` +
      `<tr><td><strong>croptype(2023)</strong></td><td>${s.croptype}</td></tr>` +
      `<tr><td><strong>timeseries</strong></td><td>${s.timeseries}</td></tr>` +
      `<tr><td><strong>observing_depth</strong></td><td>${s.depth}</td></tr>` +
      '</table>',
      { maxWidth: 300 }
    );

    insituLayerGroup.addLayer(marker);
    markersLatLngs.push([s.lat, s.lng]);
  });

  insituLayerGroup.addTo(map);
  loadInsituBtn.textContent = '实测站点 (已加载)';
  loadInsituBtn.classList.add('loaded');
  insituStatus.style.display = 'block';
  insituStatus.textContent = `已加载 ${stations.length} 个站点`;

  // 自适应视野
  if (markersLatLngs.length === 1) {
    map.flyTo(markersLatLngs[0], 10, { animate: true, duration: 1.0 });
  } else {
    const bounds = L.latLngBounds(markersLatLngs);
    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1.0 });
    }
  }
});
