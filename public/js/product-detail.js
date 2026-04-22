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
    let cantidadEnReserva = 0; // Cantidad actual del producto en la reserva (se actualizará al cargar)

    // Elementos de precios
    const montoProducto = document.getElementById('montoProducto');
    const montoTotal = document.getElementById('montoTotal');
    const totalCarrito = document.getElementById('totalCarrito');
    const lineaProducto = document.getElementById('lineaProducto');
    const lineaInstalacion = document.getElementById('lineaInstalacion');
    const montoInstalacion = document.getElementById('montoInstalacion');
    const cantidadSpan = document.querySelector('#lineaProducto span:first-child');

    // Datos del producto desde window
    const producto = window.productoData || {};
    const productoId = producto.id;
    const precioUnitario = Number(producto.precio) || 0;
    const precioInstalacion = Number(producto.precioInstalacion) || 0;
    const instalacionDisponible = producto.instalacionDisponible === 'true' || producto.instalacionDisponible === true;

    // ============================================================
    // Actualizar presupuesto dinámicamente
    // ============================================================
    function actualizarPresupuesto() {
        const cantidad = parseInt(cantidadInput?.value) || 1;
        const incluirInstalacion = instalacionCheckbox?.checked || false;

        const subtotalProducto = precioUnitario * cantidad;
        const subtotalInstalacion = (incluirInstalacion && instalacionDisponible) ? precioInstalacion : 0;
        const total = subtotalProducto + subtotalInstalacion;

        // Actualizar línea de producto
        if (montoProducto) {
            montoProducto.textContent = '$' + subtotalProducto.toLocaleString('es-AR');
        }
        if (cantidadSpan) {
            cantidadSpan.innerHTML = `Producto (${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'})`;
        }

        // Actualizar línea de instalación
        if (lineaInstalacion && instalacionDisponible) {
            if (incluirInstalacion) {
                lineaInstalacion.style.display = 'flex';
                if (montoInstalacion) {
                    montoInstalacion.textContent = '$' + subtotalInstalacion.toLocaleString('es-AR');
                }
            } else {
                lineaInstalacion.style.display = 'none';
            }
        }

        // Actualizar totales
        if (montoTotal) {
            montoTotal.textContent = '$' + total.toLocaleString('es-AR');
        }
        if (totalCarrito) {
            totalCarrito.textContent = '$' + total.toLocaleString('es-AR');
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
        if (totalCarrito) {
            totalCarrito.textContent = '$' + total.toLocaleString('es-AR');
        }
    }

    // ============================================================
    // Agregar a reserva
    // ============================================================
    let isAdding = false;  //  Bandera para evitar duplicados
    async function agregarAReserva() {

        if (isAdding) {
            console.log('⚠️ Petición en curso, ignorando...');
            return;
        }

        isAdding = true;

        const cantidadAAgregar = parseInt(cantidadInput?.value) || 1;
        const incluirInstalacion = instalacionCheckbox?.checked || false;

        // Feedback visual
        if (btnAgregarReserva) {
            btnAgregarReserva.style.opacity = '0.6';
            btnAgregarReserva.disabled = true;
            btnAgregarReserva.classList.add('agregando');
        }

        const body = {
            tipo: 'producto',
            productoId: productoId,
            cantidad: cantidadAAgregar
        };

        if (incluirInstalacion && instalacionDisponible && precioInstalacion > 0) {
            body.incluirInstalacion = true;
            body.precioInstalacion = precioInstalacion;
        }

        try {
            const response = await fetch('/reserva/agregar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const data = await response.json();

                //  Actualizar cantidad con el valor devuelto por el servidor
                cantidadEnReserva = data.nuevaCantidad || (cantidadEnReserva + cantidadAAgregar);
                actualizarTextoBoton();

                // Actualizar total
                actualizarTotal(cantidadEnReserva, incluirInstalacion);

                // Actualizar contador del navbar
                if (typeof window.actualizarContadorReserva === 'function') {
                    await window.actualizarContadorReserva();
                }

                // Feedback visual de éxito
                if (btnAgregarReserva) {
                    btnAgregarReserva.classList.add('agregado');
                    setTimeout(() => {
                        btnAgregarReserva.classList.remove('agregado');
                    }, 500);
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

        // Checkbox instalación
        if (instalacionCheckbox) {
            instalacionCheckbox.addEventListener('change', () => {
                const cantidad = parseInt(cantidadInput?.value) || 1;
                actualizarTotal(cantidad, instalacionCheckbox.checked);
            });
        }

        // Botón agregar a reserva
        if (btnAgregarReserva) {
            btnAgregarReserva.addEventListener('click', agregarAReserva);
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
        initMiniaturas();
        initEventListeners();

        await verificarCantidadEnReserva();

        // Inicializar total
        const cantidadInicial = parseInt(cantidadInput?.value) || 1;
        const incluirInstalacion = instalacionCheckbox?.checked || false;
        actualizarTotal(cantidadInicial, incluirInstalacion);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();