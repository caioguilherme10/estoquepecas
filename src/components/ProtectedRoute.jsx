// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Enquanto verifica o estado de autenticação (ex: lendo localStorage)
        // Pode mostrar um spinner ou tela de loading aqui
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    if (!user) {
        // Usuário não logado, redireciona para login
        // Passa a localização atual para redirecionar de volta após o login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Usuário logado, renderiza o componente filho
    return children;
};

export default ProtectedRoute;