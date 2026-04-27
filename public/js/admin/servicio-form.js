(function () {
    'use strict';

    // ============================================================
    // Generación automática de slug desde el nombre
    // ============================================================
    function initSlugGenerator() {
        const nombreInput = document.getElementById('nombre');
        const slugInput = document.getElementById('slug');

        if (!nombreInput || !slugInput) return;

        // Solo generar slug automáticamente si el campo slug está vacío
        // o si el usuario no lo ha modificado manualmente
        let slugModifiedByUser = false;

        slugInput.addEventListener('input', function () {
            slugModifiedByUser = true;
        });

        nombreInput.addEventListener('input', function () {
            if (!slugModifiedByUser) {
                const nombre = this.value.trim();
                const slug = generarSlug(nombre);
                slugInput.value = slug;
            }
        });

        // Si hay un valor inicial en slug, considerar que el usuario lo modificó
        if (slugInput.value.trim() !== '') {
            slugModifiedByUser = true;
        }
    }

    /**
     * Genera un slug URL-friendly a partir de un texto
     * @param {string} text - Texto a convertir
     * @returns {string} Slug generado
     */
    function generarSlug(text) {
        if (!text) return '';

        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')                    // Descomponer caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '')     // Eliminar diacríticos (acentos)
            .replace(/[^a-z0-9\s-]/g, '')        // Eliminar caracteres especiales
            .trim()                               // Eliminar espacios al inicio/final
            .replace(/\s+/g, '-')                // Reemplazar espacios por guiones
            .replace(/-+/g, '-');                // Reemplazar múltiples guiones por uno solo
    }

    // ============================================================
    // Contador de caracteres para descripción
    // ============================================================
    function initCharCounter(textareaId, counterId, maxLength) {
        const textarea = document.getElementById(textareaId);
        const counter = document.getElementById(counterId);

        if (!textarea || !counter) return;

        function updateCounter() {
            const len = textarea.value.length;
            counter.textContent = `${len} / ${maxLength}`;
            counter.classList.toggle('contador-limite', len >= maxLength * 0.9);

            // Cambiar color si se excede el límite
            if (len > maxLength) {
                counter.style.color = 'var(--color-error)';
                // Agregar clase de error al textarea
                textarea.classList.add('entrada-error');
            } else {
                counter.style.color = '';
                // Solo quitar clase de error si no hay otros errores (ej. validación al enviar)
                textarea.classList.remove('entrada-error');
            }
        }

        textarea.addEventListener('input', updateCounter);
        updateCounter();
    }

    // ============================================================
    // Validación del formulario
    // ============================================================
    function initFormValidation() {
        const form = document.getElementById('formServicio');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            let valid = true;

            // Limpiar errores anteriores
            document.querySelectorAll('.mensaje-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.entrada').forEach(el => el.classList.remove('entrada-error'));

            // Mostrar error en un campo específico
            function showError(id, message) {
                const errorSpan = document.getElementById(id);
                if (errorSpan) {
                    errorSpan.textContent = message;
                }
                const input = document.getElementById(id.replace('error-', ''));
                if (input) {
                    input.classList.add('entrada-error');
                }
                valid = false;
            }

            // ============================================
            // Validar nombre
            // ============================================
            const nombre = document.getElementById('nombre');
            if (!nombre.value.trim()) {
                showError('error-nombre', 'El nombre es obligatorio.');
            } else if (nombre.value.trim().length > 80) {
                showError('error-nombre', 'El nombre no puede superar los 80 caracteres.');
            }

            // ============================================
            // Validar slug (si se proporcionó manualmente)
            // ============================================
            const slug = document.getElementById('slug');
            if (slug && slug.value.trim() !== '') {
                // Verificar que el slug solo contenga caracteres válidos
                const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
                if (!slugRegex.test(slug.value.trim())) {
                    showError('error-slug', 'El slug solo puede contener letras minúsculas, números y guiones.');
                }
            }

            // ============================================
            // Validar descripción (opcional pero con límite)
            // ============================================
            const descripcion = document.getElementById('descripcion');
            if (descripcion && descripcion.value.trim().length > 500) {
                showError('error-descripcion', 'La descripción no puede superar los 500 caracteres.');
            }
/*
            // ============================================
            // Validar precio base 
            //============================================

            // Validar precio base (solo si el campo existe en el formulario)
            const precioBase = document.getElementById('precioBase');
            console.log('Validando precioBase:', precioBase ? precioBase.value : 'Campo no encontrado');
            if (!precioBase.value.trim()) {
                showError('error-precioBase', 'El precio base es obligatorio.');
            } else if ( precioBase.value.trim() && (isNaN(precioBase.value) || parseFloat(precioBase.value) <= 0)) {
                showError('error-precioBase', 'El precio base debe ser un número mayor a 0.');
            }

            // Validar precio por hora (solo si el campo existe)
            const precioPorHora = document.getElementById('precioPorHora');
            if (precioPorHora && precioPorHora.value.trim() && parseFloat(precioPorHora.value) < 0) {
                showError('error-precioPorHora', 'El precio por hora no puede ser negativo.');
            }*/
            // ============================================
            // Si no es válido, prevenir el envío
            // ============================================
            if (!valid) {
                e.preventDefault();
                // Scroll al primer error
                const firstError = document.querySelector('.entrada-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }

    // ============================================================
    // Inicializar toggle de switches con feedback visual
    // ============================================================
    function initSwitches() {
        const switches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');

        switches.forEach(switchInput => {
            // Agregar feedback visual al cambiar estado
            switchInput.addEventListener('change', function () {
                const toggleFila = this.closest('.toggle-fila');
                if (toggleFila) {
                    const infoDiv = toggleFila.querySelector('.toggle-fila__info');
                    if (infoDiv) {
                        if (this.checked) {
                            infoDiv.style.opacity = '1';
                        } else {
                            infoDiv.style.opacity = '0.7';
                        }
                    }
                }
            });

            // Disparar evento inicial para establecer estado visual
            const event = new Event('change');
            switchInput.dispatchEvent(event);
        });
    }

    // ============================================================
    // Prevenir envío duplicado del formulario
    // ============================================================
    function initPreventDuplicateSubmit() {
        const form = document.getElementById('formServicio');
        if (!form) return;

        let submitted = false;

        form.addEventListener('submit', (e) => {
            if (submitted) {
                e.preventDefault();
                return false;
            }
            submitted = true;

            // Deshabilitar el botón de envío después de 100ms
            setTimeout(() => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.6';
                    submitBtn.style.cursor = 'not-allowed';
                }
            }, 100);
        });
    }

    // ============================================================
    // Inicializar todos los componentes
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        initSlugGenerator();
        initCharCounter('descripcion', 'contadorDesc', 500);
        initFormValidation();
        initSwitches();
        initPreventDuplicateSubmit();

        console.log('✅ servicio-form.js inicializado correctamente');
    });
})();