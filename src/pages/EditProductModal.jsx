// src/pages/EditProductModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const EditProductModal = ({ isOpen, onClose, onUpdate, productData }) => {
    // Se não houver dados do produto, não renderiza (ou mostra erro)
    if (!productData && isOpen) {
        console.error("EditProductModal: productData é necessário para edição.");
        return null; // Ou um estado de erro
    }
    const initialFormData = {
        CodigoFabricante: '',
        CodigoBarras: '',
        NomeProduto: '',
        Marca: '',
        Descricao: '',
        Aplicacao: '',
        // QuantidadeEstoque: 0, // NÃO editamos estoque diretamente aqui
        EstoqueMinimo: 1,
        Preco: 0.0,
        Localizacao: '',
        Ativo: true,
    };
    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    // Efeito para carregar os dados do produto quando o modal abre ou productData muda
    useEffect(() => {
        if (isOpen && productData) {
            setFormData({
                CodigoFabricante: productData.CodigoFabricante || '',
                // If the field name is different, use the correct one:
                CodigoBarras: productData.codigo_barras || productData.codigoBarras || productData.CodigoBarras || '',
                NomeProduto: productData.NomeProduto || '',
                Marca: productData.Marca || '',
                Descricao: productData.Descricao || '',
                Aplicacao: productData.Aplicacao || '',
                // QuantidadeEstoque: productData.QuantidadeEstoque || 0, // Apenas para exibição se necessário
                EstoqueMinimo: productData.EstoqueMinimo !== undefined ? productData.EstoqueMinimo : 1,
                Preco: productData.Preco !== undefined ? productData.Preco : 0.0,
                Localizacao: productData.Localizacao || '',
                Ativo: productData.Ativo !== undefined ? productData.Ativo : true,
            });
            setFormErrors({}); // Limpa erros ao carregar
            setLoading(false);
        } else if (!isOpen) {
            // Resetar form ao fechar pode ser útil se a mesma instância for reutilizada
            setFormData(initialFormData);
            setFormErrors({});
        }
    }, [isOpen, productData]); // Dependências: re-executa se o modal abrir/fechar ou os dados mudarem
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox'
                ? checked
                // Garante que números sejam tratados corretamente
                : (name === 'EstoqueMinimo')
                    ? parseInt(value, 10) || 0 // Garante inteiro
                : (name === 'Preco')
                    ? parseFloat(value) || 0.0 // Garante float
                : value,
        }));
        // Limpa erro do campo ao digitar
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
        // Limpa erro geral de submit
        if (formErrors.submit) {
            setFormErrors(prev => ({ ...prev, submit: null }));
        }
    };
    // Validação (similar à criação, mas pode ter regras diferentes se necessário)
    const validateForm = () => {
        const errors = {};
        // Uncomment this validation since the field is now editable
        if (!formData.CodigoFabricante) errors.CodigoFabricante = 'Código do Fabricante é obrigatório.';
        if (!formData.NomeProduto) errors.NomeProduto = 'Nome do Produto é obrigatório.';
        if (formData.EstoqueMinimo < 0) errors.EstoqueMinimo = 'Estoque mínimo não pode ser negativo.';
        if (formData.Preco < 0) errors.Preco = 'Preço não pode ser negativo.';
        // Adicione outras validações se necessário
        return errors;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            return; // Interrompe se houver erros de validação
        }
        setLoading(true);
        setFormErrors({}); // Limpa erros de submit
        // Prepara os dados para enviar - apenas os campos editáveis
        const dataToUpdate = {
            CodigoFabricante: formData.CodigoFabricante, // Mesmo sendo não editável visualmente, envie para consistência da API
            CodigoBarras: formData.CodigoBarras,
            NomeProduto: formData.NomeProduto,
            Marca: formData.Marca,
            Descricao: formData.Descricao,
            Aplicacao: formData.Aplicacao,
            EstoqueMinimo: formData.EstoqueMinimo,
            Preco: formData.Preco,
            Localizacao: formData.Localizacao,
            Ativo: formData.Ativo,
            // NÃO INCLUA QuantidadeEstoque
        };
        try {
            // Chama a função onUpdate passada pelo pai, com ID e dados
            await onUpdate(productData.id_produto, dataToUpdate);
            onClose(); // Fecha o modal em caso de sucesso
        } catch (err) {
            console.error("Erro ao atualizar produto:", err);
            setFormErrors({ submit: err.message || 'Ocorreu um erro ao salvar as alterações.' });
        } finally {
            setLoading(false);
        }
    };
    // Se o modal não está aberto, não renderiza nada
    if (!isOpen) return null;
    // Estilos (iguais aos do CreateProductModal)
    const labelCssStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const inputCssStyles = "shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
    const disabledInputCssStyles = `${inputCssStyles} bg-gray-200 dark:bg-gray-600 cursor-not-allowed`; // Estilo para campos desabilitados
    const errorCss = "text-red-500 text-xs mt-1";
    const checkboxLabelCss = "flex items-center text-sm text-gray-700 dark:text-gray-300";
    const checkboxCss = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-full">
                {/* Modal content */}
                <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                    {/* Modal header */}
                    <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Editar Produto (#{productData?.id_produto})
                        </h3>
                        <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose} disabled={loading}>
                            <X className="w-5 h-5" />
                            <span className="sr-only">Fechar modal</span>
                        </button>
                    </div>
                    {/* Modal body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Linha para Códigos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="CodigoFabricante" className={labelCssStyles}>Código Fabricante</label>
                                <input type="text" name="CodigoFabricante" value={formData.CodigoFabricante} onChange={handleChange} 
                                    className={inputCssStyles} required />
                                {formErrors.CodigoFabricante && <p className={errorCss}>{formErrors.CodigoFabricante}</p>}
                                {/* Removed the "Não editável" text and disabled attribute */}
                            </div>
                            <div>
                                <label htmlFor="CodigoBarras" className={labelCssStyles}>Código Barras</label>
                                <input type="text" name="CodigoBarras" placeholder="Código de Barras (EAN)" onChange={handleChange} value={formData.CodigoBarras} className={inputCssStyles} />
                                {formErrors.CodigoBarras && <p className={errorCss}>{formErrors.CodigoBarras}</p>}
                            </div>
                        </div>
                        {/* Linha para Nome e Marca */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="NomeProduto" className={labelCssStyles}>Nome Produto *</label>
                                <input type="text" name="NomeProduto" placeholder="Nome do Produto" onChange={handleChange} value={formData.NomeProduto} className={inputCssStyles} required />
                                {formErrors.NomeProduto && <p className={errorCss}>{formErrors.NomeProduto}</p>}
                            </div>
                            <div>
                                <label htmlFor="Marca" className={labelCssStyles}>Marca</label>
                                <input type="text" name="Marca" placeholder="Marca do Produto" onChange={handleChange} value={formData.Marca} className={inputCssStyles} />
                                {formErrors.Marca && <p className={errorCss}>{formErrors.Marca}</p>}
                            </div>
                        </div>
                        {/* Aplicação e Descrição */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="Aplicacao" className={labelCssStyles}>Aplicação</label>
                                <input type="text" name="Aplicacao" placeholder="Aplicação (ex: Motor AP 1.8)" onChange={handleChange} value={formData.Aplicacao} className={inputCssStyles} />
                                {formErrors.Aplicacao && <p className={errorCss}>{formErrors.Aplicacao}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="Descricao" className={labelCssStyles}>Descrição</label>
                                <textarea name="Descricao" rows="3" placeholder="Descrição detalhada do produto" onChange={handleChange} value={formData.Descricao} className={inputCssStyles} />
                                {formErrors.Descricao && <p className={errorCss}>{formErrors.Descricao}</p>}
                            </div>
                        </div>
                        {/* Estoque Mínimo, Preço, Localização */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="EstoqueMinimo" className={labelCssStyles}>Estoque Mínimo</label>
                                <input type="number" name="EstoqueMinimo" placeholder="1" min="0" step="1" onChange={handleChange} value={formData.EstoqueMinimo} className={inputCssStyles} />
                                {formErrors.EstoqueMinimo && <p className={errorCss}>{formErrors.EstoqueMinimo}</p>}
                            </div>
                            <div>
                                <label htmlFor="Preco" className={labelCssStyles}>Preço Venda (R$)</label>
                                <input type="number" name="Preco" placeholder="0.00" step="0.01" min="0" onChange={handleChange} value={formData.Preco} className={inputCssStyles} />
                                {formErrors.Preco && <p className={errorCss}>{formErrors.Preco}</p>}
                            </div>
                            <div>
                                <label htmlFor="Localizacao" className={labelCssStyles}>Localização</label>
                                <input type="text" name="Localizacao" placeholder="Prateleira A-1" onChange={handleChange} value={formData.Localizacao} className={inputCssStyles} />
                                {formErrors.Localizacao && <p className={errorCss}>{formErrors.Localizacao}</p>}
                            </div>
                        </div>
                        {/* Checkbox Ativo */}
                        <div className="flex items-center pt-2">
                            <input id="Ativo" type="checkbox" name="Ativo" checked={formData.Ativo} onChange={handleChange} className={checkboxCss} />
                            <label htmlFor="Ativo" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Manter produto ativo?</label>
                        </div>
                        {/* Erro Geral de Submit */}
                        {formErrors.submit && <p className={`${errorCss} text-center font-medium`}>{formErrors.submit}</p>}
                        {/* Modal footer */}
                        <div className="flex items-center justify-end pt-5 border-t border-gray-200 rounded-b dark:border-gray-600 space-x-2">
                            <button onClick={onClose} type="button" disabled={loading} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mx-2 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 disabled:opacity-50">Cancelar</button>
                            <button type="submit" disabled={loading} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50">
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

EditProductModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired, // Função que recebe (productId, dataToUpdate)
    productData: PropTypes.object, // Dados do produto para editar (pode ser null inicialmente)
};

export default EditProductModal;