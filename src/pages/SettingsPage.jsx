// src/pages/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
// Importar useAuth se formos vincular com o DarkMode do Layout
import { useAuth } from '../context/AuthContext'; // Ajuste o caminho se necessário

// Estrutura similar ao UserSetting, mas em JS
// type UserSetting = {
//   label: string;
//   value: string | boolean;
//   type: "text" | "toggle";
//   key: string; // Adicionando uma chave única para identificar a configuração
//   readOnly?: boolean; // Opcional: para campos não editáveis
//   onChange?: (newValue: string | boolean) => void; // Opcional: Callback para salvar
// };

// Mock de configurações iniciais (Adaptado)
// Em uma aplicação real, isso viria de localStorage, API, ou estado global
const initialSettings = [
  // { key: "username", label: "Usuário (Login)", value: "carregando...", type: "text", readOnly: true }, // Exemplo: Viria do useAuth
  // { key: "email", label: "Email", value: "email@example.com", type: "text" }, // Exemplo
  { key: "darkMode", label: "Modo Escuro", value: false, type: "toggle" }, // Será vinculado ao estado do Layout/Auth
  { key: "notifications", label: "Notificações (Exemplo)", value: true, type: "toggle" },
  { key: "language", label: "Idioma (Exemplo)", value: "Português (Brasil)", type: "text", readOnly: true }, // Exemplo read-only
  // Adicione outras configurações relevantes aqui
];

const SettingsPage = () => {
  // Tenta pegar o estado inicial do dark mode do contexto, se disponível
  // Nota: Se o dark mode é controlado *apenas* pelo Layout/AuthContext, não precisa de estado local aqui.
  // Vamos assumir que queremos exibir o estado do contexto e permitir alterá-lo a partir daqui.
  const { isDarkMode: isDarkModeGlobal, toggleDarkMode: toggleDarkModeGlobal } = useAuth ? useAuth() : { isDarkMode: false, toggleDarkMode: () => {} }; // Usa o contexto se disponível
  // Inicializa o estado local, buscando o valor real do dark mode global
  const [userSettings, setUserSettings] = useState(() =>
    initialSettings.map(setting => {
      if (setting.key === 'darkMode') {
        return { ...setting, value: isDarkModeGlobal };
      }
      return setting;
    })
  );
  // Efeito para sincronizar o estado local do dark mode com o global, se o global mudar
  useEffect(() => {
    setUserSettings(currentSettings =>
      currentSettings.map(setting =>
        setting.key === 'darkMode' ? { ...setting, value: isDarkModeGlobal } : setting
      )
    );
  }, [isDarkModeGlobal]);
  // Handler para Toggles
  const handleToggleChange = (key) => {
    // Se for o dark mode, chama a função global para garantir consistência
    if (key === 'darkMode' && toggleDarkModeGlobal) {
      toggleDarkModeGlobal();
      // O useEffect acima atualizará o estado local 'userSettings'
    } else {
      // Para outros toggles (ex: notificações), atualiza o estado local diretamente
      setUserSettings(currentSettings =>
        currentSettings.map(setting =>
          setting.key === key ? { ...setting, value: !setting.value } : setting
        )
      );
      // TODO: Aqui você chamaria uma função para salvar essa configuração específica (ex: window.api.saveSetting(key, newValue))
      console.log(`Setting ${key} toggled (local state only for now)`);
    }
  };
  // Handler para Inputs de Texto
  const handleTextChange = (key, newValue) => {
    setUserSettings(currentSettings =>
      currentSettings.map(setting =>
        setting.key === key ? { ...setting, value: newValue } : setting
      )
    );
    // TODO: Implementar debounce ou salvar ao perder foco/apertar Enter
    // console.log(`Setting ${key} changed to ${newValue} (local state only)`);
    // TODO: Chamar window.api.saveSetting(key, newValue)
  };
  return (
    // O Layout já fornece o container principal e dark mode
    // <div className="w-full dark:bg-gray-900"> {/* Container principal não necessário se dentro do Layout */}
    <> {/* Usa Fragment */}
      {/* Substituído Header por h1 */}
      <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
        Configurações
      </h1>
      {/* TODO: Adicionar mensagens de sucesso/erro ao salvar configurações */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        {/* Correção: Sem espaço/newline entre <table> e <thead> */}
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-700">
            {/* Correção: Sem espaço/newline entre <thead> e <tr> */}
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">
                Configuração
              </th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">
                Valor
              </th>
            </tr>
            {/* Fim do thead */}
          </thead>
          {/* Correção: Sem espaço/newline entre </thead> e <tbody> */}
          <tbody className="text-gray-700 dark:text-gray-200 divide-y divide-gray-200 dark:divide-gray-700">
            {userSettings.map((setting) => (
              // Correção: Sem espaço/newline entre <tbody> e <tr> (implícito pelo map)
              // Correção: Sem espaço/newline entre <tr> e <td> (implícito)
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50" key={setting.key}>
                <td className="py-3 px-4">{setting.label}</td>
                <td className="py-3 px-4">
                  {setting.type === "toggle" ? (
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!setting.value}
                        onChange={() => handleToggleChange(setting.key)}
                      />
                      <div
                        className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800
                        transition peer-checked:after:translate-x-full peer-checked:after:border-white
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white
                        after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all
                        peer-checked:bg-blue-600"
                      ></div>
                    </label>
                  ) : (
                    <input
                      type="text"
                      className={`px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${setting.readOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`}
                      value={String(setting.value)}
                      readOnly={setting.readOnly}
                      onChange={(e) => {
                        if(!setting.readOnly) {
                          handleTextChange(setting.key, e.target.value);
                        }
                      }}
                    />
                  )}
                </td>
              </tr>
              // Fim do tr
            ))}
            {/* Fim do tbody */}
          </tbody>
          {/* Fim da table */}
        </table>
      </div>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md text-sm text-blue-700 dark:text-blue-200">
        <p><strong>Observação:</strong> Estas configurações são exemplos e (exceto Modo Escuro) não são salvas permanentemente nesta versão. A integração com armazenamento (localStorage ou API) é necessária para persistência.</p>
      </div>
      {/* Botão Salvar (Opcional - se não salvar a cada mudança) */}
      {/*
      <div className="mt-6 flex justify-end">
        <button
          // onClick={handleSaveChanges}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
        >
          Salvar Alterações
        </button>
      </div>
      */}
    </>
    // </div>
  );
};

export default SettingsPage;