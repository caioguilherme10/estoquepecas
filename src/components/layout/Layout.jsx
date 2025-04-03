// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PropTypes from 'prop-types';

function Layout({ children }) { // Recebe o conteúdo da página como 'children'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Tenta ler a preferência do usuário do localStorage
    const savedMode = localStorage.getItem('darkMode');
    // Ou verifica a preferência do sistema operacional
    return savedMode ? JSON.parse(savedMode) : window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', JSON.stringify(newMode)); // Salva a preferência
      return newMode;
    });
  };

  // Aplica/remove classe 'dark' no elemento <html> quando isDarkMode muda
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    // Container principal que aplica dark mode e usa flex
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar recebe o estado */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Container para Navbar e Conteúdo */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Navbar recebe estados e funções */}
        <Navbar
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Área de conteúdo principal com scroll */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
          <Outlet /> {/* Renderiza a rota filha correspondente aqui */}
        </main>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired, // Espera um nó React como filho
};

export default Layout;