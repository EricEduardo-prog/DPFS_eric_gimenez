(function () {
    'use strict';

    // ============================================================
    // Manejo de selección de servicio (existente vs nuevo)
    // ============================================================
    function initServicioToggle() {
        const radioExistente = document.querySelector('input[name="tipoServicio"][value="existente"]');
        const radioOtro = document.querySelector('input[name="tipoServicio"][value="otro"]');
        const panelExistente = document.getElementById('servicioExistentePanel');
        const panelOtro = document.getElementById('nuevoServicioPanel');
        const servicioSelect = document.getElementById('servicioId');
        const certificacionPanel = document.getElementById('certificacionPanel');

        // ✅ Verificar que los elementos existan antes de continuar
        if (!radioExistente || !radioOtro || !panelExistente || !panelOtro) return;

        function togglePanels() {
            if (radioExistente.checked) {
                panelExistente.classList.remove('oculto');
                panelOtro.classList.add('oculto');
                // Verificar si el servicio seleccionado requiere certificación
                if (servicioSelect) {
                    checkCertificacionRequerida(servicioSelect.value);
                }
            } else {
                panelExistente.classList.add('oculto');
                panelOtro.classList.remove('oculto');
                if (certificacionPanel) {
                    certificacionPanel.classList.add('oculto');
                }
            }
        }

        radioExistente.addEventListener('change', togglePanels);
        radioOtro.addEventListener('change', togglePanels);

        // Verificar certificación al cambiar servicio
        if (servicioSelect) {
            servicioSelect.addEventListener('change', function () {
                checkCertificacionRequerida(this.value);
            });
        }

        // Inicializar estado
        togglePanels();
    }

    // ============================================================
    // Verificar si el servicio seleccionado requiere certificación
    // ============================================================
    function checkCertificacionRequerida(servicioId) {
        const certificacionPanel = document.getElementById('certificacionPanel');
        if (!certificacionPanel) return;

        // Si no hay servicio seleccionado, ocultar panel
        if (!servicioId) {
            certificacionPanel.classList.add('oculto');
            return;
        }

        // Obtener el servicio seleccionado del select
        const select = document.getElementById('servicioId');
        const selectedOption = select?.options[select.selectedIndex];
        const requiereCertificacion = selectedOption?.text.includes('(requiere certificación)');

        if (requiereCertificacion) {
            certificacionPanel.classList.remove('oculto');
        } else {
            certificacionPanel.classList.add('oculto');
        }
    }

    // ============================================================
    // Toggle estado activo (actualiza el indicador visual)
    // ============================================================
    function initEstadoToggle() {
        const toggle = document.getElementById('activo');
        const dot = document.querySelector('#estadoIndicator_activo .estado-indicator__dot');
        const text = document.querySelector('#estadoIndicator_activo .estado-indicator__texto');

        if (toggle && dot && text) {
            function update() {
                if (toggle.checked) {
                    dot.className = 'estado-indicator__dot estado-indicator__dot--activo';
                    text.textContent = 'Alta — operativo en el sistema';
                } else {
                    dot.className = 'estado-indicator__dot estado-indicator__dot--inactivo';
                    text.textContent = 'Baja — no asignable';
                }
            }
            update();
            toggle.addEventListener('change', update);
        }
    }

    // ============================================================
    // Acciones rápidas de disponibilidad
    // ============================================================
    function initAvailabilityActions() {
        const checkboxes = document.querySelectorAll('.disponibilidad-checkbox');
        if (!checkboxes.length) return;

        const btnTodos = document.getElementById('btnTodos');
        const btnNinguno = document.getElementById('btnNinguno');
        const btnSoloManana = document.getElementById('btnSoloManana');
        const btnSoloTarde = document.getElementById('btnSoloTarde');

        btnTodos?.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = true);
        });

        btnNinguno?.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = false);
        });

        btnSoloManana?.addEventListener('click', () => {
            checkboxes.forEach(cb => {
                cb.checked = cb.dataset.turno === 'manana';
            });
        });

        btnSoloTarde?.addEventListener('click', () => {
            checkboxes.forEach(cb => {
                cb.checked = cb.dataset.turno === 'tarde';
            });
        });
    }

    // ============================================================
    // Validación del formulario
    // ============================================================
    function initFormValidation() {
        const form = document.getElementById('formProfesional');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            let valid = true;

            // Limpiar errores anteriores
            document.querySelectorAll('.mensaje-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.entrada').forEach(el => el.classList.remove('entrada-error'));

            function showError(id, msg) {
                const errorSpan = document.getElementById(id);
                if (errorSpan) errorSpan.textContent = msg;
                const input = document.getElementById(id.replace('error-', ''));
                if (input) input.classList.add('entrada-error');
                valid = false;
            }

            // Validar nombre
            const nombre = document.getElementById('nombre');
            if (!nombre.value.trim()) {
                showError('error-nombre', 'El nombre es obligatorio.');
            }

            // Validar matrícula
            const matricula = document.getElementById('matricula');
            if (!matricula.value.trim()) {
                showError('error-matricula', 'La matrícula es obligatoria.');
            }

            // ✅ Validar servicio según tipo seleccionado
            const tipoServicio = document.querySelector('input[name="tipoServicio"]:checked');
            if (!tipoServicio) {
                showError('error-servicioId', 'Debe seleccionar un tipo de servicio.');
            } else if (tipoServicio.value === 'existente') {
                const servicioId = document.getElementById('servicioId');
                if (!servicioId.value) {
                    showError('error-servicioId', 'Debe seleccionar un servicio.');
                }
            } else if (tipoServicio.value === 'otro') {
                const nuevoServicio = document.getElementById('nuevoServicio');
                if (!nuevoServicio.value.trim()) {
                    showError('error-nuevoServicio', 'Debe especificar el nombre del nuevo servicio.');
                }
            }

            // Validar email
            const email = document.getElementById('email');
            const emailValue = email.value.trim();
            if (!emailValue) {
                showError('error-email', 'El email es obligatorio.');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
                showError('error-email', 'Ingresá un email válido.');
            }

            if (!valid) e.preventDefault();
        });
    }

    // ============================================================
    // Inicializar todo
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        initServicioToggle();
        initEstadoToggle();
        initAvailabilityActions();
        initFormValidation();
    });
})();