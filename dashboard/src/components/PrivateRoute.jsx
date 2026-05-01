// src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../api';

export default function PrivateRoute({ children }) {
    const token = getAuthToken();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}