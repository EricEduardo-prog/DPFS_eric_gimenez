// src/components/TotalsCards.jsx
export default function TotalsCards({ totals }) {
    const cards = [
        { label: 'Productos', value: totals.products, icon: '📦' },
        { label: 'Usuarios', value: totals.users, icon: '👥' },
        { label: 'Categorías', value: totals.categories, icon: '🏷️' },
        { label: 'Servicios', value: totals.services, icon: '🔧' },
        { label: 'Profesionales', value: totals.professionals, icon: '👨‍🔧' },
    ];

    return (
        <div className="totals-grid">
            {cards.map((card, idx) => (
                <div className="total-card" key={idx}>
                    <div className="card-icon">{card.icon}</div>
                    <div className="card-value">{card.value}</div>
                    <div className="card-label">{card.label}</div>
                </div>
            ))}
        </div>
    );
}