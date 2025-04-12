// src/pages/Products/CreateProductModal.jsx (MODIFICADO)
import React, { useState, useEffect, useCallback } from 'react';
import { X, ImagePlus, Trash2, UploadCloud, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import path from 'path'; // Precisamos do path para pegar o nome do arquivo

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
    const [loading, setLoading] = useState(false);
    // *** Estados para Fotos ***
    // const [selectedPhotoPaths, setSelectedPhotoPaths] = useState([]); // Guarda os caminhos originais
    const [selectedPhotoFiles, setSelectedPhotoFiles] = useState([]); // Guarda { path: string, previewUrl: string }
    const [photoError, setPhotoError] = useState('');
    const [photoUploadProgress, setPhotoUploadProgress] = useState(null); // Ex: { current: 1, total: 3 }
    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            //setSelectedPhotoPaths([]); // Limpa fotos selecionadas
            // Limpa URLs de preview antigas para liberar memória
            selectedPhotoFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
            setSelectedPhotoFiles([]); // Limpa fotos
            setFormErrors({});
            setPhotoError('');
            setPhotoUploadProgress(null);
            setLoading(false);
        } else {
            // Limpa URLs ao fechar também (boa prática)
            selectedPhotoFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
        }
    }, [isOpen]);
    // Limpeza ao desmontar
    useEffect(() => {
        return () => {
            selectedPhotoFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
        };
    }, [selectedPhotoFiles]); // Limpa quando a lista de arquivos muda (remove um) ou desmonta
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
        // Limpa erros ao digitar
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
        if (formErrors.submit) setFormErrors(prev => ({ ...prev, submit: null }));
    };
    // Validação do formulário (sem fotos por enquanto)
    const validateForm = () => {
        const errors = {};
        // if (!formData.CodigoFabricante) errors.CodigoFabricante = 'Código Fabricante é obrigatório.'; // Removido como obrigatório
        if (!formData.NomeProduto) errors.NomeProduto = 'Nome Produto é obrigatório.';
        if (formData.EstoqueMinimo < 0) errors.EstoqueMinimo = 'Estoque mínimo não pode ser negativo.';
        if (formData.Preco < 0) errors.Preco = 'Preço não pode ser negativo.';
        if (formData.QuantidadeEstoque < 0) errors.QuantidadeEstoque = 'Estoque inicial não pode ser negativo.';
        return errors;
    };
    // --- Handlers para Fotos ---
    const handleSelectPhotos = async () => {
        setPhotoError('');
        /*try {
            const filePaths = await window.api.selectImageFiles();
            if (filePaths && filePaths.length > 0) {
                // Adiciona apenas os novos caminhos, evitando duplicatas
                setSelectedPhotoPaths(prevPaths => {
                    const newPaths = filePaths.filter(p => !prevPaths.includes(p));
                    return [...prevPaths, ...newPaths];
                });
            }
        } catch (err) {
            console.error("Erro ao selecionar fotos:", err);
            setPhotoError("Falha ao selecionar fotos.");
        }*/
        try {
            const filePaths = await window.api.selectImageFiles();
            if (filePaths && filePaths.length > 0) {
                const newFiles = await Promise.all(filePaths.map(async (filePath) => {
                    // Verifica se já não foi selecionado pelo caminho
                    if (selectedPhotoFiles.some(f => f.path === filePath)) {
                        return null; // Ignora duplicatas
                    }
                    try {
                        // Cria um objeto Blob ou File para gerar a URL de preview
                        // Ler o arquivo pode ser necessário se o acesso direto falhar
                        const response = await fetch(`file://${filePath}`); // Tenta ler via file://
                        if (!response.ok) throw new Error('Network response was not ok');
                        const blob = await response.blob();
                        const previewUrl = URL.createObjectURL(blob);
                        return { path: filePath, previewUrl: previewUrl };
                    } catch (fetchErr) {
                         console.error(`Erro ao criar preview para ${filePath}:`, fetchErr);
                         // Como fallback, pode tentar apenas guardar o path sem preview
                         return { path: filePath, previewUrl: null }; // Guarda o path, mas sem preview
                    }
                }));
                // Filtra nulos (duplicatas ou erros de preview) e adiciona ao estado
                setSelectedPhotoFiles(prevFiles => [...prevFiles, ...newFiles.filter(f => f !== null)]);
            }
        } catch (err) {
            console.error("Erro ao selecionar ou processar fotos:", err);
            setPhotoError("Falha ao selecionar ou criar preview das fotos.");
        }
    };
    /*const handleRemovePhoto = (pathToRemove) => {
        setSelectedPhotoPaths(prevPaths => prevPaths.filter(p => p !== pathToRemove));
    };*/
    const handleRemovePhoto = (pathToRemove) => {
        setSelectedPhotoFiles(prevFiles => {
           const fileToRemove = prevFiles.find(f => f.path === pathToRemove);
           if (fileToRemove?.previewUrl) {
               URL.revokeObjectURL(fileToRemove.previewUrl); // Libera memória da URL de preview
           }
           return prevFiles.filter(f => f.path !== pathToRemove);
       });
    };
    // --- Handler de Submissão Principal ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);
        setPhotoError('');
        setPhotoUploadProgress(null);
        if (Object.keys(errors).length > 0) {
            return; // Para se houver erros nos campos do produto
        }
        setLoading(true); // Inicia loading geral
        let newProductId = null;
        try {
            // 1. Cria o produto primeiro para obter o ID
            console.log("Criando produto com dados:", formData);
            const productResult = await onCreate(formData); // Chama a prop onCreate passada
            newProductId = productResult?.id; // Assume que onCreate retorna { id: ..., message: ... }
            if (!newProductId) {
                // Se onCreate não retornou um ID válido
                throw new Error("Falha ao obter o ID do novo produto criado.");
            }
            console.log(`Produto criado com ID: ${newProductId}`);
            // 2. Se houver fotos selecionadas, faz upload delas associando ao newProductId
            /*if (selectedPhotoPaths.length > 0) {
                console.log(`Iniciando upload de ${selectedPhotoPaths.length} fotos para o produto ${newProductId}`);
                setPhotoUploadProgress({ current: 0, total: selectedPhotoPaths.length });
                for (let i = 0; i < selectedPhotoPaths.length; i++) {
                    const photoPath = selectedPhotoPaths[i];
                    setPhotoUploadProgress({ current: i + 1, total: selectedPhotoPaths.length });
                    console.log(` > Uploading foto ${i + 1}/${selectedPhotoPaths.length}: ${photoPath}`);
                    try {
                        await window.api.addPhotoToProduct(newProductId, photoPath);
                        console.log(`   >> Foto ${photoPath} adicionada com sucesso.`);
                    } catch (uploadErr) {
                        console.error(`Erro ao adicionar foto ${photoPath} para produto ${newProductId}:`, uploadErr);
                        // Acumula o erro, mas continua tentando as outras fotos
                        setPhotoError(prev => prev ? `${prev}; Falha em ${path.basename(photoPath)}` : `Falha em ${path.basename(photoPath)}`);
                        // Poderia optar por parar aqui: throw new Error(`Falha ao adicionar foto ${path.basename(photoPath)}.`);
                    }
                }
                setPhotoUploadProgress(null); // Limpa progresso
                console.log("Upload de fotos concluído.");
            }*/
            // 2. Faz upload das fotos selecionadas (usando os caminhos originais)
            if (selectedPhotoFiles.length > 0) {
                setPhotoUploadProgress({ current: 0, total: selectedPhotoFiles.length });
                for (let i = 0; i < selectedPhotoFiles.length; i++) {
                    const photoFile = selectedPhotoFiles[i];
                    setPhotoUploadProgress({ current: i + 1, total: selectedPhotoFiles.length });
                    try {
                        // Passa o CAMINHO ORIGINAL para a API de adicionar foto
                        await window.api.addPhotoToProduct(newProductId, photoFile.path);
                    } catch (uploadErr) {
                        console.error(`Erro ao adicionar foto ${photoFile.path}:`, uploadErr);
                        setPhotoError(prev => prev ? `${prev}; Falha em ${path.basename(photoFile.path)}` : `Falha em ${path.basename(photoFile.path)}`);
                    }
                }
                setPhotoUploadProgress(null);
            }
            // 3. Fecha o modal se tudo (produto + fotos) correu bem (ou parcialmente bem para fotos)
            onClose();
            // A mensagem de sucesso da criação do produto já foi mostrada pela `ProductsPage`
            // Poderia adicionar uma mensagem específica se houve erros de foto aqui
        } catch (err) {
            console.error("Erro no processo de criação (produto ou fotos):", err);
            setFormErrors({ submit: err.message || 'Erro ao criar o produto ou adicionar fotos.' });
            setLoading(false); // Para loading geral
            setPhotoUploadProgress(null); // Limpa progresso em caso de erro geral
        }
        // Não precisa de finally para setLoading(false) aqui, pois é feito no catch ou após onClose
    };
    if (!isOpen) return null;
    const labelCssStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const inputCssStyles = "shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
    const checkboxLabelCss = "flex items-center text-sm text-gray-700 dark:text-gray-300";
    const checkboxCss = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
    const errorCss = "text-red-500 text-sm mt-1";
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl max-h-full"> {/* Aumentado max-w */}
                {/* Modal content */}
                <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                    {/* Modal header */}
                    <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Adicionar Novo Produto
                        </h3>
                        <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
                            <X className="w-5 h-5" />
                            <span className="sr-only">Fechar modal</span>
                        </button>
                    </div>
                    {/* Body com Scroll */}
                    <div className="p-6 max-h-[75vh] overflow-y-auto">
                        {/* Modal body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="CodigoFabricante" className={labelCssStyles}>Código Fabricante</label>
                                    <input type="text" name="CodigoFabricante" placeholder="Código do Fabricante" onChange={handleChange} value={formData.CodigoFabricante} className={inputCssStyles} />
                                    {/*formErrors.CodigoFabricante && <p className={errorCss}>{formErrors.CodigoFabricante}</p>*/}
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
                            {/* --- Seção de Fotos --- */}
                            <div className="pt-4 border-t dark:border-gray-600">
                                <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-100">Fotos do Produto (Opcional)</h4>
                                {photoError && <p className={`${errorCss} mb-2`}><AlertCircle size={14} className="inline mr-1"/> {photoError}</p>}
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={handleSelectPhotos}
                                        disabled={loading} // Desabilita durante o submit geral
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        <ImagePlus className="mr-2 h-5 w-5" />
                                        Selecionar Fotos
                                    </button>
                                </div>
                                {/* Exibição das Miniaturas das Fotos Selecionadas */}
                                {/*{selectedPhotoPaths.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                        {selectedPhotoPaths.map((photoPath) => (
                                            <div key={photoPath} className="relative group border rounded-md overflow-hidden dark:border-gray-600 aspect-square"> {/* Aspect ratio 1:1 */}
                                                {/* Usa URL.createObjectURL para preview local sem precisar do base path */}
                                                {/* NOTA: Isso requer que a imagem ainda exista no caminho original! */}
                                                {/* Uma alternativa seria ler o arquivo e mostrar como base64, mas é mais pesado */}
                                                {/* Para Electron, usar o caminho diretamente pode funcionar se tiver acesso */}
                                                {/*<img
                                                    src={`file://${photoPath.replace(/\\/g, '/')}`} // Tenta carregar direto do caminho original
                                                    alt={`Preview ${path.basename(photoPath)}`}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }
                                                />
                                                {/* Ícone placeholder caso a imagem não carregue */}
                                                {/*<div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 -z-10">
                                                    <UploadCloud size={24} className="text-gray-400" />
                                                </div>
                                                {/* Botão de Remover (visível no hover) */}
                                                {/*<button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto(photoPath)}
                                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                                                    title="Remover Seleção"
                                                    disabled={loading} // Desabilita durante o submit
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}*/}
                                {selectedPhotoFiles.length > 0 && (
                                    <div className="grid grid-cols-3 ... gap-3">
                                        {selectedPhotoFiles.map((photoFile) => (
                                            <div key={photoFile.path} className="relative group ... aspect-square">
                                                {/* *** USA A URL DE PREVIEW GERADA *** */}
                                                {photoFile.previewUrl ? (
                                                    <img
                                                        src={photoFile.previewUrl}
                                                        alt={`Preview ${path.basename(photoFile.path)}`}
                                                        className="h-full w-full object-cover"
                                                        // Não precisa de onError complexo aqui, pois é local
                                                    />
                                                ) : (
                                                    // Mostra se a geração do preview falhou
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                                                        <AlertCircle size={24} className="text-red-500" title="Erro no preview"/>
                                                    </div>
                                                )}
                                                {/* Botão de Remover */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto(photoFile.path)}
                                                    className="absolute top-1 right-1 p-1 ..."
                                                    title="Remover Seleção"
                                                    disabled={loading}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/*{selectedPhotoPaths.length === 0 && !loading && (*/}
                                {selectedPhotoFiles.length === 0 === 0 && !loading && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma foto selecionada.</p>
                                )}
                                {/* Indicador de Progresso de Upload */}
                                {photoUploadProgress && (
                                    <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
                                        <RotateCw className="inline animate-spin mr-1" size={14}/>
                                        Adicionando foto {photoUploadProgress.current} de {photoUploadProgress.total}...
                                    </div>
                                )}
                            </div>
                            {/* --- Fim da Seção de Fotos --- */}
                            {/* Erro Geral de Submit */}
                            {formErrors.submit && <p className={errorCss}>{formErrors.submit}</p>}
                            {/* Modal footer */}
                            <div className="flex items-center justify-end pt-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                                <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mx-5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Cancelar</button>
                                <button type="submit" disabled={loading} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                    {loading ? 'Criando...' : 'Criar Produto'}
                                </button>
                            </div>
                        </form>
                    </div> {/* Fim do Body com Scroll */}
                </div>
            </div>
        </div>
    );
};

CreateProductModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired, // Função que cria o produto e retorna { id: ..., message: ... }
};

export default CreateProductModal;