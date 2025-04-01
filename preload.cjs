// --- START OF FILE preload.js ---

console.log('[Preload] Script starting...');
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os'); // Mantenha para diagnóstico se precisar
const Database = require('better-sqlite3');

let db;
const dbPath = path.join(__dirname, 'meu_estoque.db');
console.log('[Preload] Database path target:', dbPath);

try {
    console.log('[Preload] Attempting to connect to SQLite DB...');
    db = new Database(dbPath, { timeout: 5000 /*, verbose: console.log */ });
    console.log('[Preload] SQLite connection established successfully.');

    db.pragma('journal_mode = WAL;');
    db.pragma('foreign_keys = ON;'); // Habilitar chaves estrangeiras é crucial!
    console.log('[Preload] PRAGMAs set: journal_mode=WAL, foreign_keys=ON.');

    // --- Criação/Verificação das Tabelas ---
    // Tabela Produtos (garantir que a estrutura está correta, adicionar UNIQUE se necessário)
    db.exec(`
        CREATE TABLE IF NOT EXISTS Produtos (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            CodigoFabricante TEXT NOT NULL UNIQUE,
            CodigoBarras TEXT UNIQUE,
            NomeProduto TEXT NOT NULL,
            Aplicacao TEXT,
            Marca TEXT,
            DescricaoDetalhada TEXT,
            QuantidadeEstoque INTEGER NOT NULL DEFAULT 0 CHECK(QuantidadeEstoque >= 0), -- Não permitir estoque negativo
            PrecoCusto REAL NOT NULL DEFAULT 0.00,
            PrecoVenda REAL NOT NULL DEFAULT 0.00,
            EstoqueMinimo INTEGER NOT NULL DEFAULT 0,
            Localizacao TEXT,
            Ativo BOOLEAN DEFAULT TRUE,
            DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            DataAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('[Preload] Tabela "Produtos" verificada/criada.');

    // Tabela MovimentacoesEstoque
    db.exec(`
        CREATE TABLE IF NOT EXISTS MovimentacoesEstoque (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ProdutoID INTEGER NOT NULL,
            DataHora DATETIME DEFAULT CURRENT_TIMESTAMP,
            PrecoVendaUnitario REAL DEFAULT NULL,
            PrecoCustoUnitario REAL DEFAULT NULL,
            TipoMovimento TEXT NOT NULL CHECK(TipoMovimento IN ('Entrada', 'Saida', 'Ajuste', 'Inicial')), -- Tipos controlados
            Quantidade INTEGER NOT NULL, -- Positivo para Entrada/Ajuste+, Negativo para Saida/Ajuste-
            Observacao TEXT, -- Ex: 'Venda Pedido #123', 'Compra NF 567', 'Ajuste Inventário', 'Cadastro Inicial'
            Usuario TEXT, -- Quem fez (pode ser implementado depois)
            FOREIGN KEY (ProdutoID) REFERENCES Produtos (ID) ON DELETE CASCADE -- Se deletar o produto, deleta o histórico? Ou ON DELETE RESTRICT para impedir? Decisão: CASCADE por simplicidade agora.
        );
    `);
    console.log('[Preload] Tabela "MovimentacoesEstoque" verificada/criada.');

     // Trigger para atualizar DataAtualizacao na tabela Produtos (Opcional, mas útil)
     db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_product_timestamp
        AFTER UPDATE ON Produtos
        FOR EACH ROW
        BEGIN
            UPDATE Produtos SET DataAtualizacao = CURRENT_TIMESTAMP WHERE ID = OLD.ID;
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

// Função interna para registrar movimentação e atualizar estoque (usando Transação)
function registrarMovimentacaoEAtualizarEstoque(produtoId, tipoMovimento, quantidade, observacao = null, precoCustoUnitario = null, precoVendaUnitario = null, usuario = null) {
    if (!db) throw new Error("Banco de dados não conectado.");

    // Validação básica da quantidade (deve ser sempre positiva aqui)
    if (typeof quantidade !== 'number' || quantidade <= 0) {
        throw new Error(`Quantidade inválida (${quantidade}). Deve ser um número positivo.`);
   }
   // Validação dos tipos de movimento aceitos
   const tiposValidos = ['Entrada', 'Saida', 'Ajuste', 'Inicial']; // AjustePositivo/Negativo foram removidos, use 'Ajuste' com qtd positiva/negativa no cálculo
   if (!tiposValidos.includes(tipoMovimento)) {
       throw new Error(`Tipo de movimento inválido: ${tipoMovimento}. Válidos: ${tiposValidos.join(', ')}`);
   }

   // Determina o ajuste no estoque (positivo para entradas/inicial, negativo para saídas)
   // Para 'Ajuste', o sinal da 'quantidade' passada para a *transação* determina a direção
   // Mas a quantidade *registrada* é sempre positiva. O tipo 'Ajuste' indica a natureza.
   // SIMPLIFICAÇÃO: Vamos assumir que 'Ajuste' aqui é sempre positivo para o estoque. Se precisar de ajuste negativo, use 'Saida' com observação clara. Ou crie um tipo 'AjusteNegativo'. Mantendo simples por agora:
   const quantidadeAjuste = (tipoMovimento === 'Saida') ? -quantidade : quantidade;

   // Prepara os preços unitários para inserção (NULL se não aplicável ao tipo)
   const custoUnitarioParaRegistro = (tipoMovimento === 'Entrada' || tipoMovimento === 'Inicial') ? precoCustoUnitario : null;
   const vendaUnitariaParaRegistro = (tipoMovimento === 'Saida') ? precoVendaUnitario : null;


    const transaction = db.transaction((data) => {
        // 1. Verifica estoque atual (se for saída)
        if (data.tipo === 'Saida') {
            const stmtCheck = db.prepare('SELECT QuantidadeEstoque FROM Produtos WHERE ID = ? AND Ativo = TRUE');
            const produto = stmtCheck.get(data.id);
            if (!produto) throw new Error(`Produto com ID ${data.id} não encontrado.`);
            if (produto.QuantidadeEstoque < data.qtd) {
                throw new Error(`Estoque insuficiente para '${produto.NomeProduto}'. Atual: ${produto.QuantidadeEstoque}, Saída: ${data.qtd}`);
            }
        }

        // 2. Atualiza a quantidade na tabela Produtos
        const stmtUpdate = db.prepare('UPDATE Produtos SET QuantidadeEstoque = QuantidadeEstoque + ?, DataAtualizacao = CURRENT_TIMESTAMP WHERE ID = ?');
        const infoUpdate = stmtUpdate.run(data.qtdAjuste, data.id);
        if (infoUpdate.changes === 0) {
            throw new Error(`Falha ao atualizar estoque do produto ID ${data.id}. Produto existe?`);
        }

        // 3. Insere o registro na tabela MovimentacoesEstoque com os preços unitários
        const stmtInsert = db.prepare(`
            INSERT INTO MovimentacoesEstoque
                (ProdutoID, TipoMovimento, Quantidade, PrecoCustoUnitario, PrecoVendaUnitario, Observacao, Usuario, DataHora)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) -- Inserir DataHora explicitamente
        `);
        const infoInsert = stmtInsert.run(
            data.id,
            data.tipo,
            data.qtd, // Quantidade registrada é sempre positiva
            data.custoUnit,
            data.vendaUnit,
            data.obs,
            data.user
        );

        return { movementId: infoInsert.lastInsertRowid, productId: data.id };
    });

    try {
        const result = transaction({
            id: produtoId,
            tipo: tipoMovimento,
            qtd: quantidade, // Quantidade da movimentação (positiva)
            qtdAjuste: quantidadeAjuste, // Quantidade a somar/subtrair do estoque
            obs: observacao,
            custoUnit: custoUnitarioParaRegistro,
            vendaUnit: vendaUnitariaParaRegistro,
            user: usuario
        });
        console.log(`[Preload TX] Movimentação (${tipoMovimento}, Qtd: ${quantidade}) registrada (CustoU: ${custoUnitarioParaRegistro}, VendaU: ${vendaUnitariaParaRegistro}) e estoque atualizado para Produto ID ${produtoId}. Mov ID: ${result.movementId}`);
        return result;
    } catch (err) {
        console.error(`[Preload TX] Erro na transação de movimentação para Produto ID ${produtoId}:`, err.message);
        throw err; // Re-lança o erro para ser tratado pela API exposta
    }
}


// --- Expor Funções para o Renderer ---
console.log('[Preload] Attempting to expose API via contextBridge...');
try {
    contextBridge.exposeInMainWorld('api', {
        // --- Funções de Produto ---
        getProducts: (searchTerm = null, includeInactive = false) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                let query = `
                    SELECT ID, Marca, CodigoFabricante, NomeProduto, QuantidadeEstoque, PrecoVenda, Localizacao, EstoqueMinimo, Aplicacao, Ativo
                    FROM Produtos
                `;
                const params = [];
                const conditions = [];

                // Adiciona filtro Ativo=TRUE por padrão
                if (!includeInactive) {
                    conditions.push("Ativo = TRUE");
                }

                if (searchTerm) {
                    query += ` WHERE NomeProduto LIKE ? OR CodigoFabricante LIKE ? OR Marca LIKE ? OR Aplicacao LIKE ? OR CodigoBarras LIKE ?`;
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
                const stmt = db.prepare('SELECT * FROM Produtos WHERE ID = ?');
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
            if (!productData || !productData.codigoFabricante || !productData.nomeProduto) {
                 return Promise.reject(new Error("Dados incompletos (Código Fabricante e Nome são obrigatórios)."));
            }
            const initialQuantity = parseInt(productData.quantidadeEstoque || 0, 10);

            // Usar transação para inserir produto E registrar movimento inicial
            const transaction = db.transaction((data) => {
                 // 1. Inserir o Produto
                 const stmtProd = db.prepare(`
                    INSERT INTO Produtos (
                        CodigoFabricante, CodigoBarras, NomeProduto, Aplicacao, Marca,
                        DescricaoDetalhada, QuantidadeEstoque, PrecoCusto, PrecoVenda,
                        EstoqueMinimo, Localizacao, Ativo
                    ) VALUES (@CodigoFabricante, @CodigoBarras, @NomeProduto, @Aplicacao, @Marca, @DescricaoDetalhada, @QuantidadeEstoque, @PrecoCusto, @PrecoVenda, @EstoqueMinimo, @Localizacao, @Ativo)
                `);
                 const params = {
                    CodigoFabricante: data.codigoFabricante,
                    CodigoBarras: data.codigoBarras || null,
                    NomeProduto: data.nomeProduto,
                    Aplicacao: data.aplicacao || null,
                    Marca: data.marca || null,
                    DescricaoDetalhada: data.descricaoDetalhada || null, // Adicione se tiver no form
                    QuantidadeEstoque: initialQuantity, // Usa a quantidade inicial validada
                    PrecoCusto: parseFloat(data.precoCusto || 0.0),
                    PrecoVenda: parseFloat(data.precoVenda || 0.0),
                    EstoqueMinimo: parseInt(data.estoqueMinimo || 0, 10),
                    Localizacao: data.localizacao || null,
                    Ativo: data.ativo === false ? false : true
                };
                const infoProd = stmtProd.run(params);
                const newProductId = infoProd.lastInsertRowid;

                 // Chama a função interna de movimentação
                 registrarMovimentacaoEAtualizarEstoque(
                    newProductId,
                    'Inicial', // ou 'Entrada'
                    initialQuantity,
                    'Cadastro Inicial do Produto',
                    initialCost, // Passa o custo unitário inicial
                    null // Preço de venda não se aplica aqui
                    // usuário se tiver
                );
                 return { id: newProductId };
            });

            try {
                console.log('[Preload API] addProduct starting transaction with data:', productData);
                const result = transaction(productData);
                console.log(`[Preload API] addProduct transaction successful. Inserted Product ID: ${result.id}`);
                return Promise.resolve({ id: result.id, message: 'Produto adicionado com sucesso!' });
            } catch (err) {
                console.error("[Preload API] Error in addProduct transaction:", err);
                 if (err.code && err.code.includes('SQLITE_CONSTRAINT')) { // Trata erros de constraint de forma mais genérica
                     if (err.message.includes('UNIQUE constraint failed: Produtos.CodigoFabricante')) { return Promise.reject(new Error(`Erro: Código do Fabricante '${productData.codigoFabricante}' já existe.`)); }
                     if (err.message.includes('UNIQUE constraint failed: Produtos.CodigoBarras')) { return Promise.reject(new Error(`Erro: Código de Barras '${productData.codigoBarras}' já existe.`)); }
                     if (err.message.includes('CHECK constraint failed: QuantidadeEstoque')) { return Promise.reject(new Error(`Erro: Quantidade em estoque não pode ser negativa.`)); }
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
                    UPDATE Produtos SET
                        CodigoFabricante = @CodigoFabricante,
                        CodigoBarras = @CodigoBarras,
                        NomeProduto = @NomeProduto,
                        Aplicacao = @Aplicacao,
                        Marca = @Marca,
                        DescricaoDetalhada = @DescricaoDetalhada,
                        -- QuantidadeEstoque = @QuantidadeEstoque, -- REMOVIDO - Alterar via movimentação
                        PrecoCusto = @PrecoCusto,
                        PrecoVenda = @PrecoVenda,
                        EstoqueMinimo = @EstoqueMinimo,
                        Localizacao = @Localizacao,
                        Ativo = @Ativo
                        -- DataAtualizacao é atualizada pelo Trigger
                    WHERE ID = @ID
                `);
                const params = {
                    ID: id,
                    CodigoFabricante: productData.codigoFabricante,
                    CodigoBarras: productData.codigoBarras || null,
                    NomeProduto: productData.nomeProduto,
                    Aplicacao: productData.aplicacao || null,
                    Marca: productData.marca || null,
                    DescricaoDetalhada: productData.descricaoDetalhada || null, // Adicione se tiver no form de edição
                    // QuantidadeEstoque: parseInt(productData.quantidadeEstoque || 0, 10), // REMOVIDO
                    PrecoCusto: parseFloat(productData.precoCusto || 0.0),
                    PrecoVenda: parseFloat(productData.precoVenda || 0.0),
                    EstoqueMinimo: parseInt(productData.estoqueMinimo || 0, 10),
                    Localizacao: productData.localizacao || null,
                    Ativo: ativoValue
                };
                console.log('[Preload API] updateProduct executing statement with params:', params);
                const info = stmt.run(params);
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
                    if (err.message.includes('UNIQUE constraint failed: Produtos.CodigoFabricante')) { return Promise.reject(new Error(`Erro: Código do Fabricante '${productData.codigoFabricante}' já pertence a outro produto.`)); }
                    if (err.message.includes('UNIQUE constraint failed: Produtos.CodigoBarras')) { return Promise.reject(new Error(`Erro: Código de Barras '${productData.codigoBarras}' já pertence a outro produto.`)); }
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
                const stmt = db.prepare('DELETE FROM Produtos WHERE ID = ?');
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

        // Modificado para aceitar dados de preço unitário
        addStockMovement: (movementData) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
           // Desestrutura os dados esperados, incluindo os novos preços
           const {
               produtoId,
               tipoMovimento,
               quantidade,
               observacao,
               precoCustoUnitario, // Novo
               precoVendaUnitario, // Novo
               usuario // Novo
           } = movementData;

           console.log(`[Preload API] addStockMovement called with data:`, movementData);

           if (!produtoId || !tipoMovimento || !quantidade) {
               return Promise.reject(new Error("Dados da movimentação incompletos (ProdutoID, Tipo, Quantidade são obrigatórios)."));
           }
            // Validação da quantidade (deve ser positiva na chamada da API)
            if (typeof quantidade !== 'number' || quantidade <= 0) {
                return Promise.reject(new Error("Quantidade para movimentação deve ser um número positivo."));
           }
           // Validação básica dos preços (se fornecidos)
            if (precoCustoUnitario !== undefined && precoCustoUnitario !== null && typeof precoCustoUnitario !== 'number') {
                return Promise.reject(new Error("Preço de Custo Unitário inválido."));
            }
            if (precoVendaUnitario !== undefined && precoVendaUnitario !== null && typeof precoVendaUnitario !== 'number') {
                return Promise.reject(new Error("Preço de Venda Unitário inválido."));
            }


           try {
                // Chama a função interna que executa a transação, passando os preços
               const result = registrarMovimentacaoEAtualizarEstoque(
                   produtoId,
                   tipoMovimento,
                   quantidade,
                   observacao,
                   precoCustoUnitario,
                   precoVendaUnitario,
                   usuario
               );
               return Promise.resolve({ ...result, message: `Movimentação (${tipoMovimento}) registrada com sucesso!` });
           } catch (err) {
               // O erro já foi logado na função interna, apenas repassa.
               return Promise.reject(err); // Repassa o erro da transação
           }
       },

        // getStockMovements pode incluir os novos campos de preço se necessário na UI
        getStockMovements: (productId) => {
            if (!db) return Promise.reject(new Error("Banco de dados não conectado."));
            try {
                console.log(`[Preload API] getStockMovements executing query for Product ID: ${productId}...`);
                // Inclui as novas colunas no SELECT
                const stmt = db.prepare(`
                    SELECT
                        ID,
                        strftime('%d/%m/%Y %H:%M:%S', DataHora) as DataHoraFormatada,
                        TipoMovimento,
                        Quantidade,
                        PrecoCustoUnitario,
                        PrecoVendaUnitario,
                        Observacao,
                        Usuario
                    FROM MovimentacoesEstoque
                    WHERE ProdutoID = ?
                    ORDER BY DataHora DESC
                `);
                const movements = stmt.all(productId);
                console.log(`[Preload API] getStockMovements returning ${movements.length} movements for Product ID ${productId}.`);
                return Promise.resolve(movements);
            } catch (err) {
                console.error(`[Preload API] Error fetching stock movements for Product ID ${productId}:`, err);
                return Promise.reject(err);
            }
        },

        // Função para fechar o DB ao sair
        closeDatabase: () => {
             // ... (código existente para fechar o DB) ...
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