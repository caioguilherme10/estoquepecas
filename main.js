// --- START OF FILE main.js ---

const { app, BrowserWindow, dialog } = require('electron'); // Adicionei dialog para possíveis erros
const path = require('node:path');

// Variável global para a janela principal, se precisar acessá-la depois
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1000, // Aumentei um pouco a largura para melhor visualização da tabela
      height: 700,
      webPreferences: {
        // preload: path.join(__dirname, 'preload.js') define que o preload.js
        // deve estar na MESMA PASTA que este main.js. Confirme sua estrutura.
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true, // Essencial e correto
        nodeIntegration: false, // Essencial e correto
        sandbox: false // !! ESSENCIAL PARA PERMITIR NODE NO PRELOAD !!
      }
    });

    // mainWindow.webContents.openDevTools(); // Descomente para abrir DevTools automaticamente

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
      // Limpa a referência da janela quando fechada
      mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      // No macOS, recria a janela se clicar no ícone do dock e não houver outras janelas.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
});

app.on('window-all-closed', () => {
    // Fecha o app em todas as plataformas, exceto macOS
    if (process.platform !== 'darwin') {
        app.quit();
    }
    // O fechamento do banco de dados será tentado pelo renderer/preload
});

// Opcional: Ouvir por erros críticos do preload (se você implementar o send)
// ipcMain.on('db-error', (event, errorMessage) => {
//     console.error("Erro fatal no banco de dados:", errorMessage);
//     dialog.showErrorBox("Erro de Banco de Dados", `Não foi possível conectar ao banco de dados: ${errorMessage}\nO aplicativo será fechado.`);
//     app.quit();
// });

// --- END OF FILE main.js ---