// --- START OF FILE ComprasPage.jsx (MODIFICADO) ---

// src/pages/ComprasPage.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeftCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Adicionada a prop onSaveSuccess
const ComprasPage = ({ onSaveSuccess, isModal = false }) => {
    const [productId, setProductId] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [precoUnitario, setPrecoUnitario] = useState('');
    const [numeroNotaFiscal, setNumeroNotaFiscal] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [nomeFornecedor, setNomeFornecedor] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [produtos, setProdutos] = useState([]);
    const [loadingProdutos, setLoadingProdutos] = useState(true); // Estado de loading

    useEffect(() => {
        const fetchProdutos = async () => {
            setLoadingProdutos(true);
            setErro(''); // Limpa erro anterior
            try {
                // Busca apenas produtos ativos para o select
                const produtosData = await window.api.getProducts(null, false);
                setProdutos(produtosData || []); // Garante que seja um array
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
                setErro("Erro ao buscar produtos para popular a lista.");
            } finally {
                setLoadingProdutos(false);
            }
        };

        fetchProdutos();
    }, []);

    const handleCompra = async (e) => {
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


        try {
            const compraData = {
                id_produto: parseInt(productId, 10),
                quantidade: qtd,
                preco_unitario: preco,
                numero_nota_fiscal: numeroNotaFiscal.trim() || null, // Envia null se vazio
                observacoes: observacoes.trim() || null,
                nome_fornecedor: nomeFornecedor.trim() || null
            };

            await window.api.addCompra(compraData);
            setMensagem("Compra registrada com sucesso!");
            // Limpar os campos após o sucesso
            setProductId('');
            setQuantidade('');
            setPrecoUnitario('');
            setNumeroNotaFiscal('');
            setObservacoes('');
            setNomeFornecedor('');

            // Chama a função de callback se ela foi passada (para fechar modal/atualizar lista)
            if (onSaveSuccess) {
                onSaveSuccess();
            }

        } catch (err) {
            console.error("Erro ao registrar compra:", err);
            setErro(`Erro ao registrar compra: ${err.message || err}`);
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
                Registrar Compra
            </h1>

            {mensagem && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{mensagem}</div>}
            {erro && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{erro}</div>}

            <form onSubmit={handleCompra}> {/* Adicionado form para melhor acessibilidade e submit com Enter */}
                <div className="mb-4">
                    <label htmlFor="productId" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Produto:*
                    </label>
                    <select
                        id="productId"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        required // Marca como obrigatório no HTML
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        disabled={loadingProdutos}
                    >
                        <option value="">{loadingProdutos ? 'Carregando...' : 'Selecione um produto'}</option>
                        {produtos.map((produto) => (
                            <option key={produto.id_produto} value={produto.id_produto}>
                                {produto.NomeProduto} ({produto.CodigoFabricante || 'Sem Código Fab.'}) - Estoque: {produto.QuantidadeEstoque}
                            </option>
                        ))}
                    </select>
                     {loadingProdutos && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Carregando lista de produtos...</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="quantidade" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Quantidade:*
                        </label>
                        <input
                            type="number"
                            id="quantidade"
                            min="1" // Quantidade mínima
                            step="1" // Apenas inteiros
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="precoUnitario" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Preço Unitário:*
                        </label>
                        <input
                            type="number"
                            id="precoUnitario"
                            step="0.01"
                            min="0" // Preço não pode ser negativo
                            value={precoUnitario}
                            onChange={(e) => setPrecoUnitario(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="numeroNotaFiscal" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Número da Nota Fiscal:
                        </label>
                        <input
                            type="text"
                            id="numeroNotaFiscal"
                            value={numeroNotaFiscal}
                            onChange={(e) => setNumeroNotaFiscal(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="nomeFornecedor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Nome do Fornecedor:
                        </label>
                        <input
                            type="text"
                            id="nomeFornecedor"
                            value={nomeFornecedor}
                            onChange={(e) => setNomeFornecedor(e.target.value)}
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
                        rows="3" // Ajusta altura inicial
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <button
                    type="submit" // Tipo submit para o form
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    disabled={loadingProdutos} // Desabilita enquanto carrega produtos
                >
                    Registrar Compra
                </button>
             </form> {/* Fim do form */}
        </div>
    );
};

export default ComprasPage;
// --- END OF FILE ComprasPage.jsx ---