(function () {
    'use strict';

    // ============================================================
    // DOM Elements
    // ============================================================
    const miniaturas = document.querySelectorAll('.miniatura');
    const imagenPrincipal = document.querySelector('.imagen-principal img');
    const cantidadInput = document.getElementById('cantidadProducto');
    const btnDisminuir = document.querySelector('.boton-cantidad:first-child');
    const btnAumentar = document.querySelector('.boton-cantidad:last-child');
    const instalacionCheckbox = document.getElementById('checkboxInstalacion');
    const btnAgregarReserva = document.getElementById('btnAgregarReserva');
    const btnVerReservaciones = document.getElementById('btnVerReservas');
    const btnTexto = btnAgregarReserva?.querySelector('.btn-texto');

    // Elementos de precios
    const montoProducto = document.getElementById('montoProducto');
    const montoTotal = document.getElementById('montoTotal');
    const totalReserva = document.getElementById('totalReserva');
    const lineaProducto = document.getElementById('lineaProducto');
    const lineaInstalacion = document.getElementById('lineaInstalacion');
    const montoInstalacion = document.getElementById('montoInstalacion');
    const cantidadSpan = document.querySelector('#lineaProducto span:first-child');

    // Fecha y horario
    const fechaInput = document.getElementById('fechaInstalacion');
    const horarioSelected = document.getElementById('horarioInstalacion');

    // Datos del producto desde window
    const producto = window.productoData || {};
    const productoId = producto.id;
    const precioUnitario = Number(producto.precio) || 0;
    const instalacionDisponible = producto.instalacionDisponible === true || producto.instalacionDisponible === 'true';
    const servicioId = producto.servicioId || null;

    // Estado
    let cantidadEnReserva = 0;
    let isAdding = false;
    let profesionalesDisponibles = [];
    let profesionalSeleccionado = null;
    let selectorProfesionalDiv = null;

    // ============================================================
    // Helpers
    // ============================================================
    function getFechaActual() {
        return fechaInput?.value || '';
    }

    function getHorarioActual() {
        return horarioSelected?.value || '';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function generarEstrellas(rating) {
        const full = Math.floor(rating);
        const half = rating - full >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    }

    function setLoading(state) {
        if (!btnAgregarReserva) return;

        btnAgregarReserva.disabled = state;
        btnAgregarReserva.style.opacity = state ? '0.6' : '1';
        btnAgregarReserva.classList.toggle('agregando', state);
    }

    function actualizarUIExito(data) {
        cantidadEnReserva = data?.item?.cantidad || cantidadEnReserva + 1;

        if (btnTexto) {
            btnTexto.textContent =
                cantidadEnReserva > 0
                    ? `Agregar más (${cantidadEnReserva} en reserva)`
                    : 'Agregar a reserva';
        }

        if (typeof window.actualizarContadorReserva === 'function') {
            window.actualizarContadorReserva();
        }

        btnAgregarReserva?.classList.add('agregado');
        setTimeout(() => btnAgregarReserva?.classList.remove('agregado'), 500);
    }
    // ============================================================
    // Control de visibilidad de los campos de instalación
    // ============================================================
    function toggleInstalacionCampos(mostrar) {
        const selectorFechaContainer = document.getElementById('selector-fecha');
        const selectorProfesionalContainer = selectorProfesionalDiv;

        const displayValue = mostrar ? 'block' : 'none'; // O 'flex' según el CSS

        if (selectorFechaContainer) selectorFechaContainer.style.display = displayValue;
        if (selectorProfesionalContainer) selectorProfesionalContainer.style.display = displayValue;

        // Si se ocultan, limpiar selección de profesional
        if (!mostrar) {
            profesionalSeleccionado = null;
            const hidden = document.getElementById('profesionalSeleccionado');
            if (hidden) hidden.value = '';
        }
    }

    // ============================================================
    // Actualizar presupuesto (producto + instalación)
    // ============================================================
    function actualizarPresupuesto() {
        const cantidad = parseInt(cantidadInput?.value) || 1;
        const subtotalProducto = precioUnitario * cantidad;

        let costoInstalacion = 0;
        const incluirInstalacion = instalacionCheckbox?.checked && instalacionDisponible;

        if (incluirInstalacion && profesionalSeleccionado) {
            const profesional = profesionalesDisponibles.find(p => p.id === profesionalSeleccionado);
            costoInstalacion = profesional ? (profesional.precioBase || 0) : 0;
        }

        const total = subtotalProducto + costoInstalacion;

        // Actualizar línea de producto
        if (montoProducto) montoProducto.textContent = '$' + subtotalProducto.toLocaleString('es-AR');
        if (cantidadSpan) cantidadSpan.innerHTML = `Producto (${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'})`;

        // Línea de instalación
        if (lineaInstalacion && instalacionDisponible) {
            lineaInstalacion.style.display = incluirInstalacion ? 'flex' : 'none';
            if (montoInstalacion) montoInstalacion.textContent = '$' + costoInstalacion.toLocaleString('es-AR');
        }

        // Total
        if (montoTotal) montoTotal.textContent = '$' + total.toLocaleString('es-AR');
        if (totalReserva) totalReserva.textContent = '$' + total.toLocaleString('es-AR');
    }

    // ============================================================
    // Cargar profesionales disponibles desde el backend
    // ============================================================
    async function cargarProfesionalesDisponibles() {
        const fecha = getFechaActual();
        const horario = getHorarioActual();

        if (!instalacionDisponible || !servicioId) {
            ocultarSelectorProfesional();
            return;
        }

        if (!fecha || !horario) {
            mostrarMensajeCompletarFechaHorario();
            return;
        }

        try {
            mostrarCargandoProfesionales();
            console.log(`Cargando profesionales para servicioId=${servicioId}, fecha=${fecha}, horario=${horario}`);
            const response = await fetch(`/disponibilidad/profesionales?servicioId=${servicioId}&fecha=${fecha}&turno=${horario}`);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (data.success && data.profesionales?.length) {
                profesionalesDisponibles = data.profesionales;
                renderizarProfesionales(profesionalesDisponibles);
                mostrarSelectorProfesional();
            } else {
                profesionalesDisponibles = [];
                mostrarMensajeSinProfesionales();
            }

            actualizarPresupuesto();

        } catch (err) {
            console.error('Error cargando profesionales:', err);
            mostrarMensajeErrorProfesionales();
        }
    }

    function mostrarSelectorProfesional() {
        toggleInstalacionCampos(true); // Muestra fecha, horario y grid de profesionales
    }

    function ocultarSelectorProfesional() {
        toggleInstalacionCampos(false);
    }

    function mostrarCargandoProfesionales() {
        const grid = document.getElementById('gridProfesionales');
        if (grid) grid.innerHTML = '<div class="cargando-profesionales">🔄 Cargando profesionales disponibles...</div>';
        mostrarSelectorProfesional();
    }

    function mostrarMensajeSinProfesionales() {
        const grid = document.getElementById('gridProfesionales');
        if (grid) grid.innerHTML = '<div class="sin-profesionales">⚠️ No hay profesionales disponibles en esta fecha y horario</div>';
    }

    function mostrarMensajeCompletarFechaHorario() {
        const grid = document.getElementById('gridProfesionales');
        if (grid) grid.innerHTML = '<div class="completar-fecha-horario">⚠️ Por favor, complete la fecha y el horario para ver profesionales disponibles</div>';
    }

    function mostrarMensajeErrorProfesionales() {
        const grid = document.getElementById('gridProfesionales');
        if (grid) grid.innerHTML = '<div class="error-profesionales">❌ Error al cargar profesionales. Intente nuevamente.</div>';
    }

    function renderizarProfesionales(profesionales) {
        const grid = document.getElementById('gridProfesionales');
        if (!grid) return;

        if (!profesionales.length) {
            mostrarMensajeSinProfesionales();
            return;
        }

        grid.innerHTML = profesionales.map(prof => `
            <div class="tarjeta-profesional" data-id="${prof.id}" data-precio="${prof.precioBase || 0}">
                <div class="nombre-profesional">${escapeHtml(prof.nombre)}</div>
                <div class="rating-profesional">
                    <span class="estrellas">${generarEstrellas(prof.rating || 0)}</span>
                    <span class="rating-numero">${(prof.rating || 0).toFixed(1)}</span>
                    <span class="trabajos">(${prof.trabajos || 0} trabajos)</span>
                </div>
                <div class="precio-profesional">$${(prof.precioBase || 0).toLocaleString('es-AR')}</div>
            </div>
        `).join('');

        document.querySelectorAll('.tarjeta-profesional').forEach(card => {
            card.addEventListener('click', () => seleccionarProfesional(card));
        });
    }

    function seleccionarProfesional(card) {
        document.querySelectorAll('.tarjeta-profesional').forEach(c => c.classList.remove('seleccionado'));
        card.classList.add('seleccionado');
        profesionalSeleccionado = card.dataset.id;
        const hidden = document.getElementById('profesionalSeleccionado');
        if (hidden) hidden.value = profesionalSeleccionado;
        actualizarPresupuesto();
    }

    // ============================================================
    // Verificar cantidad actual en reserva (para el texto del botón)
    // ============================================================
    async function verificarCantidadEnReserva() {
        try {
            const response = await fetch(`/reserva/detecto/${productoId}`);
            if (response.ok) {
                const data = await response.json();
                cantidadEnReserva = data.cantidad || 0;
                if (btnTexto) {
                    btnTexto.textContent = cantidadEnReserva > 0
                        ? `Agregar más (${cantidadEnReserva} en reserva)`
                        : 'Agregar a reserva';
                }
            }
        } catch (err) {
            console.error('Error al verificar cantidad:', err);
        }
    }
    // Fetch limpio
    async function postReserva(body) {
        const response = await fetch('/reserva/agregar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(data?.error || 'Error al agregar a la reserva');
        }

        return data;
    }

    //validar Antes de enviar al Body 
    function validarAntesDeEnviar(body) {
        if (body.tipo === 'combo') {
            if (!body.servicioId || !body.profesionalId || !body.fechaInstalacion || !body.horarioInstalacion) {
                throw new Error('Faltan datos de instalación para el combo');
            }
        }
    }
    // Builder del request
    function buildRequestBody() {
        const cantidad = parseInt(cantidadInput?.value) || 1;
        const incluirInstalacion = instalacionCheckbox?.checked && instalacionDisponible;

        if (incluirInstalacion) {
            return {
                tipo: 'combo',
                productoId,
                servicioId,
                cantidad,
                profesionalId: profesionalSeleccionado,
                fechaInstalacion: getFechaActual(),
                horarioInstalacion: getHorarioActual()
            };
        }

        return {
            tipo: 'producto',
            productoId,
            cantidad
        };
    }

    // ============================================================
    // Agregar a reserva (lógica de combo)
    // ============================================================
    async function agregarAReserva() {
        if (isAdding) return;

        isAdding = true;
        setLoading(true);

        try {
            const body = buildRequestBody();

            console.log('📤 requestBody:', body);

            validarAntesDeEnviar(body);

            const data = await postReserva(body);

            actualizarUIExito(data);

        } catch (err) {
            console.error('❌ agregarAReserva:', err.message);

        } finally {
            isAdding = false;
            setLoading(false);
        }
    }

    function manejarCambioInstalacion() {
        const activo = instalacionCheckbox?.checked;

        toggleInstalacionCampos(activo);

        if (!activo) {
            actualizarPresupuesto();
            return;
        }

        const fecha = getFechaActual();
        const horario = getHorarioActual();

        if (servicioId && fecha && horario) {
            cargarProfesionalesDisponibles();
        } else {
            mostrarMensajeCompletarFechaHorario();
        }
    }
    // ============================================================
    // Event Listeners e inicialización
    // ============================================================
    function initMiniaturas() {
        if (!miniaturas.length || !imagenPrincipal) return;
        miniaturas.forEach(mini => {
            mini.addEventListener('click', () => {
                const nuevaImagen = mini.dataset.imagen;
                if (nuevaImagen) {
                    imagenPrincipal.src = nuevaImagen;
                    miniaturas.forEach(m => m.classList.remove('activa'));
                    mini.classList.add('activa');
                }
            });
        });
    }

    function initEventListeners() {
        // Disminuir cantidad
        if (btnDisminuir) {
            btnDisminuir.addEventListener('click', () => {
                let val = parseInt(cantidadInput?.value) || 1;
                if (val > 1) cantidadInput.value = val - 1;
                actualizarPresupuesto();
            });
        }
        // Aumentar cantidad
        if (btnAumentar) {
            btnAumentar.addEventListener('click', () => {
                let val = parseInt(cantidadInput?.value) || 1;
                const max = parseInt(cantidadInput?.max) || 99;
                if (val < max) cantidadInput.value = val + 1;
                actualizarPresupuesto();
            });
        }
        // Cambio manual de cantidad
        if (cantidadInput) {
            cantidadInput.addEventListener('change', () => actualizarPresupuesto());
        }
        // Botón agregar a reserva
        if (btnAgregarReserva) {
            btnAgregarReserva.addEventListener('click', agregarAReserva);
        }
        // Botón ver reservas
        if (btnVerReservaciones) {
            btnVerReservaciones.addEventListener('click', () => window.location.href = '/reserva');
        }
        // Checkbox de instalación
        instalacionCheckbox?.addEventListener('change', manejarCambioInstalacion);

        fechaInput?.addEventListener('change', manejarCambioInstalacion);

        horarioSelected?.addEventListener('change', manejarCambioInstalacion);
    }

    // Inicialización principal
    async function init() {
        selectorProfesionalDiv = document.getElementById('selectorProfesional');
        initMiniaturas();
        initEventListeners();
        await verificarCantidadEnReserva();

        // Estado inicial según el checkbox
        const instalacionMarcada = instalacionCheckbox?.checked && instalacionDisponible;
        toggleInstalacionCampos(instalacionMarcada);

        if (instalacionMarcada && servicioId && getFechaActual() && getHorarioActual()) {
            cargarProfesionalesDisponibles();
        }

        actualizarPresupuesto();
    }

    // Arrancar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();