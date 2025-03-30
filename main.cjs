// main.js
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// Mantenha uma referência global do objeto da janela, se você não fizer isso,
// a janela será fechada automaticamente quando o objeto JavaScript for coletado pelo garbage collector.
let mainWindow;

// Adicione esta variável para verificar o ambiente
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100, // Ajuste conforme necessário
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // Caminho para seu preload continua o mesmo
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Necessário para o preload funcionar com 'require'
    }
  });

  // Carrega a URL do Vite dev server ou o arquivo HTML buildado
  if (isDev) {
    console.log('Running in development mode, loading from Vite dev server...');
    // Garanta que a porta (:5173) corresponde à porta que o Vite usa (geralmente 5173)
    mainWindow.loadURL('http://localhost:5173');
    // Abra o DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Running in production mode, loading built file...');
    // Carrega o index.html buildado pelo Vite (ajuste o caminho se mudou o outDir)
    mainWindow.loadFile(path.join(__dirname, 'dist-renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});