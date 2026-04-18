(function () {
    'use strict';

    // Contador de caracteres para descripción
    function initCharCounter(textareaId, counterId, maxLength) {
        const textarea = document.getElementById(textareaId);
        const counter = document.getElementById(counterId);
        if (!textarea || !counter) return;

        function update() {
            const len = textarea.value.length;
            counter.textContent = `${len} / ${maxLength}`;
            counter.classList.toggle('contador-limite', len >= maxLength * 0.9);
        }
        textarea.addEventListener('input', update);
        update();
    }

    // Toggle de estado activo (actualiza el indicador visual)
    function initEstadoToggle(toggleId, dotId, textId, activeText, inactiveText) {
        const toggle = document.getElementById(toggleId);
        const dot = document.getElementById(dotId);
        const text = document.getElementById(textId);
        if (!toggle || !dot || !text) return;

        function update(checked) {
            if (checked) {
                dot.className = 'estado-indicator__dot estado-indicator__dot--activo';
                text.textContent = activeText;
            } else {
                dot.className = 'estado-indicator__dot estado-indicator__dot--inactivo';
                text.textContent = inactiveText;
            }
        }

        update(toggle.checked);
        toggle.addEventListener('change', () => update(toggle.checked));
    }

    // Validación del formulario
    function initFormValidation() {
        const form = document.getElementById('formCategoria');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            let valid = true;

            // Limpiar errores anteriores
            document.querySelectorAll('.mensaje-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.entrada').forEach(el => el.classList.remove('entrada-error'));

            // Validar nombre
            const nombre = document.getElementById('nombre');
            const errorNombre = document.getElementById('error-nombre');
            if (!nombre.value.trim()) {
                errorNombre.textContent = 'El nombre es obligatorio.';
                nombre.classList.add('entrada-error');
                valid = false;
            } else if (nombre.value.trim().length > 80) {
                errorNombre.textContent = 'El nombre no puede superar los 80 caracteres.';
                nombre.classList.add('entrada-error');
                valid = false;
            }

            // Validar descripción (si tiene contenido, validar longitud)
            const desc = document.getElementById('descripcion');
            const errorDesc = document.getElementById('error-descripcion');
            if (desc.value.trim().length > 200) {
                errorDesc.textContent = 'La descripción no puede superar los 200 caracteres.';
                desc.classList.add('entrada-error');
                valid = false;
            }

            // Validar orden (si tiene valor, debe ser número positivo)
            const orden = document.getElementById('orden');
            const errorOrden = document.getElementById('error-orden');
            if (orden.value.trim() !== '') {
                const num = Number(orden.value);
                if (isNaN(num) || num < 1) {
                    errorOrden.textContent = 'El orden debe ser un número mayor a 0.';
                    orden.classList.add('entrada-error');
                    valid = false;
                }
            }

            if (!valid) e.preventDefault();
        });
    }

    // Inicializar todo cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        initCharCounter('descripcion', 'contadorDesc', 200);
        initEstadoToggle('activo', 'estadoDot_activo', 'estadoTexto_activo', 'Visible en el sitio', 'Oculta del sitio');
        initFormValidation();
    });
})();