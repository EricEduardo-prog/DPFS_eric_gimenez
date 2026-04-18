(function () {
    'use strict';

    // Validación del formulario
    function initFormValidation() {
        const form = document.getElementById('formEditarPerfil');
        if (!form) return;

        form.addEventListener('submit', function (e) {
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
            } else if (nombre.value.trim().length > 100) {
                showError('error-nombre', 'El nombre no puede superar los 100 caracteres.');
            }

            // Validar teléfono (si se ingresó)
            const telefono = document.getElementById('telefono');
            if (telefono.value.trim() && !/^[\+\d\s\-\(\)]{8,20}$/.test(telefono.value.trim())) {
                showError('error-telefono', 'El teléfono no tiene un formato válido.');
            }

            if (!valid) {
                e.preventDefault();
            }
        });
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
        initFormValidation();
    });
})();