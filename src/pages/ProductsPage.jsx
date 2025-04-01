// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, PlusCircle, Package } from 'lucide-react'; // Ícones
import CreateProductModal from './CreateProductModal';
// import Rating from '../components/common/Rating'; // Se for usar rating

// Componente para o Card de Produto individual
const ProductCard = ({ product, onProductDesativar }) => { // Adicionada prop onProductDesativar
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

    // Placeholder para campos vazios
    const displayValue = (value, placeholder = '-') => value || placeholder;

    // Handler para desativar/ativar o produto
    const handleDesativarAtivar = () => {
        console.log(`[ProductCard] Desativar/Ativar produto ID: ${product.id_produto}`);
        onProductDesativar(product.id_produto);
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 shadow rounded-lg bg-white dark:bg-gray-800 flex flex-col transition hover:shadow-md overflow-hidden"> {/* Adicionado overflow-hidden */}
            {/* Imagem Placeholder */}
            <div className="bg-gray-100 dark:bg-gray-700 h-32 flex items-center justify-center flex-shrink-0"> {/* Altura fixa */}
                <Package size={48} className="text-gray-400 dark:text-gray-500" />
            </div>

            {/* Conteúdo do Card */}
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div> {/* Agrupa informações principais */}
                    {/* Marca e Nome */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {displayValue(product.Marca)}
                    </p>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1 leading-tight truncate" title={product.NomeProduto}>
                        {displayValue(product.NomeProduto, 'Produto Sem Nome')}
                    </h3>

                    {/* Aplicação */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 text-ellipsis overflow-hidden line-clamp-2" title={product.Aplicacao} style={{ minHeight: '2.5rem' }}> {/* Garante espaço mesmo vazio, limita a 2 linhas */}
                        Aplicação: {displayValue(product.Aplicacao)}
                    </p>

                    {/* Localização */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate" title={product.Localizacao}>
                        <span className="font-medium">Local:</span> {displayValue(product.Localizacao)}
                    </p>
                </div>

                <div> {/* Agrupa Preço e Estoque */}
                    {/* Preço */}
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1 text-right">
                        {formatCurrency(product.Preco)} {/* Alterado para product.Preco */}
                    </p>

                    {/* Estoque */}
                    <p className={`text-sm font-medium text-right ${getStockColor(product.QuantidadeEstoque, product.EstoqueMinimo)}`}>
                        Estoque: {product.QuantidadeEstoque ?? 0}
                        {product.EstoqueMinimo > 0 ? ` (Min: ${product.EstoqueMinimo})` : ''}
                    </p>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-2">
                {/* Adicione onClick handlers quando implementar as funções */}
                <button className="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-150">Editar</button>
                <button
                    onClick={handleDesativarAtivar}
                    className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition duration-150"
                >
                    {product.Ativo ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    );
};

// Componente principal da página
const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Para o modal de criação
    const [refreshProducts, setRefreshProducts] = useState(false); // State para forçar a atualização da lista

    // Função para buscar produtos (usando useCallback para otimização)
    const fetchProducts = useCallback(async (term) => {
        setIsLoading(true);
        setError(null);
        console.log(`[ProductsPage] Buscando produtos com termo: "${term}"`);

        // Verifica se a API está disponível
        if (!window.api || typeof window.api.getProducts !== 'function') {
            console.error('[ProductsPage] window.api.getProducts não está definida!');
            setError('Erro interno: API de produtos indisponível.');
            setIsLoading(false);
            return;
        }

        try {
            const result = await window.api.getProducts(term); // Usando o termo de busca
            console.log('[ProductsPage] Produtos recebidos:', result);
            setProducts(result || []); // Garante que seja sempre um array
        } catch (err) {
            console.error('[ProductsPage] Erro ao buscar produtos:', err);
            setError(`Falha ao carregar produtos: ${err.message}`);
            setProducts([]); // Limpa produtos em caso de erro
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback sem dependências externas diretas

    // Efeito para buscar produtos na montagem inicial e quando searchTerm muda
    useEffect(() => {
        // Um debounce simples para evitar buscas a cada tecla digitada
        const delayDebounceFn = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 300); // Espera 300ms após o usuário parar de digitar

        // Função de limpeza para cancelar o timeout se o usuário digitar novamente
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchProducts, refreshProducts]); // Re-executa quando searchTerm ou fetchProducts muda

    // Função para abrir o modal (será usada depois)
    const handleOpenModal = () => {
        console.log("Abrir modal de criação...");
        setIsModalOpen(true);
        //alert("Funcionalidade de Criar Produto ainda não implementada.");
    };

    // Função para FECHAR o modal (será passada via prop 'onClose')
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Função para lidar com a criação (será passada para o modal)
    const handleCreateProduct = async (productData) => {
        console.log("Tentando criar produto:", productData);
        try {
            await window.api.addProduct(productData);
            fetchProducts(searchTerm); // Rebusca a lista após adicionar
            setIsModalOpen(false); // Fecha o modal
            // Adicionar mensagem de sucesso
        } catch (err) {
            console.error("Erro ao criar produto:", err);
            // Mostrar erro para o usuário
        }
    };

    // Função para lidar com a desativação/ativação de um produto
    const handleProductDesativar = async (id) => {
        console.log(`[ProductsPage] Desativar/Ativar produto ID: ${id}`);
        try {
            await window.api.desativarProduto(id);
            //fetchProducts(searchTerm); // Recarrega a lista de produtos após a desativação/ativação
            setRefreshProducts(prev => !prev); // Inverte o state para forçar o useEffect a recarregar
        } catch (err) {
            console.error("Erro ao desativar/ativar produto:", err);
            // Mostre uma mensagem de erro ao usuário
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 dark:text-gray-100">
            {/* Cabeçalho da Página e Ações */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    Produtos em Estoque
                </h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Input de Busca */}
                    <div className="relative flex-grow md:flex-grow-0">
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
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-150 ease-in-out"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>Criar</span>
                    </button>
                </div>
            </div>

            {/* Grid de Produtos */}
            {isLoading && (
                <div className="text-center py-10">Carregando produtos...</div>
            )}
            {error && (
                <div className="text-center py-10 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-4 rounded">
                    {error}
                </div>
            )}
            {!isLoading && !error && products.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Nenhum produto encontrado {searchTerm && `para "${searchTerm}"`}.
                </div>
            )}
            {!isLoading && !error && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id_produto} // Alterado para id_produto
                            product={product}
                            onProductDesativar={handleProductDesativar} // Passa a função para o ProductCard
                        />
                    ))}
                </div>
            )}

            {/* Modal de Criação (Renderização Condicional) */}
            {isModalOpen && (
                <CreateProductModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onCreate={handleCreateProduct}
                />
            )}
        </div>
    );
};

export default ProductsPage;

// Adicione PropTypes se desejar maior robustez
// ProductCard.propTypes = { ... };
// ProductsPage.propTypes = { ... };