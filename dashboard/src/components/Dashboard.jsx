// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import {
    getProducts,
    getUsers,
    getCategories,
    getServices,
    getProfessionals,
    getLatestProduct,
    getLatestUser,
} from '../api';
import TotalsCards from './TotalsCards';
import LatestItems from './LatestItems';
import CategoriesList from './CategoriesList';
import ProductsTable from './ProductsTable';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({
        products: 0,
        users: 0,
        categories: 0,
        services: 0,
        professionals: 0,
    });
    const [latestProduct, setLatestProduct] = useState(null);
    const [latestUser, setLatestUser] = useState(null);
    const [categoriesWithCount, setCategoriesWithCount] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Ejecutar todas las peticiones en paralelo
                const [
                    productsData,
                    usersData,
                    categoriesData,
                    servicesData,
                    professionalsData,
                    latestProd,
                    latestUsr,
                ] = await Promise.all([
                    getProducts(),
                    getUsers(),
                    getCategories(),
                    getServices(),
                    getProfessionals(),
                    getLatestProduct(),
                    getLatestUser(),
                ]);

                // Totales
                setTotals({
                    products: productsData.length,
                    users: usersData.length,
                    categories: categoriesData.length,
                    services: servicesData.length,
                    professionals: professionalsData.length,
                });

                // Últimos
                setLatestProduct(latestProd);
                setLatestUser(latestUsr);

                // Productos
                setProducts(productsData);

                // Categorías con contador de productos
                const countMap = {};
                productsData.forEach(prod => {
                    const catId = prod.category_id || prod.category?.id;
                    if (catId) {
                        countMap[catId] = (countMap[catId] || 0) + 1;
                    }
                });
                const categoriesEnriched = categoriesData.map(cat => ({
                    ...cat,
                    productCount: countMap[cat.id] || 0,
                }));
                setCategoriesWithCount(categoriesEnriched);
            } catch (error) {
                console.error('Error cargando datos:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="loading">Cargando datos...</div>;
    }

    return (
        <div className="dashboard">
            <h1>Panel de Administración</h1>
            <TotalsCards totals={totals} />
            <LatestItems latestProduct={latestProduct} latestUser={latestUser} />
            <CategoriesList categoriesWithCount={categoriesWithCount} />
            <ProductsTable products={products} />
        </div>
    );
}