// src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { UserPlus, Edit, ToggleLeft, ToggleRight, Trash2, RotateCw } from 'lucide-react';
// import UserModal from './UserModal'; // Componente modal para criar/editar (a ser criado)

const UsersPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [currentUser, setCurrentUser] = useState(null); // Para edição

    // Controle de Acesso: Apenas Admins podem ver esta página
    if (user?.permissao !== 'admin') {
        // Redireciona para o dashboard ou mostra mensagem de não autorizado
        console.warn("Acesso negado à página de usuários.");
        return <Navigate to="/dashboard" replace />;
        // Ou: return <div className="p-4 text-red-500">Acesso não autorizado.</div>;
    }

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
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

    const handleToggleActive = async (id) => {
        // Adicionar confirmação visual?
        try {
            await window.api.toggleUserActive(id);
            fetchUsers(); // Recarrega a lista
        } catch (err) {
            console.error(`Erro ao ativar/desativar usuário ${id}:`, err);
            setError(`Erro ao alterar status: ${err.message}`);
        }
    };

    // Funções para abrir modal (a serem implementadas com UserModal)
    const handleOpenCreateModal = () => {
        // setCurrentUser(null);
        // setIsModalOpen(true);
        alert("Funcionalidade Criar Usuário ainda não implementada.");
    };

    const handleOpenEditModal = (userToEdit) => {
        // setCurrentUser(userToEdit);
        // setIsModalOpen(true);
         alert("Funcionalidade Editar Usuário ainda não implementada.");
    };

    const handleDeleteUser = async (id) => {
         alert(`Funcionalidade Excluir Usuário (ID: ${id}) ainda não implementada. Considere desativar em vez de excluir.`);
         // Implementar window.api.deleteUser(id) se necessário
    };


    const formatDateTime = (isoString) => {
        if (!isoString) return '-';
        try {
            return new Date(isoString).toLocaleString('pt-BR');
        } catch (e) {
            return 'Data inválida';
        }
    };

    return (
        <div className="container mx-auto p-4 dark:text-gray-100">
            <div className="flex justify-between items-center mb-6">
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
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <UserPlus className="mr-2 h-5 w-5" /> Novo Usuário
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

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
                                users.map((u) => (
                                    <tr key={u.id_usuario} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{u.nome_completo}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.nome_usuario}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{u.permissao}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                {u.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(u.data_cadastro)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(u.data_ultimo_login)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => handleToggleActive(u.id_usuario)} title={u.ativo ? 'Desativar' : 'Ativar'} className={`p-1 rounded ${u.ativo ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200'}`}>
                                                 {u.ativo ? <ToggleLeft size={18} /> : <ToggleRight size={18}/>}
                                            </button>
                                            <button onClick={() => handleOpenEditModal(u)} title="Editar" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-1">
                                                <Edit size={16} />
                                            </button>
                                            {/* Botão de Excluir (cuidado ao usar) */}
                                             {/* <button onClick={() => handleDeleteUser(u.id_usuario)} title="Excluir" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1">
                                                 <Trash2 size={16}/>
                                             </button> */}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
             {/* Modal para Criar/Editar Usuário (a ser implementado) */}
             {/* {isModalOpen && (
                 <UserModal
                     isOpen={isModalOpen}
                     onClose={() => setIsModalOpen(false)}
                     onSave={handleSaveUser} // Função que chama add ou update
                     userData={currentUser} // Passa null para criar, ou dados para editar
                 />
             )} */}
        </div>
    );
};

export default UsersPage;