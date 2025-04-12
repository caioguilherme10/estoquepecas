// main.js
const { app, net, protocol, ipcMain, dialog, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('fs'); // Módulo File System do Node.js
const crypto = require('crypto'); // Para gerar nomes únicos
const url = require('url'); // Para converter path em URL

// Mantenha uma referência global do objeto da janela, se você não fizer isso,
// a janela será fechada automaticamente quando o objeto JavaScript for coletado pelo garbage collector.
let mainWindow;

// Adicione esta variável para verificar o ambiente
const isDev = process.env.NODE_ENV === 'development';

// --- Diretório para armazenar as imagens dos produtos ---
// É crucial criar esta pasta dentro do diretório de dados do usuário
const IMAGES_SUBFOLDER = 'product_images';
let productImagesPath = ''; // Será definido quando o app estiver pronto

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
  productImagesPath = path.join(app.getPath('userData'), IMAGES_SUBFOLDER);
  console.log('[Main Process] Diretório de imagens de produtos:', productImagesPath);

  // Cria o diretório se ele não existir
  try {
    if (!fs.existsSync(productImagesPath)) {
      fs.mkdirSync(productImagesPath, { recursive: true });
      console.log('[Main Process] Diretório de imagens criado com sucesso.');
    }
  } catch (error) {
    console.error('[Main Process] Erro ao criar diretório de imagens:', error);
    // Considere notificar o usuário ou impedir o upload de imagens
  }

  // --- Registro do Protocolo com protocol.handle (NOVO) ---
  protocol.handle('safe-file', (request) => {
    try {
      // 1. Decodifica e remove o prefixo do protocolo
      const requestedPath = decodeURI(request.url.replace(/^safe-file:\/\//, ''));

      // 2. Constrói o caminho absoluto seguro
      const potentialFilePath = path.join(productImagesPath, requestedPath);
      const normalizedPath = path.normalize(potentialFilePath);

      // 3. Validação de Segurança (ESSENCIAL!)
      if (!normalizedPath.startsWith(path.normalize(productImagesPath))) {
        console.error(`[Protocol Handle] Acesso negado: Tentativa de acessar fora da pasta segura: ${normalizedPath}`);
        // Retorna uma resposta de erro (404 Not Found)
        // Para `protocol.handle`, você retorna um objeto Response ou joga um erro.
        // Criar uma resposta 404 é um pouco mais complexo, vamos jogar um erro por enquanto.
        throw new Error('Access denied'); // Ou return new Response(null, { status: 404 }); se suportado
      }

      console.log(`[Protocol Handle] Resolvendo safe-file para: ${normalizedPath}`);

      // 4. Retorna uma Resposta com o arquivo local
      // A API Response é similar à Fetch API
      return net.fetch(url.pathToFileURL(normalizedPath).toString()); // Usa net.fetch para carregar o arquivo local

    } catch (error) {
      console.error(`[Protocol Handle] Erro ao processar ${request.url}:`, error);
      // Retorna uma resposta de erro 500 (Internal Server Error) ou 404
      // return new Response(null, { status: 500 }); // Requer importação de Response ou use a global se disponível
      throw error; // Jogar o erro pode ser suficiente para indicar falha
    }
  });
  // --- Fim do Registro com protocol.handle ---

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// --- Handlers IPC ---

// Handler para obter o caminho base das imagens (usado pelo preload/renderer)
/*ipcMain.handle('get-product-image-base-path', () => {
  // Retorna o caminho absoluto para a pasta de imagens
  // Adiciona file:// para ser usado em src de <img> no renderer
  // Cuidado com barras invertidas no Windows, path.toNamespacedPath pode ajudar
  // mas `path.join` geralmente lida bem. O `replace` é uma garantia extra.
  // const fileUrl = `file://${productImagesPath.replace(/\\/g, '/')}`; // Forma mais antiga
    const fileUrl = require('url').pathToFileURL(productImagesPath).toString(); // Forma moderna e segura
    console.log('[Main Process] Retornando base path para renderer:', fileUrl);
    return fileUrl;
});*/

// Handler para o usuário selecionar arquivos de imagem
ipcMain.handle('select-image-files', async () => {
  console.log('[Main Process] Abrindo diálogo para selecionar imagens...');
  const result = await dialog.showOpenDialog({
    title: 'Selecionar Imagens do Produto',
    properties: ['openFile', 'multiSelections'], // Permite selecionar múltiplos arquivos
    filters: [
      { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
    ],
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    console.log('[Main Process] Seleção de imagens cancelada ou vazia.');
    return []; // Retorna array vazio se cancelado
  } else {
    console.log('[Main Process] Imagens selecionadas:', result.filePaths);
    return result.filePaths; // Retorna array com os caminhos dos arquivos selecionados
  }
});

// Handler para copiar a imagem e retornar o novo nome/caminho relativo
ipcMain.handle('copy-product-image', async (event, sourcePath, productId) => {
    if (!productImagesPath) {
        throw new Error("Diretório de imagens não inicializado.");
    }
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Arquivo de origem não encontrado: ${sourcePath}`);
    }

    try {
        const fileExtension = path.extname(sourcePath).toLowerCase(); // Pega a extensão original
        // Gera um nome de arquivo único para evitar colisões
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(4).toString('hex'); // Pequeno hash aleatório
        const uniqueFileName = `prod_${productId}_${timestamp}_${randomString}${fileExtension}`;
        const destinationPath = path.join(productImagesPath, uniqueFileName);

        console.log(`[Main Process] Copiando ${sourcePath} para ${destinationPath}`);
        fs.copyFileSync(sourcePath, destinationPath);
        console.log(`[Main Process] Cópia bem-sucedida. Novo nome: ${uniqueFileName}`);

        // Retorna apenas o nome único do arquivo (que será salvo no DB)
        return uniqueFileName;

    } catch (error) {
        console.error(`[Main Process] Erro ao copiar imagem ${sourcePath}:`, error);
        throw new Error(`Falha ao copiar imagem: ${error.message}`); // Re-lança o erro para o preload
    }
});

// Handler para deletar o arquivo de imagem físico
ipcMain.handle('delete-product-image-file', async (event, fileName) => {
     if (!productImagesPath) {
        throw new Error("Diretório de imagens não inicializado.");
    }
     const filePath = path.join(productImagesPath, fileName);
     console.log(`[Main Process] Tentando deletar arquivo de imagem: ${filePath}`);
     try {
         if (fs.existsSync(filePath)) {
             fs.unlinkSync(filePath);
             console.log(`[Main Process] Arquivo ${fileName} deletado com sucesso.`);
             return true;
         } else {
             console.warn(`[Main Process] Arquivo ${fileName} não encontrado para exclusão.`);
             return false; // Ou pode lançar erro se preferir que a operação falhe
         }
     } catch (error) {
         console.error(`[Main Process] Erro ao deletar arquivo ${fileName}:`, error);
         throw new Error(`Falha ao deletar arquivo de imagem: ${error.message}`);
     }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});