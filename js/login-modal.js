const navLogin = document.getElementById('nav-login');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeLoginModal');
const form = document.getElementById('loginForm');
const mensaje = document.getElementById('loginMensaje');

function closeLoginModal() {
  loginModal.classList.remove('is-visible');
  form.reset();
}
const fetchOriginal = window.fetch.bind(window);
window.fetch = (url, options = {}) => {
  const normalizedUrl = typeof url === 'string' && url.startsWith('/api/') ? API_URL(url) : url;
  const urlString = typeof normalizedUrl === 'string' ? normalizedUrl : String(normalizedUrl.url || '');
  if (urlString.includes('/api/')) {
    const token = localStorage.getItem('token');
    options.headers = { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }
  return fetchOriginal(normalizedUrl, options);
};
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function closeUserMenu() {
  const dropdown = document.getElementById('navUserDropdown');
  const toggle = document.getElementById('navUserToggle');
  if (dropdown) dropdown.classList.remove('is-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function renderNav() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (token && username) {
    navLogin.innerHTML = `
      <div class="nav-user-menu">
        <button type="button" class="nav-user-toggle" id="navUserToggle" aria-haspopup="true" aria-expanded="false">
          <span class="nav-user-icon">&#128100;</span><span class="nav-user-name">${escapeHtml(username)}</span><span class="nav-user-caret">&#9662;</span>
        </button>
        <ul class="nav-user-dropdown" id="navUserDropdown" role="menu">
          <li role="none"><button type="button" id="logoutDiv" class="nav-user-item" role="menuitem">Cerrar sesi\u00f3n</button></li>
          <li role="none"><button type="button" class="nav-user-item" role="menuitem" disabled>Cambiar contrase\u00f1a</button></li>
        </ul>
      </div>
    `;
    const toggle = document.getElementById('navUserToggle');
    const dropdown = document.getElementById('navUserDropdown');
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = dropdown.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.getElementById('logoutDiv').addEventListener('click', () => {
      localStorage.removeItem('token'); localStorage.removeItem('username'); localStorage.removeItem('role');
      form.reset(); window.location.reload();
    });
  } else {
    navLogin.innerHTML = '<div id="loginDiv" class="nav-btn">Login</div>';
    document.getElementById('loginDiv').addEventListener('click', () => {
      loginModal.classList.add('is-visible');
      document.getElementById('user').focus();
    });
  }
}
closeModal.addEventListener('click', closeLoginModal);
loginModal.addEventListener('click', event => {
  if (event.target === loginModal) closeLoginModal();
});
document.addEventListener('click', () => closeUserMenu());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && loginModal.classList.contains('is-visible')) closeLoginModal();
  if (event.key === 'Escape') closeUserMenu();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const res = await API_FETCH('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: document.getElementById('user').value, password: document.getElementById('password').value }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesi\u00f3n');
    localStorage.setItem('token', data.token); localStorage.setItem('role', data.role); localStorage.setItem('username', document.getElementById('user').value);
    window.location.reload();
  } catch (error) { mensaje.textContent = `Error: ${error.message}`; mensaje.style.color = 'red'; }
});
renderNav();
