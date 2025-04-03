// src/pages/UserModal.jsx (ou src/components/users/UserModal.jsx)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSave, userData }) => {
    const isEditing = Boolean(userData?.id_usuario); // Verifica se estamos editando
    const initialFormData = {
        nome_usuario: '',
        nome_completo: '',
        senha: '',
        confirmPassword: '', // Campo de confirmação
        permissao: 'vendedor', // Padrão
        ativo: true,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Efeito para carregar dados de edição ou resetar o form
    useEffect(() => {
        if (isOpen) {
            if (isEditing && userData) {
                // Carrega dados para edição, não inclui senha por padrão
                setFormData({
                    nome_usuario: userData.nome_usuario || '',
                    nome_completo: userData.nome_completo || '',
                    senha: '', // Senha fica vazia na edição por padrão
                    confirmPassword: '',
                    permissao: userData.permissao || 'vendedor',
                    ativo: userData.ativo !== undefined ? userData.ativo : true,
                });
            } else {
                // Reseta para criação
                setFormData(initialFormData);
            }
            setFormErrors({}); // Limpa erros ao abrir/recarregar
            setLoading(false);
        }
    }, [isOpen, userData, isEditing]); // Dependências do efeito

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Limpa erro específico ao digitar
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
        if (name === 'senha' || name === 'confirmPassword') {
             setFormErrors(prev => ({ ...prev, senha: null })); // Limpa erro geral de senha
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.nome_usuario.trim()) errors.nome_usuario = 'Nome de usuário é obrigatório.';
        if (!formData.nome_completo.trim()) errors.nome_completo = 'Nome completo é obrigatório.';
        if (!formData.permissao) errors.permissao = 'Permissão é obrigatória.';

        // Validação de senha apenas na criação ou se digitada na edição
        if (!isEditing || formData.senha) {
            if (!formData.senha) {
                errors.senha = 'Senha é obrigatória para novos usuários.';
            } else if (formData.senha.length < 4) { // Exemplo: Mínimo 4 caracteres
                errors.senha = 'Senha deve ter no mínimo 4 caracteres.';
            } else if (formData.senha !== formData.confirmPassword) {
                errors.senha = 'As senhas não coincidem.';
            }
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return; // Não envia se houver erros
        }

        setLoading(true);
        setFormErrors({}); // Limpa erros de submissão anteriores

        // Prepara os dados a serem enviados (remove confirmPassword)
        const dataToSend = {
            nome_usuario: formData.nome_usuario.trim(),
            nome_completo: formData.nome_completo.trim(),
            permissao: formData.permissao,
            ativo: formData.ativo,
        };
        // Inclui a senha apenas se ela foi digitada (para criação ou atualização)
        if (formData.senha) {
            dataToSend.senha = formData.senha;
        }

        try {
             // Chama a função onSave passada pelo pai, passando os dados e o ID (se for edição)
            await onSave(dataToSend, userData?.id_usuario);
            onClose(); // Fecha o modal em caso de sucesso
        } catch (err) {
            console.error("Erro ao salvar usuário:", err);
            setFormErrors({ submit: err.message || 'Ocorreu um erro ao salvar.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Estilos reutilizáveis (Tailwind)
    const labelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const inputStyles = "shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
    const errorStyles = "text-red-500 text-xs mt-1";
    const checkboxLabelCss = "flex items-center text-sm text-gray-700 dark:text-gray-300";
    const checkboxCss = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";


    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg max-h-full">
                {/* Modal content */}
                <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                    {/* Modal header */}
                    <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
                        </h3>
                        <button
                            type="button"
                            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <X className="w-5 h-5" />
                            <span className="sr-only">Fechar modal</span>
                        </button>
                    </div>
                    {/* Modal body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                         {/* Campo Nome Completo */}
                        <div>
                            <label htmlFor="nome_completo" className={labelStyles}>Nome Completo *</label>
                            <input
                                type="text"
                                id="nome_completo"
                                name="nome_completo"
                                value={formData.nome_completo}
                                onChange={handleChange}
                                className={inputStyles}
                                required
                                maxLength={100}
                            />
                            {formErrors.nome_completo && <p className={errorStyles}>{formErrors.nome_completo}</p>}
                        </div>

                        {/* Campo Nome de Usuário (Login) */}
                        <div>
                            <label htmlFor="nome_usuario" className={labelStyles}>Usuário (Login) *</label>
                            <input
                                type="text"
                                id="nome_usuario"
                                name="nome_usuario"
                                value={formData.nome_usuario}
                                onChange={handleChange}
                                className={`${inputStyles} ${isEditing ? 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed' : ''}`} // Visualmente desabilitado na edição
                                required
                                maxLength={50}
                                disabled={isEditing} // Desabilita a edição do nome de usuário
                                title={isEditing ? "Não é possível alterar o nome de usuário." : ""}
                            />
                            {formErrors.nome_usuario && <p className={errorStyles}>{formErrors.nome_usuario}</p>}
                             {isEditing && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nome de usuário não pode ser alterado.</p>}
                        </div>

                         {/* Campo Senha */}
                        <div>
                            <label htmlFor="senha" className={labelStyles}>
                                Senha {isEditing ? '(Deixe em branco para não alterar)' : '*'}
                            </label>
                            <input
                                type="password"
                                id="senha"
                                name="senha"
                                value={formData.senha}
                                onChange={handleChange}
                                className={inputStyles}
                                required={!isEditing} // Obrigatório apenas na criação
                                minLength={4}
                            />
                             {/* Mostra erro geral de senha ou confirmação */}
                            {formErrors.senha && <p className={errorStyles}>{formErrors.senha}</p>}
                        </div>

                        {/* Campo Confirmar Senha (Apenas se a senha estiver sendo digitada) */}
                         {(formData.senha || !isEditing) && ( // Mostra se criando ou se digitou senha na edição
                             <div>
                                <label htmlFor="confirmPassword" className={labelStyles}>Confirmar Senha *</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={inputStyles}
                                    required={!isEditing || !!formData.senha} // Obrigatório se senha foi digitada
                                />
                                {/* Não precisa de erro específico aqui, o erro de confirmação está em 'formErrors.senha' */}
                            </div>
                         )}


                        {/* Campo Permissão */}
                        <div>
                            <label htmlFor="permissao" className={labelStyles}>Permissão *</label>
                            <select
                                id="permissao"
                                name="permissao"
                                value={formData.permissao}
                                onChange={handleChange}
                                className={inputStyles}
                                required
                            >
                                <option value="vendedor">Vendedor</option>
                                <option value="admin">Administrador</option>
                                {/* Adicione outros níveis se necessário */}
                            </select>
                            {formErrors.permissao && <p className={errorStyles}>{formErrors.permissao}</p>}
                        </div>

                        {/* Checkbox Ativo */}
                        <div className="flex items-center">
                            <input
                                id="ativo"
                                name="ativo"
                                type="checkbox"
                                checked={formData.ativo}
                                onChange={handleChange}
                                className={checkboxCss}
                            />
                            <label htmlFor="ativo" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Usuário Ativo
                            </label>
                        </div>

                         {/* Erro Geral de Submissão */}
                         {formErrors.submit && (
                             <p className={`${errorStyles} text-center font-medium`}>{formErrors.submit}</p>
                         )}


                        {/* Modal footer */}
                        <div className="flex items-center justify-end pt-4 border-t border-gray-200 rounded-b dark:border-gray-600 space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50"
                            >
                                {loading ? (
                                     <svg className="animate-spin inline-block h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">...</svg> // Ícone de loading
                                ) : (isEditing ? 'Salvar Alterações' : 'Criar Usuário')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

UserModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired, // Função que recebe (data, userId?)
    userData: PropTypes.shape({ // Dados do usuário para edição (opcional)
        id_usuario: PropTypes.number,
        nome_usuario: PropTypes.string,
        nome_completo: PropTypes.string,
        permissao: PropTypes.string,
        ativo: PropTypes.bool,
    }),
};

export default UserModal;