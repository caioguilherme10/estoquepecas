// src/pages/HistoricoComprasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftCircle, PlusCircle, Search, RotateCw, X } from 'lucide-react';
import Modal from '../components/Modal'; // Importa o Modal
import ComprasPage from './ComprasPage'; // Importa a página de Compras para o Modal

const HistoricoComprasPage = () => {
    const [historico, setHistorico] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [filtroNomeFornecedor, setFiltroNomeFornecedor] = useState('');
    const [filtroProdutoId, setFiltroProdutoId] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingProdutos, setLoadingProdutos] = useState(true);
    const [erro, setErro] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Função para buscar o histórico filtrado
    const fetchHistorico = useCallback(async () => {
        setLoading(true);
        setErro('');
        try {
            const filters = {};
            if (filtroNomeFornecedor.trim()) {
                filters.nomeFornecedor = filtroNomeFornecedor.trim();
            }
            if (filtroProdutoId) {
                filters.produtoId = parseInt(filtroProdutoId, 10);
            }
            const data = await window.api.getFilteredHistoricoCompras(filters);
            setHistorico(data || []);
        } catch (err) {
            console.error("Erro ao buscar histórico de compras:", err);
            setErro(`Erro ao buscar histórico: ${err.message || err}`);
            setHistorico([]); // Limpa em caso de erro
        } finally {
            setLoading(false);
        }
    }, [filtroNomeFornecedor, filtroProdutoId]); // Dependências do useCallback

    // Função para buscar produtos (apenas uma vez)
    const fetchProdutos = useCallback(async () => {
        setLoadingProdutos(true);
        try {
            const produtosData = await window.api.getProducts(null, true); // Pega todos, incluindo inativos
            setProdutos(produtosData || []);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            // Não define erro geral aqui para não sobrescrever erro de busca de histórico
        } finally {
            setLoadingProdutos(false);
        }
    }, []); // Sem dependências, executa só uma vez

    // Efeito para buscar produtos no mount
    useEffect(() => {
        fetchProdutos();
    }, [fetchProdutos]);

    // Efeito para buscar histórico no mount e quando filtros mudam
    useEffect(() => {
        fetchHistorico();
    }, [fetchHistorico]); // fetchHistorico já inclui os filtros como dependência

    const handleLimparFiltros = () => {
        setFiltroNomeFornecedor('');
        setFiltroProdutoId('');
        // O useEffect [fetchHistorico] vai disparar a busca novamente
    };

    const handleNovaCompraSalva = () => {
        setIsModalOpen(false); // Fecha o modal
        fetchHistorico(); // Atualiza a lista
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') {
            return 'N/A';
        }
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="container mx-auto p-4 dark:text-gray-100">
            {/*<Link to="/" className="inline-flex items-center mb-4 text-blue-500 hover:text-blue-700">
                <ArrowLeftCircle className="mr-2 w-5 h-5" /> Voltar
            </Link>*/}
            <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Histórico de Compras</h1>

            {/* Barra de Filtros e Ações */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    {/* Filtro Nome Fornecedor */}
                    <div className="md:col-span-1 lg:col-span-1">
                        <label htmlFor="filtroFornecedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fornecedor
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="filtroFornecedor"
                                value={filtroNomeFornecedor}
                                onChange={(e) => setFiltroNomeFornecedor(e.target.value)}
                                placeholder="Buscar por nome..."
                                className="shadow-sm appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                        </div>
                    </div>

                    {/* Filtro Produto */}
                    <div className="md:col-span-1 lg:col-span-1">
                         <label htmlFor="filtroProduto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Produto
                        </label>
                        <select
                            id="filtroProduto"
                            value={filtroProdutoId}
                            onChange={(e) => setFiltroProdutoId(e.target.value)}
                            disabled={loadingProdutos}
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        >
                            <option value="">{loadingProdutos ? 'Carregando...' : 'Todos os produtos'}</option>
                            {produtos.map((produto) => (
                                <option key={produto.id_produto} value={produto.id_produto}>
                                    {produto.NomeProduto} ({produto.CodigoFabricante || 'N/A'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botões de Ação */}
                    <div className="md:col-span-1 lg:col-span-2 flex flex-wrap gap-2 justify-start md:justify-end">
                        <button
                            onClick={handleLimparFiltros}
                            title="Limpar filtros e recarregar"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <X className="mr-1 h-4 w-4" /> Limpar
                        </button>
                        <button
                            onClick={fetchHistorico} // Botão para recarregar manualmente
                            disabled={loading}
                            title="Recarregar lista"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <RotateCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Recarregar
                        </button>
                         <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PlusCircle className="mr-2 h-5 w-5" /> Nova Compra
                        </button>
                    </div>
                </div>
            </div>

            {/* Mensagem de Erro */}
            {erro && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{erro}</div>}

            {/* Tabela de Histórico */}
            <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produto</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Qtd.</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço Unit.</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço Total</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fornecedor</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nota Fiscal</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Obs.</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        <RotateCw className="inline-block animate-spin h-5 w-5 mr-2" /> Carregando histórico...
                                    </td>
                                </tr>
                            ) : historico.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        Nenhum registro de compra encontrado {filtroNomeFornecedor || filtroProdutoId ? 'para os filtros aplicados' : ''}.
                                    </td>
                                </tr>
                            ) : (
                                historico.map((compra) => (
                                    <tr key={compra.id_compra} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{compra.data_compra_formatada}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            {compra.NomeProduto || 'Produto não encontrado'}
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">({compra.CodigoFabricante || 'N/A'})</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">{compra.quantidade}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">{formatCurrency(compra.preco_unitario)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(compra.preco_total)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{compra.nome_fornecedor || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{compra.numero_nota_fiscal || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={compra.observacoes || ''}>{compra.observacoes || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Modal para Nova Compra */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nova Compra"
            >
                <ComprasPage onSaveSuccess={handleNovaCompraSalva} isModal={true} />
            </Modal>
        </div>
    );
};

export default HistoricoComprasPage;