(function () {
    'use strict';

    // ============================================================
    // ACORDEÓN - Colapsar/Expandir secciones
    // ============================================================
    function initAcordeon() {
        const headers = document.querySelectorAll('.acordeon-header');

        headers.forEach(header => {
            // Estado inicial: primera sección abierta por defecto
            const seccion = header.parentElement;
            const isFirst = seccion === document.querySelector('.acordeon-seccion');
            if (isFirst) {
                seccion.classList.add('acordeon-abierto');
            }

            header.addEventListener('click', (e) => {
                e.preventDefault();
                seccion.classList.toggle('acordeon-abierto');
            });
        });
    }

    // ============================================================
    // ACTUALIZAR CANTIDAD DE PRODUCTO
    // ============================================================
    async function actualizarItem(itemId, cantidad) {
        try {
            const response = await fetch(`/reserva/item/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cantidad: cantidad })
            });

            if (response.ok) {
                if (typeof window.actualizarContadorReserva === 'function') {
                    window.actualizarContadorReserva();
                }
                window.location.reload();
            } else {
                const error = await response.json();
                console.error('Error al actualizar:', error);
                alert('No se pudo actualizar la cantidad');
            }
        } catch (err) {
            console.error('Error de red:', err);
            alert('Error de conexión al actualizar');
        }
    }

    function initActualizarCantidad() {
        // Botón disminuir
        document.querySelectorAll('.btn-disminuir').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.dataset.itemId;
                const input = document.querySelector(`.input-cantidad[data-item-id="${itemId}"]`);
                let cantidad = parseInt(input.value) - 1;
                if (cantidad < 1) cantidad = 1;
                await actualizarItem(itemId, cantidad);
            });
        });

        // Botón aumentar
        document.querySelectorAll('.btn-aumentar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.dataset.itemId;
                const input = document.querySelector(`.input-cantidad[data-item-id="${itemId}"]`);
                let cantidad = parseInt(input.value) + 1;
                await actualizarItem(itemId, cantidad);
            });
        });
    }

    // ============================================================
    // ELIMINAR ITEM
    // ============================================================
    async function eliminarItem(itemId) {
        try {
            const response = await fetch(`/reserva/item/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                if (typeof window.actualizarContadorReserva === 'function') {
                    window.actualizarContadorReserva();
                }
                window.location.reload();
            } else {
                const error = await response.json();
                console.error('Error al eliminar:', error);
                alert('No se pudo eliminar el item');
            }
        } catch (err) {
            console.error('Error de red:', err);
            alert('Error de conexión al eliminar');
        }
    }

    function initEliminarItem() {
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.dataset.itemId;
                const confirmar = confirm('¿Eliminar este item de tu reserva?');
                if (confirmar) {
                    await eliminarItem(itemId);
                }
            });
        });
    }

    // ============================================================
    // FINALIZAR COMPRA
    // ============================================================
    function initFinalizarCompra() {
        const btnFinalizar = document.getElementById('btnFinalizarCompra');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => {
                window.location.href = '/checkout';
            });
        }
    }

    // ============================================================
    // FECHA DE INSTALACIÓN (guardar en localStorage)
    // ============================================================
    function initFechaInstalacion() {
        const fechaInput = document.getElementById('fechaInstalacion');
        const horarioSelect = document.getElementById('horarioInstalacion');

        if (!fechaInput || !horarioSelect) return;

        // Cargar datos guardados
        const fechaGuardada = localStorage.getItem('reserva_fecha_instalacion');
        const horarioGuardado = localStorage.getItem('reserva_horario_instalacion');

        if (fechaGuardada) fechaInput.value = fechaGuardada;
        if (horarioGuardado) horarioSelect.value = horarioGuardado;

        // Guardar al cambiar
        fechaInput.addEventListener('change', () => {
            localStorage.setItem('reserva_fecha_instalacion', fechaInput.value);
        });

        horarioSelect.addEventListener('change', () => {
            localStorage.setItem('reserva_horario_instalacion', horarioSelect.value);
        });
    }

    // ============================================================
    // ACTUALIZAR CONTADOR DEL RESERVA (para navbar)
    // ============================================================
    async function actualizarContadorReserva() {
        try {
            const response = await fetch('/reserva/count');
            if (response.ok) {
                const data = await response.json();
                const contador = document.querySelector('.contador-notificacion');
                if (contador && data.totalItems > 0) {
                    contador.textContent = data.totalItems > 9 ? '+9' : data.totalItems;
                    contador.style.display = 'flex';
                } else if (contador) {
                    contador.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Error al obtener contador:', err);
        }
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        initAcordeon();
        initActualizarCantidad();
        initEliminarItem();
        initFinalizarCompra();
        initFechaInstalacion();
        actualizarContadorReserva();
    });
})();