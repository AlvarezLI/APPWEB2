/* NUVEA — Navbar Component */
import { isLoggedIn, getUsuario, cerrarSesion } from '../utils/session.js';
import { updateCartBadge } from '../utils/cart.js';
import { escapeHTML } from '../utils/format.js';

const NAV_PAGES = [
  { href: 'index.html',       label: 'Inicio' },
  { href: 'productos.html',   label: 'Productos' },
  { href: 'moda.html',        label: 'Moda' },
  { href: 'electronica.html', label: 'Electrónica' },
  { href: 'hogar.html',       label: 'Hogar' },
];

export function renderNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;

  const current = window.location.pathname.split('/').pop() || 'index.html';
  const logged  = isLoggedIn();
  const pages   = logged ? [...NAV_PAGES, { href: 'compras.html', label: 'Mis compras' }] : NAV_PAGES;

  const linksHTML = pages.map(page =>
    `<li><a href="${page.href}"${page.href === current ? ' class="active"' : ''}>${page.label}</a></li>`
  ).join('');

  const sessionHTML = logged
    ? `<span class="nav-user">Hola, ${escapeHTML(getUsuario()?.nombre)}</span>
       <button class="btn-logout" id="btnLogout">Cerrar sesión</button>`
    : `<a href="login.html" class="btn-logout">Iniciar sesión</a>`;

  nav.innerHTML = `
    <a href="index.html" class="nav-brand">
      <svg class="nav-logo" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="3" fill="#1A1917"/>
        <path d="M7 8v12M7 8l14 12M21 8v12" stroke="#FAFAF8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="nav-brand-name">uvea</span>
    </a>
    <ul class="nav-links">${linksHTML}</ul>
    <a href="cart.html" class="nav-cart" aria-label="Carrito">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <span class="cart-badge"></span>
    </a>
    <button class="nav-toggle" aria-label="Menú" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    ${sessionHTML}`;

  document.getElementById('btnLogout')?.addEventListener('click', () => cerrarSesion('index.html'));
  initNav();
  updateCartBadge();
}

// Menú hamburguesa en mobile
export function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}
