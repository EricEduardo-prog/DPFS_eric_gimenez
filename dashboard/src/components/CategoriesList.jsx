// src/components/CategoriesList.jsx
export default function CategoriesList({ categoriesWithCount }) {
    return (
        <div className="categories-panel">
            <h3>📊 Categorías (productos por categoría)</h3>
            <div className="categories-list">
                {categoriesWithCount.map(cat => (
                    <div key={cat.id} className="category-item">
                        <span className="category-name">{cat.name} {cat.icon}</span>
                        <span className="category-count">{cat.productCount} productos</span>
                    </div>
                ))}
            </div>
        </div>
    );
}