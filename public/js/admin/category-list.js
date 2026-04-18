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
                    mensaje = `¿Desactivar la categoría "${nombre}"?\n\nLos productos asociados no perderán su categoría, pero la categoría no se mostrará en el sitio.`;
                } else {
                    mensaje = `¿Reactivar la categoría "${nombre}"?\n\nVolverá a estar disponible en el sitio.`;
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
        const table = document.getElementById('categoriasTabla');
        if (!table) return;

        const headers = table.querySelectorAll('th.sortable');
        let currentSort = { column: null, direction: 'asc' };

        headers.forEach(header => {
            header.addEventListener('click', () => {
                const sortKey = header.dataset.sort;
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));

                // Determinar dirección
                if (currentSort.column === sortKey) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.direction = 'asc';
                }
                currentSort.column = sortKey;

                // Actualizar iconos
                headers.forEach(h => {
                    const icon = h.querySelector('.sort-icon');
                    if (icon) icon.textContent = '↕️';
                });
                const currentIcon = header.querySelector('.sort-icon');
                if (currentIcon) {
                    currentIcon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
                }

                // Ordenar filas
                rows.sort((a, b) => {
                    let aVal, bVal;

                    switch (sortKey) {
                        case 'orden':
                            aVal = parseInt(a.dataset.orden) || 999;
                            bVal = parseInt(b.dataset.orden) || 999;
                            break;
                        case 'nombre':
                            aVal = a.dataset.nombre || '';
                            bVal = b.dataset.nombre || '';
                            break;
                        case 'slug':
                            aVal = a.dataset.slug || '';
                            bVal = b.dataset.slug || '';
                            break;
                        case 'productos':
                            aVal = parseInt(a.dataset.productos) || 0;
                            bVal = parseInt(b.dataset.productos) || 0;
                            break;
                        default:
                            return 0;
                    }

                    if (typeof aVal === 'number') {
                        return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
                    }
                    return currentSort.direction === 'asc'
                        ? aVal.localeCompare(bVal, 'es')
                        : bVal.localeCompare(aVal, 'es');
                });

                // Reordenar DOM
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    }

    // ============================================================
    // 3. FILTRO POR ESTADO (Solo activas)
    // ============================================================
    function initFilterByStatus() {
        const checkSoloActivas = document.getElementById('filtroSoloActivas');
        const btnFiltrar = document.getElementById('btnFiltrar');
        const tabla = document.getElementById('categoriasTabla');

        if (!checkSoloActivas || !btnFiltrar || !tabla) return;

        // Cargar filtro guardado
        const savedFilter = localStorage.getItem('categorias_filtro_soloActivas');
        if (savedFilter === 'true') {
            checkSoloActivas.checked = true;
        }

        function aplicarFiltro() {
            const soloActivas = checkSoloActivas.checked;
            const rows = tabla.querySelectorAll('tbody tr');
            let visibleCount = 0;

            rows.forEach(row => {
                const isActiva = !row.classList.contains('admin-tabla__fila--inactiva');

                if (soloActivas && !isActiva) {
                    row.style.display = 'none';
                } else {
                    row.style.display = '';
                    visibleCount++;
                }
            });

            // Actualizar contador visual
            const conteoElement = document.querySelector('.admin-listado__conteo');
            if (conteoElement) {
                conteoElement.textContent = `${visibleCount} registros`;
            }

            // Guardar filtro
            localStorage.setItem('categorias_filtro_soloActivas', soloActivas);
        }

        btnFiltrar.addEventListener('click', aplicarFiltro);

        // Aplicar filtro inicial si hay guardado
        if (savedFilter === 'true') {
            aplicarFiltro();
        }
    }

    // ============================================================
    // 4. RESETEAR CONTADOR AL LIMPIAR FILTROS
    // ============================================================
    function initResetCounter() {
        const limpiarLink = document.querySelector('a[href="/admin/categorias"]');
        if (limpiarLink) {
            limpiarLink.addEventListener('click', () => {
                localStorage.removeItem('categorias_filtro_soloActivas');
                const checkSoloActivas = document.getElementById('filtroSoloActivas');
                if (checkSoloActivas) checkSoloActivas.checked = false;
            });
        }
    }

    // ============================================================
    // 5. INICIALIZACIÓN
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        initToggleEstado();
        initSortableTable();
        initFilterByStatus();
        initResetCounter();
    });
})();