// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Importe a página real
import ProductsPage from './pages/ProductsPage';

// Crie componentes placeholder para as páginas por enquanto
const DashboardPage = () => <h1 className="text-xl font-bold dark:text-white">Dashboard</h1>;
const InventoryPage = () => <h1 className="text-xl font-bold dark:text-white">Inventário</h1>;
//const ProductsPage = () => <h1 className="text-xl font-bold dark:text-white">Produtos</h1>;
const SettingsPage = () => <h1 className="text-xl font-bold dark:text-white">Configurações</h1>;
const NotFoundPage = () => <h1 className="text-xl font-bold dark:text-white">404 - Página Não Encontrada</h1>;


function App() {
  // O estado agora está dentro do Layout
  return (
    <HashRouter> {/* Use HashRouter para Electron */}
      <Layout> {/* O Layout agora envolve as rotas */}
        <Routes>
          <Route path="/" element={<DashboardPage />} /> {/* Rota inicial */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Adicione outras rotas conforme necessário */}
          <Route path="*" element={<NotFoundPage />} /> {/* Rota para 404 */}
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;