// src/pages/EditProductModal.jsx (MODIFICADO)
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, ImagePlus, Trash2, GripVertical, UploadCloud } from 'lucide-react';

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
    const [productPhotos, setProductPhotos] = useState([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [photoError, setPhotoError] = useState('');
    // const [imageBasePath, setImageBasePath] = useState(''); // Para construir o src da imagem
    // Função para buscar o caminho base das imagens
    /*const fetchImageBasePath = useCallback(async () => {
        try {
            const path = await window.api.getProductImageBasePath();
            setImageBasePath(path); // Armazena o caminho base (ex: file:///path/to/userData/product_images/)
        } catch (err) {
            console.error("Erro ao buscar caminho base das imagens:", err);
            setPhotoError("Não foi possível carregar o caminho das imagens.");
        }
    }, []);*/
    // Função para buscar fotos do produto atual
    const fetchPhotos = useCallback(async (productId) => {
        if (!productId) return;
        setLoadingPhotos(true);
        setPhotoError('');
        try {
            const photos = await window.api.getPhotosForProduct(productId);
            setProductPhotos(photos || []);
        } catch (err) {
            console.error(`Erro ao buscar fotos para produto ${productId}:`, err);
            setPhotoError("Erro ao carregar fotos.");
            setProductPhotos([]);
        } finally {
            setLoadingPhotos(false);
        }
    }, []);
    // Efeito para carregar os dados do produto quando o modal abre ou productData muda
    useEffect(() => {
        // Efeito para buscar caminho base e fotos quando o modal abre ou productData muda
        if (isOpen && productData?.id_produto) {
            //fetchImageBasePath(); // Busca o caminho base
            fetchPhotos(productData.id_produto); // Busca as fotos
            // ... (lógica existente para carregar formData) ...
        } else {
            setProductPhotos([]); // Limpa fotos ao fechar/sem produto
            //setImageBasePath('');
            setPhotoError('');
        }
        // ... (lógica existente para carregar/resetar formData) ...
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
    }, [isOpen, productData, fetchPhotos]); // Dependências: re-executa se o modal abrir/fechar ou os dados mudarem fetchImageBasePath
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
    // --- Handlers para Fotos ---
    const handleSelectPhotos = async () => {
        if (!productData?.id_produto) return;
        setPhotoError('');
        try {
            const selectedFiles = await window.api.selectImageFiles();
            if (selectedFiles && selectedFiles.length > 0) {
                setLoadingPhotos(true); // Mostra loading durante upload
                // Faz upload de cada foto selecionada
                for (const filePath of selectedFiles) {
                    try {
                        // Adiciona a foto (backend copia e insere no DB)
                        await window.api.addPhotoToProduct(productData.id_produto, filePath);
                    } catch (uploadErr) {
                        console.error(`Erro ao adicionar foto ${filePath}:`, uploadErr);
                        setPhotoError(`Erro ao adicionar ${path.basename(filePath)}: ${uploadErr.message}`);
                        // Continua tentando as outras fotos
                    }
                }
                // Após tentar todas, recarrega a lista de fotos
                fetchPhotos(productData.id_produto);
            }
        } catch (err) {
            console.error("Erro ao selecionar fotos:", err);
            setPhotoError("Falha ao abrir seleção de fotos.");
        } finally {
            // setLoadingPhotos(false); // fetchPhotos já faz isso
        }
    };
    const handleDeletePhoto = async (photoId) => {
        if (!productData?.id_produto) return;
        // Confirmação (opcional mas recomendado)
        if (!window.confirm("Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.")) {
            return;
        }
        setPhotoError('');
        setLoadingPhotos(true); // Indica atividade
        try {
            await window.api.deletePhoto(photoId);
            // Remove a foto do estado local imediatamente para feedback rápido
            setProductPhotos(prev => prev.filter(p => p.id_foto !== photoId));
            // fetchPhotos(productData.id_produto); // Recarrega para garantir consistência (opcional se o estado local for confiável)
        } catch (err) {
            console.error(`Erro ao deletar foto ${photoId}:`, err);
            setPhotoError(`Erro ao excluir foto: ${err.message}`);
        } finally {
             setLoadingPhotos(false);
        }
    };
    // (Opcional) Handler para reordenar fotos (requer biblioteca de drag-and-drop como react-beautiful-dnd)
    // const handleDragEnd = (result) => { ... };
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
            <div className="relative w-full max-w-3xl max-h-full">{/* Aumentado max-w */}
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
                    {/* Body com Scroll Interno */}
                    <div className="p-6 max-h-[75vh] overflow-y-auto"> {/* Scroll para conteúdo longo */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Linha para Códigos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="CodigoFabricante" className={labelCssStyles}>Código Fabricante</label>
                                    <input type="text" name="CodigoFabricante" value={formData.CodigoFabricante} onChange={handleChange} className={inputCssStyles} required />
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
                            {/* --- Seção de Fotos --- */}
                            <div className="pt-4 border-t dark:border-gray-600">
                                <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-100">Fotos do Produto</h4>
                                {photoError && <p className="text-red-500 text-sm mb-2">{photoError}</p>}
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={handleSelectPhotos}
                                        disabled={loadingPhotos || !productData?.id_produto}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        <ImagePlus className="mr-2 h-5 w-5" />
                                        Adicionar Fotos
                                    </button>
                                </div>
                                {loadingPhotos && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando/Processando fotos...</p>}
                                {!loadingPhotos && productPhotos.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma foto adicionada para este produto.</p>
                                )}
                                {/* Lista de Fotos Adicionadas */}
                                {/* {imageBasePath && productPhotos.length > 0 && ( */}
                                {productPhotos.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {productPhotos.map((photo) => (
                                            <div key={photo.id_foto} className="relative group border rounded-md overflow-hidden dark:border-gray-600">
                                                <img
                                                    // Constrói o src usando o caminho base e o nome do arquivo
                                                    //src={`${imageBasePath}/${photo.nome_arquivo_foto}`}
                                                    src={`safe-file://${photo.nome_arquivo_foto}`}
                                                    alt={photo.descricao_foto || `Foto ${photo.id_foto} do produto ${productData?.NomeProduto}`}
                                                    className="h-32 w-full object-cover" // Tamanho fixo
                                                    onError={(e) => { e.target.src = '/placeholder-image.png'; e.target.alt="Erro ao carregar imagem";}} // Placeholder se falhar
                                                />
                                                {/* Overlay com Ações (aparece no hover) */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                                                    {/* Botão de Excluir (visível no hover) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePhoto(photo.id_foto)}
                                                        className="p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                                        title="Excluir Foto"
                                                        disabled={loadingPhotos}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    {/* (Opcional) Botão para Reordenar */}
                                                    {/* <button type="button" className="p-1.5 bg-gray-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" title="Mover">
                                                        <GripVertical size={16} />
                                                    </button> */}
                                                </div>
                                                {/* (Opcional) Campo de Descrição */}
                                                {/* <input type="text" value={photo.descricao_foto || ''} placeholder="Descrição..." className="w-full text-xs p-1 border-t dark:bg-gray-700 dark:border-gray-600"/> */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* --- Fim da Seção de Fotos --- */}
                            {/* Erro Geral de Submit */}
                            {formErrors.submit && <p className={`${errorCss} text-center font-medium`}>{formErrors.submit}</p>}
                            {/* Modal footer com Botões Salvar/Cancelar*/}
                            <div className="flex items-center justify-end pt-5 border-t border-gray-200 rounded-b dark:border-gray-600 space-x-2">
                                <button onClick={onClose} type="button" disabled={loading} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mx-2 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 disabled:opacity-50">Cancelar</button>
                                <button type="submit" disabled={loading} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50">
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div> {/* Fim do Body com Scroll */}
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