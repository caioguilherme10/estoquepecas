// --- START OF FILE renderer.js ---

console.log('[Renderer] Script starting...');

// Verifica se a API foi exposta corretamente pelo preload
if (typeof window.api === 'undefined') {
    console.error('[Renderer] FATAL: window.api is undefined. Preload script likely failed or contextIsolation is off.');
    // Você pode exibir uma mensagem de erro mais proeminente para o usuário aqui
    alert("Erro Crítico: A comunicação com o backend falhou. Verifique os logs e a configuração do preload.");
    // Impede a execução do resto do script se a API não existir
    throw new Error("window.api is undefined. Cannot proceed.");
} else {
    console.log('[Renderer] window.api object found:', window.api);
}


// --- Elementos do DOM ---
const addForm = document.getElementById('add-product-form');
const addProductMessage = document.getElementById('add-product-message');
const productsTableBody = document.getElementById('products-table')?.querySelector('tbody');
const refreshButton = document.getElementById('refresh-products');
const productsListMessage = document.getElementById('products-list-message');

// --- Funções ---

// Função para carregar e exibir produtos
async function loadProducts() {
    console.log('[Renderer] loadProducts called');
    if (!productsTableBody || !productsListMessage) {
        console.warn('[Renderer] loadProducts aborted: Table body or message area not found.');
        return;
    }

    productsListMessage.textContent = 'Carregando produtos...';
    productsListMessage.style.color = 'black';
    productsTableBody.innerHTML = ''; // Limpa a tabela

    try {
        console.log('[Renderer] Calling window.api.getProducts()...');
        const products = await window.api.getProducts();
        console.log(`[Renderer] Received ${products.length} products from API.`);

        if (products.length === 0) {
            productsListMessage.textContent = 'Nenhum produto cadastrado.';
            return;
        }

        products.forEach(product => {
            const row = productsTableBody.insertRow();
            // Sanitizar output é bom, mas para este exemplo interno, vamos simplificar
            row.innerHTML = `
                <td>${product.ID}</td>
                <td>${product.NomeProduto || '-'}</td>
                <td>${product.Aplicacao || '-'}</td>
                <td>${product.QuantidadeEstoque}</td>
                <td>${typeof product.PrecoVenda === 'number' ? `R$ ${product.PrecoVenda.toFixed(2)}` : 'N/A'}</td>
                <td>${product.Localizacao || '-'}</td>
                <td>
                    <button onclick="editProduct(${product.ID})">Editar</button>
                    <button onclick="deleteProduct(${product.ID})">Excluir</button>
                    <button onclick="showMovements(${product.ID})">Movimentações</button>
                </td>
            `;
        });
        productsListMessage.textContent = ''; // Limpa mensagem de carregamento/sucesso
    } catch (error) {
        console.error('[Renderer] Error loading products:', error);
        productsListMessage.textContent = `Erro ao carregar produtos: ${error.message}`;
        productsListMessage.style.color = 'red';
        // Manter a tabela vazia ou mostrar uma linha de erro mais clara
        productsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Falha ao carregar dados. Verifique a conexão com o banco.</td></tr>`;
    }
}

// Função para lidar com o envio do formulário de adição
async function handleAddProduct(event) {
    event.preventDefault(); // Impede o recarregamento da página
    console.log('[Renderer] handleAddProduct called');
    addProductMessage.textContent = 'Adicionando...';
    addProductMessage.style.color = 'black';

    // Coleta dados do formulário
    const productData = {
        codigoFabricante: document.getElementById('codigoFabricante').value.trim(),
        nomeProduto: document.getElementById('nomeProduto').value.trim(),
        codigoBarras: document.getElementById('codigoBarras').value.trim(),
        aplicacao: document.getElementById('aplicacao').value.trim(),
        marca: document.getElementById('marca').value.trim(),
        quantidadeEstoque: document.getElementById('quantidadeEstoque').value,
        precoCusto: document.getElementById('precoCusto').value,
        precoVenda: document.getElementById('precoVenda').value,
        estoqueMinimo: document.getElementById('estoqueMinimo').value,
        localizacao: document.getElementById('localizacao').value.trim(),
    };
    console.log('[Renderer] Product data collected from form:', productData);

    // Validação simples no renderer (melhorar conforme necessário)
    if (!productData.codigoFabricante || !productData.nomeProduto) {
         addProductMessage.textContent = 'Erro: Código Fabricante e Nome são obrigatórios.';
         addProductMessage.style.color = 'red';
         console.warn('[Renderer] Add product aborted due to missing required fields.');
         return;
    }


    try {
        console.log('[Renderer] Calling window.api.addProduct()...');
        const result = await window.api.addProduct(productData);
        console.log('[Renderer] addProduct API call successful:', result);
        addProductMessage.textContent = result.message;
        addProductMessage.style.color = 'green'; // Mensagem de sucesso
        addForm.reset(); // Limpa o formulário
        loadProducts(); // Atualiza a lista de produtos
    } catch (error) {
        console.error('[Renderer] Error adding product:', error);
        addProductMessage.textContent = `Erro ao adicionar: ${error.message}`;
        addProductMessage.style.color = 'red';
    }
}

// --- Funções Placeholder para Ações (Implementar) ---
function editProduct(id) {
    console.log(`[Renderer] editProduct(${id}) called - Placeholder`);
    alert(`Implementar edição para o produto ID: ${id}`);
    // Implementação futura:
    // 1. Chamar `window.api.getProductById(id)` (precisa criar essa função no preload)
    // 2. Preencher um modal/formulário de edição com os dados recebidos
    // 3. No submit do modal, chamar `window.api.updateProduct(id, updatedData)` (precisa criar)
    // 4. Atualizar a tabela com `loadProducts()`
}

async function deleteProduct(id) {
   console.log(`[Renderer] deleteProduct(${id}) called`);
   if (confirm(`Tem certeza que deseja excluir o produto ID: ${id}? Esta ação não pode ser desfeita.`)) {
       console.log(`[Renderer] Confirmed deletion for ID: ${id}`);
       alert(`Implementar exclusão para o produto ID: ${id}`);
       // try {
       //    console.log(`[Renderer] Calling window.api.deleteProduct(${id})...`);
       //    await window.api.deleteProduct(id); // Criar função deleteProduct no preload
       //    console.log(`[Renderer] deleteProduct API call successful for ID: ${id}`);
       //    loadProducts(); // Atualiza a tabela
       // } catch (error) {
       //    console.error(`[Renderer] Error deleting product ID ${id}:`, error);
       //    alert(`Erro ao excluir produto: ${error.message}`);
       // }
   } else {
       console.log(`[Renderer] Deletion cancelled for ID: ${id}`);
   }
}

function showMovements(id) {
    console.log(`[Renderer] showMovements(${id}) called - Placeholder`);
    alert(`Implementar visualização de movimentações para o produto ID: ${id}`);
    // Implementação futura:
    // 1. Chamar `window.api.getStockMovements(id)` (precisa criar no preload)
    // 2. Exibir os dados recebidos em um modal ou nova seção da página
}


// --- Event Listeners ---
if (addForm) {
    addForm.addEventListener('submit', handleAddProduct);
    console.log('[Renderer] Add product form listener attached.');
} else {
    console.warn('[Renderer] Add product form not found.');
}

if (refreshButton) {
    refreshButton.addEventListener('click', loadProducts);
    console.log('[Renderer] Refresh button listener attached.');
} else {
    console.warn('[Renderer] Refresh button not found.');
}

// --- Inicialização ---
// Carrega os produtos assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Renderer] DOMContentLoaded event fired. Initializing product load.');
    loadProducts();
});

// Opcional: Tentar fechar o DB antes da janela fechar
window.addEventListener('beforeunload', (event) => {
  console.log("[Renderer] 'beforeunload' event triggered. Attempting to close database...");
  // Verifica se a API e a função existem antes de chamar
  if (window.api && typeof window.api.closeDatabase === 'function') {
       try {
            window.api.closeDatabase(); // Chame a função exposta
            console.log("[Renderer] window.api.closeDatabase() called.");
       } catch (e) {
            console.error("[Renderer] Error calling window.api.closeDatabase():", e);
       }
  } else {
      console.warn("[Renderer] window.api or window.api.closeDatabase is not available.");
  }
  // Não é garantido que código assíncrono termine aqui.
  // O fechamento síncrono do better-sqlite3 no preload ajuda.
});

console.log('[Renderer] Script finished.');
// --- END OF FILE renderer.js ---