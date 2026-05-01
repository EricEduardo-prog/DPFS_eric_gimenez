// src/api.js
const API_BASE = '/api';

// Guardar/obtener token
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('adminToken', token);
    } else {
        localStorage.removeItem('adminToken');
    }
};

export const getAuthToken = () => localStorage.getItem('adminToken');

// Función genérica para peticiones autenticadas
async function fetchWithAuth(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });
    if (response.status === 401) {
        // Token inválido o expirado
        setAuthToken(null);
        window.location.href = '/login';
        throw new Error('No autorizado');
    }
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la petición');
    }
    return response.json();
}

// Login
export const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Credenciales inválidas');
    }
    const data = await response.json();
    setAuthToken(data.token);
    return data;
};

// Obtener todos los productos (sin paginación, usamos limit grande)
export const getProducts = async () => {
    const data = await fetchWithAuth('/products?limit=1000');
    return data.products || data; // la API devuelve { products: [...] } o directamente array
};

// Obtener usuarios
export const getUsers = async () => {
    const data = await fetchWithAuth('/users?limit=1000');
    return data.users || data;
};

// Obtener categorías
export const getCategories = async () => {
    const data = await fetchWithAuth('/categories?limit=100');
    return data.categories || data;
};

// Obtener servicios (opcional para totales)
export const getServices = async () => {
    const data = await fetchWithAuth('/services?limit=100');
    return data.services || data;
};

// Obtener profesionales
export const getProfessionals = async () => {
    const data = await fetchWithAuth('/professionals?limit=100');
    return data.professionals || data;
};

// Obtener último producto (el primero del listado ordenado por fecha)
export const getLatestProduct = async () => {
    const data = await fetchWithAuth('/products?limit=1&sort=created_at&order=DESC');
    const products = data.products || data;
    return products[0] || null;
};

// Obtener último usuario
export const getLatestUser = async () => {
    const data = await fetchWithAuth('/users?limit=1&sort=registered_at&order=DESC');
    const users = data.users || data;
    return users[0] || null;
};