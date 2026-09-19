const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.site-nav');
menuButton?.addEventListener('click', () => { const open = siteNav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); });
siteNav?.addEventListener('click', e => { if (e.target.matches('a')) { siteNav.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); } });
document.querySelector('#year').textContent = new Date().getFullYear();
