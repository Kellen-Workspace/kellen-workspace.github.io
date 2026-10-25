'use strict';

const $ = selector => document.querySelector(selector);
const elements = {
  input: $('#file-input'), dropZone: $('#drop-zone'), frameList: $('#frame-list'), empty: $('#empty-frames'), frameCount: $('#frame-count'),
  batchDelay: $('#batch-delay'), applyDelay: $('#apply-delay'), clear: $('#clear-all'), width: $('#width'), height: $('#height'), fit: $('#fit'),
  background: $('#background'), colorValue: $('#color-value'), dither: $('#dither'), loop: $('#loop'), previewCanvas: $('#preview-canvas'),
  gifPreview: $('#gif-preview'), placeholder: $('#preview-placeholder'), previewStage: $('#preview-stage'), previewStatus: $('#preview-status'),
  previewSize: $('#preview-size'), estimate: $('#estimate'), progressWrap: $('#progress-wrap'), progressBar: $('#progress-bar'), progressText: $('#progress-text'),
  generate: $('#generate'), download: $('#download'), toast: $('#toast')
};

const state = { frames: [], nextId: 1, previewTimer: null, previewIndex: 0, outputUrl: null, busy: false, draggedId: null };
const context = elements.previewCanvas.getContext('2d', { alpha: false });

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('show'), 2200);
}

function revokeOutput() {
  if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
  state.outputUrl = null;
  elements.gifPreview.hidden = true;
  elements.previewCanvas.hidden = false;
  elements.download.hidden = true;
  elements.estimate.textContent = '预计大小将在生成后显示';
}

function readableBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

function outputDimensions() {
  return {
    width: Math.max(1, Math.min(2400, Number.parseInt(elements.width.value, 10) || 1)),
    height: Math.max(1, Math.min(2400, Number.parseInt(elements.height.value, 10) || 1))
  };
}

function drawFrame(targetContext, image, width, height) {
  targetContext.save();
  targetContext.fillStyle = elements.background.value;
  targetContext.fillRect(0, 0, width, height);
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let drawWidth = width, drawHeight = height, x = 0, y = 0;
  if (elements.fit.value === 'contain') {
    if (sourceRatio > targetRatio) { drawHeight = width / sourceRatio; y = (height - drawHeight) / 2; }
    else { drawWidth = height * sourceRatio; x = (width - drawWidth) / 2; }
  } else if (elements.fit.value === 'cover') {
    if (sourceRatio > targetRatio) { drawWidth = height * sourceRatio; x = (width - drawWidth) / 2; }
    else { drawHeight = width / sourceRatio; y = (height - drawHeight) / 2; }
  }
  targetContext.imageSmoothingEnabled = true;
  targetContext.imageSmoothingQuality = 'high';
  targetContext.drawImage(image, x, y, drawWidth, drawHeight);
  targetContext.restore();
}

function renderPreviewFrame() {
  const { width, height } = outputDimensions();
  elements.previewCanvas.width = width;
  elements.previewCanvas.height = height;
  elements.previewStage.style.aspectRatio = `${width}/${height}`;
  elements.previewSize.textContent = `${width} × ${height} px`;
  if (!state.frames.length) {
    context.fillStyle = elements.background.value;
    context.fillRect(0, 0, width, height);
    elements.placeholder.hidden = false;
    elements.previewStatus.textContent = '等待图片';
    return;
  }
  elements.placeholder.hidden = true;
  const frame = state.frames[state.previewIndex % state.frames.length];
  drawFrame(context, frame.image, width, height);
  elements.previewStatus.textContent = `预览第 ${state.previewIndex + 1} / ${state.frames.length} 帧`;
  clearTimeout(state.previewTimer);
  state.previewTimer = setTimeout(() => {
    state.previewIndex = (state.previewIndex + 1) % state.frames.length;
    renderPreviewFrame();
  }, Math.max(20, frame.delay));
}

function invalidateOutput() {
  revokeOutput();
  renderPreviewFrame();
}

function frameMarkup(frame, index) {
  return `<li class="frame-card" draggable="true" data-id="${frame.id}">
    <span class="frame-number">${String(index + 1).padStart(2, '0')}</span>
    <img class="frame-thumb" src="${frame.url}" alt="">
    <div class="frame-info"><span class="frame-name" title="${escapeHtml(frame.name)}">${escapeHtml(frame.name)}</span><div class="frame-detail"><span>${frame.width} × ${frame.height}</span><label class="delay-field">时长 <input type="number" min="20" max="60000" step="10" value="${frame.delay}" data-action="delay"> ms</label></div></div>
    <div class="frame-actions"><button class="icon-button" data-action="up" title="上移" aria-label="上移">↑</button><button class="icon-button" data-action="down" title="下移" aria-label="下移">↓</button><button class="icon-button remove" data-action="remove" title="删除" aria-label="删除">×</button></div>
  </li>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderFrames() {
  elements.frameList.innerHTML = state.frames.map(frameMarkup).join('');
  elements.empty.hidden = state.frames.length > 0;
  elements.frameCount.textContent = `${state.frames.length} 帧`;
  elements.clear.disabled = state.frames.length === 0;
  elements.generate.disabled = state.frames.length < 2 || state.busy;
  state.previewIndex = Math.min(state.previewIndex, Math.max(0, state.frames.length - 1));
  invalidateOutput();
}

async function fileToFrame(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} 不是图片文件`);
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  try { await image.decode(); }
  catch { URL.revokeObjectURL(url); throw new Error(`${file.name} 无法读取`); }
  return { id: state.nextId++, name: file.name || `粘贴图片-${state.nextId - 1}.png`, file, url, image, width: image.naturalWidth, height: image.naturalHeight, delay: Number(elements.batchDelay.value) || 500 };
}

async function addFiles(files) {
  const candidates = [...files].filter(file => file.type.startsWith('image/'));
  if (!candidates.length) { showToast('没有检测到可用图片'); return; }
  elements.previewStatus.textContent = '正在读取图片…';
  const results = await Promise.allSettled(candidates.map(fileToFrame));
  const added = results.filter(result => result.status === 'fulfilled').map(result => result.value);
  const failed = results.filter(result => result.status === 'rejected');
  if (!state.frames.length && added.length) {
    const first = added[0];
    const scale = Math.min(1, 1200 / Math.max(first.width, first.height));
    elements.width.value = Math.max(1, Math.round(first.width * scale));
    elements.height.value = Math.max(1, Math.round(first.height * scale));
  }
  state.frames.push(...added);
  renderFrames();
  if (added.length) showToast(`已添加 ${added.length} 张图片`);
  if (failed.length) showToast(`${failed.length} 张图片读取失败`);
}

function moveFrame(id, direction) {
  const index = state.frames.findIndex(frame => frame.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= state.frames.length) return;
  [state.frames[index], state.frames[target]] = [state.frames[target], state.frames[index]];
  renderFrames();
}

function removeFrame(id) {
  const index = state.frames.findIndex(frame => frame.id === id);
  if (index < 0) return;
  URL.revokeObjectURL(state.frames[index].url);
  state.frames.splice(index, 1);
  renderFrames();
}

function clearFrames() {
  state.frames.forEach(frame => URL.revokeObjectURL(frame.url));
  state.frames = [];
  state.previewIndex = 0;
  renderFrames();
}

async function generateGif() {
  if (state.frames.length < 2 || state.busy) return;
  const { width, height } = outputDimensions();
  const totalPixels = width * height * state.frames.length;
  if (totalPixels > 40_000_000) {
    showToast('处理量过大，请缩小尺寸或减少图片');
    return;
  }
  state.busy = true;
  elements.generate.disabled = true;
  elements.generate.textContent = '正在生成…';
  elements.progressWrap.hidden = false;
  elements.progressBar.style.width = '2%';
  elements.progressText.textContent = '正在准备画面…';
  clearTimeout(state.previewTimer);
  revokeOutput();

  try {
    await new Promise(resolve => requestAnimationFrame(resolve));
    const workCanvas = document.createElement('canvas');
    workCanvas.width = width; workCanvas.height = height;
    const workContext = workCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
    const frames = [];
    for (let index = 0; index < state.frames.length; index += 1) {
      drawFrame(workContext, state.frames[index].image, width, height);
      frames.push({ imageData: workContext.getImageData(0, 0, width, height), delay: state.frames[index].delay });
      elements.progressBar.style.width = `${Math.round(((index + 1) / state.frames.length) * 40)}%`;
      elements.progressText.textContent = `正在整理第 ${index + 1} / ${state.frames.length} 帧…`;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const blob = LocalGifEncoder.encodeGif({ width, height, frames, loop: elements.loop.checked, dither: elements.dither.value === 'on', onProgress: progress => {
      elements.progressBar.style.width = `${40 + Math.round(progress * 60)}%`;
      elements.progressText.textContent = `正在编码 GIF：${Math.round(progress * 100)}%`;
    }});
    state.outputUrl = URL.createObjectURL(blob);
    elements.gifPreview.src = state.outputUrl;
    elements.gifPreview.hidden = false;
    elements.previewCanvas.hidden = true;
    elements.placeholder.hidden = true;
    elements.download.href = state.outputUrl;
    elements.download.download = `animation-${new Date().toISOString().slice(0, 10)}.gif`;
    elements.download.hidden = false;
    elements.estimate.textContent = `文件大小 ${readableBytes(blob.size)}`;
    elements.previewStatus.textContent = 'GIF 已生成';
    elements.progressText.textContent = '生成完成';
    showToast('GIF 已生成，可以下载');
  } catch (error) {
    console.error(error);
    elements.progressText.textContent = '生成失败，请缩小尺寸后重试';
    showToast('生成失败，请缩小尺寸或减少图片');
  } finally {
    state.busy = false;
    elements.generate.disabled = state.frames.length < 2;
    elements.generate.textContent = '重新生成 GIF';
  }
}

elements.input.addEventListener('change', event => { addFiles(event.target.files); event.target.value = ''; });
elements.dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); elements.input.click(); } });
['dragenter', 'dragover'].forEach(type => elements.dropZone.addEventListener(type, event => { event.preventDefault(); elements.dropZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => elements.dropZone.addEventListener(type, event => { event.preventDefault(); elements.dropZone.classList.remove('dragging'); }));
elements.dropZone.addEventListener('drop', event => addFiles(event.dataTransfer.files));
document.addEventListener('paste', event => {
  const files = [...event.clipboardData.items].filter(item => item.kind === 'file' && item.type.startsWith('image/')).map(item => item.getAsFile()).filter(Boolean);
  if (files.length) { event.preventDefault(); addFiles(files); }
});

elements.frameList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = Number(button.closest('.frame-card').dataset.id);
  if (button.dataset.action === 'up') moveFrame(id, -1);
  if (button.dataset.action === 'down') moveFrame(id, 1);
  if (button.dataset.action === 'remove') removeFrame(id);
});
elements.frameList.addEventListener('change', event => {
  if (event.target.dataset.action !== 'delay') return;
  const frame = state.frames.find(item => item.id === Number(event.target.closest('.frame-card').dataset.id));
  frame.delay = Math.max(20, Math.min(60000, Number(event.target.value) || 500));
  event.target.value = frame.delay;
  invalidateOutput();
});
elements.frameList.addEventListener('dragstart', event => { const card = event.target.closest('.frame-card'); if (!card) return; state.draggedId = Number(card.dataset.id); card.classList.add('dragging'); });
elements.frameList.addEventListener('dragend', event => { event.target.closest('.frame-card')?.classList.remove('dragging'); state.draggedId = null; document.querySelectorAll('.drop-target').forEach(card => card.classList.remove('drop-target')); });
elements.frameList.addEventListener('dragover', event => { event.preventDefault(); const card = event.target.closest('.frame-card'); document.querySelectorAll('.drop-target').forEach(item => item.classList.remove('drop-target')); card?.classList.add('drop-target'); });
elements.frameList.addEventListener('drop', event => {
  event.preventDefault();
  const targetCard = event.target.closest('.frame-card');
  if (!targetCard || state.draggedId === null) return;
  const from = state.frames.findIndex(frame => frame.id === state.draggedId);
  const to = state.frames.findIndex(frame => frame.id === Number(targetCard.dataset.id));
  if (from !== to && from >= 0 && to >= 0) { const [moved] = state.frames.splice(from, 1); state.frames.splice(to, 0, moved); renderFrames(); }
});

elements.applyDelay.addEventListener('click', () => {
  const delay = Math.max(20, Math.min(60000, Number(elements.batchDelay.value) || 500));
  elements.batchDelay.value = delay;
  state.frames.forEach(frame => { frame.delay = delay; });
  renderFrames();
  showToast(`已统一为 ${delay} ms`);
});
elements.clear.addEventListener('click', clearFrames);
elements.generate.addEventListener('click', generateGif);
elements.background.addEventListener('input', () => { elements.colorValue.textContent = elements.background.value; invalidateOutput(); });
[elements.width, elements.height].forEach(input => input.addEventListener('change', () => { const { width, height } = outputDimensions(); elements.width.value = width; elements.height.value = height; invalidateOutput(); }));
[elements.fit, elements.dither, elements.loop].forEach(input => input.addEventListener('change', invalidateOutput));
elements.download.addEventListener('click', () => showToast('GIF 下载已开始'));
window.addEventListener('beforeunload', () => { clearTimeout(state.previewTimer); state.frames.forEach(frame => URL.revokeObjectURL(frame.url)); revokeOutput(); });

$('#year').textContent = new Date().getFullYear();
renderPreviewFrame();

