// --- START OF FILE preload.cjs (MODIFICADO) ---

console.log('[Preload] Script starting...');
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os'); // Mantenha para diagnóstico se precisar
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt'); // Importa bcrypt

const saltRounds = 10; // Fator de custo para o hash bcrypt

let db;
// Use __dirname se o preload.js estiver na mesma pasta que o main.js
// Se estiver em src/preload, ajuste o caminho para subir um nível: path.join(__dirname, '..', 'estoque.db')
// Assumindo que está na raiz junto com o main.js por enquanto:
// const dbPath = path.join(process.resourcesPath, 'estoque.db'); // Caminho mais robusto para produção
// Para desenvolvimento, pode usar: const dbPath = path.join(__dirname, 'estoque.db');
const dbPath = path.join(__dirname, 'estoque2.db');
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

    // Tabela Usuários (NOVA ou Verifica Existência)
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_usuario VARCHAR(50) NOT NULL UNIQUE,
            senha_hash VARCHAR(255) NOT NULL,
            nome_completo VARCHAR(100) NOT NULL,
            permissao VARCHAR(20) NOT NULL DEFAULT 'vendedor', -- 'admin', 'vendedor'
            ativo BOOLEAN NOT NULL DEFAULT TRUE,
            data_cadastro DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            data_ultimo_login DATETIME NULL
        );
    `);
    console.log('[Preload] Tabela "usuarios" verificada/criada.');
    db.exec(`CREATE INDEX IF NOT EXISTS idx_usuarios_nome_usuario ON usuarios (nome_usuario);`);

    // Garante que o usuário admin exista (apenas na primeira vez)
    // A senha 'admin123' será hashada
    const adminExists = db.prepare('SELECT 1 FROM usuarios WHERE nome_usuario = ?').get('admin');
    if (!adminExists) {
        console.log('[Preload] Usuário "admin" não encontrado. Criando usuário admin padrão...');
        const adminPassword = 'admin'; // Senha padrão inicial
        bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
            if (err) {
                console.error('[Preload] Erro ao gerar hash para senha admin:', err);
            } else {
                try {
                    db.prepare(`
                        INSERT INTO usuarios (nome_usuario, senha_hash, nome_completo, permissao)
                        VALUES (?, ?, ?, ?)
                    `).run('admin', hash, 'Administrador', 'admin');
                    console.log('[Preload] Usuário "admin" criado com senha padrão.');
                } catch (insertErr) {
                     console.error('[Preload] Erro ao inserir usuário admin padrão:', insertErr);
                }
            }
        });
    }

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
            id_usuario_compra INTEGER NULL,
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE RESTRICT -- Alterado para RESTRICT para segurança
            FOREIGN KEY (id_usuario_compra) REFERENCES usuarios(id_usuario) ON DELETE SET NULL -- << NOVA FK
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
            id_usuario_venda INTEGER NULL,
            FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE RESTRICT -- Alterado para RESTRICT para segurança
            FOREIGN KEY (id_usuario_venda) REFERENCES usuarios(id_usuario) ON DELETE SET NULL -- << NOVA FK
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
            login: () => Promise.reject(new Error("Banco de dados não conectado.")),
            addUser: () => Promise.reject(new Error("Banco de dados não conectado.")),
            getAllUsers: () => Promise.reject(new Error("Banco de dados não conectado.")),
            updateUser: () => Promise.reject(new Error("Banco de dados não conectado.")),
            toggleUserActive: () => Promise.reject(new Error("Banco de dados não conectado.")), // Nova
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

        desativarProduto: async (id) => { // Alterado para async/await
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            console.log(`[Preload API] desativarProduto/ativarProduto called for ID: ${id}`);
            try {
                // Primeiro, verifica o estado atual
                const stmtCheck = db.prepare('SELECT Ativo FROM produtos WHERE id_produto = ?');
                const product = stmtCheck.get(id);

                if (!product) {
                    return Promise.reject(new Error(`Produto com ID ${id} não encontrado.`));
                }

                const novoEstado = !product.Ativo; // Inverte o estado atual

                const stmt = db.prepare('UPDATE produtos SET Ativo = ? WHERE id_produto = ?');
                const info = stmt.run(novoEstado, id);

                if (info.changes === 0) {
                    // Isso não deveria acontecer se o produto foi encontrado antes, mas é uma segurança
                    console.warn(`[Preload API] toggleAtivo: No rows updated for ID ${id}.`);
                    return Promise.reject(new Error(`Produto com ID ${id} não encontrado para alterar estado.`));
                }

                const message = novoEstado ? 'Produto ativado com sucesso!' : 'Produto desativado com sucesso!';
                console.log(`[Preload API] toggleAtivo successful for ID: ${id}. Rows changed: ${info.changes}. Novo estado: ${novoEstado}`);
                return Promise.resolve({ changes: info.changes, message: message, novoEstado: novoEstado });
            } catch (err) {
                console.error(`[Preload API] Error toggling ativo for product ID ${id}:`, err);
                return Promise.reject(err);
            }
        },

        // --- Funções de Compra e Venda (ATUALIZADAS) ---
        addCompra: (compraData) => { // Recebe compraData que agora inclui idUsuarioLogado
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!compraData || !compraData.id_produto || !compraData.quantidade || !compraData.preco_unitario || !compraData.idUsuarioLogado) { // Verifica idUsuarioLogado
                return Promise.reject(new Error("Dados da compra incompletos (Produto, Qtd, Preço, Usuário)."));
            }
             // ... (validações de quantidade existentes) ...
             if (parseInt(compraData.quantidade, 10) <= 0) {
                 return Promise.reject(new Error("A quantidade da compra deve ser maior que zero."));
             }

            const transaction = db.transaction(() => {
                 // ... (verificações de produto existentes) ...
                 const productStmt = db.prepare('SELECT Ativo FROM produtos WHERE id_produto = ?');
                 const product = productStmt.get(compraData.id_produto);
                 if (!product) throw new Error(`Produto com ID ${compraData.id_produto} não encontrado.`);
                 // if (!product.Ativo) throw new Error(`Produto com ID ${compraData.id_produto} está inativo.`); // Descomente se necessário

                const stmt = db.prepare(`
                    INSERT INTO historico_compras (
                        id_produto, quantidade, preco_unitario, preco_total,
                        numero_nota_fiscal, observacoes, nome_fornecedor, id_usuario_compra -- Nome da coluna atualizado
                    ) VALUES (
                        @id_produto, @quantidade, @preco_unitario, @preco_total,
                        @numero_nota_fiscal, @observacoes, @nome_fornecedor, @id_usuario_compra -- Parâmetro atualizado
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
                    nome_fornecedor: compraData.nome_fornecedor || null,
                    id_usuario_compra: compraData.idUsuarioLogado // << USA O ID DO USUÁRIO LOGADO
                });

                // Trigger cuida da atualização do estoque
                return info.lastInsertRowid;
            });

            try {
                const newCompraId = transaction();
                console.log(`[Preload API] addCompra successful by user ${compraData.idUsuarioLogado}. Inserted Compra ID: ${newCompraId}`);
                return Promise.resolve({ id: newCompraId, message: 'Compra adicionada com sucesso!' });
            } catch (err) {
                console.error("[Preload API] Error in addCompra:", err);
                return Promise.reject(err);
            }
        },

        addVenda: (vendaData) => { // Recebe vendaData que agora inclui idUsuarioLogado
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!vendaData || !vendaData.id_produto || !vendaData.quantidade || !vendaData.preco_unitario || !vendaData.idUsuarioLogado) { // Verifica idUsuarioLogado
                return Promise.reject(new Error("Dados da venda incompletos (Produto, Qtd, Preço, Usuário)."));
            }
            // ... (validações de quantidade e estoque existentes) ...
            if (parseInt(vendaData.quantidade, 10) <= 0) {
                 return Promise.reject(new Error("A quantidade da venda deve ser maior que zero."));
            }


            const transaction = db.transaction(() => {
                 // ... (verificações de produto e estoque existentes) ...
                 const productStmt = db.prepare('SELECT QuantidadeEstoque, Ativo, NomeProduto FROM produtos WHERE id_produto = ?');
                 const product = productStmt.get(vendaData.id_produto);
                 if (!product) throw new Error(`Produto com ID ${vendaData.id_produto} não encontrado.`);
                 if (!product.Ativo) throw new Error(`Produto '${product.NomeProduto}' está inativo.`);
                 if (product.QuantidadeEstoque < vendaData.quantidade) throw new Error(`Estoque insuficiente para '${product.NomeProduto}'. Disp: ${product.QuantidadeEstoque}.`);

                const stmt = db.prepare(`
                    INSERT INTO historico_vendas (
                        id_produto, quantidade, preco_unitario, preco_total,
                        numero_recibo, observacoes, nome_cliente, id_usuario_venda -- Nome da coluna atualizado
                    ) VALUES (
                        @id_produto, @quantidade, @preco_unitario, @preco_total,
                        @numero_recibo, @observacoes, @nome_cliente, @id_usuario_venda -- Parâmetro atualizado
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
                    nome_cliente: vendaData.nome_cliente || null,
                    id_usuario_venda: vendaData.idUsuarioLogado // << USA O ID DO USUÁRIO LOGADO
                });

                // Trigger cuida da atualização do estoque
                return info.lastInsertRowid;
            });

            try {
                const newVendaId = transaction();
                console.log(`[Preload API] addVenda successful by user ${vendaData.idUsuarioLogado}. Inserted Venda ID: ${newVendaId}`);
                return Promise.resolve({ id: newVendaId, message: 'Venda adicionada com sucesso!' });
            } catch (err) {
                console.error("[Preload API] Error in addVenda:", err);
                return Promise.reject(err);
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

        // --- Funções de Histórico (ATUALIZADAS para incluir nome do usuário) ---
        getFilteredHistoricoCompras: (filters = {}) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                const { nomeFornecedor, produtoId } = filters;
                let query = `
                    SELECT
                        hc.id_compra, strftime('%d/%m/%Y %H:%M:%S', hc.data_compra) as data_compra_formatada,
                        hc.quantidade, hc.preco_unitario, hc.preco_total, hc.numero_nota_fiscal,
                        hc.observacoes, hc.nome_fornecedor,
                        p.NomeProduto, p.CodigoFabricante,
                        u.nome_completo as nome_usuario_compra -- << JOIN com usuários
                    FROM historico_compras hc
                    JOIN produtos p ON hc.id_produto = p.id_produto
                    LEFT JOIN usuarios u ON hc.id_usuario_compra = u.id_usuario -- << LEFT JOIN para não quebrar se usuário for NULL
                `;
                const params = [];
                const conditions = [];
                if (produtoId) { conditions.push('hc.id_produto = ?'); params.push(produtoId); }
                if (nomeFornecedor) { conditions.push('hc.nome_fornecedor LIKE ?'); params.push(`%${nomeFornecedor}%`); }
                if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; }
                query += ' ORDER BY hc.data_compra DESC';

                const stmt = db.prepare(query);
                const compras = stmt.all(params);
                return Promise.resolve(compras);
            } catch (err) { /* ... */ return Promise.reject(err); }
        },

        getFilteredHistoricoVendas: (filters = {}) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
               const { nomeCliente, produtoId } = filters;
               let query = `
                   SELECT
                       hv.id_venda, strftime('%d/%m/%Y %H:%M:%S', hv.data_venda) as data_venda_formatada,
                       hv.quantidade, hv.preco_unitario, hv.preco_total, hv.numero_recibo,
                       hv.observacoes, hv.nome_cliente,
                       p.NomeProduto, p.CodigoFabricante,
                       u.nome_completo as nome_usuario_venda -- << JOIN com usuários
                   FROM historico_vendas hv
                   JOIN produtos p ON hv.id_produto = p.id_produto
                   LEFT JOIN usuarios u ON hv.id_usuario_venda = u.id_usuario -- << LEFT JOIN
               `;
               const params = [];
               const conditions = [];
               if (produtoId) { conditions.push('hv.id_produto = ?'); params.push(produtoId); }
               if (nomeCliente) { conditions.push('hv.nome_cliente LIKE ?'); params.push(`%${nomeCliente}%`); }
               if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; }
               query += ' ORDER BY hv.data_venda DESC';

               const stmt = db.prepare(query);
               const vendas = stmt.all(params);
               return Promise.resolve(vendas);
            } catch (err) { /* ... */ return Promise.reject(err); }
        },

        // --- NOVAS Funções de Autenticação e Usuário ---
        login: async (username, password) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            console.log(`[Preload API] Login attempt for user: ${username}`);
            try {
                const stmt = db.prepare('SELECT id_usuario, nome_completo, senha_hash, permissao, ativo FROM usuarios WHERE nome_usuario = ?');
                const user = stmt.get(username);

                if (!user) {
                    console.log(`[Preload API] Login failed: User ${username} not found.`);
                    return Promise.reject(new Error("Usuário não encontrado."));
                }

                if (!user.ativo) {
                     console.log(`[Preload API] Login failed: User ${username} is inactive.`);
                     return Promise.reject(new Error("Usuário inativo."));
                }

                // Compara a senha fornecida com o hash armazenado
                const match = await bcrypt.compare(password, user.senha_hash);

                if (match) {
                    console.log(`[Preload API] Login successful for user: ${username}`);
                    // Atualiza data_ultimo_login (sem esperar)
                    db.prepare("UPDATE usuarios SET data_ultimo_login = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id_usuario = ?").run(user.id_usuario);
                    // Retorna dados essenciais do usuário, NUNCA o hash da senha
                    return Promise.resolve({
                        id_usuario: user.id_usuario,
                        nome_usuario: username, // Retorna o nome de usuário usado no login
                        nome_completo: user.nome_completo,
                        permissao: user.permissao
                    });
                } else {
                    console.log(`[Preload API] Login failed: Incorrect password for user: ${username}`);
                    return Promise.reject(new Error("Senha incorreta."));
                }
            } catch (err) {
                console.error("[Preload API] Error during login:", err);
                return Promise.reject(new Error(`Erro interno durante o login: ${err.message}`));
            }
        },

        addUser: async (userData) => {
             if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
             if (!userData || !userData.nome_usuario || !userData.senha || !userData.nome_completo || !userData.permissao) {
                 return Promise.reject(new Error("Dados incompletos para criar usuário."));
             }
             console.log(`[Preload API] Attempting to add user: ${userData.nome_usuario}`);
             try {
                 // Gera o hash da senha
                 const hashedPassword = await bcrypt.hash(userData.senha, saltRounds);

                 const stmt = db.prepare(`
                     INSERT INTO usuarios (nome_usuario, senha_hash, nome_completo, permissao, ativo)
                     VALUES (@nome_usuario, @senha_hash, @nome_completo, @permissao, @ativo)
                 `);
                 const info = stmt.run({
                     nome_usuario: userData.nome_usuario,
                     senha_hash: hashedPassword,
                     nome_completo: userData.nome_completo,
                     permissao: userData.permissao,
                     ativo: userData.ativo !== undefined ? userData.ativo : true // Default true se não especificado
                 });
                 console.log(`[Preload API] User ${userData.nome_usuario} added successfully. ID: ${info.lastInsertRowid}`);
                 return Promise.resolve({ id: info.lastInsertRowid, message: 'Usuário criado com sucesso!' });
             } catch (err) {
                 console.error("[Preload API] Error adding user:", err);
                  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                     return Promise.reject(new Error(`O nome de usuário '${userData.nome_usuario}' já existe.`));
                 }
                 return Promise.reject(err);
             }
        },

        getAllUsers: () => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            console.log(`[Preload API] Fetching all users...`);
            try {
                 // Nunca retornar senha_hash para o frontend
                 const stmt = db.prepare('SELECT id_usuario, nome_usuario, nome_completo, permissao, ativo, data_cadastro, data_ultimo_login FROM usuarios ORDER BY nome_completo');
                 const users = stmt.all();
                 console.log(`[Preload API] Returning ${users.length} users.`);
                 return Promise.resolve(users);
             } catch (err) {
                 console.error("[Preload API] Error fetching all users:", err);
                 return Promise.reject(err);
             }
        },

        updateUser: async (id, userData) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            if (!id || !userData) return Promise.reject(new Error("ID e dados do usuário são obrigatórios."));
             console.log(`[Preload API] Attempting to update user ID: ${id}`);

             // Campos que podem ser atualizados (exceto senha por enquanto)
             const fields = [];
             const params = { id_usuario: id };

             if (userData.nome_completo !== undefined) { fields.push("nome_completo = @nome_completo"); params.nome_completo = userData.nome_completo; }
             if (userData.permissao !== undefined) { fields.push("permissao = @permissao"); params.permissao = userData.permissao; }
             if (userData.ativo !== undefined) { fields.push("ativo = @ativo"); params.ativo = userData.ativo; }
              // Se uma nova senha foi fornecida, hasheia e atualiza
             if (userData.senha) {
                 console.log(`[Preload API] Updating password for user ID: ${id}`);
                 try {
                     const hashedPassword = await bcrypt.hash(userData.senha, saltRounds);
                     fields.push("senha_hash = @senha_hash");
                     params.senha_hash = hashedPassword;
                 } catch(hashError) {
                      console.error(`[Preload API] Error hashing new password for user ID ${id}:`, hashError);
                      return Promise.reject(new Error("Erro ao processar nova senha."));
                 }
             }

             if (fields.length === 0) {
                 return Promise.reject(new Error("Nenhum dado fornecido para atualização."));
             }

             try {
                 const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = @id_usuario`;
                 const stmt = db.prepare(query);
                 const info = stmt.run(params);

                 if (info.changes === 0) {
                     return Promise.reject(new Error(`Usuário com ID ${id} não encontrado.`));
                 }
                 console.log(`[Preload API] User ID ${id} updated successfully.`);
                 return Promise.resolve({ changes: info.changes, message: 'Usuário atualizado com sucesso!' });
             } catch (err) {
                  console.error(`[Preload API] Error updating user ID ${id}:`, err);
                  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' && err.message.includes('nome_usuario')) {
                     // A checagem de nome de usuário único deveria ser feita antes se permitir alterar nome_usuario
                     return Promise.reject(new Error(`O nome de usuário já está em uso por outro usuário.`));
                 }
                 return Promise.reject(err);
             }
        },

        // Função para ativar/desativar usuário (simplificada)
        toggleUserActive: (id) => {
             if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
             console.log(`[Preload API] Toggling active status for user ID: ${id}`);
             try {
                 // Pega o estado atual e inverte
                 const currentState = db.prepare('SELECT ativo FROM usuarios WHERE id_usuario = ?').get(id);
                 if (!currentState) {
                     return Promise.reject(new Error(`Usuário com ID ${id} não encontrado.`));
                 }
                 const newState = !currentState.ativo;
                 const stmt = db.prepare('UPDATE usuarios SET ativo = ? WHERE id_usuario = ?');
                 const info = stmt.run(newState, id);

                 if (info.changes === 0) {
                    return Promise.reject(new Error(`Usuário com ID ${id} não encontrado para alterar status.`));
                 }
                 const message = newState ? 'Usuário ativado.' : 'Usuário desativado.';
                 console.log(`[Preload API] User ID ${id} active status toggled to ${newState}.`);
                 return Promise.resolve({ changes: info.changes, message, newState });
             } catch (err) {
                 console.error(`[Preload API] Error toggling user active status ID ${id}:`, err);
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