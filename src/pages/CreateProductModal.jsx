// src/pages/Products/CreateProductModal.jsx // Ou onde quer que esteja seu modal
import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react';
// Ajuste o caminho se o Header estiver em outro lugar
// import Header from '@/components/layout/Header';
import { X } from 'lucide-react'; // Ícone para fechar
import PropTypes from 'prop-types';

const CreateProductModal = ({ isOpen, onClose, onCreate }) => {
  const initialFormData = {
    // Campos da sua tabela Produtos
    CodigoFabricante: '',
    CodigoBarras: '',
    NomeProduto: '',
    Marca: '',
    Descricao: '', // Correspondente a "Descricao" no seu DB
    Aplicacao: '',
    QuantidadeEstoque: 0,
    EstoqueMinimo: 1, // Valor padrão
    Preco: 0.0, // Correspondente a "Preco" no seu DB
    Localizacao: '',
    Ativo: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({}); // State para erros de validação

  // Reseta o form quando o modal for fechado/reaberto
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setFormErrors({}); // Limpa os erros
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox'
        ? checked
        : (type === 'number') // Evita parse de códigos
          ? parseFloat(value) || 0 // Garante que seja número ou 0
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    const errors = {};
    if (!formData.CodigoFabricante) {
      errors.CodigoFabricante = 'Código do Fabricante é obrigatório.';
    }
    if (!formData.NomeProduto) {
      errors.NomeProduto = 'Nome do Produto é obrigatório.';
    }
    setFormErrors(errors); // Define erros para mostrar na tela

    if (Object.keys(errors).length > 0) {
      return; // Impede o envio se houver erros
    }
    try {
      await onCreate(formData); // Envia o form data validado
      onClose(); // Só fecha se a criação for bem-sucedida
    } catch (err) {
      console.error("Erro ao criar produto no modal:", err);
      // Tratar erro aqui (ex: mostrar mensagem)
      setFormErrors({ submit: err.message || 'Erro ao criar o produto.' });
    }
  };

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputCssStyles = "block w-full mb-3 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100";
  const checkboxLabelCss = "flex items-center text-sm text-gray-700 dark:text-gray-300";
  const checkboxCss = "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ml-2";
  const errorCss = "text-red-500 text-sm mt-1";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          <h1 className="text-2xl font-semibold text-gray-700">Adicionar Novo Produto</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* --- CAMPOS DO SEU BANCO DE DADOS --- */}
          <label htmlFor="CodigoFabricante" className={labelCssStyles}>Código Fabricante *</label>
          <input type="text" name="CodigoFabricante" placeholder="Código do Fabricante" onChange={handleChange} value={formData.CodigoFabricante} className={inputCssStyles} required />
          {formErrors.CodigoFabricante && <p className={errorCss}>{formErrors.CodigoFabricante}</p>}

          <label htmlFor="NomeProduto" className={labelCssStyles}>Nome Produto *</label>
          <input type="text" name="NomeProduto" placeholder="Nome do Produto" onChange={handleChange} value={formData.NomeProduto} className={inputCssStyles} required />
          {formErrors.NomeProduto && <p className={errorCss}>{formErrors.NomeProduto}</p>}

          <label htmlFor="CodigoBarras" className={labelCssStyles}>Código Barras</label>
          <input type="text" name="CodigoBarras" placeholder="Código de Barras (EAN)" onChange={handleChange} value={formData.CodigoBarras} className={inputCssStyles} />

          <label htmlFor="Marca" className={labelCssStyles}>Marca</label>
          <input type="text" name="Marca" placeholder="Marca do Produto" onChange={handleChange} value={formData.Marca} className={inputCssStyles} />

          <label htmlFor="Aplicacao" className={labelCssStyles}>Aplicação</label>
          <input type="text" name="Aplicacao" placeholder="Aplicação (ex: Motor AP 1.8)" onChange={handleChange} value={formData.Aplicacao} className={inputCssStyles} />

          <label htmlFor="Descricao" className={labelCssStyles}>Descrição</label>
          <input type="text" name="Descricao" placeholder="Descrição do produto" onChange={handleChange} value={formData.Descricao} className={inputCssStyles} />

          <div className="grid grid-cols-2 gap-4"> {/* Grid para campos numéricos */}
            <div>
              <label htmlFor="QuantidadeEstoque" className={labelCssStyles}>Qtd. Estoque Inicial</label>
              <input type="number" name="QuantidadeEstoque" placeholder="0" min="0" onChange={handleChange} value={formData.QuantidadeEstoque} className={inputCssStyles} />
            </div>
            <div>
              <label htmlFor="EstoqueMinimo" className={labelCssStyles}>Estoque Mínimo</label>
              <input type="number" name="EstoqueMinimo" placeholder="1" min="0" onChange={handleChange} value={formData.EstoqueMinimo} className={inputCssStyles} />
            </div>
            <div>
              <label htmlFor="Preco" className={labelCssStyles}>Preço (R$)</label>
              <input type="number" name="Preco" placeholder="0.00" step="0.01" min="0" onChange={handleChange} value={formData.Preco} className={inputCssStyles} />
            </div>
          </div>

          <label htmlFor="Localizacao" className={labelCssStyles}>Localização</label>
          <input type="text" name="Localizacao" placeholder="Prateleira A, Corredor 3" onChange={handleChange} value={formData.Localizacao} className={inputCssStyles} />

          {/* --- CAMPO ATIVO --- */}
          <div className="mt-4 mb-4">
            <label className={checkboxLabelCss}>
              Manter produto ativo?
              <input
                type="checkbox"
                name="Ativo"
                checked={formData.Ativo}
                onChange={handleChange}
                className={checkboxCss}
              />
            </label>
          </div>

          {formErrors.submit && <p className={errorCss}>{formErrors.submit}</p>}

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