// src/pages/Products/CreateProductModal.jsx
import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const CreateProductModal = ({ isOpen, onClose, onCreate }) => {
    const initialFormData = {
        CodigoFabricante: '',
        CodigoBarras: '',
        NomeProduto: '',
        Marca: '',
        Descricao: '',
        Aplicacao: '',
        QuantidadeEstoque: 0,
        EstoqueMinimo: 1,
        Preco: 0.0,
        Localizacao: '',
        Ativo: true,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setFormErrors({});
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox'
                ? checked
                : (type === 'number')
                    ? parseFloat(value) || 0
                    : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        if (!formData.CodigoFabricante) {
            errors.CodigoFabricante = 'Código do Fabricante é obrigatório.';
        }
        if (!formData.NomeProduto) {
            errors.NomeProduto = 'Nome do Produto é obrigatório.';
        }
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            await onCreate(formData);
            onClose();
        } catch (err) {
            console.error("Erro ao criar produto no modal:", err);
            setFormErrors({ submit: err.message || 'Erro ao criar o produto.' });
        }
    };

    if (!isOpen) return null;

    const labelCssStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const inputCssStyles = "shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
    const checkboxLabelCss = "flex items-center text-sm text-gray-700 dark:text-gray-300";
    const checkboxCss = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
    const errorCss = "text-red-500 text-sm mt-1";

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl max-h-full">
                {/* Modal content */}
                <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                    {/* Modal header */}
                    <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Adicionar Novo Produto
                        </h3>
                        <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
                            <X className="w-5 h-5" />
                            <span className="sr-only">Close modal</span>
                        </button>
                    </div>
                    {/* Modal body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="CodigoFabricante" className={labelCssStyles}>Código Fabricante *</label>
                                <input type="text" name="CodigoFabricante" placeholder="Código do Fabricante" onChange={handleChange} value={formData.CodigoFabricante} className={inputCssStyles} required />
                                {formErrors.CodigoFabricante && <p className={errorCss}>{formErrors.CodigoFabricante}</p>}
                            </div>
                            <div>
                                <label htmlFor="NomeProduto" className={labelCssStyles}>Nome Produto *</label>
                                <input type="text" name="NomeProduto" placeholder="Nome do Produto" onChange={handleChange} value={formData.NomeProduto} className={inputCssStyles} required />
                                {formErrors.NomeProduto && <p className={errorCss}>{formErrors.NomeProduto}</p>}
                            </div>
                            <div>
                                <label htmlFor="CodigoBarras" className={labelCssStyles}>Código Barras</label>
                                <input type="text" name="CodigoBarras" placeholder="Código de Barras (EAN)" onChange={handleChange} value={formData.CodigoBarras} className={inputCssStyles} />
                            </div>
                            <div>
                                <label htmlFor="Marca" className={labelCssStyles}>Marca</label>
                                <input type="text" name="Marca" placeholder="Marca do Produto" onChange={handleChange} value={formData.Marca} className={inputCssStyles} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="Aplicacao" className={labelCssStyles}>Aplicação</label>
                                <input type="text" name="Aplicacao" placeholder="Aplicação (ex: Motor AP 1.8)" onChange={handleChange} value={formData.Aplicacao} className={inputCssStyles} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="Descricao" className={labelCssStyles}>Descrição</label>
                                <textarea name="Descricao" rows="3" placeholder="Descrição do produto" onChange={handleChange} value={formData.Descricao} className={inputCssStyles} />
                            </div>
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
                            <div>
                                <label htmlFor="Localizacao" className={labelCssStyles}>Localização</label>
                                <input type="text" name="Localizacao" placeholder="Prateleira A, Corredor 3" onChange={handleChange} value={formData.Localizacao} className={inputCssStyles} />
                            </div>
                        </div>

                        <div className="flex items-center mb-4">
                            <input id="Ativo" type="checkbox" name="Ativo" checked={formData.Ativo} onChange={handleChange} className={checkboxCss} />
                            <label htmlFor="Ativo" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Manter produto ativo?</label>
                        </div>

                        {formErrors.submit && <p className={errorCss}>{formErrors.submit}</p>}

                        {/* Modal footer */}
                        <div className="flex items-center justify-end pt-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                            <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mx-5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Cancelar</button>
                            <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Criar Produto
                            </button>
                        </div>
                    </form>
                </div>
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