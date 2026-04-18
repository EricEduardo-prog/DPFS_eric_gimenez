(function () {
    'use strict';

    // ============================================================
    // 1. CONFIRMACIÓN PARA TOGGLE DE ESTADO
    // ============================================================
    function initToggleEstado() {
        const btns = document.querySelectorAll('.btn-toggle-estado');

        btns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                const nombre = this.dataset.nombre;
                const activo = this.dataset.activo === 'true';

                let mensaje = '';
                if (activo) {
                    mensaje = `¿Desactivar el usuario "${nombre}"?\n\nEl usuario no podrá iniciar sesión ni realizar compras.`;
                } else {
                    mensaje = `¿Reactivar el usuario "${nombre}"?\n\nVolverá a tener acceso a la plataforma.`;
                }

                if (confirm(mensaje)) {
                    const form = this.closest('.form-toggle-estado');
                    if (form) {
                        form.submit();
                    }
                }
            });
        });
    }

    // ============================================================
    // 2. ORDENAMIENTO DE TABLA (sortable)
    // ============================================================
    function initSortableTable() {
        const table = document.getElementById('usuariosTabla');
        if (!table) return;

        const headers = table.querySelectorAll('th.sortable');
        let currentSort = { column: null, direction: 'asc' };

        headers.forEach(header => {
            header.addEventListener('click', () => {
                const sortKey = header.dataset.sort;
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));

                if (currentSort.column === sortKey) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.direction = 'asc';
                }
                currentSort.column = sortKey;

                headers.forEach(h => {
                    const icon = h.querySelector('.sort-icon');
                    if (icon) icon.textContent = '↕️';
                });
                const currentIcon = header.querySelector('.sort-icon');
                if (currentIcon) {
                    currentIcon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
                }

                rows.sort((a, b) => {
                    let aVal, bVal;

                    switch (sortKey) {
                        case 'nombre':
                            aVal = a.dataset.nombre || '';
                            bVal = b.dataset.nombre || '';
                            break;
                        case 'email':
                            aVal = a.dataset.email || '';
                            bVal = b.dataset.email || '';
                            break;
                        default:
                            return 0;
                    }

                    return currentSort.direction === 'asc'
                        ? aVal.localeCompare(bVal, 'es')
                        : bVal.localeCompare(aVal, 'es');
                });

                rows.forEach(row => tbody.appendChild(row));
            });
        });
    }

    // ============================================================
    // 3. PERSISTENCIA DE FILTROS
    // ============================================================
    function initFilterPersistence() {
        const filtrosForm = document.getElementById('filtrosForm');
        if (!filtrosForm) return;

        const checkSoloActivos = filtrosForm.querySelector('input[name="soloActivos"]');
        if (!checkSoloActivos) return;

        const savedFilter = localStorage.getItem('usuarios_filtro_soloActivos');
        if (savedFilter === 'true') {
            checkSoloActivos.checked = true;
        }

        filtrosForm.addEventListener('submit', () => {
            localStorage.setItem('usuarios_filtro_soloActivos', checkSoloActivos.checked);
        });
    }

    // ============================================================
    // 4. INICIALIZACIÓN
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        initToggleEstado();
        initSortableTable();
        initFilterPersistence();
    });
})();