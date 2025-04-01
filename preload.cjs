// --- START OF FILE preload.js ---

console.log('[Preload] Script starting...');
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os'); // Mantenha para diagnóstico se precisar
const Database = require('better-sqlite3');

let db;
const dbPath = path.join(__dirname, 'estoque.db'); // ALTERADO: Nome do banco de dados
console.log('[Preload] Database path target:', dbPath);

try {
    console.log('[Preload] Attempting to connect to SQLite DB...');
    db = new Database(dbPath, { timeout: 5000 /*, verbose: console.log */ });
    console.log('[Preload] SQLite connection established successfully.');

    db.pragma('journal_mode = WAL;');
    db.pragma('foreign_keys = ON;'); // Habilitar chaves estrangeiras é crucial!
    console.log('[Preload] PRAGMAs set: journal_mode=WAL, foreign_keys=ON.');

    // --- Criação/Verificação das Tabelas (NOVA ESTRUTURA) ---
    // Tabela Produtos
    db.exec(`
        CREATE TABLE IF NOT EXISTS produtos (
            id_produto INTEGER PRIMARY KEY AUTOINCREMENT,
            CodigoBarras VARCHAR(255) NULL,
            CodigoFabricante VARCHAR(255) NULL,
            NomeProduto VARCHAR(255) NOT NULL,
            Marca VARCHAR(255) NULL,
            Descricao TEXT NULL,
            Aplicacao TEXT NULL,
            QuantidadeEstoque INTEGER NOT NULL DEFAULT 0,
            EstoqueMinimo INTEGER NOT NULL DEFAULT 1,
            Preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            Localizacao VARCHAR(255) NULL,
            DataCadastro DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            DataUltimaAtualizacao DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            Ativo BOOLEAN NULL DEFAULT TRUE
        );
    `);
    console.log('[Preload] Tabela "produtos" verificada/criada.');

    // Tabela historico_compras
    db.exec(`
        CREATE TABLE IF NOT EXISTS historico_compras (
            id_compra INTEGER PRIMARY KEY AUTOINCREMENT,
            id_produto INTEGER NOT NULL,
            data_compra DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            quantidade INTEGER NOT NULL,
            preco_unitario DECIMAL(10, 2) NOT NULL,
            preco_total DECIMAL(12, 2) NOT NULL,
            id_fornecedor INTEGER NULL,
            nome_fornecedor VARCHAR(255) NULL,
            numero_nota_fiscal VARCHAR(255) NULL,
            observacoes TEXT NULL,
            usuario_compra INTEGER NULL,
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
            -- FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor) -- Se tiver tabela de fornecedores
        );
    `);
    console.log('[Preload] Tabela "historico_compras" verificada/criada.');

    // Tabela historico_vendas
    db.exec(`
        CREATE TABLE IF NOT EXISTS historico_vendas (
            id_venda INTEGER PRIMARY KEY AUTOINCREMENT,
            id_produto INTEGER NOT NULL,
            data_venda DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            quantidade INTEGER NOT NULL,
            preco_unitario DECIMAL(10, 2) NOT NULL,
            preco_total DECIMAL(12, 2) NOT NULL,
            id_cliente INTEGER NULL,
            nome_cliente VARCHAR(255) NULL,
            numero_recibo VARCHAR(255) NULL,
            observacoes TEXT NULL,
            usuario_venda INTEGER NULL,
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
            -- FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) -- Se tiver tabela de clientes
        );
    `);
    console.log('[Preload] Tabela "historico_vendas" verificada/criada.');

    // Trigger para atualizar DataUltimaAtualizacao na tabela produtos
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_product_timestamp
        AFTER UPDATE ON produtos
        FOR EACH ROW
        BEGIN
            UPDATE produtos SET DataUltimaAtualizacao = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id_produto = OLD.id_produto;
        END;
    `);
    console.log('[Preload] Trigger "update_product_timestamp" verificado/criado.');


} catch (err) {
    console.error('[Preload] !!! CRITICAL ERROR during database setup !!!');
    console.error(`[Preload] Error loading module, connecting to DB, or creating tables: ${err.message}`);
    console.error(`[Preload] Stack Trace: ${err.stack}`);
    db = null; // Garante que db é null se a conexão falhar
    // Informar o main process sobre o erro fatal? (Opcional)
    // ipcRenderer.send('db-error', err.message);
}

// --- FUNÇÃO INTERNA DE MOVIMENTAÇÃO REMOVIDA ---
// A lógica de movimentação será mais simples e feita diretamente nas funções de API, usando as tabelas historico_compras/vendas

// --- Expor Funções para o Renderer (AJUSTADAS PARA A NOVA ESTRUTURA) ---
console.log('[Preload] Attempting to expose API via contextBridge...');
try {
    contextBridge.exposeInMainWorld('api', {
        // --- Funções de Produto ---
        getProducts: (searchTerm = null, includeInactive = false) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                let query = `
                    SELECT id_produto, Marca, CodigoFabricante, NomeProduto, QuantidadeEstoque, Preco, Localizacao, EstoqueMinimo, Aplicacao, Ativo
                    FROM produtos
                `;
                const params = [];
                const conditions = [];

                // Adiciona filtro Ativo=TRUE por padrão
                if (!includeInactive) {
                    conditions.push("Ativo = TRUE");
                }

                if (searchTerm) {
                    conditions.push(`(NomeProduto LIKE ? OR CodigoFabricante LIKE ? OR Marca LIKE ? OR Aplicacao LIKE ? OR CodigoBarras LIKE ?)`);
                    const likeTerm = `%${searchTerm}%`;
                    params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm); // Adiciona para cada campo de busca
                }

                // Junta as condições com WHERE e AND
                if (conditions.length > 0) {
                    query += ` WHERE ${conditions.join(' AND ')}`;
                }

                query += ' ORDER BY NomeProduto';

                console.log(`[Preload API] getProducts executing query (Search: ${searchTerm || 'None'})...`);
                const stmt = db.prepare(query);
                const products = stmt.all(params);
                console.log(`[Preload API] getProducts returning ${products.length} products.`);
                return Promise.resolve(products);
            } catch (err) {
                console.error("[Preload API] Error in getProducts query:", err);
                return Promise.reject(err);
            }
        },

        getProductById: (id) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                console.log(`[Preload API] getProductById executing query for ID: ${id}...`);
                const stmt = db.prepare('SELECT * FROM produtos WHERE id_produto = ?'); // Alterado
                const product = stmt.get(id);
                if (!product) {
                    console.warn(`[Preload API] getProductById: Product with ID ${id} not found.`);
                    return Promise.resolve(null); // Ou reject(new Error(...))
                }
                console.log(`[Preload API] getProductById returning product data for ID: ${id}.`);
                return Promise.resolve(product);
            } catch (err) {
                console.error(`[Preload API] Error in getProductById query for ID ${id}:`, err);
                return Promise.reject(err);
            }
        },

        addProduct: (productData) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            // Validações básicas
            if (!productData || !productData.CodigoFabricante || !productData.NomeProduto) { // Alterado
                return Promise.reject(new Error("Dados incompletos (Código Fabricante e Nome são obrigatórios)."));
            }

            try {
                const stmt = db.prepare(`
                    INSERT INTO produtos (
                        CodigoBarras, CodigoFabricante, NomeProduto, Marca,
                        Descricao, Aplicacao, QuantidadeEstoque, EstoqueMinimo,
                        Preco, Localizacao, Ativo
                    ) VALUES (
                        @CodigoBarras, @CodigoFabricante, @NomeProduto, @Marca,
                        @Descricao, @Aplicacao, @QuantidadeEstoque, @EstoqueMinimo,
                        @Preco, @Localizacao, @Ativo
                    )
                `);
                const info = stmt.run({
                    CodigoBarras: productData.CodigoBarras || null,
                    CodigoFabricante: productData.CodigoFabricante,
                    NomeProduto: productData.NomeProduto,
                    Marca: productData.Marca || null,
                    Descricao: productData.Descricao || null,
                    Aplicacao: productData.Aplicacao || null,
                    QuantidadeEstoque: parseInt(productData.QuantidadeEstoque || 0, 10),
                    EstoqueMinimo: parseInt(productData.EstoqueMinimo || 1, 10),
                    Preco: parseFloat(productData.Preco || 0.0),
                    Localizacao: productData.Localizacao || null,
                    Ativo: productData.Ativo === false ? false : true
                });
                const newProductId = info.lastInsertRowid;

                console.log(`[Preload API] addProduct successful. Inserted Product ID: ${newProductId}`);
                return Promise.resolve({ id: newProductId, message: 'Produto adicionado com sucesso!' });
            } catch (err) {
                console.error("[Preload API] Error in addProduct:", err);
                if (err.code && err.code.includes('SQLITE_CONSTRAINT')) { // Trata erros de constraint de forma mais genérica
                    if (err.message.includes('UNIQUE constraint failed: produtos.CodigoFabricante')) { return Promise.reject(new Error(`Erro: Código do Fabricante '${productData.CodigoFabricante}' já existe.`)); }
                    if (err.message.includes('UNIQUE constraint failed: produtos.CodigoBarras')) { return Promise.reject(new Error(`Erro: Código de Barras '${productData.CodigoBarras}' já existe.`)); }
                    return Promise.reject(new Error(`Erro de constraint: ${err.message}`));
                }
                return Promise.reject(err); // Re-lança outros erros
            }
        },

        updateProduct: (id, productData) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!id || !productData) return Promise.reject(new Error("ID do produto e dados para atualização são obrigatórios."));
             // **Importante:** Não permitir atualização direta da QuantidadeEstoque aqui.
             // Ela deve ser alterada via movimentações.
            console.log(`[Preload API] updateProduct called for ID: ${id} with data:`, productData);
            try {
                const stmt = db.prepare(`
                    UPDATE produtos SET
                        CodigoBarras = @CodigoBarras,
                        CodigoFabricante = @CodigoFabricante,
                        NomeProduto = @NomeProduto,
                        Marca = @Marca,
                        Descricao = @Descricao,
                        Aplicacao = @Aplicacao,
                        Preco = @Preco,
                        EstoqueMinimo = @EstoqueMinimo,
                        Localizacao = @Localizacao,
                        Ativo = @Ativo
                    WHERE id_produto = @id_produto
                `);
                const info = stmt.run({
                    id_produto: id,
                    CodigoBarras: productData.CodigoBarras || null,
                    CodigoFabricante: productData.CodigoFabricante,
                    NomeProduto: productData.NomeProduto,
                    Marca: productData.Marca || null,
                    Descricao: productData.Descricao || null,
                    Aplicacao: productData.Aplicacao || null,
                    Preco: parseFloat(productData.Preco || 0.0),
                    EstoqueMinimo: parseInt(productData.EstoqueMinimo || 1, 10),
                    Localizacao: productData.Localizacao || null,
                    Ativo: productData.Ativo === false ? false : true
                });
                if (info.changes === 0) {
                     console.warn(`[Preload API] updateProduct: No rows updated for ID ${id}. Product might not exist.`);
                    return Promise.reject(new Error(`Produto com ID ${id} não encontrado para atualização.`));
                }
                console.log(`[Preload API] updateProduct successful for ID: ${id}. Rows changed: ${info.changes}`);
                return Promise.resolve({ changes: info.changes, message: 'Produto atualizado com sucesso!' });
            } catch (err) {
                 console.error(`[Preload API] Error in updateProduct for ID ${id}:`, err);
                 // Tratar erros de constraint UNIQUE aqui também
                 if (err.code && err.code.includes('SQLITE_CONSTRAINT')) {
                    if (err.message.includes('UNIQUE constraint failed: produtos.CodigoFabricante')) { return Promise.reject(new Error(`Erro: Código do Fabricante '${productData.CodigoFabricante}' já pertence a outro produto.`)); }
                    if (err.message.includes('UNIQUE constraint failed: produtos.CodigoBarras')) { return Promise.reject(new Error(`Erro: Código de Barras '${productData.CodigoBarras}' já pertence a outro produto.`)); }
                    return Promise.reject(new Error(`Erro de constraint ao atualizar: ${err.message}`));
                }
                return Promise.reject(err);
            }
        },

        deleteProduct: (id) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            console.log(`[Preload API] deleteProduct called for ID: ${id}`);
            try {
                 // A chave estrangeira com ON DELETE CASCADE cuidará das movimentações associadas.
                 // Se fosse ON DELETE RESTRICT, a exclusão falharia se houvesse movimentações.
                const stmt = db.prepare('DELETE FROM produtos WHERE id_produto = ?');
                console.log('[Preload API] deleteProduct executing statement...');
                const info = stmt.run(id);
                if (info.changes === 0) {
                     console.warn(`[Preload API] deleteProduct: No rows deleted for ID ${id}. Product might not exist.`);
                     return Promise.reject(new Error(`Produto com ID ${id} não encontrado para exclusão.`));
                }
                console.log(`[Preload API] deleteProduct successful for ID: ${id}. Rows deleted: ${info.changes}`);
                return Promise.resolve({ changes: info.changes, message: 'Produto excluído com sucesso!' });
            } catch (err) {
                console.error(`[Preload API] Error deleting product ID ${id}:`, err);
                 // Exemplo: Se usasse ON DELETE RESTRICT e houvesse movimentações, um erro SQLITE_CONSTRAINT_FOREIGNKEY ocorreria aqui.
                 if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
                     return Promise.reject(new Error(`Não é possível excluir o produto ID ${id} pois ele possui histórico de movimentações.`));
                 }
                return Promise.reject(err);
            }
        },

        // Nova função para desativar um produto
        desativarProduto: (id) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            console.log(`[Preload API] desativarProduto called for ID: ${id}`);
            try {
                const stmt = db.prepare('UPDATE produtos SET Ativo = FALSE WHERE id_produto = ?');
                const info = stmt.run(id);
                if (info.changes === 0) {
                    console.warn(`[Preload API] desativarProduto: No rows updated for ID ${id}. Product might not exist.`);
                    return Promise.reject(new Error(`Produto com ID ${id} não encontrado para desativar.`));
                }
                console.log(`[Preload API] desativarProduto successful for ID: ${id}. Rows changed: ${info.changes}`);
                return Promise.resolve({ changes: info.changes, message: 'Produto desativado com sucesso!' });
            } catch (err) {
                console.error(`[Preload API] Error desativando product ID ${id}:`, err);
                return Promise.reject(err);
            }
        },

        // --- Funções de Compra e Venda (NOVAS) ---
        addCompra: (compraData) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!compraData || !compraData.id_produto || !compraData.quantidade || !compraData.preco_unitario) {
                return Promise.reject(new Error("Dados da compra incompletos."));
            }

            try {
                const stmt = db.prepare(`
                    INSERT INTO historico_compras (
                        id_produto, quantidade, preco_unitario, preco_total,
                        numero_nota_fiscal, observacoes, usuario_compra, nome_fornecedor
                    ) VALUES (
                        @id_produto, @quantidade, @preco_unitario, @preco_total,
                        @numero_nota_fiscal, @observacoes, @usuario_compra, @nome_fornecedor
                    )
                `);

                const precoTotal = compraData.quantidade * compraData.preco_unitario;

                const info = stmt.run({
                    id_produto: compraData.id_produto,
                    quantidade: compraData.quantidade,
                    preco_unitario: compraData.preco_unitario,
                    preco_total: precoTotal,
                    numero_nota_fiscal: compraData.numero_nota_fiscal || null,
                    observacoes: compraData.observacoes || null,
                    usuario_compra: compraData.usuario_compra || null,
                    nome_fornecedor: compraData.nome_fornecedor || null
                });

                console.log(`[Preload API] addCompra successful. Inserted Compra ID: ${info.lastInsertRowid}`);
                 // Após a compra, atualizar o estoque
                const stmtUpdateEstoque = db.prepare('UPDATE produtos SET QuantidadeEstoque = QuantidadeEstoque + ? WHERE id_produto = ?');
                stmtUpdateEstoque.run(compraData.quantidade, compraData.id_produto);

                return Promise.resolve({ id: info.lastInsertRowid, message: 'Compra adicionada com sucesso!' });

            } catch (err) {
                console.error("[Preload API] Error in addCompra:", err);
                return Promise.reject(err);
            }
        },

        addVenda: (vendaData) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!vendaData || !vendaData.id_produto || !vendaData.quantidade || !vendaData.preco_unitario) {
                return Promise.reject(new Error("Dados da venda incompletos."));
            }

            try {
                const stmt = db.prepare(`
                    INSERT INTO historico_vendas (
                        id_produto, quantidade, preco_unitario, preco_total,
                        numero_recibo, observacoes, usuario_venda, nome_cliente
                    ) VALUES (
                        @id_produto, @quantidade, @preco_unitario, @preco_total,
                        @numero_recibo, @observacoes, @usuario_venda, @nome_cliente
                    )
                `);

                const precoTotal = vendaData.quantidade * vendaData.preco_unitario;

                const info = stmt.run({
                    id_produto: vendaData.id_produto,
                    quantidade: vendaData.quantidade,
                    preco_unitario: vendaData.preco_unitario,
                    preco_total: precoTotal,
                    numero_recibo: vendaData.numero_recibo || null,
                    observacoes: vendaData.observacoes || null,
                    usuario_venda: vendaData.usuario_venda || null,
                    nome_cliente: vendaData.nome_cliente || null
                });

                console.log(`[Preload API] addVenda successful. Inserted Venda ID: ${info.lastInsertRowid}`);

                 // Após a venda, atualizar o estoque (diminuir)
                const stmtUpdateEstoque = db.prepare('UPDATE produtos SET QuantidadeEstoque = QuantidadeEstoque - ? WHERE id_produto = ?');
                stmtUpdateEstoque.run(vendaData.quantidade, vendaData.id_produto);

                return Promise.resolve({ id: info.lastInsertRowid, message: 'Venda adicionada com sucesso!' });

            } catch (err) {
                console.error("[Preload API] Error in addVenda:", err);
                return Promise.reject(err);
            }
        },

        // --- Funções de Histórico (AJUSTADAS) ---
        // getStockMovements => historico_compras e historico_vendas separadamente
        getHistoricoCompras: (productId) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                console.log(`[Preload API] getHistoricoCompras executing query for Product ID: ${productId}...`);
                const stmt = db.prepare(`
                    SELECT
                        id_compra,
                        strftime('%d/%m/%Y %H:%M:%S', data_compra) as data_compra_formatada,
                        quantidade,
                        preco_unitario,
                        preco_total,
                        numero_nota_fiscal,
                        observacoes,
                        nome_fornecedor,
                        usuario_compra
                    FROM historico_compras
                    WHERE id_produto = ?
                    ORDER BY data_compra DESC
                `);
                const movements = stmt.all(productId);
                console.log(`[Preload API] getHistoricoCompras returning ${movements.length} movements for Product ID ${productId}.`);
                return Promise.resolve(movements);
            } catch (err) {
                console.error(`[Preload API] Error fetching historico_compras for Product ID ${productId}:`, err);
                return Promise.reject(err);
            }
        },

        getHistoricoVendas: (productId) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                console.log(`[Preload API] getHistoricoVendas executing query for Product ID: ${productId}...`);
                const stmt = db.prepare(`
                    SELECT
                        id_venda,
                        strftime('%d/%m/%Y %H:%M:%S', data_venda) as data_venda_formatada,
                        quantidade,
                        preco_unitario,
                        preco_total,
                        numero_recibo,
                        observacoes,
                        nome_cliente,
                        usuario_venda
                    FROM historico_vendas
                    WHERE id_produto = ?
                    ORDER BY data_venda DESC
                `);
                const movements = stmt.all(productId);
                console.log(`[Preload API] getHistoricoVendas returning ${movements.length} movements for Product ID ${productId}.`);
                return Promise.resolve(movements);
            } catch (err) {
                console.error(`[Preload API] Error fetching historico_vendas for Product ID ${productId}:`, err);
                return Promise.reject(err);
            }
        },


        // Função para fechar o DB ao sair
        closeDatabase: () => {
            if (db && db.open) {
                console.log('[Preload API] Attempting to close database connection...');
                db.close();
                if (!db.open) {
                    console.log('[Preload API] Database connection closed successfully.');
                    db = null; // Limpa a referência
                } else {
                    console.error('[Preload API] Failed to close database connection.');
                }
            } else {
                console.log('[Preload API] closeDatabase called, but DB was not open or already closed.');
            }
        }
    });
    console.log('[Preload] API exposed successfully via contextBridge.');

} catch (bridgeError) {
    console.error('[Preload] !!! ERROR exposing API via contextBridge !!!', bridgeError);
}

console.log('[Preload] Script finished.');
// --- END OF FILE preload.js ---