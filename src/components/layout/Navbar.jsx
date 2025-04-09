// src/components/layout/Navbar.jsx
import React from 'react';
import { Menu, Moon, Settings, Sun, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

// Define as props que o Navbar espera receber do componente pai
const Navbar = ({
  isSidebarCollapsed, // Estado vindo do pai
  toggleSidebar,      // Função vinda do pai
  isDarkMode,         // Estado vindo do pai
  toggleDarkMode,     // Função vinda do pai
}) => {
  const { user, logout } = useAuth();
  return (
    // Adiciona classes dark mode aqui se necessário, ou gerencie no Layout pai
    <nav className="flex justify-between items-center w-full mb-7 px-4 md:px-6 text-gray-700 dark:text-gray-200">
      {/* LEFT SIDE */}
      <div className="flex justify-between items-center gap-5">
        {/* Botão usa a função toggleSidebar recebida via props */}
        <button
          className="px-3 py-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800"
          onClick={toggleSidebar} // Chama a função do pai
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
      {/* RIGHT SIDE */}
      <div className="flex justify-between items-center gap-3 md:gap-5">
        {/* Botão Dark Mode usa estado e função das props */}
        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          {isDarkMode ? (
            <Sun className="cursor-pointer text-yellow-500" size={22} />
          ) : (
            <Moon className="cursor-pointer text-gray-600" size={22} />
          )}
        </button>
        {/* Seção de Usuário (simplificada/ajustada) */}
        <div className="hidden md:flex justify-between items-center gap-4">
          {/* Separador */}
          <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
          {/* Usuário - Usando <img> padrão */}
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              // Substitua pela URL real ou importe a imagem se configurado
              src="/3052.png" // Placeholder
              // src="/path/to/your/profile.jpg" // Exemplo se tiver imagem local
              alt="Perfil"
              width={32} // Tamanho menor
              height={32}
              className="rounded-full object-cover"
            />
            {/* Exibe o nome completo se logado, senão 'Visitante' */}
            <span className="font-semibold hidden lg:inline">
              {user ? user.nome_completo : 'Visitante'}
            </span>
            {/* Botão Logout */}
            {user && ( // Mostra apenas se estiver logado
              <button onClick={logout} title="Sair" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <LogOut className="cursor-pointer text-red-500 dark:text-red-400" size={22} />
              </button>
            )}
          </div>
        </div>
        {/* Link para Configurações */}
        <Link to="/settings" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Settings className="cursor-pointer text-gray-500 dark:text-gray-400" size={22} />
        </Link>
      </div>
    </nav>
  );
};

// Define os tipos esperados para as props
Navbar.propTypes = {
  isSidebarCollapsed: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
};

export default Navbar;