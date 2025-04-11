// src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { UserPlus, Edit, ToggleLeft, ToggleRight, RotateCw } from 'lucide-react';
import UserModal from './UserModal'; 
import PropTypes from 'prop-types';

// Componente da Linha do Usuário (Opcional, mas organiza)
const UserRow = ({ user, onToggleActive, onEdit, formatDateTime }) => {
    return (
        <tr key={user.id_usuario} className="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.nome_completo}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.nome_usuario}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{user.permissao}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(user.data_cadastro)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(user.data_ultimo_login)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onClick={() => onToggleActive(user.id_usuario)} title={user.ativo ? 'Desativar' : 'Ativar'} className={`p-1 rounded ${user.ativo ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200'}`}>
                    {user.ativo ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
                </button>
                <button onClick={() => onEdit(user)} title="Editar" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-1">
                    <Edit size={16} />
                </button>
                {/* Botão de Excluir pode ser adicionado aqui se necessário */}
            </td>
        </tr>
    );
};

UserRow.propTypes = {
    user: PropTypes.object.isRequired,
    onToggleActive: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    formatDateTime: PropTypes.func.isRequired,
};


// Componente Principal da Página
const UsersPage = () => {
    const { user: loggedInUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    // Controle de Acesso
    if (loggedInUser?.permissao !== 'admin') {
        console.warn("Acesso negado à página de usuários.");
        return <Navigate to="/dashboard" replace />;
    }
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const data = await window.api.getAllUsers();
            setUsers(data || []);
        } catch (err) {
            console.error("Erro ao buscar usuários:", err);
            setError(`Erro ao buscar usuários: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    // Limpa mensagem de sucesso após alguns segundos
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000); // Mensagem some após 3s
            return () => clearTimeout(timer); // Limpa o timer se o componente desmontar
        }
    }, [successMessage]);
    const handleToggleActive = async (id) => {
        setError('');
        setSuccessMessage('');
        // Não permitir desativar o próprio usuário logado?
        if (id === loggedInUser?.id_usuario) {
            setError("Você não pode desativar seu próprio usuário.");
            return;
        }
        try {
            const result = await window.api.toggleUserActive(id);
            setSuccessMessage(result.message || 'Status do usuário alterado.');
            fetchUsers();
        } catch (err) {
            console.error(`Erro ao ativar/desativar usuário ${id}:`, err);
            setError(`Erro ao alterar status: ${err.message}`);
        }
    };
    // *** Funções para controlar o Modal ***
    const handleOpenCreateModal = () => {
        setCurrentUser(null);
        setIsModalOpen(true);
        setError('');
        setSuccessMessage('');
    };
    const handleOpenEditModal = (userToEdit) => {
        setCurrentUser(userToEdit);
        setIsModalOpen(true);
        setError('');
        setSuccessMessage('');
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };
    // ***  Função chamada pelo Modal ao salvar ***
    const handleSaveUser = async (userData, userId) => {
        // A lógica de loading e error será tratada dentro do Modal,
        // mas podemos limpar erros/sucessos antigos aqui
        setError('');
        setSuccessMessage('');
        try {
            if (userId) {
                // Editando usuário existente
                await window.api.updateUser(userId, userData);
                setSuccessMessage('Usuário atualizado com sucesso!');
            } else {
                // Criando novo usuário
                await window.api.addUser(userData);
                setSuccessMessage('Usuário criado com sucesso!');
            }
            fetchUsers(); // Recarrega a lista após salvar
            // handleCloseModal(); // O Modal já chama onClose internamente no sucesso
            return Promise.resolve(); // Indica sucesso para o Modal
        } catch (err) {
            console.error("Erro no handleSaveUser:", err);
            // Re-lança o erro para o Modal exibir
            return Promise.reject(err);
        }
    };
    // Função de formatação de data
    const formatDateTime = (isoString) => {
        if (!isoString) return '-';
        try {
            return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return 'Inválido';
        }
    };
    return (
        <div className="container mx-auto p-4 dark:text-gray-100">
            {/* Cabeçalho e Botões */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Gerenciamento de Usuários</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        title="Recarregar lista"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        <RotateCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Recarregar
                    </button>
                    <button
                        onClick={handleOpenCreateModal} // Chama a função para abrir o modal de criação
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <UserPlus className="mr-2 h-5 w-5" /> Novo Usuário
                    </button>
                </div>
            </div>
            {/* Mensagens de Erro e Sucesso */}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}
            {/* Tabela de Usuários */}
            <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome Completo</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuário (Login)</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Permissão</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cadastro</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Login</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-4"><RotateCw className="inline-block animate-spin h-5 w-5 mr-2" /> Carregando...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-4 text-gray-500">Nenhum usuário encontrado.</td></tr>
                            ) : (
                                users.map((user) => (
                                    // Usa o componente UserRow
                                    <UserRow
                                        key={user.id_usuario}
                                        user={user}
                                        onToggleActive={handleToggleActive}
                                        onEdit={handleOpenEditModal} // Passa a função para abrir modal de edição
                                        formatDateTime={formatDateTime}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* *** Renderizar o Modal Condicionalmente *** */}
            <UserModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUser}
                userData={currentUser} // Passa null para criar ou os dados do user para editar
            />
        </div>
    );
};

export default UsersPage;