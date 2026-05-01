// src/components/LatestItems.jsx
export default function LatestItems({ latestProduct, latestUser }) {
    return (
        <div className="latest-grid">
            <div className="latest-card">
                <h3>📦 Último producto</h3>
                {latestProduct ? (
                    <div>
                        <p><strong>Nombre:</strong> {latestProduct.name}</p>
                        <p><strong>SKU:</strong> {latestProduct.sku}</p>
                        <p><strong>Precio:</strong> ${latestProduct.price}</p>
                        <p><strong>Creado:</strong> {new Date(latestProduct.created_at).toLocaleDateString()}</p>
                    </div>
                ) : (
                    <p>No hay productos</p>
                )}
            </div>
            <div className="latest-card">
                <h3>👤 Último usuario</h3>
                {latestUser ? (
                    <div>
                        <p><strong>Nombre:</strong> {latestUser.name}</p>
                        <p><strong>Email:</strong> {latestUser.email}</p>
                        <p><strong>Registro:</strong> {new Date(latestUser.registered_at).toLocaleDateString()}</p>
                    </div>
                ) : (
                    <p>No hay usuarios</p>
                )}
            </div>
        </div>
    );
}