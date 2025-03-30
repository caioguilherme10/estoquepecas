// src/pages/CreateProductModal.jsx (ou src/components/products/CreateProductModal.jsx)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react'; // Ícone para fechar

const CreateProductModal = ({ isOpen, onClose, onCreate }) => {
  // Estado inicial do formulário, espelhando a estrutura da API/banco
  const initialFormData = {
    codigoFabricante: '',
    nomeProduto: '',
    codigoBarras: '',
    aplicacao: '',
    marca: '',
    quantidadeEstoque: 0, // Estoque inicial
    precoCusto: 0.00,
    precoVenda: 0.00,
    estoqueMinimo: 0,
    localizacao: '',
    // Adicione outros campos se necessário (ex: DescricaoDetalhada)
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reseta o formulário quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setError(null); // Limpa erros anteriores
      setIsSubmitting(false);
    }
  }, [isOpen]); // Dependência: isOpen

  // Handler para atualizar o estado do formulário
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Converte para número se necessário
    const newValue = (type === 'number') ? parseFloat(value || 0) : value;

    setFormData(prevData => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  // Handler para submeter o formulário
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne recarregamento da página
    setIsSubmitting(true);
    setError(null);

    console.log('Enviando dados para criar produto:', formData);

    // Verifica se a API existe antes de chamar
    if (!window.api || typeof window.api.addProduct !== 'function') {
        setError('Erro: API de criação não disponível.');
        setIsSubmitting(false);
        return;
    }

    try {
      // Chama a função exposta pelo preload
      const result = await window.api.addProduct(formData);
      console.log('Produto criado com sucesso:', result);
      onCreate(); // Chama a função passada por props (geralmente para atualizar a lista)
      onClose(); // Fecha o modal
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      // Define a mensagem de erro para exibir no modal
      setError(`Falha ao criar produto: ${err.message}`);
    } finally {
      setIsSubmitting(false); // Reabilita o botão de submit
    }
  };

  // Não renderiza nada se não estiver aberto
  if (!isOpen) return null;

  // --- Estilos reutilizáveis ---
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputClass = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50";
  const gridClass = "grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3"; // Grid para layout

  return (
    // Overlay do Modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose} // Fecha ao clicar fora (opcional)
    >
      {/* Conteúdo do Modal */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()} // Impede que clique dentro feche o modal
      >
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

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded">
              {error}
            </div>
          )}

          <div className={gridClass}>
            {/* Coluna 1 */}
            <div>
              <label htmlFor="codigoFabricante" className={labelClass}>Código Fabricante *</label>
              <input type="text" name="codigoFabricante" id="codigoFabricante" value={formData.codigoFabricante} onChange={handleChange} className={inputClass} required disabled={isSubmitting} />
            </div>
            <div>
              <label htmlFor="nomeProduto" className={labelClass}>Nome Produto *</label>
              <input type="text" name="nomeProduto" id="nomeProduto" value={formData.nomeProduto} onChange={handleChange} className={inputClass} required disabled={isSubmitting} />
            </div>
            <div>
              <label htmlFor="codigoBarras" className={labelClass}>Código Barras</label>
              <input type="text" name="codigoBarras" id="codigoBarras" value={formData.codigoBarras} onChange={handleChange} className={inputClass} disabled={isSubmitting} />
            </div>
             <div>
              <label htmlFor="marca" className={labelClass}>Marca</label>
              <input type="text" name="marca" id="marca" value={formData.marca} onChange={handleChange} className={inputClass} disabled={isSubmitting} />
            </div>
             <div>
              <label htmlFor="localizacao" className={labelClass}>Localização</label>
              <input type="text" name="localizacao" id="localizacao" value={formData.localizacao} onChange={handleChange} className={inputClass} disabled={isSubmitting} />
            </div>
          </div>

           {/* Campo Aplicação (Ocupa largura total) */}
           <div className="mt-3">
              <label htmlFor="aplicacao" className={labelClass}>Aplicação</label>
              <textarea name="aplicacao" id="aplicacao" value={formData.aplicacao} onChange={handleChange} rows="3" className={inputClass} disabled={isSubmitting}></textarea>
           </div>


          {/* Linha para campos numéricos */}
          <div className={`${gridClass} mt-4 border-t border-gray-200 dark:border-gray-700 pt-4`}>
            <div>
                <label htmlFor="quantidadeEstoque" className={labelClass}>Qtd. Estoque Inicial</label>
                <input type="number" name="quantidadeEstoque" id="quantidadeEstoque" value={formData.quantidadeEstoque} onChange={handleChange} className={inputClass} min="0" step="1" disabled={isSubmitting} />
            </div>
             <div>
                <label htmlFor="estoqueMinimo" className={labelClass}>Estoque Mínimo</label>
                <input type="number" name="estoqueMinimo" id="estoqueMinimo" value={formData.estoqueMinimo} onChange={handleChange} className={inputClass} min="0" step="1" disabled={isSubmitting} />
            </div>
            <div>
                <label htmlFor="precoCusto" className={labelClass}>Preço Custo</label>
                <input type="number" name="precoCusto" id="precoCusto" value={formData.precoCusto} onChange={handleChange} className={inputClass} min="0" step="0.01" disabled={isSubmitting} />
            </div>
            <div>
                <label htmlFor="precoVenda" className={labelClass}>Preço Venda</label>
                <input type="number" name="precoVenda" id="precoVenda" value={formData.precoVenda} onChange={handleChange} className={inputClass} min="0" step="0.01" disabled={isSubmitting} />
            </div>
          </div>


          {/* Rodapé do Modal com Botões */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Define os PropTypes para o componente
CreateProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired, // Função a ser chamada após criação bem-sucedida
};

export default CreateProductModal;