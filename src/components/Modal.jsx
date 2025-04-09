// src/components/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Cabeçalho do Modal */}
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title || 'Modal'}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Fechar modal"
                    >
                        <X size={24} />
                    </button>
                </div>
                {/* Conteúdo do Modal */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {children}
                </div>
                {/* Rodapé opcional (pode adicionar botões aqui se necessário) */}
                {/* <div className="flex justify-end p-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                        Fechar
                    </button>
                </div> */}
            </div>
        </div>
    );
};

export default Modal;