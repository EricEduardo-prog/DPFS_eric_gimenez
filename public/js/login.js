(function () {
    'use strict';

    // ============================================================
    // Toggle de visibilidad de contraseña
    // ============================================================
    function initPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.boton-visibilidad');

        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const targetId = this.dataset.target;
                const passwordInput = document.getElementById(targetId);

                if (passwordInput) {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);

                    // Cambiar ícono (opcional)
                    const svg = this.querySelector('svg');
                    if (svg) {
                        if (type === 'text') {
                            svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
                        } else {
                            svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
                        }
                    }
                }
            });
        });
    }

    // ============================================================
    // Validación del formulario
    // ============================================================
    function initFormValidation() {
        const form = document.getElementById('formLogin');
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

            // Validar email
            const email = document.getElementById('login-email');
            const emailValue = email.value.trim();
            if (!emailValue) {
                showError('error-email', 'El email es obligatorio.');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
                showError('error-email', 'Ingresá un email válido.');
            }

            // Validar contraseña
            const password = document.getElementById('login-password');
            if (!password.value.trim()) {
                showError('error-password', 'La contraseña es obligatoria.');
            }

            if (!valid) {
                e.preventDefault();
            }
        });
    }

    // ============================================================
    // Recordar email (localStorage)
    // ============================================================
    function initRememberMe() {
        const rememberCheckbox = document.querySelector('input[name="recordarme"]');
        const emailInput = document.getElementById('login-email');

        if (!rememberCheckbox || !emailInput) return;

        // Cargar email guardado
        const savedEmail = localStorage.getItem('recordedEmail');
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberCheckbox.checked = true;
        }

        // Guardar email al enviar el formulario
        const form = document.getElementById('formLogin');
        if (form) {
            form.addEventListener('submit', function () {
                if (rememberCheckbox.checked && emailInput.value.trim()) {
                    localStorage.setItem('recordedEmail', emailInput.value.trim());
                } else {
                    localStorage.removeItem('recordedEmail');
                }
            });
        }
    }

    // ============================================================
    // Inicialización
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        initPasswordToggle();
        initFormValidation();
        initRememberMe();
    });
})();