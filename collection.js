const key = document.body.dataset.collection;
const collection = window.SITE_COLLECTIONS?.[key];
if (collection) {
  document.title = `${collection.title} · Kellen`;
  document.querySelector('#collection-label').textContent = collection.label;
  document.querySelector('#collection-title').textContent = collection.title;
  document.querySelector('#collection-description').textContent = collection.description;
  document.querySelector(`[data-nav="${key}"]`)?.classList.add('active');
  const list = document.querySelector('#item-list');
  if (!collection.items.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = collection.emptyText; list.append(empty);
  } else {
    collection.items.forEach(item => {
      const link = document.createElement('a'); link.className = 'collection-item'; link.href = item.url;
      if (/^https?:/.test(item.url)) { link.target = '_blank'; link.rel = 'noreferrer'; }
      link.innerHTML = `<span class="item-meta">${item.meta || ''}</span><div><h2>${item.title}</h2><p>${item.description || ''}</p></div><span class="item-arrow">↗</span>`;
      list.append(link);
    });
  }
}
document.querySelector('#year').textContent = new Date().getFullYear();
