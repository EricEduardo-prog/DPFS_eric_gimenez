(function () {
    async function actualizarContadorReserva() {
        try {
            const response = await fetch('/reserva/count');
            if (response.ok) {
                const data = await response.json();
                const contador = document.getElementById('reservaContador');
                if (contador) {
                    const total = data.totalItems || 0;
                    if (total > 0) {
                        contador.textContent = total > 9 ? '+9' : total;
                        contador.style.display = 'flex';
                    } else {
                        contador.style.display = 'none';
                    }
                }
            }
        } catch (err) {
            console.error('Error al actualizar contador:', err);
        }
    }
    // Solo ejecutar al cargar la página
    actualizarContadorReserva();

    window.actualizarContadorReserva = actualizarContadorReserva;
})();