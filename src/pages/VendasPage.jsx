// --- START OF FILE VendasPage.jsx (MODIFICADO) ---

// src/pages/VendasPage.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeftCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Adicionada a prop onSaveSuccess
const VendasPage = ({ onSaveSuccess, isModal = false }) => {
    const [productId, setProductId] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [precoUnitario, setPrecoUnitario] = useState('');
    const [numeroRecibo, setNumeroRecibo] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [nomeCliente, setNomeCliente] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [produtos, setProdutos] = useState([]);
    const [loadingProdutos, setLoadingProdutos] = useState(true); // Estado de loading
    const [produtoSelecionado, setProdutoSelecionado] = useState(null); // Para mostrar estoque e preço sugerido

     useEffect(() => {
        const fetchProdutos = async () => {
            setLoadingProdutos(true);
            setErro('');
            try {
                // Busca apenas produtos ativos para o select de venda
                const produtosData = await window.api.getProducts(null, false);
                setProdutos(produtosData || []);
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
                setErro("Erro ao buscar produtos para popular a lista.");
            } finally {
                setLoadingProdutos(false);
            }
        };

        fetchProdutos();
    }, []);

     // Atualiza produtoSelecionado quando productId muda
     useEffect(() => {
        if (productId) {
            const selected = produtos.find(p => p.id_produto === parseInt(productId, 10));
            setProdutoSelecionado(selected);
            // Sugere o preço de venda cadastrado no produto, se existir e for maior que zero
            if (selected && selected.Preco > 0 && !precoUnitario) { // Só preenche se o campo estiver vazio
                 setPrecoUnitario(selected.Preco.toString());
             }
        } else {
            setProdutoSelecionado(null);
        }
    }, [productId, produtos, precoUnitario]); // Adiciona precoUnitario para não sobrescrever se já digitado


    const handleVenda = async (e) => {
         e.preventDefault(); // Previne submit padrão se estiver em um form
        setMensagem('');
        setErro('');

        if (!productId || !quantidade || !precoUnitario) {
            setErro("Produto, Quantidade e Preço Unitário são obrigatórios.");
            return;
        }
         const qtd = parseInt(quantidade, 10);
        const preco = parseFloat(precoUnitario);

        if (isNaN(qtd) || qtd <= 0) {
            setErro("Quantidade inválida. Deve ser um número maior que zero.");
            return;
        }
         if (isNaN(preco) || preco < 0) {
            setErro("Preço Unitário inválido. Deve ser um número positivo ou zero.");
            return;
        }

        // Validação de estoque antes de chamar a API (embora a API também valide)
        if (produtoSelecionado && produtoSelecionado.QuantidadeEstoque < qtd) {
             setErro(`Estoque insuficiente para '${produtoSelecionado.NomeProduto}'. Disponível: ${produtoSelecionado.QuantidadeEstoque}.`);
             return;
         }


        try {
            const vendaData = {
                id_produto: parseInt(productId, 10),
                quantidade: qtd,
                preco_unitario: preco,
                numero_recibo: numeroRecibo.trim() || null,
                observacoes: observacoes.trim() || null,
                nome_cliente: nomeCliente.trim() || null
            };

            await window.api.addVenda(vendaData);
            setMensagem("Venda registrada com sucesso!");
            // Limpar os campos após o sucesso
            setProductId('');
            setQuantidade('');
            setPrecoUnitario('');
            setNumeroRecibo('');
            setObservacoes('');
            setNomeCliente('');
            setProdutoSelecionado(null); // Limpa seleção

            // Chama a função de callback se ela foi passada
            if (onSaveSuccess) {
                onSaveSuccess();
            }
        } catch (err) {
            console.error("Erro ao registrar venda:", err);
            setErro(`Erro ao registrar venda: ${err.message || err}`);
        }
    };

     // Esconde o botão voltar se estiver dentro de um modal
    const showBackButton = !isModal;

    return (
        // Ajusta padding se estiver em modal
        <div className={`container mx-auto ${isModal ? 'p-0' : 'p-4'} dark:text-gray-100`}>
             {showBackButton && (
                <Link to="/" className="inline-flex items-center mb-4 text-blue-500 hover:text-blue-700">
                    <ArrowLeftCircle className="mr-2 w-5 h-5" /> Voltar
                </Link>
             )}
            {/* Ajusta margem do título se estiver em modal */}
            <h1 className={`text-2xl font-semibold ${isModal ? 'mb-4' : 'mb-6'} text-gray-800 dark:text-gray-100`}>
                Registrar Venda
            </h1>

            {mensagem && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{mensagem}</div>}
            {erro && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{erro}</div>}

             <form onSubmit={handleVenda}> {/* Adicionado form */}
                <div className="mb-4">
                    <label htmlFor="productId" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Produto:*
                    </label>
                     <select
                        id="productId"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        disabled={loadingProdutos}
                    >
                        <option value="">{loadingProdutos ? 'Carregando...' : 'Selecione um produto'}</option>
                        {produtos.map((produto) => (
                             // Mostra apenas produtos com estoque > 0 ou o selecionado (caso estoque tenha zerado após selecionar)
                             (produto.QuantidadeEstoque > 0 || produto.id_produto === parseInt(productId, 10)) && (
                                <option key={produto.id_produto} value={produto.id_produto}>
                                    {produto.NomeProduto} ({produto.CodigoFabricante || 'N/A'}) - Estoque: {produto.QuantidadeEstoque}
                                </option>
                             )
                        ))}
                    </select>
                    {loadingProdutos && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Carregando lista de produtos...</p>}
                    {produtoSelecionado && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Estoque atual: {produtoSelecionado.QuantidadeEstoque} | Preço Cadastrado: R$ {produtoSelecionado.Preco.toFixed(2)}
                        </p>
                    )}
                     {/* Aviso se o produto selecionado estiver sem estoque */}
                    {produtoSelecionado && produtoSelecionado.QuantidadeEstoque <= 0 && (
                         <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Atenção: Produto selecionado está sem estoque!
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="quantidade" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Quantidade:*
                        </label>
                        <input
                            type="number"
                            id="quantidade"
                            min="1"
                            // Define max baseado no estoque do produto selecionado
                            max={produtoSelecionado ? produtoSelecionado.QuantidadeEstoque : undefined}
                            step="1"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            required
                            disabled={!produtoSelecionado || produtoSelecionado.QuantidadeEstoque <= 0} // Desabilita se não houver produto ou estoque
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        />
                         {produtoSelecionado && quantidade > produtoSelecionado.QuantidadeEstoque && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">Quantidade maior que o estoque disponível!</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="precoUnitario" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Preço Unitário:*
                        </label>
                        <input
                            type="number"
                            id="precoUnitario"
                            step="0.01"
                            min="0"
                            value={precoUnitario}
                            onChange={(e) => setPrecoUnitario(e.target.value)}
                            required
                            disabled={!produtoSelecionado} // Desabilita se não houver produto selecionado
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                        <label htmlFor="numeroRecibo" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Número do Recibo:
                        </label>
                        <input
                            type="text"
                            id="numeroRecibo"
                            value={numeroRecibo}
                            onChange={(e) => setNumeroRecibo(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="nomeCliente" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Nome do Cliente:
                        </label>
                        <input
                            type="text"
                            id="nomeCliente"
                            value={nomeCliente}
                            onChange={(e) => setNomeCliente(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                 </div>

                <div className="mb-6">
                    <label htmlFor="observacoes" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Observações:
                    </label>
                    <textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows="3"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    // Desabilita se carregando produtos, sem produto selecionado, sem estoque ou quantidade maior que estoque
                    disabled={loadingProdutos || !produtoSelecionado || produtoSelecionado.QuantidadeEstoque <= 0 || (quantidade > produtoSelecionado?.QuantidadeEstoque) }
                >
                    Registrar Venda
                </button>
            </form> {/* Fim do form */}
        </div>
    );
};

export default VendasPage;
// --- END OF FILE VendasPage.jsx ---