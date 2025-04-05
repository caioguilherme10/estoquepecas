// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext'; // Importa o Provider
import ProtectedRoute from './components/ProtectedRoute'; // Importa a rota protegida
import LoginPage from './pages/LoginPage'; // Importa a página de Login

// Importe a página real
import ProductsPage from './pages/ProductsPage';
import ComprasPage from './pages/ComprasPage';
import VendasPage from './pages/VendasPage';
import HistoricoComprasPage from './pages/HistoricoComprasPage'; // Nova página
import HistoricoVendasPage from './pages/HistoricoVendasPage'; // Nova página
import UsersPage from './pages/UsersPage'; // << Importar a futura página de usuários
import DashboardPage from './pages/DashboardPage'; // << Importar a futura página de usuários

// Crie componentes placeholder para as páginas por enquanto
// const DashboardPage = () => <h1 className="text-xl font-bold dark:text-white">Dashboard</h1>;
//const CompraPage = () => <h1 className="text-xl font-bold dark:text-white">Compra</h1>;
//const VendaPage = () => <h1 className="text-xl font-bold dark:text-white">Venda</h1>;
//const ProductsPage = () => <h1 className="text-xl font-bold dark:text-white">Produtos</h1>;
const SettingsPage = () => <h1 className="text-xl font-bold dark:text-white">Configurações</h1>;
const NotFoundPage = () => <h1 className="text-xl font-bold dark:text-white">404 - Página Não Encontrada</h1>;


function App() {
  // O estado agora está dentro do Layout
  return (
    <AuthProvider> {/* Envolve toda a aplicação com o AuthProvider */}
      <HashRouter>
        <Routes>
          {/* Rota de Login (pública) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas Protegidas (dentro do Layout) */}
          <Route
            path="/"
            element={
              <ProtectedRoute> {/* Protege todo o layout e suas rotas filhas */}
                <Layout> {/* O Layout agora está dentro da rota protegida */}
                   {/* As rotas filhas serão renderizadas onde o <Outlet/> (implícito pelo Layout) estiver */}
                </Layout>
              </ProtectedRoute>
            }
          >
             {/* Rotas filhas que serão renderizadas dentro do Layout */}
            <Route index element={<DashboardPage />} /> {/* Rota inicial dentro do layout */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="compras/nova" element={<ComprasPage />} /> {/* Provavelmente remover ou proteger */}
            <Route path="vendas/nova" element={<VendasPage />} /> {/* Provavelmente remover ou proteger */}
            <Route path="historico/compras" element={<HistoricoComprasPage />} />
            <Route path="historico/vendas" element={<HistoricoVendasPage />} />
            <Route path="users" element={<UsersPage />} /> {/* Rota para Gerenciamento de Usuários */}
            <Route path="settings" element={<SettingsPage />} />
             {/* Adicione outras rotas protegidas aqui */}

          </Route>

           {/* Rota 404 (fora das rotas protegidas ou dentro, dependendo do desejado) */}
           <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;

// Ajuste no Layout.jsx para renderizar rotas filhas:
// No final do Layout.jsx, em vez de {children}, use <Outlet /> de react-router-dom
// import { Outlet } from 'react-router-dom';
// ...
// <main className="flex-grow p-4 md:p-6 overflow-y-auto">
//   <Outlet /> {/* Renderiza a rota filha correspondente aqui */}
// </main>