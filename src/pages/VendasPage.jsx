// --- START OF FILE VendasPage.jsx (REATORADO para Múltiplos Itens) ---

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ShoppingCart, DollarSign, Info } from 'lucide-react'; // Ícones

// Helper para formatar moeda
const formatCurrency = (value) => {
    return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const VendasPage = ({ onSaveSuccess, isModal = false }) => { // Mantemos props por enquanto
    const { user } = useAuth();

    // Estados para o item ATUAL sendo adicionado
    const [currentProductId, setCurrentProductId] = useState('');
    const [currentQuantidade, setCurrentQuantidade] = useState('');
    const [currentPrecoUnitario, setCurrentPrecoUnitario] = useState('');
    const [produtoSelecionadoInfo, setProdutoSelecionadoInfo] = useState(null); // Infos do produto atual

    // Estados para a transação GERAL
    const [items, setItems] = useState([]); // Lista de itens adicionados
    const [nomeCliente, setNomeCliente] = useState('');
    const [numeroRecibo, setNumeroRecibo] = useState('');
    const [observacoes, setObservacoes] = useState('');

    // Estados de controle da UI
    const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
    const [loadingProdutos, setLoadingProdutos] = useState(true);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    // Busca produtos disponíveis ao montar
    useEffect(() => {
        const fetchProdutos = async () => {
            setLoadingProdutos(true);
            try {
                const produtosData = await window.api.getProducts(null, 'active'); // Apenas ativos
                setProdutosDisponiveis(produtosData || []);
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
                setErro("Erro ao carregar lista de produtos.");
            } finally {
                setLoadingProdutos(false);
            }
        };
        fetchProdutos();
    }, []);

    // Atualiza informações e preço sugerido quando o produto atual muda
    useEffect(() => {
        if (currentProductId) {
            const selected = produtosDisponiveis.find(p => p.id_produto === parseInt(currentProductId, 10));
            setProdutoSelecionadoInfo(selected);
            // Sugere preço, mas apenas se o campo estiver vazio
            if (selected && selected.Preco > 0 && !currentPrecoUnitario) {
                setCurrentPrecoUnitario(selected.Preco.toString());
            }
        } else {
            setProdutoSelecionadoInfo(null);
            // Se des-selecionar, não limpa o preço automaticamente,
            // o usuário pode ter digitado um valor customizado.
            // Poderia limpar se quisesse: setCurrentPrecoUnitario('');
        }
    }, [currentProductId, produtosDisponiveis, currentPrecoUnitario]); // Dependência em currentPrecoUnitario para não sobrescrever

    // Limpa mensagens após um tempo
    useEffect(() => {
        if (mensagem) {
            const timer = setTimeout(() => setMensagem(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [mensagem]);
     useEffect(() => {
        if (erro) {
            const timer = setTimeout(() => setErro(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [erro]);

    // Handler para adicionar item à lista
    const handleAddItem = () => {
        setErro(''); // Limpa erro antes de tentar adicionar

        // Validações do item atual
        if (!currentProductId) { setErro('Selecione um produto.'); return; }
        const qtd = parseInt(currentQuantidade, 10);
        const precoUnit = parseFloat(currentPrecoUnitario);

        if (isNaN(qtd) || qtd <= 0) { setErro('Quantidade inválida.'); return; }
        if (isNaN(precoUnit) || precoUnit < 0) { setErro('Preço unitário inválido.'); return; }
        if (!produtoSelecionadoInfo) { setErro('Produto selecionado inválido.'); return; } // Segurança
        if (produtoSelecionadoInfo.QuantidadeEstoque < qtd) { setErro(`Estoque insuficiente para ${produtoSelecionadoInfo.NomeProduto} (Disponível: ${produtoSelecionadoInfo.QuantidadeEstoque}).`); return; }

        // Verifica se o produto já está na lista
        const existingItemIndex = items.findIndex(item => item.id_produto === produtoSelecionadoInfo.id_produto);

        if (existingItemIndex > -1) {
            // OPÇÃO 1: Atualizar quantidade (comentado por enquanto)
            // const updatedItems = [...items];
            // const newQtd = updatedItems[existingItemIndex].quantidade + qtd;
            // if (produtoSelecionadoInfo.QuantidadeEstoque < newQtd) {
            //     setErro(`Estoque insuficiente para ${produtoSelecionadoInfo.NomeProduto} ao adicionar mais (Total solicitado: ${newQtd}, Disponível: ${produtoSelecionadoInfo.QuantidadeEstoque}).`);
            //     return;
            // }
            // updatedItems[existingItemIndex].quantidade = newQtd;
            // updatedItems[existingItemIndex].preco_total = newQtd * updatedItems[existingItemIndex].preco_unitario; // Recalcula total do item
            // setItems(updatedItems);

            // OPÇÃO 2: Mostrar erro e não adicionar/atualizar
             setErro(`${produtoSelecionadoInfo.NomeProduto} já foi adicionado. Remova-o para alterar a quantidade ou preço.`);
             return;
        }

        // Adiciona novo item à lista
        setItems(prevItems => [
            ...prevItems,
            {
                id_produto: produtoSelecionadoInfo.id_produto,
                NomeProduto: produtoSelecionadoInfo.NomeProduto, // Guarda nome para exibição
                CodigoFabricante: produtoSelecionadoInfo.CodigoFabricante, // Guarda código para exibição
                quantidade: qtd,
                preco_unitario: precoUnit,
                preco_total: qtd * precoUnit,
            }
        ]);

        // Limpa campos do item atual
        setCurrentProductId('');
        setCurrentQuantidade('');
        setCurrentPrecoUnitario('');
        setProdutoSelecionadoInfo(null);
        setMensagem(`${produtoSelecionadoInfo.NomeProduto} adicionado.`);
    };

    // Handler para remover item da lista
    const handleRemoveItem = (productIdToRemove) => {
        setItems(prevItems => prevItems.filter(item => item.id_produto !== productIdToRemove));
        setMensagem(`Item removido.`);
    };

    // Calcula o valor total da venda
    const valorTotalVenda = useMemo(() => {
        return items.reduce((total, item) => total + item.preco_total, 0);
    }, [items]);

    // Handler para submeter a venda completa
    const handleSubmitVenda = async () => {
        setErro('');
        setMensagem('');

        if (!user || !user.id_usuario) { setErro("Usuário não logado."); return; }
        if (items.length === 0) { setErro("Adicione pelo menos um item à venda."); return; }

        setLoadingSubmit(true);

        const vendaPayload = {
            // Informações gerais
            nome_cliente: nomeCliente.trim() || null,
            numero_recibo: numeroRecibo.trim() || null,
            observacoes: observacoes.trim() || null,
            idUsuarioLogado: user.id_usuario,
            // Array de itens
            items: items.map(item => ({ // Envia apenas os dados necessários para a API
                id_produto: item.id_produto,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario
            }))
        };

        try {
            console.log("Enviando payload da venda:", vendaPayload);
            const result = await window.api.addVenda(vendaPayload);
            setMensagem(result.message || "Venda registrada com sucesso!");

            // Limpa tudo após sucesso
            setItems([]);
            setNomeCliente('');
            setNumeroRecibo('');
            setObservacoes('');
            setCurrentProductId('');
            setCurrentQuantidade('');
            setCurrentPrecoUnitario('');
            setProdutoSelecionadoInfo(null);

            if (onSaveSuccess) { // Chama callback se estiver em modal
                onSaveSuccess();
            }
        } catch (err) {
            console.error("Erro ao registrar venda:", err);
            setErro(`Erro ao registrar venda: ${err.message || err}`);
        } finally {
            setLoadingSubmit(false);
        }
    };


    // ----- JSX -----
    return (
        <div className={`container mx-auto ${isModal ? 'p-0' : 'p-4'} dark:text-gray-100`}>
             {/* Título (ajustado para nova lógica) */}
            <h1 className={`text-2xl font-semibold ${isModal ? 'mb-4' : 'mb-6'} text-gray-800 dark:text-gray-100`}>
                Registrar Nova Venda
            </h1>

            {/* Mensagens */}
            {mensagem && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{mensagem}</div>}
            {erro && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{erro}</div>}

             {/* Seção para adicionar itens */}
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                 <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Adicionar Item</h2>
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                     {/* Produto Select */}
                     <div className="md:col-span-5">
                         <label htmlFor="currentProductId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto*</label>
                         <select
                            id="currentProductId"
                            value={currentProductId}
                            onChange={(e) => setCurrentProductId(e.target.value)}
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            disabled={loadingProdutos}
                        >
                            <option value="">{loadingProdutos ? 'Carregando...' : 'Selecione...'}</option>
                            {produtosDisponiveis
                                .filter(p => p.QuantidadeEstoque > 0 || p.id_produto === parseInt(currentProductId, 10)) // Filtra sem estoque, exceto o selecionado
                                .map((produto) => (
                                    <option key={produto.id_produto} value={produto.id_produto}>
                                        {produto.NomeProduto} ({produto.CodigoFabricante || 'N/A'}) - Est: {produto.QuantidadeEstoque}
                                    </option>
                                ))}
                        </select>
                         {produtoSelecionadoInfo && produtoSelecionadoInfo.QuantidadeEstoque <= 0 && (
                            <p className="text-xs text-red-500 mt-1">Produto sem estoque!</p>
                         )}
                     </div>
                     {/* Quantidade Input */}
                    <div className="md:col-span-2">
                         <label htmlFor="currentQuantidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qtd*</label>
                         <input
                            type="number"
                            id="currentQuantidade"
                            min="1"
                            max={produtoSelecionadoInfo?.QuantidadeEstoque}
                            step="1"
                            value={currentQuantidade}
                            onChange={(e) => setCurrentQuantidade(e.target.value)}
                            placeholder="0"
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            disabled={!produtoSelecionadoInfo || produtoSelecionadoInfo.QuantidadeEstoque <= 0}
                        />
                    </div>
                     {/* Preço Unitário Input */}
                     <div className="md:col-span-3">
                         <label htmlFor="currentPrecoUnitario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Unit*</label>
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">R$</span>
                            <input
                                type="number"
                                id="currentPrecoUnitario"
                                step="0.01"
                                min="0"
                                value={currentPrecoUnitario}
                                onChange={(e) => setCurrentPrecoUnitario(e.target.value)}
                                placeholder="0.00"
                                className="shadow-sm pl-9 appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                disabled={!produtoSelecionadoInfo}
                            />
                         </div>
                         {produtoSelecionadoInfo && (
                             <p className="text-xs text-gray-500 mt-1">Preço Sugerido: {formatCurrency(produtoSelecionadoInfo.Preco)}</p>
                         )}
                     </div>
                     {/* Botão Adicionar */}
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-transparent mb-1 select-none">Ação</label> {/* Label invisível para alinhar */}
                         <button
                             type="button"
                             onClick={handleAddItem}
                             className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                             disabled={!currentProductId || !currentQuantidade || !currentPrecoUnitario || (produtoSelecionadoInfo && produtoSelecionadoInfo.QuantidadeEstoque <= 0)}
                         >
                             <Plus size={18} className="mr-1" /> Adicionar
                         </button>
                     </div>
                 </div>
            </div>

             {/* Tabela de Itens Adicionados */}
             {items.length > 0 && (
                 <div className="mb-6">
                    <h2 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Itens da Venda</h2>
                     <div className="shadow border-b border-gray-200 dark:border-gray-700 sm:rounded-lg overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                 <tr>
                                     <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produto</th>
                                     <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Qtd</th>
                                     <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço Unit.</th>
                                     <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Item</th>
                                     <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ação</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {items.map((item) => (
                                    <tr key={item.id_produto}>
                                         <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {item.NomeProduto} <span className="text-xs text-gray-500">({item.CodigoFabricante || 'N/A'})</span>
                                        </td>
                                         <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100">{item.quantidade}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">{formatCurrency(item.preco_unitario)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-right text-gray-900 dark:text-gray-100">{formatCurrency(item.preco_total)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id_produto)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                title="Remover Item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                         </table>
                     </div>
                     {/* Total da Venda */}
                     <div className="mt-4 text-right">
                         <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                             Valor Total da Venda: {formatCurrency(valorTotalVenda)}
                         </p>
                     </div>
                 </div>
             )}

            {/* Seção de Informações Gerais da Venda */}
             <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                 <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Informações da Venda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nomeCliente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cliente:</label>
                        <input
                            type="text"
                            id="nomeCliente"
                            value={nomeCliente}
                            onChange={(e) => setNomeCliente(e.target.value)}
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="numeroRecibo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número Recibo/NF:</label>
                        <input
                            type="text"
                            id="numeroRecibo"
                            value={numeroRecibo}
                            onChange={(e) => setNumeroRecibo(e.target.value)}
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="md:col-span-2">
                         <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações Gerais:</label>
                        <textarea
                            id="observacoes"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows="2"
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
             </div>

            {/* Botão Finalizar Venda */}
             <div className="flex justify-end">
                 <button
                    type="button"
                    onClick={handleSubmitVenda}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={items.length === 0 || loadingSubmit}
                >
                    {loadingSubmit ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">...</svg> // Ícone loading
                    ) : (
                         <ShoppingCart size={20} className="mr-2" />
                    )}
                    {loadingSubmit ? 'Registrando...' : 'Finalizar Venda'}
                </button>
             </div>

        </div>
    );
};

export default VendasPage;

// --- END OF FILE VendasPage.jsx ---