// --- START OF FILE preload.cjs (MODIFICADO) ---

console.log('[Preload] Script starting...');
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os'); // Mantenha para diagnóstico se precisar
const Database = require('better-sqlite3');

let db;
// Use __dirname se o preload.js estiver na mesma pasta que o main.js
// Se estiver em src/preload, ajuste o caminho para subir um nível: path.join(__dirname, '..', 'estoque.db')
// Assumindo que está na raiz junto com o main.js por enquanto:
// const dbPath = path.join(process.resourcesPath, 'estoque.db'); // Caminho mais robusto para produção
// Para desenvolvimento, pode usar: const dbPath = path.join(__dirname, 'estoque.db');
const dbPath = path.join(__dirname, 'estoque.db');
console.log('[Preload] Database path target:', dbPath);


try {
    console.log('[Preload] Attempting to connect to SQLite DB...');
    db = new Database(dbPath, { timeout: 5000 /*, verbose: console.log */ });
    console.log('[Preload] SQLite connection established successfully.');

    db.pragma('journal_mode = WAL;');
    db.pragma('foreign_keys = ON;'); // Habilitar chaves estrangeiras é crucial!
    console.log('[Preload] PRAGMAs set: journal_mode=WAL, foreign_keys=ON.');

    // --- Criação/Verificação das Tabelas (mantendo a estrutura anterior) ---
    // Tabela Produtos
    db.exec(`
        CREATE TABLE IF NOT EXISTS produtos (
            id_produto INTEGER PRIMARY KEY AUTOINCREMENT,
            CodigoBarras VARCHAR(255) UNIQUE NULL,
            CodigoFabricante VARCHAR(255) UNIQUE NULL,
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
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE RESTRICT -- Alterado para RESTRICT para segurança
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
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE RESTRICT -- Alterado para RESTRICT para segurança
            -- FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) -- Se tiver tabela de clientes
        );
    `);
    console.log('[Preload] Tabela "historico_vendas" verificada/criada.');

    // Trigger para atualizar DataUltimaAtualizacao na tabela produtos
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_product_timestamp
        AFTER UPDATE ON produtos
        FOR EACH ROW
        WHEN OLD.DataUltimaAtualizacao = NEW.DataUltimaAtualizacao -- Evita loop infinito se trigger atualizar o timestamp
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
    ipcRenderer.send('db-error', err.message); // Informar o main process
}

// --- Expor Funções para o Renderer (AJUSTADAS E NOVAS FUNÇÕES) ---
console.log('[Preload] Attempting to expose API via contextBridge...');
try {
    if (!db) {
        // Se o DB falhou ao iniciar, expõe um objeto API 'vazio' ou com funções que retornam erro
        console.error("[Preload] Database connection failed. Exposing limited/error API.");
        contextBridge.exposeInMainWorld('api', {
            // Funções que indicam o erro
            getProducts: () => Promise.reject(new Error("Banco de dados não conectado.")),
            getProductById: () => Promise.reject(new Error("Banco de dados não conectado.")),
            addProduct: () => Promise.reject(new Error("Banco de dados não conectado.")),
            updateProduct: () => Promise.reject(new Error("Banco de dados não conectado.")),
            deleteProduct: () => Promise.reject(new Error("Banco de dados não conectado.")),
            desativarProduto: () => Promise.reject(new Error("Banco de dados não conectado.")),
            addCompra: () => Promise.reject(new Error("Banco de dados não conectado.")),
            addVenda: () => Promise.reject(new Error("Banco de dados não conectado.")),
            getHistoricoCompras: () => Promise.reject(new Error("Banco de dados não conectado.")),
            getHistoricoVendas: () => Promise.reject(new Error("Banco de dados não conectado.")),
            getFilteredHistoricoCompras: () => Promise.reject(new Error("Banco de dados não conectado.")), // Nova
            getFilteredHistoricoVendas: () => Promise.reject(new Error("Banco de dados não conectado.")), // Nova
            closeDatabase: () => { console.warn("[Preload API] DB not connected, cannot close.") },
        });
        throw new Error("Database connection failed during setup."); // Interrompe a execução do try
    }

    // Se o DB conectou, expõe a API completa
    contextBridge.exposeInMainWorld('api', {
        // --- Funções de Produto (mantidas como antes) ---
        getProducts: (searchTerm = null, includeInactive = false) => {
             // Código da função getProducts... (sem alterações)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                let query = `
                    SELECT id_produto, Marca, CodigoFabricante, NomeProduto, QuantidadeEstoque, Preco, Localizacao, EstoqueMinimo, Aplicacao, Ativo
                    FROM produtos
                `;
                const params = [];
                const conditions = [];

                if (!includeInactive) {
                    conditions.push("Ativo = TRUE");
                }

                if (searchTerm) {
                    conditions.push(`(NomeProduto LIKE ? OR CodigoFabricante LIKE ? OR Marca LIKE ? OR Aplicacao LIKE ? OR CodigoBarras LIKE ?)`);
                    const likeTerm = `%${searchTerm}%`;
                    params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
                }

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
             // Código da função getProductById... (sem alterações)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                console.log(`[Preload API] getProductById executing query for ID: ${id}...`);
                const stmt = db.prepare('SELECT * FROM produtos WHERE id_produto = ?');
                const product = stmt.get(id);
                if (!product) {
                    console.warn(`[Preload API] getProductById: Product with ID ${id} not found.`);
                    return Promise.resolve(null);
                }
                console.log(`[Preload API] getProductById returning product data for ID: ${id}.`);
                return Promise.resolve(product);
            } catch (err) {
                console.error(`[Preload API] Error in getProductById query for ID ${id}:`, err);
                return Promise.reject(err);
            }
        },

        addProduct: (productData) => {
            // Código da função addProduct... (sem alterações)
             if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!productData || !productData.CodigoFabricante || !productData.NomeProduto) {
                return Promise.reject(new Error("Dados incompletos (Código Fabricante e Nome são obrigatórios)."));
            }

            const transaction = db.transaction(() => {
                const stmtCheckFab = db.prepare('SELECT id_produto FROM produtos WHERE CodigoFabricante = ?');
                if (productData.CodigoFabricante && stmtCheckFab.get(productData.CodigoFabricante)) {
                    throw new Error(`Código do Fabricante '${productData.CodigoFabricante}' já existe.`);
                }
                const stmtCheckBar = db.prepare('SELECT id_produto FROM produtos WHERE CodigoBarras = ?');
                 if (productData.CodigoBarras && stmtCheckBar.get(productData.CodigoBarras)) {
                    throw new Error(`Código de Barras '${productData.CodigoBarras}' já existe.`);
                }

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
                return info.lastInsertRowid;
            });

            try {
                const newProductId = transaction();
                console.log(`[Preload API] addProduct successful. Inserted Product ID: ${newProductId}`);
                return Promise.resolve({ id: newProductId, message: 'Produto adicionado com sucesso!' });
            } catch (err) {
                console.error("[Preload API] Error in addProduct:", err);
                 // O erro já vem formatado da transaction
                 return Promise.reject(err);
            }
        },

        updateProduct: (id, productData) => {
             // Código da função updateProduct... (sem alterações, exceto checagem de duplicidade)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!id || !productData) return Promise.reject(new Error("ID do produto e dados para atualização são obrigatórios."));
            console.log(`[Preload API] updateProduct called for ID: ${id} with data:`, productData);

             const transaction = db.transaction(() => {
                 // Verificar duplicidade de CodigoFabricante (exceto para o próprio ID)
                const stmtCheckFab = db.prepare('SELECT id_produto FROM produtos WHERE CodigoFabricante = ? AND id_produto != ?');
                if (productData.CodigoFabricante && stmtCheckFab.get(productData.CodigoFabricante, id)) {
                    throw new Error(`Código do Fabricante '${productData.CodigoFabricante}' já pertence a outro produto.`);
                }
                 // Verificar duplicidade de CodigoBarras (exceto para o próprio ID)
                const stmtCheckBar = db.prepare('SELECT id_produto FROM produtos WHERE CodigoBarras = ? AND id_produto != ?');
                 if (productData.CodigoBarras && stmtCheckBar.get(productData.CodigoBarras, id)) {
                    throw new Error(`Código de Barras '${productData.CodigoBarras}' já pertence a outro produto.`);
                }

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
                        /* DataUltimaAtualizacao será atualizada pelo trigger */
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
                     // Lança um erro se nada foi alterado, pode ser que o ID não exista
                    throw new Error(`Produto com ID ${id} não encontrado ou nenhum dado foi alterado.`);
                }
                return info.changes; // Retorna o número de linhas alteradas
            });

            try {
                const changes = transaction();
                console.log(`[Preload API] updateProduct successful for ID: ${id}. Rows changed: ${changes}`);
                return Promise.resolve({ changes: changes, message: 'Produto atualizado com sucesso!' });
            } catch (err) {
                 console.error(`[Preload API] Error in updateProduct for ID ${id}:`, err);
                 return Promise.reject(err); // O erro já vem formatado da transaction
            }
        },

        deleteProduct: (id) => {
             // Código da função deleteProduct... (alterado para usar transaction e verificar RESTRICT)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            console.log(`[Preload API] deleteProduct called for ID: ${id}`);

            const transaction = db.transaction(() => {
                 // Verificar se há histórico associado (por causa do ON DELETE RESTRICT)
                const stmtCheckCompras = db.prepare('SELECT 1 FROM historico_compras WHERE id_produto = ? LIMIT 1');
                if (stmtCheckCompras.get(id)) {
                    throw new Error(`Não é possível excluir o produto ID ${id} pois ele possui histórico de compras.`);
                }
                const stmtCheckVendas = db.prepare('SELECT 1 FROM historico_vendas WHERE id_produto = ? LIMIT 1');
                if (stmtCheckVendas.get(id)) {
                    throw new Error(`Não é possível excluir o produto ID ${id} pois ele possui histórico de vendas.`);
                }

                // Se não houver histórico, prosseguir com a exclusão
                const stmt = db.prepare('DELETE FROM produtos WHERE id_produto = ?');
                console.log('[Preload API] deleteProduct executing statement...');
                const info = stmt.run(id);
                if (info.changes === 0) {
                     console.warn(`[Preload API] deleteProduct: No rows deleted for ID ${id}. Product might not exist.`);
                     // Lança erro se não excluiu, pode não existir
                     throw new Error(`Produto com ID ${id} não encontrado para exclusão.`);
                }
                return info.changes;
            });

             try {
                const changes = transaction();
                console.log(`[Preload API] deleteProduct successful for ID: ${id}. Rows deleted: ${changes}`);
                return Promise.resolve({ changes: changes, message: 'Produto excluído com sucesso!' });
            } catch (err) {
                console.error(`[Preload API] Error deleting product ID ${id}:`, err);
                return Promise.reject(err); // Erro já formatado pela transaction
            }
        },

        desativarProduto: (id) => {
            // Código da função desativarProduto... (sem alterações)
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

        // --- Funções de Compra e Venda (addCompra/addVenda inalteradas) ---
        addCompra: (compraData) => {
            // Código da função addCompra... (sem alterações)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!compraData || !compraData.id_produto || !compraData.quantidade || !compraData.preco_unitario) {
                return Promise.reject(new Error("Dados da compra incompletos (Produto, Quantidade, Preço Unitário)."));
            }
            if (parseInt(compraData.quantidade, 10) <= 0) {
                 return Promise.reject(new Error("A quantidade da compra deve ser maior que zero."));
            }


            const transaction = db.transaction(() => {
                 // Verifica se o produto existe e está ativo
                const productStmt = db.prepare('SELECT Ativo FROM produtos WHERE id_produto = ?');
                const product = productStmt.get(compraData.id_produto);
                if (!product) {
                    throw new Error(`Produto com ID ${compraData.id_produto} não encontrado.`);
                }
                // Opcional: Permitir compra de produto inativo? Se não, descomente abaixo.
                if (!product.Ativo) {
                     throw new Error(`Produto com ID ${compraData.id_produto} está inativo e não pode receber compras.`);
                }

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
                    usuario_compra: compraData.usuario_compra || null, // Adicionar lógica de usuário se necessário
                    nome_fornecedor: compraData.nome_fornecedor || null
                });

                 // Após a compra, atualizar o estoque
                const stmtUpdateEstoque = db.prepare('UPDATE produtos SET QuantidadeEstoque = QuantidadeEstoque + ? WHERE id_produto = ?');
                stmtUpdateEstoque.run(compraData.quantidade, compraData.id_produto);

                return info.lastInsertRowid; // Retorna o ID da compra inserida
            });

            try {
                const newCompraId = transaction();
                console.log(`[Preload API] addCompra successful. Inserted Compra ID: ${newCompraId}`);
                return Promise.resolve({ id: newCompraId, message: 'Compra adicionada com sucesso!' });
            } catch (err) {
                console.error("[Preload API] Error in addCompra:", err);
                return Promise.reject(err); // Erro já formatado pela transaction
            }
        },

        addVenda: (vendaData) => {
            // Código da função addVenda... (sem alterações, apenas validação de estoque)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!vendaData || !vendaData.id_produto || !vendaData.quantidade || !vendaData.preco_unitario) {
                return Promise.reject(new Error("Dados da venda incompletos (Produto, Quantidade, Preço Unitário)."));
            }
             if (parseInt(vendaData.quantidade, 10) <= 0) {
                 return Promise.reject(new Error("A quantidade da venda deve ser maior que zero."));
            }

             const transaction = db.transaction(() => {
                // Verifica se o produto existe, está ativo e tem estoque suficiente
                const productStmt = db.prepare('SELECT QuantidadeEstoque, Ativo, NomeProduto FROM produtos WHERE id_produto = ?');
                const product = productStmt.get(vendaData.id_produto);
                if (!product) {
                    throw new Error(`Produto com ID ${vendaData.id_produto} não encontrado.`);
                }
                 if (!product.Ativo) {
                    throw new Error(`Produto '${product.NomeProduto}' (ID: ${vendaData.id_produto}) está inativo e não pode ser vendido.`);
                }
                if (product.QuantidadeEstoque < vendaData.quantidade) {
                    throw new Error(`Estoque insuficiente para o produto '${product.NomeProduto}'. Disponível: ${product.QuantidadeEstoque}, Solicitado: ${vendaData.quantidade}.`);
                }


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
                    usuario_venda: vendaData.usuario_venda || null, // Adicionar lógica de usuário se necessário
                    nome_cliente: vendaData.nome_cliente || null
                });

                 // Após a venda, atualizar o estoque (diminuir)
                const stmtUpdateEstoque = db.prepare('UPDATE produtos SET QuantidadeEstoque = QuantidadeEstoque - ? WHERE id_produto = ?');
                stmtUpdateEstoque.run(vendaData.quantidade, vendaData.id_produto);

                return info.lastInsertRowid; // Retorna o ID da venda inserida
            });

            try {
                const newVendaId = transaction();
                console.log(`[Preload API] addVenda successful. Inserted Venda ID: ${newVendaId}`);
                return Promise.resolve({ id: newVendaId, message: 'Venda adicionada com sucesso!' });
            } catch (err) {
                console.error("[Preload API] Error in addVenda:", err);
                return Promise.reject(err); // Erro já formatado pela transaction
            }
        },

        // --- Funções de Histórico (getHistoricoCompras/Vendas para UM produto - mantidas) ---
        getHistoricoCompras: (productId) => {
            // Código da função getHistoricoCompras... (sem alterações)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
             try {
                console.log(`[Preload API] getHistoricoCompras executing query for Product ID: ${productId}...`);
                const stmt = db.prepare(`
                    SELECT
                        hc.id_compra,
                        strftime('%d/%m/%Y %H:%M:%S', hc.data_compra) as data_compra_formatada,
                        hc.quantidade,
                        hc.preco_unitario,
                        hc.preco_total,
                        hc.numero_nota_fiscal,
                        hc.observacoes,
                        hc.nome_fornecedor,
                        hc.usuario_compra,
                        p.NomeProduto,
                        p.CodigoFabricante
                    FROM historico_compras hc
                    JOIN produtos p ON hc.id_produto = p.id_produto
                    WHERE hc.id_produto = ?
                    ORDER BY hc.data_compra DESC
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
            // Código da função getHistoricoVendas... (sem alterações)
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                console.log(`[Preload API] getHistoricoVendas executing query for Product ID: ${productId}...`);
                const stmt = db.prepare(`
                    SELECT
                        hv.id_venda,
                        strftime('%d/%m/%Y %H:%M:%S', hv.data_venda) as data_venda_formatada,
                        hv.quantidade,
                        hv.preco_unitario,
                        hv.preco_total,
                        hv.numero_recibo,
                        hv.observacoes,
                        hv.nome_cliente,
                        hv.usuario_venda,
                        p.NomeProduto,
                        p.CodigoFabricante
                    FROM historico_vendas hv
                    JOIN produtos p ON hv.id_produto = p.id_produto
                    WHERE hv.id_produto = ?
                    ORDER BY hv.data_venda DESC
                `);
                const movements = stmt.all(productId);
                console.log(`[Preload API] getHistoricoVendas returning ${movements.length} movements for Product ID ${productId}.`);
                return Promise.resolve(movements);
            } catch (err) {
                console.error(`[Preload API] Error fetching historico_vendas for Product ID ${productId}:`, err);
                return Promise.reject(err);
            }
        },

        // --- NOVAS Funções de Histórico Filtrado ---
        getFilteredHistoricoCompras: (filters = {}) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                const { nomeFornecedor, produtoId } = filters;
                console.log(`[Preload API] getFilteredHistoricoCompras executing query with filters:`, filters);

                let query = `
                    SELECT
                        hc.id_compra,
                        strftime('%d/%m/%Y %H:%M:%S', hc.data_compra) as data_compra_formatada,
                        hc.quantidade,
                        hc.preco_unitario,
                        hc.preco_total,
                        hc.numero_nota_fiscal,
                        hc.observacoes,
                        hc.nome_fornecedor,
                        hc.usuario_compra,
                        p.NomeProduto,
                        p.CodigoFabricante
                    FROM historico_compras hc
                    JOIN produtos p ON hc.id_produto = p.id_produto
                `;
                const params = [];
                const conditions = [];

                if (produtoId) {
                    conditions.push('hc.id_produto = ?');
                    params.push(produtoId);
                }
                if (nomeFornecedor) {
                    conditions.push('hc.nome_fornecedor LIKE ?');
                    params.push(`%${nomeFornecedor}%`);
                }

                if (conditions.length > 0) {
                    query += ` WHERE ${conditions.join(' AND ')}`;
                }

                query += ' ORDER BY hc.data_compra DESC'; // Ordenar sempre

                const stmt = db.prepare(query);
                const compras = stmt.all(params);
                console.log(`[Preload API] getFilteredHistoricoCompras returning ${compras.length} records.`);
                return Promise.resolve(compras);
            } catch (err) {
                console.error(`[Preload API] Error fetching filtered historico_compras:`, err);
                return Promise.reject(err);
            }
        },

        getFilteredHistoricoVendas: (filters = {}) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
             try {
                const { nomeCliente, produtoId } = filters;
                console.log(`[Preload API] getFilteredHistoricoVendas executing query with filters:`, filters);

                let query = `
                    SELECT
                        hv.id_venda,
                        strftime('%d/%m/%Y %H:%M:%S', hv.data_venda) as data_venda_formatada,
                        hv.quantidade,
                        hv.preco_unitario,
                        hv.preco_total,
                        hv.numero_recibo,
                        hv.observacoes,
                        hv.nome_cliente,
                        hv.usuario_venda,
                        p.NomeProduto,
                        p.CodigoFabricante
                    FROM historico_vendas hv
                    JOIN produtos p ON hv.id_produto = p.id_produto
                `;
                const params = [];
                const conditions = [];

                if (produtoId) {
                    conditions.push('hv.id_produto = ?');
                    params.push(produtoId);
                }
                if (nomeCliente) {
                    conditions.push('hv.nome_cliente LIKE ?');
                    params.push(`%${nomeCliente}%`);
                }

                if (conditions.length > 0) {
                    query += ` WHERE ${conditions.join(' AND ')}`;
                }

                query += ' ORDER BY hv.data_venda DESC'; // Ordenar sempre

                const stmt = db.prepare(query);
                const vendas = stmt.all(params);
                console.log(`[Preload API] getFilteredHistoricoVendas returning ${vendas.length} records.`);
                return Promise.resolve(vendas);
            } catch (err) {
                console.error(`[Preload API] Error fetching filtered historico_vendas:`, err);
                return Promise.reject(err);
            }
        },


        // Função para fechar o DB ao sair
        closeDatabase: () => {
            if (db && db.open) {
                console.log('[Preload API] Attempting to close database connection...');
                 try {
                    db.close();
                    if (!db.open) {
                        console.log('[Preload API] Database connection closed successfully.');
                        db = null; // Limpa a referência
                        return Promise.resolve("Database closed successfully.");
                    } else {
                        console.error('[Preload API] Failed to close database connection.');
                        return Promise.reject(new Error("Failed to close database."));
                    }
                } catch (err) {
                     console.error('[Preload API] Error closing database:', err);
                     return Promise.reject(err);
                }
            } else {
                console.log('[Preload API] closeDatabase called, but DB was not open or already closed.');
                return Promise.resolve("Database was not open.");
            }
        }
    });
    console.log('[Preload] API exposed successfully via contextBridge.');

} catch (bridgeError) {
    console.error('[Preload] !!! ERROR exposing API via contextBridge !!!', bridgeError);
    // Se ocorrer um erro aqui, o objeto 'api' pode não estar disponível no renderer
    // O erro de DB já foi tratado acima, mas pode haver outros erros de bridge.
}

// Cleanup listener para fechar o banco ao recarregar/fechar a janela no dev mode
// Em produção, o ideal é fechar no 'before-quit' do app no main process
if (process.env.NODE_ENV === 'development') {
    window.addEventListener('beforeunload', () => {
        console.log('[Preload] beforeunload event triggered. Attempting to close DB...');
        if (db && db.open) {
            db.close();
            console.log('[Preload] DB closed on beforeunload.');
        }
    });
}


console.log('[Preload] Script finished.');
// --- END OF FILE preload.cjs ---