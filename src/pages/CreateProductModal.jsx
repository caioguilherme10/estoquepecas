// src/pages/Products/CreateProductModal.jsx // Ou onde quer que esteja seu modal

import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react';
// Ajuste o caminho se o Header estiver em outro lugar
// import Header from '@/components/layout/Header';
import { X } from 'lucide-react'; // Ícone para fechar
import PropTypes from 'prop-types';

// O tipo ProductFormData agora reflete melhor a API addProduct, mas não precisa ter ID ou ativo aqui, pois são gerenciados internamente ou no estado do modal
// type ProductFormData = {
//   name: string;
//   price: number; // Assumindo PrecoVenda aqui? Seja claro.
//   stockQuantity: number;
//   rating: number; // Rating não existe no seu DB, remova se não for usar
// };

const CreateProductModal = ({ isOpen, onClose, onCreate }) => {
  const initialFormData = {
    // Campos da sua tabela Produtos (exceto ID, Data*)
    codigoFabricante: '',
    codigoBarras: '',
    nomeProduto: '',
    aplicacao: '',
    marca: '',
    descricaoDetalhada: '', // Adicione se quiser
    unidadeMedida: 'UN', // Adicione se quiser
    quantidadeEstoque: 0, // Estoque inicial
    precoCusto: 0.0,
    precoVenda: 0.0,
    estoqueMinimo: 0,
    localizacao: '',
    ativo: true, // <<< NOVO CAMPO, default TRUE
    // Removido rating - não está no seu DB
  };

  const [formData, setFormData] = useState(initialFormData);

  // Reseta o form quando o modal for fechado/reaberto
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);


  const handleChange = (e) => { 
    const { name, value, type, checked } = e.target 

    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox'
        ? checked // Para o campo 'ativo'
        : (type === 'number' && name !== 'codigoBarras' && name !== 'codigoFabricante') // Evita parse de códigos
          ? parseFloat(value) || 0 // Garante que seja número ou 0
          : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validações extras podem ser adicionadas aqui
    console.log("Enviando para onCreate:", formData);
    onCreate(formData);
    // onClose(); // Fechar pode ser feito dentro do handleCreateProduct na página pai após sucesso
  };

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputCssStyles = "block w-full mb-3 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100";
  const checkboxLabelCss = "flex items-center text-sm text-gray-700 dark:text-gray-300";
  const checkboxCss = "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ml-2";


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Adicionar Novo Produto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 max-h-[70vh] overflow-y-auto pr-2"> {/* Adiciona scroll interno */}

          {/* --- CAMPOS DO SEU BANCO DE DADOS --- */}

          <label htmlFor="codigoFabricante" className={labelCssStyles}>Código Fabricante *</label>
          <input type="text" name="codigoFabricante" placeholder="Código do Fabricante" onChange={handleChange} value={formData.codigoFabricante} className={inputCssStyles} required />

          <label htmlFor="nomeProduto" className={labelCssStyles}>Nome Produto *</label>
          <input type="text" name="nomeProduto" placeholder="Nome do Produto" onChange={handleChange} value={formData.nomeProduto} className={inputCssStyles} required />

          <label htmlFor="codigoBarras" className={labelCssStyles}>Código Barras</label>
          <input type="text" name="codigoBarras" placeholder="Código de Barras (EAN)" onChange={handleChange} value={formData.codigoBarras} className={inputCssStyles} />

          <label htmlFor="marca" className={labelCssStyles}>Marca</label>
          <input type="text" name="marca" placeholder="Marca do Produto" onChange={handleChange} value={formData.marca} className={inputCssStyles} />

          <label htmlFor="aplicacao" className={labelCssStyles}>Aplicação</label>
          <input type="text" name="aplicacao" placeholder="Aplicação (ex: Motor AP 1.8)" onChange={handleChange} value={formData.aplicacao} className={inputCssStyles} />

          {/* Descricao Detalhada e Unidade Medida (Opcionais no form) */}

          <div className="grid grid-cols-2 gap-4"> {/* Grid para campos numéricos */}
            <div>
              <label htmlFor="quantidadeEstoque" className={labelCssStyles}>Qtd. Estoque Inicial</label>
              <input type="number" name="quantidadeEstoque" placeholder="0" min="0" onChange={handleChange} value={formData.quantidadeEstoque} className={inputCssStyles} />
            </div>
            <div>
              <label htmlFor="estoqueMinimo" className={labelCssStyles}>Estoque Mínimo</label>
              <input type="number" name="estoqueMinimo" placeholder="0" min="0" onChange={handleChange} value={formData.estoqueMinimo} className={inputCssStyles} />
            </div>
            <div>
              <label htmlFor="precoCusto" className={labelCssStyles}>Preço Custo (R$)</label>
              <input type="number" name="precoCusto" placeholder="0.00" step="0.01" min="0" onChange={handleChange} value={formData.precoCusto} className={inputCssStyles} />
            </div>
            <div>
              <label htmlFor="precoVenda" className={labelCssStyles}>Preço Venda (R$)</label>
              <input type="number" name="precoVenda" placeholder="0.00" step="0.01" min="0" onChange={handleChange} value={formData.precoVenda} className={inputCssStyles} />
            </div>
          </div>

          <label htmlFor="localizacao" className={labelCssStyles}>Localização</label>
          <input type="text" name="localizacao" placeholder="Prateleira A, Corredor 3" onChange={handleChange} value={formData.localizacao} className={inputCssStyles} />

          {/* --- CAMPO ATIVO --- */}
          <div className="mt-4 mb-4">
             <label className={checkboxLabelCss}>
               Manter produto ativo?
               <input
                 type="checkbox"
                 name="ativo"
                 checked={formData.ativo}
                 onChange={handleChange}
                 className={checkboxCss}
               />
             </label>
          </div>


          {/* --- BOTÕES DE AÇÃO --- */}
          <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-200"
            >
              Criar Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateProductModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
};

export default CreateProductModal;