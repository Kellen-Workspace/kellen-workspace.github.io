const data = window.SITE_CONTENT;
const $ = selector => document.querySelector(selector);
if (data) {
  $('#profile-avatar').src = data.profile.avatar; $('#profile-avatar').alt = `${data.profile.name} 的头像`;
  $('#profile-name').textContent = data.profile.name; $('#profile-identity').textContent = data.profile.identity;
  $('#profile-affiliation').textContent = data.profile.affiliation; $('#profile-location').textContent = data.profile.location;
  const email = $('#profile-email'); email.textContent = data.profile.email; email.href = `mailto:${data.profile.email}`;
  $('#research-directions').replaceChildren(...data.profile.researchDirections.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  $('#profile-links').replaceChildren(...data.links.map(item => {
    const element = document.createElement(item.url ? 'a' : 'span'); element.className = item.url ? 'contact-button' : 'contact-button disabled';
    element.textContent = item.url ? item.label : `${item.label} · 待补充`;
    if (item.url) { element.href = item.url; element.target = '_blank'; element.rel = 'noreferrer'; } return element;
  }));
  $('#introduction').replaceChildren(...data.introduction.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
  $('#honors-list').replaceChildren(...data.honors.map(item => { const article = document.createElement('article'); article.className = 'record'; article.innerHTML = `<time>${item.year}</time><div><h3>${item.title}</h3><p>${item.detail || ''}</p></div>`; return article; }));
  $('#publications-list').replaceChildren(...data.publications.map(item => {
    const article = document.createElement('article'); article.className = 'record'; const title = item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>` : item.title;
    article.innerHTML = `<time>${item.year}</time><div><h3>${title}</h3><p>${item.authors || ''}</p>${item.venue ? `<p class="venue">${item.venue}</p>` : ''}</div>`; return article;
  }));
}
$('#year').textContent = new Date().getFullYear();
