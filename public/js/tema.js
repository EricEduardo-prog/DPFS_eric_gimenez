window.temaManager = {

  init() {
    const guardado = localStorage.getItem('tema');
    const prefereDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (guardado === 'dark' || (!guardado && prefereDark)) {
      this._activarDark();
    } else {
      this._activarLight();
    }
  },

  alternarTema() {
    const esDark = document.documentElement.classList.contains('dark');
    esDark ? this._activarLight() : this._activarDark();
  },

  _activarDark() {
    document.documentElement.classList.add('dark');
    localStorage.setItem('tema', 'dark');
    this._actualizarIcono('☀️');
  },

  _activarLight() {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('tema', 'light');
    this._actualizarIcono('🌙');
  },

  _actualizarIcono(icono) {
    const btn = document.querySelector('.boton-tema .icono-tema');
    if (btn) btn.textContent = icono;
  }
};

document.addEventListener('DOMContentLoaded', () => window.temaManager.init());