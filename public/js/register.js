(function () {
    'use strict';

    const form = document.getElementById('formRegistro');

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

        // Validar email
        const email = document.getElementById('email');
        const emailValue = email.value.trim();
        if (!emailValue) {
            showError('error-email', 'El email es obligatorio.');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            showError('error-email', 'Ingresá un email válido.');
        }

        // Validar contraseña
        const password = document.getElementById('password');
        if (!password.value.trim()) {
            showError('error-password', 'La contraseña es obligatoria.');
        } else if (password.value.trim().length < 6) {
            showError('error-password', 'La contraseña debe tener al menos 6 caracteres.');
        }

        // Validar confirmación de contraseña
        const confirmPassword = document.getElementById('confirmPassword');
        if (password.value.trim() !== confirmPassword.value.trim()) {
            showError('error-confirmPassword', 'Las contraseñas no coinciden.');
        }

        // Validar teléfono (si se ingresó)
        const telefono = document.getElementById('telefono');
        if (telefono.value.trim() && !/^[\+\d\s\-\(\)]{8,20}$/.test(telefono.value.trim())) {
            showError('error-telefono', 'El teléfono no tiene un formato válido.');
        }

        // Validar términos
        const aceptoTerminos = document.querySelector('input[name="aceptoTerminos"]');
        if (!aceptoTerminos.checked) {
            showError('error-terminos', 'Debes aceptar los términos y condiciones.');
        }

        if (!valid) {
            e.preventDefault();
        }
    });
})();