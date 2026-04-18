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
                    mensaje = `¿Desactivar al profesional "${nombre}"? Dejará de estar disponible para asignaciones.`;
                } else {
                    mensaje = `¿Reactivar al profesional "${nombre}"? Volverá a estar disponible.`;
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
        const table = document.getElementById('profesionalesTabla');
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
                        case 'nombre':
                            aVal = a.dataset.nombre || '';
                            bVal = b.dataset.nombre || '';
                            break;
                        case 'matricula':
                            aVal = a.dataset.matricula || '';
                            bVal = b.dataset.matricula || '';
                            break;
                        case 'servicio':
                            aVal = a.dataset.servicio || '';
                            bVal = b.dataset.servicio || '';
                            break;
                        case 'valoracion':
                            aVal = parseFloat(a.dataset.valoracion) || 0;
                            bVal = parseFloat(b.dataset.valoracion) || 0;
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
    // 3. PERSISTENCIA DE FILTROS (localStorage)
    // ============================================================
    function initFilterPersistence() {
        const filtrosForm = document.getElementById('filtrosForm');
        if (!filtrosForm) return;

        const servicioSelect = filtrosForm.querySelector('select[name="servicioId"]');
        const soloActivosCheck = filtrosForm.querySelector('input[name="soloActivos"]');

        if (!servicioSelect) return;

        // Cargar filtros guardados
        const savedServicioId = localStorage.getItem('profesionales_filtro_servicioId');
        const savedSoloActivos = localStorage.getItem('profesionales_filtro_soloActivos');

        if (savedServicioId) {
            const optionExists = Array.from(servicioSelect.options).some(opt => opt.value === savedServicioId);
            if (optionExists) {
                servicioSelect.value = savedServicioId;
            }
        }

        if (savedSoloActivos === 'true' && soloActivosCheck) {
            soloActivosCheck.checked = true;
        }

        // Guardar filtros al enviar
        filtrosForm.addEventListener('submit', () => {
            if (servicioSelect && servicioSelect.value) {
                localStorage.setItem('profesionales_filtro_servicioId', servicioSelect.value);
            } else {
                localStorage.removeItem('profesionales_filtro_servicioId');
            }

            if (soloActivosCheck) {
                localStorage.setItem('profesionales_filtro_soloActivos', soloActivosCheck.checked);
            }
        });

        // Limpiar filtros
        const limpiarBtn = document.getElementById('limpiarFiltros');
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => {
                localStorage.removeItem('profesionales_filtro_servicioId');
                localStorage.removeItem('profesionales_filtro_soloActivos');
            });
        }
    }

    // ============================================================
    // 4. ACTUALIZAR CONTADOR DE REGISTROS (filtro visual)
    // ============================================================
    function initFiltroVisual() {
        const filtroForm = document.getElementById('filtrosForm');
        if (!filtroForm) return;

        const servicioSelect = filtroForm.querySelector('select[name="servicioId"]');
        const soloActivosCheck = filtroForm.querySelector('input[name="soloActivos"]');
        const conteoElement = document.getElementById('registrosConteo');
        const tabla = document.getElementById('profesionalesTabla');

        if (!conteoElement || !tabla) return;

        function actualizarConteo() {
            const tbody = tabla.querySelector('tbody');
            if (!tbody) return;
            const visibleRows = Array.from(tbody.querySelectorAll('tr')).filter(row => row.style.display !== 'none');
            conteoElement.textContent = `${visibleRows.length} registros`;
        }

        // Si hay filtros visuales, actualizar conteo
        if (servicioSelect || soloActivosCheck) {
            actualizarConteo();
        }
    }

    // ============================================================
    // 5. INICIALIZACIÓN
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        initToggleEstado();
        initSortableTable();
        initFilterPersistence();
        initFiltroVisual();

        console.log('✅ professional-list.js inicializado correctamente');
    });
})();