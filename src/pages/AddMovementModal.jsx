// src/pages/Products/AddMovementModal.jsx (NOVO ARQUIVO - EXEMPLO)

import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react';
// import Header from '@/components/layout/Header'; // Ajuste o caminho
import PropTypes from 'prop-types';

// Tipos de movimento permitidos pela API
const MOVEMENT_TYPES = ['Entrada', 'Saida', 'Ajuste'];

const AddMovementModal = ({ isOpen, onClose, product, onAddMovement }) => {
  // Estado inicial do formulário
  const initialMovementData = {
    tipoMovimento: 'Saida', // Default para Saida
    quantidade: 1,
    precoCustoUnitario: null,
    precoVendaUnitario: product?.PrecoVenda || null, // Default para preço atual se for saída
    observacao: '',
    // usuario: null, // Você pode adicionar isso se tiver autenticação
  };

  const [movementData, setMovementData] = useState(initialMovementData);

  // Reseta o form quando o produto ou estado isOpen muda
  useEffect(() => {
    if (isOpen && product) {
      setMovementData({
          ...initialMovementData,
          // Preenche o preço de venda se for Saída e o produto tiver um
          precoVendaUnitario: product.PrecoVenda || null
      });
    } else if (!isOpen) {
        setMovementData(initialMovementData); // Limpa ao fechar
    }
  }, [isOpen, product]); // Depende de product também

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;

    // Converte para número se necessário
    if (name === 'quantidade' || name === 'precoCustoUnitario' || name === 'precoVendaUnitario') {
      parsedValue = parseFloat(value) || null; // Usa null se não for número válido
      if (name === 'quantidade' && parsedValue !== null && parsedValue < 0) {
          parsedValue = 0; // Quantidade não pode ser negativa no input
      }
    }

    setMovementData(prevData => ({
      ...prevData,
      [name]: parsedValue,
      // Limpa o preço não relevante ao mudar o tipo
      ...(name === 'tipoMovimento' && value !== 'Entrada' && { precoCustoUnitario: null }),
      ...(name === 'tipoMovimento' && value !== 'Saida' && { precoVendaUnitario: null }),
       // Repreencher preço de venda se mudar para Saída
      ...(name === 'tipoMovimento' && value === 'Saida' && { precoVendaUnitario: product?.PrecoVenda || null }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product || !product.ID) {
        alert("Erro: Produto não selecionado.");
        return;
    }
    if (movementData.quantidade <= 0) {
        alert("Erro: A quantidade deve ser maior que zero.");
        return;
    }
    // Chama a função passada pelo pai, incluindo o ID do produto
    onAddMovement({
      ...movementData,
      produtoId: product.ID,
    });
     // Fechar pode ser feito no onAddMovement na página pai após sucesso
  };

  if (!isOpen || !product) return null; // Não renderiza se fechado ou sem produto

  // Estilos CSS (similares ao outro modal)
  const labelCssStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputCssStyles = "block w-full mb-3 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100";
  const selectCssStyles = inputCssStyles; // Reutiliza estilo

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
        <Header name={`Movimentar: ${product.NomeProduto}`} />
        <form onSubmit={handleSubmit} className="mt-4">

          <label htmlFor="tipoMovimento" className={labelCssStyles}>Tipo de Movimento *</label>
          <select name="tipoMovimento" value={movementData.tipoMovimento} onChange={handleChange} className={selectCssStyles} required>
            {MOVEMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <label htmlFor="quantidade" className={labelCssStyles}>Quantidade *</label>
          <input type="number" name="quantidade" placeholder="0" min="1" step="1" value={movementData.quantidade || ''} onChange={handleChange} className={inputCssStyles} required />

          {/* Campo de Preço de Custo (Condicional) */}
          {movementData.tipoMovimento === 'Entrada' && (
            <div>
              <label htmlFor="precoCustoUnitario" className={labelCssStyles}>Preço Custo Unitário (R$)</label>
              <input type="number" name="precoCustoUnitario" placeholder="0.00" step="0.01" min="0" value={movementData.precoCustoUnitario || ''} onChange={handleChange} className={inputCssStyles} />
            </div>
          )}

          {/* Campo de Preço de Venda (Condicional) */}
          {movementData.tipoMovimento === 'Saida' && (
            <div>
              <label htmlFor="precoVendaUnitario" className={labelCssStyles}>Preço Venda Unitário (R$)</label>
              <input type="number" name="precoVendaUnitario" placeholder="0.00" step="0.01" min="0" value={movementData.precoVendaUnitario || ''} onChange={handleChange} className={inputCssStyles} />
            </div>
          )}

          <label htmlFor="observacao" className={labelCssStyles}>Observação</label>
          <textarea name="observacao" placeholder="Ex: Venda Pedido #123, Compra NF 456" value={movementData.observacao} onChange={handleChange} className={inputCssStyles} rows="2"></textarea>


          {/* --- BOTÕES DE AÇÃO --- */}
          <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition duration-200">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition duration-200">
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddMovementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object, // Objeto do produto a ser movimentado
  onAddMovement: PropTypes.func.isRequired,
};

export default AddMovementModal;