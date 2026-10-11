const DATA_PATHS = {
  province: './data/administrative/province.geojson',
  city: './data/administrative/city.geojson',
  district: './data/administrative/district.geojson',
  seats: './data/administrative/government-seats.geojson',
  elevation: './data/environment/elevation-metadata.json'
};

const LEVEL_LABEL = { province: '省级', city: '地市级', district: '区县级' };
const LAYER_GROUPS = {
  'elevation-bands': ['elevation-bands'],
  hillshade: ['hillshade'],
  province: ['province-fill', 'province-line'],
  city: ['city-fill', 'city-line', 'city-labels'],
  district: ['district-fill', 'district-line'],
  'government-seats': ['government-points', 'government-labels']
};

const els = {
  status: document.querySelector('#map-status'),
  feature: document.querySelector('#feature-card'),
  search: document.querySelector('#region-search'),
  options: document.querySelector('#region-options'),
  searchButton: document.querySelector('#search-button'),
  opacity: document.querySelector('#elevation-opacity'),
  opacityOutput: document.querySelector('#opacity-output'),
  panel: document.querySelector('#control-panel'),
  panelOpen: document.querySelector('#panel-open'),
  panelClose: document.querySelector('#panel-close'),
  coordinates: document.querySelector('#pointer-coordinates')
};

const map = new maplibregl.Map({
  container: 'map',
  center: [116.5, 39.5],
  zoom: 5.45,
  minZoom: 4.6,
  maxZoom: 11,
  renderWorldCopies: false,
  attributionControl: false,
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9ece5' } }]
  }
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right');
map.addControl(new maplibregl.AttributionControl({
  compact: true,
  customAttribution: '行政区：DataV · 地形：Mapzen/AWS Open Data'
}), 'bottom-right');

let datasets = null;
let searchable = [];
let hovered = null;

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} 返回 ${response.status}`);
  return response.json();
}

function setStatus(message, ready = false) {
  els.status.lastChild.textContent = message;
  els.status.classList.toggle('ready', ready);
}

function sourceConfig(data) {
  return { type: 'geojson', data, promoteId: 'adcode' };
}

function addLayers(data) {
  map.addSource('elevation-bands-source', {
    type: 'image',
    url: './data/environment/elevation-bands.png',
    coordinates: data.elevation.coordinates
  });
  map.addLayer({
    id: 'elevation-bands', type: 'raster', source: 'elevation-bands-source',
    paint: { 'raster-opacity': 0.82, 'raster-resampling': 'linear' }
  });

  map.addSource('hillshade-source', {
    type: 'raster-dem',
    url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
    tileSize: 256
  });
  map.addLayer({
    id: 'hillshade', type: 'hillshade', source: 'hillshade-source',
    paint: {
      'hillshade-exaggeration': 0.32,
      'hillshade-shadow-color': '#26352f',
      'hillshade-highlight-color': '#fffdf3',
      'hillshade-accent-color': '#596a61'
    }
  });

  map.addSource('province', sourceConfig(data.province));
  map.addSource('city', sourceConfig(data.city));
  map.addSource('district', sourceConfig(data.district));
  map.addSource('seats', sourceConfig(data.seats));

  map.addLayer({ id: 'province-fill', type: 'fill', source: 'province', paint: {
    'fill-color': '#f7f6ed',
    'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.22, 0.03]
  }});
  map.addLayer({ id: 'city-fill', type: 'fill', source: 'city', paint: {
    'fill-color': '#f1ead8',
    'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.3, 0.035]
  }});
  map.addLayer({ id: 'district-fill', type: 'fill', source: 'district', paint: {
    'fill-color': '#fff7dc',
    'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.34, 0.015]
  }});
  map.addLayer({ id: 'district-line', type: 'line', source: 'district', minzoom: 5.3, paint: {
    'line-color': '#73877c', 'line-width': ['interpolate', ['linear'], ['zoom'], 5.3, 0.35, 9, 1],
    'line-opacity': 0.72, 'line-dasharray': [2, 1.5]
  }});
  map.addLayer({ id: 'city-line', type: 'line', source: 'city', paint: {
    'line-color': '#315e52', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.9, 9, 2],
    'line-opacity': 0.88
  }});
  map.addLayer({ id: 'province-line', type: 'line', source: 'province', paint: {
    'line-color': '#112f29', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2.1, 9, 4],
    'line-opacity': 0.96
  }});

  map.addLayer({ id: 'government-points', type: 'circle', source: 'seats', paint: {
    'circle-radius': ['match', ['get', 'admin_level'], 'province', 6, 'city', 4.7, 3],
    'circle-color': ['match', ['get', 'admin_level'], 'province', '#a33831', 'city', '#cf6b43', '#f2c36b'],
    'circle-stroke-color': '#fffaf0', 'circle-stroke-width': 1.5,
    'circle-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 8, 1]
  }});
  map.addLayer({ id: 'city-labels', type: 'symbol', source: 'seats',
    filter: ['==', ['get', 'admin_level'], 'city'],
    layout: {
      'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 13],
      'text-offset': [0, 1.15], 'text-anchor': 'top', 'text-allow-overlap': false
    },
    paint: { 'text-color': '#16372f', 'text-halo-color': 'rgba(250,249,240,.92)', 'text-halo-width': 1.3 }
  });
  map.addLayer({ id: 'government-labels', type: 'symbol', source: 'seats', minzoom: 7.2,
    filter: ['==', ['get', 'admin_level'], 'district'],
    layout: {
      'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 10,
      'text-offset': [0, 1.05], 'text-anchor': 'top', 'text-allow-overlap': false
    },
    paint: { 'text-color': '#384740', 'text-halo-color': 'rgba(250,249,240,.9)', 'text-halo-width': 1 }
  });
}

function buildSearch(data) {
  searchable = ['province', 'city', 'district'].flatMap(level =>
    data[level].features.map(feature => ({
      name: feature.properties.name,
      adcode: feature.properties.adcode,
      level,
      center: feature.properties.center
    }))
  );
  const unique = new Map(searchable.map(item => [`${item.level}-${item.adcode}`, item]));
  searchable = [...unique.values()];
  els.options.innerHTML = searchable
    .map(item => `<option value="${item.name}">${LEVEL_LABEL[item.level]} · ${item.adcode}</option>`)
    .join('');
}

function locateRegion() {
  const keyword = els.search.value.trim();
  if (!keyword) return;
  const match = searchable.find(item => item.name === keyword)
    || searchable.find(item => item.name.includes(keyword));
  if (!match || !Array.isArray(match.center)) {
    setStatus('未找到该行政区，请检查名称', false);
    return;
  }
  map.flyTo({ center: match.center, zoom: match.level === 'district' ? 8.2 : match.level === 'city' ? 6.8 : 5.4, duration: 900 });
  showFeature({ name: match.name, adcode: match.adcode, admin_level: match.level, center: match.center });
  if (window.innerWidth <= 960) els.panel.classList.remove('open');
}

function showFeature(props, isSeat = false) {
  const level = props.admin_level || props.subcategory || '—';
  els.feature.innerHTML = `
    <p class="eyebrow">${isSeat ? 'GOVERNMENT SEAT' : 'ADMINISTRATIVE UNIT'}</p>
    <h2>${props.name || '未命名要素'}</h2>
    <dl>
      <dt>层级</dt><dd>${LEVEL_LABEL[level] || level}</dd>
      <dt>行政代码</dt><dd>${props.adcode || '—'}</dd>
      <dt>上级代码</dt><dd>${props.parent_code || '—'}</dd>
      <dt>数据角色</dt><dd>${isSeat ? '行政中心参考点' : '行政边界'}</dd>
    </dl>
    <p>${props.description || '点击其他区域继续查询。'}</p>`;
}

function setLayerVisibility(key, visible) {
  (LAYER_GROUPS[key] || []).forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  });
}

function bindControls() {
  document.querySelectorAll('[data-layer]').forEach(input => {
    input.addEventListener('change', () => setLayerVisibility(input.dataset.layer, input.checked));
  });
  document.querySelectorAll('.group-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const keys = button.dataset.group === 'terrain'
        ? ['elevation-bands', 'hillshade']
        : ['province', 'city', 'district', 'government-seats'];
      const controls = keys.map(key => document.querySelector(`[data-layer="${key}"]`));
      const turnOn = controls.some(control => !control.checked);
      controls.forEach(control => {
        control.checked = turnOn;
        setLayerVisibility(control.dataset.layer, turnOn);
      });
      button.textContent = turnOn ? '全部' : '恢复';
    });
  });
  els.opacity.addEventListener('input', () => {
    const value = Number(els.opacity.value) / 100;
    els.opacityOutput.value = `${els.opacity.value}%`;
    if (map.getLayer('elevation-bands')) map.setPaintProperty('elevation-bands', 'raster-opacity', value);
  });
  els.searchButton.addEventListener('click', locateRegion);
  els.search.addEventListener('keydown', event => { if (event.key === 'Enter') locateRegion(); });
  els.panelOpen.addEventListener('click', () => els.panel.classList.add('open'));
  els.panelClose.addEventListener('click', () => els.panel.classList.remove('open'));
}

function bindMapInteractions() {
  const hitLayers = ['government-points', 'district-fill', 'city-fill', 'province-fill'];
  map.on('mousemove', event => {
    els.coordinates.textContent = `${event.lngLat.lng.toFixed(4)}°, ${event.lngLat.lat.toFixed(4)}°`;
    const features = map.queryRenderedFeatures(event.point, { layers: hitLayers });
    map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    const boundary = features.find(feature => feature.layer.id.endsWith('-fill'));
    if (hovered && (!boundary || hovered.source !== boundary.source || hovered.id !== boundary.id)) {
      map.setFeatureState(hovered, { hover: false });
      hovered = null;
    }
    if (boundary && boundary.id != null && !hovered) {
      hovered = { source: boundary.source, id: boundary.id };
      map.setFeatureState(hovered, { hover: true });
    }
  });
  map.on('mouseleave', () => {
    if (hovered) map.setFeatureState(hovered, { hover: false });
    hovered = null;
    map.getCanvas().style.cursor = '';
  });
  map.on('click', event => {
    const feature = map.queryRenderedFeatures(event.point, { layers: hitLayers })[0];
    if (!feature) return;
    const isSeat = feature.layer.id === 'government-points';
    showFeature(feature.properties, isSeat);
    new maplibregl.Popup({ closeButton: false, offset: isSeat ? 10 : 0 })
      .setLngLat(event.lngLat)
      .setHTML(`<h3 class="popup-title">${feature.properties.name}</h3><p class="popup-meta">${isSeat ? '行政中心参考点' : LEVEL_LABEL[feature.properties.admin_level] || '行政区'} · ${feature.properties.adcode || ''}</p>`)
      .addTo(map);
  });
}

map.on('load', async () => {
  try {
    const [province, city, district, seats, elevation] = await Promise.all([
      loadJson(DATA_PATHS.province), loadJson(DATA_PATHS.city), loadJson(DATA_PATHS.district),
      loadJson(DATA_PATHS.seats), loadJson(DATA_PATHS.elevation)
    ]);
    datasets = { province, city, district, seats, elevation };
    addLayers(datasets);
    buildSearch(datasets);
    document.querySelector('#province-count').textContent = province.features.length;
    document.querySelector('#city-count').textContent = city.features.length;
    document.querySelector('#district-count').textContent = district.features.length;
    document.querySelector('#seat-count').textContent = seats.features.length;
    bindControls();
    bindMapInteractions();
    map.fitBounds([[113.35, 36], [119.95, 42.75]], { padding: 34, duration: 0 });
    setStatus('空间数据已加载', true);
  } catch (error) {
    console.error(error);
    setStatus(`加载失败：${error.message}`, false);
  }
});

map.on('error', event => {
  if (event.error) console.warn('MapLibre:', event.error.message || event.error);
});
