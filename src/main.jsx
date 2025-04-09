// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Importa o CSS

// Verifica se o elemento 'root' existe
const rootElement = document.getElementById('root');
if (rootElement) {
  console.log("Elemento #root encontrado, montando React...");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("FATAL: Elemento #root não encontrado no HTML!");
  // Você pode adicionar uma mensagem de erro visível na página aqui também
  document.body.innerHTML = '<h1 style="color: red;">Erro: Falha ao encontrar o ponto de montagem do React (#root). Verifique index.html.</h1>';
}