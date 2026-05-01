// src/components/ProductsTable.jsx
export default function ProductsTable({ products }) {
    if (!products || products.length === 0) {
        return <div className="products-panel">No hay productos</div>;
    }
    return (
        <div className="products-panel">
            <h3>📋 Lista de productos</h3>
            <div className="table-responsive">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>SKU</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Activo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td>{product.sku}</td>
                                <td>{product.category?.name || product.category_id}</td>
                                <td>${product.price}</td>
                                <td>{product.is_active ? '✅' : '❌'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}