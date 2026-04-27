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

    // Validar que todos los datos necesarios existan
    const fechaInput = document.getElementById('fechaInstalacion');
    const horarioSelected = document.getElementById('horarioInstalacion');

    // Datos del producto desde window
    const producto = window.productoData || {};
    const productoId = producto.id;
    const precioUnitario = Number(producto.precio) || 0;
    const precioInstalacion = Number(producto.precioBase) || 0;

    const instalacionDisponible = producto.instalacionDisponible === true || producto.instalacionDisponible === 'true';
    const servicioId = producto.servicioId || null; // Si el producto tiene un servicio asociado, se usará para cargar profesionales
    console.log('servicioId:', servicioId, 'instalacionDisponible:', instalacionDisponible);
    //Variables adicionales para el manejo de reservas
    let cantidadEnReserva = 0; // Cantidad actual del producto en la reserva (se actualizará al cargar)
    let isAdding = false;  //  Bandera para evitar duplicados al agregar a reserva
    let profesionalesDisponibles = [];// Almacena lista de profesionales obtenidos del backend
    let profesionalSeleccionado = null; // ID del profesional seleccionado por el usuario
    let selectorProfesionalDiv = null;     // Referencia al div del selector (se obtendrá al iniciar)

    // Función para obtener valores actuales
    function getFechaActual() {
        return fechaInput?.value || '';
    }

    function getHorarioActual() {
        return horarioSelected?.value || '';
    }
    // ============================================================
    // CARGAR PROFESIONALES DISPONIBLES DESDE EL BACKEND
    // ============================================================
    /**
     * Obtiene la lista de profesionales disponibles para un servicio,
     * fecha y turno específicos.
     * @returns {Promise<void>}
     */
    async function cargarProfesionalesDisponibles() {
        const fecha = getFechaActual();
        const horario = getHorarioActual();

        if (!fecha || !horario || !servicioId) {
            ocultarSelectorProfesional();
            return;
        }

        try {
            // Mostrar estado de carga
            mostrarCargandoProfesionales();

            const response = await fetch(`/disponibilidad/profesionales?servicioId=${servicioId}&fecha=${fecha}&turno=${horario || ''}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Profesionales disponibles:', data);
            if (data.success && data.profesionales && data.profesionales.length > 0) {
                profesionalesDisponibles = data.profesionales;
                renderizarProfesionales(profesionalesDisponibles);
                mostrarSelectorProfesional();
            } else {
                // No hay profesionales disponibles
                profesionalesDisponibles = [];
                mostrarMensajeSinProfesionales();
            }
        } catch (err) {
            console.error('❌ Error al cargar profesionales:', err);
            mostrarMensajeErrorProfesionales();
        }
    }


    // ============================================================
    // FUNCIONES AUXILIARES PARA UI DEL SELECTOR
    // ============================================================

    function mostrarSelectorProfesional() {
        if (selectorProfesionalDiv) {
            selectorProfesionalDiv.style.display = 'block';
        }
    }

    function ocultarSelectorProfesional() {
        if (selectorProfesionalDiv) {
            selectorProfesionalDiv.style.display = 'none';
        }
        // Limpiar selección cuando se oculta
        profesionalSeleccionado = null;
        const hiddenInput = document.getElementById('profesionalSeleccionado');
        if (hiddenInput) hiddenInput.value = '';
    }

    function mostrarCargandoProfesionales() {
        const grid = document.getElementById('gridProfesionales');
        if (grid) {
            grid.innerHTML = '<div class="cargando-profesionales">🔄 Cargando profesionales disponibles...</div>';
        }
        mostrarSelectorProfesional();
    }

    function mostrarMensajeSinProfesionales() {
        const grid = document.getElementById('gridProfesionales');
        if (grid) {
            grid.innerHTML = '<div class="sin-profesionales">⚠️ No hay profesionales disponibles en esta fecha y horario</div>';
        }
    }

    function mostrarMensajeErrorProfesionales() {
        const grid = document.getElementById('gridProfesionales');
        if (grid) {
            grid.innerHTML = '<div class="error-profesionales">❌ Error al cargar profesionales. Intente nuevamente.</div>';
        }
    }
    // ============================================================
    // RENDERIZAR TARJETAS DE PROFESIONALES
    // ============================================================
    /**
     * Renderiza la lista de profesionales en el grid
     * @param {Array} profesionales - Lista de profesionales a mostrar
     */
    function renderizarProfesionales(profesionales) {
        const grid = document.getElementById('gridProfesionales');
        if (!grid) return;

        if (!profesionales || profesionales.length === 0) {
            mostrarMensajeSinProfesionales();
            return;
        }

        // Generar HTML para cada profesional
        grid.innerHTML = profesionales.map(prof => {
            //  Validar y asignar valores por defecto
            const nombre = prof.nombre || 'Profesional sin nombre';
            const rating = prof.rating || 0;
            const precio = prof.precioBase || 0;
            const trabajos = prof.trabajos || 0;

            return `
            <div class="tarjeta-profesional" data-id="${prof.id}" data-precio="${precio}">
                <div class="nombre-profesional">${escapeHtml(nombre)}</div>
                <div class="rating-profesional">
                    <span class="estrellas">${generarEstrellas(rating)}</span>
                    <span class="rating-numero">${rating.toFixed(1)}</span>
                    <span class="trabajos">(${trabajos} trabajos)</span>
                </div>
                <div class="precio-profesional">$${precio.toLocaleString('es-AR')}</div>
            </div>
        `;
        }).join('');


        // Agregar event listeners a las tarjetas
        document.querySelectorAll('.tarjeta-profesional').forEach(card => {
            card.addEventListener('click', () => seleccionarProfesional(card));
        });
    }

    /**
     * Maneja la selección de un profesional por parte del usuario
     * @param {HTMLElement} card - Elemento de la tarjeta seleccionada
     */
    function seleccionarProfesional(card) {
        // Remover clase seleccionado de todas las tarjetas
        document.querySelectorAll('.tarjeta-profesional').forEach(c => {
            c.classList.remove('seleccionado');
        });

        // Marcar la tarjeta seleccionada
        card.classList.add('seleccionado');

        // Guardar ID del profesional seleccionado
        profesionalSeleccionado = card.dataset.id;

        // Actualizar campo oculto del formulario
        const hiddenInput = document.getElementById('profesionalSeleccionado');
        if (hiddenInput) {
            hiddenInput.value = profesionalSeleccionado;
        }

        // Actualizar precio total con el profesional seleccionado
        const precioProfesional = parseFloat(card.dataset.precio) || 0;
        actualizarPrecioConProfesional(precioProfesional);
    }

    /**
     * Actualiza el precio total basado en el profesional seleccionado
     * @param {number} precio - Precio base del servicio del profesional seleccionado
     */
    function actualizarPrecioConProfesional(precioProfesional) {
        const cantidad = parseInt(cantidadInput?.value) || 1;

        // Calcular subtotal del producto
        const subtotalProducto = precioUnitario * cantidad;

        // Calcular costo de instalación (precio del profesional)
        const precioServicio = precioProfesional; // window.productoData.precioInstalacion || precioInstalacion || 0;

        // Calcular total final
        const total = subtotalProducto + precioServicio;

        // Actualizar UI
        if (montoTotal) {
            montoTotal.textContent = '$' + total.toLocaleString('es-AR');
        }

        // Actualizar línea de instalación
        if (lineaInstalacion && instalacionDisponible) {
            lineaInstalacion.style.display = 'flex';
            if (montoInstalacion) {
                montoInstalacion.textContent = '$' + precioServicio.toLocaleString('es-AR');
            }
        }
        if (total && precioServicio) {
            let totalConInstalacion = total + precioServicio;
            totalReserva.textContent = '$' + totalConInstalacion.toLocaleString('es-AR');
        } else if (total) {
            totalReserva.textContent = '$' + total.toLocaleString('es-AR');
        }
    }

    /**
     * Genera estrellas visuales según rating
     * @param {number} rating - Valoración del profesional (0-5)
     * @returns {string} HTML de estrellas
     */
    function generarEstrellas(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating - fullStars >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHtml = '';

        // Estrellas llenas
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '★';
        }

        // Media estrella
        if (hasHalfStar) {
            starsHtml += '½';
        }

        // Estrellas vacías
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '☆';
        }

        return starsHtml;
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} str - String a escapar
     * @returns {string} String escapado
     */
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ============================================================
    // Actualizar presupuesto dinámicamente (VERSIÓN MEJORADA)
    // ============================================================
    function actualizarPresupuesto() {
        const cantidad = parseInt(cantidadInput?.value) || 1;
        const incluirInstalacion = instalacionCheckbox?.checked || false;

        const subtotalProducto = precioUnitario * cantidad;

        // ✅ Calcular costo de instalación según profesional seleccionado
        let montoInstalacion = 0;
        if (incluirInstalacion && instalacionDisponible) {
            // ✅ Buscar en profesionalesDisponibles (puede estar vacío si aún no se cargaron)
            const profesional = profesionalesDisponibles?.find(p => p.id === profesionalSeleccionado);
            if (profesional) {
                montoInstalacion = Number(profesional.precio) || 0;
            }
        }

        // Sin instalacion ni profesional usar precio base de instalación (si existe), si no, 0
        const total = subtotalProducto + montoInstalacion;

        // Actualizar línea de producto
        if (montoProducto) {
            montoProducto.textContent = '$' + subtotalProducto.toLocaleString('es-AR');
        }
        if (cantidadSpan) {
            cantidadSpan.innerHTML = `Producto (${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'})`;
        }

        // Actualizar línea de instalación
        if (lineaInstalacion && instalacionDisponible) {
            lineaInstalacion.style.display = 'flex';
            if (montoInstalacion) {
                montoInstalacion.textContent = '$' + montoInstalacion.toLocaleString('es-AR');
            }
        }

        // Actualizar totales
        if (montoTotal) {
            montoTotal.textContent = '$' + total.toLocaleString('es-AR');
        }
        if (montoTotal && montoInstalacion) {
            totalCarrito.textContent = '$' + total.toLocaleString('es-AR') + montoInstalacion.toLocaleString('es-AR');
        }
    }
    // ============================================================
    // Verificar cantidad actual en reserva
    // ============================================================
    async function verificarCantidadEnReserva() {
        try {
            const response = await fetch(`/reserva/detecto/${productoId}`);
            if (response.ok) {
                const data = await response.json();
                cantidadEnReserva = data.cantidad || 0;
                actualizarTextoBoton();
            }
        } catch (err) {
            console.error('Error al verificar cantidad:', err);
        }
    }

    // ============================================================
    // Actualizar texto del botón con la cantidad actual
    // ============================================================
    function actualizarTextoBoton() {
        if (!btnTexto) return;

        if (cantidadEnReserva > 0) {
            btnTexto.textContent = `Agregar más (${cantidadEnReserva} en reserva)`;
        } else {
            btnTexto.textContent = 'Agregar a reserva';
        }
    }

    // ============================================================
    // Actualizar total mostrado
    // ============================================================
    function actualizarTotal(cantidad, incluirInstalacion) {
        const subtotalProducto = precioUnitario * cantidad;
        const total = subtotalProducto + (incluirInstalacion && instalacionDisponible ? precioInstalacion : 0);
        if (totalReserva) {
            totalReserva.textContent = '$' + total.toLocaleString('es-AR');
        }
    }

    // ============================================================
    // Agregar a reserva
    // ============================================================
    async function agregarAReserva() {

        if (isAdding) {
            console.log('⚠️ Petición en curso, ignorando...');
            return;
        }

        isAdding = true;

        const cantidadAAgregar = parseInt(cantidadInput?.value) || 1;
        const incluirInstalacion = instalacionCheckbox?.checked;
        console.log('instalacion :', incluirInstalacion);

        // Feedback visual
        if (btnAgregarReserva) {
            btnAgregarReserva.style.opacity = '0.6';
            btnAgregarReserva.disabled = true;
            btnAgregarReserva.classList.add('agregando');
        }

        //  Obtener servicioId desde window.productoData
        const servicioId = producto.servicioId;

        //  Determinar el tipo según lo que se está agregando
        const esProductoConServicio = (servicioId && profesionalSeleccionado); // Si hay servicio y profesional, es servicio
        
        const esProducto = (productoId && !esProductoConServicio); // Si no es servicio, es producto


        let requestBody;

        if (esProductoConServicio) {
            requestBody = {
                tipo: 'servicio',
                servicioId: servicioId,
                productoId: productoId,
                cantidad: cantidadAAgregar,
                profesionalId: profesionalSeleccionado,
                fechaInstalacion: getFechaActual(),
                horarioInstalacion: getHorarioActual()
            };
        } else {
            requestBody = {
                tipo: 'producto',
                productoId: productoId,
                cantidad: cantidadAAgregar
            };

            if (incluirInstalacion && instalacionDisponible && precioInstalacion > 0) {
                requestBody.incluirInstalacion = true;
                requestBody.precioInstalacion = precioInstalacion;
            }

            // Agregar profesional si está seleccionado (para instalación)
            if (profesionalSeleccionado) {
                requestBody.profesionalId = profesionalSeleccionado;
                requestBody.fechaInstalacion = getFechaActual();
                requestBody.horarioInstalacion = getHorarioActual();
            }
        }

        console.log('🔍 Enviando request:', requestBody);

        try {
            const response = await fetch('/reserva/agregar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();

                cantidadEnReserva = data.nuevaCantidad || (cantidadEnReserva + cantidadAAgregar);
                actualizarTextoBoton();
                actualizarTotal(cantidadEnReserva, incluirInstalacion);

                if (typeof window.actualizarContadorReserva === 'function') {
                    await window.actualizarContadorReserva();
                }

                if (btnAgregarReserva) {
                    btnAgregarReserva.classList.add('agregado');
                    setTimeout(() => {
                        btnAgregarReserva.classList.remove('agregado');
                    }, 500); // se quita la clase después de 0.5 segundos para el efecto visual
                }
            } else {
                const error = await response.json();
                console.error('Error:', error);
                alert(error.error || 'Error al agregar a la reserva');
            }
        } catch (err) {
            console.error('Error de red:', err);
            alert('Error de conexión al agregar a la reserva');
        } finally {
            isAdding = false;
            if (btnAgregarReserva) {
                btnAgregarReserva.style.opacity = '1';
                btnAgregarReserva.disabled = false;
                btnAgregarReserva.classList.remove('agregando');
            }
        }
    }

    // ============================================================
    // Ver reservas (solo redirección)
    // ============================================================
    function verReservas() {
        window.location.href = '/reserva';
    }


    // ============================================================
    // Miniaturas
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

    // ============================================================
    // Event Listeners
    // ============================================================
    function initEventListeners() {

        // Disminuir cantidad
        if (btnDisminuir) {
            btnDisminuir.addEventListener('click', () => {
                let valor = parseInt(cantidadInput?.value) || 1;
                if (valor > 1) {
                    cantidadInput.value = valor - 1;
                    actualizarPresupuesto();
                }
            });
        }

        // Aumentar cantidad
        if (btnAumentar) {
            btnAumentar.addEventListener('click', () => {
                let valor = parseInt(cantidadInput?.value) || 1;
                const max = parseInt(cantidadInput?.max) || 99;
                if (valor < max) {
                    cantidadInput.value = valor + 1;
                    actualizarPresupuesto();
                }
            });
        }

        // Actualizar total al cambiar cantidad
        if (cantidadInput) {
            cantidadInput.addEventListener('change', () => {
                const cantidad = parseInt(cantidadInput.value) || 1;
                const incluirInstalacion = instalacionCheckbox?.checked || false;
                actualizarTotal(cantidad, incluirInstalacion);
            });
        }


        // Botón agregar a reserva
        if (btnAgregarReserva) {
            btnAgregarReserva.addEventListener('click', agregarAReserva);
        }

        // fecha y horario para cargar profesionales disponibles
        if (fechaInput) {
            fechaInput.addEventListener('change', () => {
                cargarProfesionalesDisponibles();
                actualizarPresupuesto();
            });
        }

        // Al cambiar el horario, recargar profesionales disponibles y actualizar presupuesto
        if (horarioSelected) {
            horarioSelected.addEventListener('change', () => {
                cargarProfesionalesDisponibles();
                actualizarPresupuesto();
            });
        }

        // Checkbox instalación se marca/desmarca instalación, recargar profesionales disponibles y actualizar presupuesto
        if (instalacionCheckbox) {
            instalacionCheckbox.addEventListener('change', () => {
                if (instalacionCheckbox.checked) {
                    cargarProfesionalesDisponibles();

                } else {
                    ocultarSelectorProfesional();
                    profesionalSeleccionado = null;
                }
                actualizarPresupuesto();
            });
        }

        // Botón ver reservas
        const btnVerReservas = document.getElementById('btnVerReservas');
        if (btnVerReservas) {
            btnVerReservas.addEventListener('click', verReservas);
        }
    }

    // ============================================================
    // Inicialización
    // ============================================================
    async function init() {
        selectorProfesionalDiv = document.getElementById('selectorProfesional');

        initMiniaturas();
        initEventListeners();

        await verificarCantidadEnReserva();

        //  Si hay instalación disponible, cargar profesionales
        if (instalacionDisponible && instalacionCheckbox?.checked) {
            await cargarProfesionalesDisponibles();
        }

        // Inicializar total
        const cantidadInicial = parseInt(cantidadInput?.value) || 1;
        const incluirInstalacion = instalacionCheckbox?.checked || false;

        actualizarTotal(cantidadInicial, incluirInstalacion);
        actualizarPresupuesto();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();