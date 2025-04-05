// --- START OF FILE ProductsPage.jsx (MODIFICADO) ---

import React, { useState, useEffect, useCallback } from 'react';
import { Search, PlusCircle, Package, Edit, ToggleLeft, ToggleRight, RotateCw } from 'lucide-react'; // Adicionar ícones Toggle
import CreateProductModal from './CreateProductModal';
import EditProductModal from './EditProductModal'; // *** 1. Importar o EditProductModal ***
import PropTypes from 'prop-types'; // Boa prática

// Componente ProductCard (com pequenas melhorias no botão Ativar/Desativar)
const ProductCard = ({ product, onToggleActive, onEdit }) => { // Adicionada prop onEdit
    // Função para formatar moeda (opcional)
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'N/A';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Determina a cor do estoque
    const getStockColor = (quantity, minStock) => {
        if (quantity <= 0) return 'text-red-600 dark:text-red-400';
        if (minStock > 0 && quantity <= minStock) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };
    const displayValue = (value, placeholder = '-') => value || placeholder;

    const handleToggleClick = () => {
        onToggleActive(product.id_produto);
    };

    const handleEditClick = () => {
        onEdit(product); // Passa o produto inteiro para edição
    };

    // Determina a cor e o texto do botão de status
    const isActive = product.Ativo ?? true; // Assume ativo se for null/undefined (embora não deveria ser)
    const statusButtonClass = isActive
        ? "bg-yellow-500 hover:bg-yellow-600 text-white" // Amarelo para Desativar
        : "bg-green-500 hover:bg-green-600 text-white"; // Verde para Ativar
    const statusButtonIcon = isActive ? <ToggleLeft size={14} className="mr-1" /> : <ToggleRight size={14} className="mr-1" />;

    return (
        <div className={`border border-gray-200 dark:border-gray-700 shadow rounded-lg bg-white dark:bg-gray-800 flex flex-col transition hover:shadow-md overflow-hidden ${!isActive ? 'opacity-60' : ''}`}>
             {/* ... (Imagem Placeholder e Conteúdo do Card - código existente) ... */}
             <div className="bg-gray-100 dark:bg-gray-700 h-32 flex items-center justify-center flex-shrink-0 relative">
                <Package size={48} className="text-gray-400 dark:text-gray-500" />
                 {!isActive && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                        Inativo
                    </span>
                 )}
            </div>
             <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {displayValue(product.Marca)}
                    </p>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1 leading-tight truncate" title={product.NomeProduto}>
                        {displayValue(product.NomeProduto, 'Produto Sem Nome')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-ellipsis overflow-hidden line-clamp-2" title={product.Aplicacao} style={{ minHeight: '2.5rem' }}>
                        Aplicação: {displayValue(product.Aplicacao)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate" title={product.Localizacao}>
                        <span className="font-medium">Local:</span> {displayValue(product.Localizacao)}
                    </p>
                </div>
                 <div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1 text-right">
                        {formatCurrency(product.Preco)}
                    </p>
                    <p className={`text-sm font-medium text-right ${getStockColor(product.QuantidadeEstoque, product.EstoqueMinimo)}`}>
                        Estoque: {product.QuantidadeEstoque ?? 0}
                        {product.EstoqueMinimo > 0 ? ` (Min: ${product.EstoqueMinimo})` : ''}
                    </p>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-2">
                <button
                    onClick={handleEditClick} // Adicionado handler de clique
                    className="flex items-center text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-150"
                    title="Editar Produto"
                >
                    <Edit size={14} className="mr-1" /> Editar
                </button>
                <button
                    onClick={handleToggleClick}
                    className={`flex items-center text-xs px-3 py-1 rounded transition duration-150 ${statusButtonClass}`}
                    title={isActive ? 'Desativar Produto' : 'Ativar Produto'}
                >
                    {statusButtonIcon}
                    {isActive ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    );
};

ProductCard.propTypes = {
    product: PropTypes.object.isRequired,
    onToggleActive: PropTypes.func.isRequired, // Renomeado de onProductDesativar
    onEdit: PropTypes.func.isRequired,
};


// Componente principal da página
const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('active'); // *** NOVO ESTADO para o filtro *** Padrão é 'active'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(''); // Para feedback
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Estado para modal de edição (se usar um diferente)
    const [currentProduct, setCurrentProduct] = useState(null); // Para edição

    // Função para buscar produtos (agora depende de term e status)
    const fetchProducts = useCallback(async (term, status) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(''); // Limpa mensagens
        console.log(`[ProductsPage] Buscando produtos com termo: "${term}", status: "${status}"`);

        if (!window.api || typeof window.api.getProducts !== 'function') {
            // ... (tratamento de erro da API existente) ...
             console.error('[ProductsPage] window.api.getProducts não está definida!');
            setError('Erro interno: API de produtos indisponível.');
            setIsLoading(false);
            return;
        }

        try {
            // *** CHAMA A API COM O FILTRO DE STATUS ***
            const result = await window.api.getProducts(term, status);
            console.log('[ProductsPage] Produtos recebidos:', result);
            setProducts(result || []);
        } catch (err) {
             // ... (tratamento de erro existente) ...
            console.error('[ProductsPage] Erro ao buscar produtos:', err);
            setError(`Falha ao carregar produtos: ${err.message}`);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback ainda não depende de estado diretamente

    // Efeito para buscar produtos (agora depende de searchTerm e filterStatus)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // *** PASSA OS DOIS FILTROS ***
            fetchProducts(searchTerm, filterStatus);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
        // *** ATUALIZA AS DEPENDÊNCIAS DO useEffect ***
    }, [searchTerm, filterStatus, fetchProducts]); // Re-executa quando busca ou filtro mudam


    // Limpa mensagem de sucesso após alguns segundos
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);


    // Funções para Modal de Criação
    const handleOpenCreateModal = () => {
        // setCurrentProduct(null); // Se usar um único modal
        setIsCreateModalOpen(true);
        setError('');
        setSuccessMessage('');
    };
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleCreateProduct = async (productData) => {
        setError('');
        setSuccessMessage('');
        try {
            const result = await window.api.addProduct(productData);
            setSuccessMessage(result.message || 'Produto criado com sucesso!');
            fetchProducts(searchTerm, filterStatus); // Rebusca a lista
            handleCloseCreateModal();
            return Promise.resolve();
        } catch (err) {
            console.error("Erro ao criar produto:", err);
            setError(`Erro ao criar: ${err.message}`); // Mostra erro na página principal
            return Promise.reject(err); // Re-lança para o modal, se ele tratar tbm
        }
    };

    // Função para Modal de Edição (ainda não implementado, mas estrutura pronta)
    const handleOpenEditModal = (product) => {
        console.log("Abrindo modal de edição para:", product);
        setCurrentProduct(product); // Define o produto atual
        setIsEditModalOpen(true);    // Abre o modal de edição
        setError('');
        setSuccessMessage('');
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentProduct(null); // Limpa o produto atual ao fechar
    };

    const handleUpdateProduct = async (productId, updatedData) => {
        // Esta função é passada para EditProductModal como 'onUpdate'
        setError('');
        setSuccessMessage('');
        console.log(`[ProductsPage] Tentando atualizar produto ID: ${productId}`, updatedData);
        try {
            const result = await window.api.updateProduct(productId, updatedData);
            setSuccessMessage(result.message || 'Produto atualizado com sucesso!');
            fetchProducts(searchTerm, filterStatus); // Recarrega a lista
            // handleCloseEditModal(); // O modal já fecha sozinho no sucesso via onUpdate->onClose
            return Promise.resolve(); // Sinaliza sucesso para o modal
        } catch (err) {
            console.error("Erro ao atualizar produto:", err);
            // Define o erro na página principal para visibilidade
            setError(`Erro ao atualizar: ${err.message}`);
            return Promise.reject(err); // Re-lança o erro para o modal lidar (ex: formErrors.submit)
        }
    };

    // Função para ativar/desativar produto
    const handleToggleProductActive = async (id) => {
        setError('');
        setSuccessMessage('');
        console.log(`[ProductsPage] Toggling active status for product ID: ${id}`);
        try {
            // Usar a função renomeada ou a existente 'desativarProduto'
            const result = await window.api.desativarProduto(id); // Ou toggleProductActive se renomeou
            setSuccessMessage(result.message || 'Status do produto alterado.');
            // Força a re-busca para refletir a mudança visualmente (ativo/inativo)
            fetchProducts(searchTerm, filterStatus);
        } catch (err) {
            console.error("Erro ao ativar/desativar produto:", err);
            setError(`Erro ao alterar status: ${err.message}`);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 dark:text-gray-100">
            {/* Cabeçalho da Página e Ações */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    Produtos
                </h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto"> {/* Ajuste para responsividade */}
                    {/* *** SELECT DE FILTRO DE STATUS *** */}
                    <div className="flex-shrink-0"> {/* Evita que o select estique demais */}
                        <label htmlFor="filterStatus" className="sr-only">Filtrar por status</label> {/* Label para acessibilidade */}
                        <select
                            id="filterStatus"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                        >
                            <option value="active">Ativos</option>
                            <option value="inactive">Inativos</option>
                            <option value="all">Todos</option>
                        </select>
                    </div>
                    {/* Input de Busca */}
                    <div className="relative flex-grow"> {/* Permite que a busca cresça */}
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            type="search"
                            placeholder="Buscar por nome, código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                        />
                    </div>
                    {/* Botão Criar Produto */}
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-150 ease-in-out" // Adicionado justify-center
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>Criar</span>
                    </button>
                </div>
            </div>

             {/* Mensagens de Erro e Sucesso */}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}


            {/* Grid de Produtos */}
            {isLoading && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">Carregando produtos...</div>
            )}
            {!isLoading && !error && products.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Nenhum produto encontrado
                    {(searchTerm || filterStatus !== 'active') ? ' para os filtros aplicados' : ''}.
                     {/* Mensagem ajustada */}
                </div>
            )}
            {!isLoading && !error && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id_produto}
                            product={product}
                            onToggleActive={handleToggleProductActive} // Passa a função correta
                            onEdit={handleOpenEditModal} // Passa a função para abrir edição
                        />
                    ))}
                </div>
            )}

            {/* Modal de Criação */}
             {/* Renderiza o modal apenas se isCreateModalOpen for true */}
            {isCreateModalOpen && (
                 <CreateProductModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseCreateModal}
                    onCreate={handleCreateProduct} // Passa a função correta
                />
            )}

            {/* Modal de Edição (a ser implementado) */}
            {isEditModalOpen && currentProduct && (
                <EditProductModal // Componente diferente ou o mesmo com lógica interna
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onUpdate={handleUpdateProduct}
                    productData={currentProduct}
                />
            )}

        </div>
    );
};

export default ProductsPage;

// --- END OF FILE ProductsPage.jsx ---

// Adicione PropTypes se desejar maior robustez
// ProductCard.propTypes = { ... };
// ProductsPage.propTypes = { ... };