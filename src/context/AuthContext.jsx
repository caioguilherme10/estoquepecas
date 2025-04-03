// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Começa como true para verificar o estado inicial

    // Tentar carregar o usuário do localStorage na inicialização (opcional, mas melhora UX)
    useEffect(() => {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
            try {
                 setUser(JSON.parse(storedUser));
            } catch (e) {
                 console.error("Erro ao parsear usuário do localStorage", e);
                 localStorage.removeItem('authUser');
            }
        }
        setIsLoading(false); // Finaliza o carregamento inicial
    }, []);

    const login = async (username, password) => {
        setIsLoading(true);
        try {
            const userData = await window.api.login(username, password);
            setUser(userData);
            localStorage.setItem('authUser', JSON.stringify(userData)); // Salva no localStorage
            setIsLoading(false);
            return userData; // Retorna dados em caso de sucesso
        } catch (error) {
            console.error("Falha no login:", error);
            setUser(null);
            localStorage.removeItem('authUser'); // Remove em caso de falha
            setIsLoading(false);
            throw error; // Re-lança o erro para o componente de login tratar
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('authUser'); // Limpa o localStorage
         // Idealmente, você pode querer chamar window.api.logout se tiver alguma ação no backend (invalidar token, etc.)
        console.log("Usuário deslogado.");
    };

    const value = {
        user,
        isLoading, // Exporta isLoading para saber quando a verificação inicial terminou
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook customizado para usar o contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};