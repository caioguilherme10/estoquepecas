// src/components/layout/Sidebar.jsx
import React from 'react';
import { PackagePlus, PackageMinus, Clipboard, Layout, SlidersHorizontal, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

// Componente interno para os links da sidebar
const SidebarLink = ({ href, icon: Icon, label, isCollapsed }) => {
  // Usa useLocation para obter o pathname atual
  const location = useLocation();
  const pathname = location.pathname;
  // Lógica para verificar se o link está ativo
  // Considera '/' como '/dashboard' para a rota inicial
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");
  return (
    <Link to={href} title={isCollapsed ? label : undefined}> {/* Adiciona title quando colapsado */}
      <div
        className={`
          cursor-pointer flex items-center gap-3 transition-colors duration-200 ease-in-out
          ${isCollapsed ? 'justify-center py-3' : 'justify-start px-6 py-3'}
          ${isActive
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold' // Estilo ativo
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100' // Estilo inativo/hover
          }
        `}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : ''}`} /> {/* Tamanho ajustado */}
        <span className={`${isCollapsed ? 'hidden' : 'block'} whitespace-nowrap`}>
          {label}
        </span>
      </div>
    </Link>
  );
};

// Define PropTypes para SidebarLink
SidebarLink.propTypes = {
  href: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired, // Ícone é um componente
  label: PropTypes.string.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
};


// Componente principal da Sidebar
const Sidebar = ({ isCollapsed }) => { // Recebe apenas isCollapsed como prop agora
  // Classe da sidebar calculada baseada na prop
  const sidebarClassNames = `
    fixed top-0 left-0 h-full z-40 flex flex-col
    bg-white dark:bg-gray-800 shadow-lg # Sidebar principal
    transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-16' : 'w-64'}
  `;
  const { user } = useAuth();
  // TO-DO: Adicionar botão de toggle interno se quiser controlar pelo sidebar também
  // const toggleSidebar = () => { /* lógica para chamar a função do pai */ };
  return (
    <aside className={sidebarClassNames}>
      {/* TOP LOGO */}
      <div
        className={`flex items-center h-16 border-b border-gray-200 dark:border-gray-700 ${
          isCollapsed ? 'justify-center px-4' : 'justify-start px-5'
        }`} // Altura fixa e padding ajustado
      >
        {/* Use <img> padrão
        <img
          src="https://via.placeholder.com/30" // Placeholder ou sua logo real
          alt="Logo"
          width={isCollapsed ? 30 : 27} // Ajusta tamanho no modo colapsado
          height={isCollapsed ? 30 : 27}
          className="rounded flex-shrink-0"
        />*/}
        <h1
          className={`font-extrabold text-xl ml-2 whitespace-nowrap text-gray-800 dark:text-gray-100 ${
            isCollapsed ? 'hidden' : 'block'
          }`} // Tamanho de fonte e cor ajustados
        >
          MeuEstoque
        </h1>
      </div>
      {/* LINKS */}
      <nav className="flex-grow mt-4 overflow-y-auto"> {/* Adicionado overflow */}
        {/* Mapeia os links aqui */}
        <SidebarLink href="/dashboard" icon={Layout} label="Dashboard" isCollapsed={isCollapsed} />
        <SidebarLink href="/historico/compras" icon={PackagePlus} label="Compra de Produtos" isCollapsed={isCollapsed} />
        <SidebarLink href="/historico/vendas" icon={PackageMinus} label="Venda de Produtos" isCollapsed={isCollapsed} />
        <SidebarLink href="/products" icon={Clipboard} label="Produtos" isCollapsed={isCollapsed} />
        {user?.permissao === 'admin' && (
          <SidebarLink href="/users" icon={User} label="Usuários" isCollapsed={isCollapsed} />
        )}
        <SidebarLink href="/settings" icon={SlidersHorizontal} label="Configurações" isCollapsed={isCollapsed} />
      </nav>
      {/* FOOTER (Opcional) */}
      <div className={`border-t border-gray-200 dark:border-gray-700 p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">© 2025 MeuEstoque</p>
      </div>
    </aside>
  );
};

// Define PropTypes para Sidebar
Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  // toggleSidebar: PropTypes.func.isRequired, // Adicione se o botão de toggle estiver aqui
};

export default Sidebar;