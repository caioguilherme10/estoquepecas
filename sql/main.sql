CREATE TABLE produtos ( 
    id_produto INTEGER PRIMARY KEY AUTOINCREMENT,
    CodigoBarras VARCHAR(255) NULL, -- Permite nulo se nem todos os produtos têm código de barras
    CodigoFabricante VARCHAR(255) NULL, -- Permite nulo se não tiver
    NomeProduto VARCHAR(255) NOT NULL, -- Obrigatório
    Marca VARCHAR(255) NULL,  -- Permite nulo
    Descricao TEXT NULL, -- Permite nulo, pode ser longo
    Aplicacao TEXT NULL, -- Compatibilidade (ex: modelos de moto), permite nulo
    QuantidadeEstoque INTEGER NOT NULL DEFAULT 0, -- Não pode ser nulo, padrão é 0
    EstoqueMinimo INTEGER NOT NULL DEFAULT 1, -- Não pode ser nulo, padrão é 1 (ou outro valor razoável)
    Preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Preço com duas casas decimais, padrão é 0
    Localizacao VARCHAR(255) NULL, -- Onde está fisicamente, permite nulo
    DataCadastro DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')), -- Padrão é a data/hora atual
    DataUltimaAtualizacao DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')), -- Atualiza automaticamente
    Ativo BOOLEANNOT NULL DEFAULT TRUE -- Se o produto está ativo/disponível
);

INSERT INTO produtos (CodigoBarras, CodigoFabricante, NomeProduto, Marca, Descricao, Aplicacao, QuantidadeEstoque, EstoqueMinimo, Preco, Localizacao)
VALUES ('7891234567890', 'Honda-12345', 'Vela de Ignição', 'NGK', 'Vela para Honda CG 150', 'CG 150 2004-2015', 10, 2, 15.50, 'Prateleira A-1');

INSERT INTO produtos (CodigoBarras, CodigoFabricante, NomeProduto, Marca, Aplicacao, QuantidadeEstoque, EstoqueMinimo, Preco, Localizacao)
VALUES ('7899641814953', 'VS0561010001K', 'Kit Junta Superior Motor', 'Vedamotors', 'HDA CG TITAN/FAN 150 (04-)/NXR 150 BROS (06-) FLEX', 0, 5, 0, 'Prateleira B-1');

INSERT INTO produtos (CodigoFabricante, NomeProduto, Marca, Aplicacao, QuantidadeEstoque, EstoqueMinimo, Preco, Localizacao)
VALUES ('90205020', 'Suporte e Escovas', 'MAGNETRON', 'Motos Honda CG 150 / Sport / Mix / Flex / CG 150 Fan / Flex / NXR 150 Bros 2006 em diante / Mix / Flex / CG 125 Fan 2009 em diante / Cargo 2009 em diante / NXR 125 Bros 2013 em diante / Biz 125 Flex 2011 em diante / NXR 160 Bros / CG 160', 0, 5, 0, 'Prateleira C-1');

INSERT INTO produtos (CodigoBarras, CodigoFabricante, NomeProduto, Marca, Descricao, Aplicacao, QuantidadeEstoque, EstoqueMinimo, Preco, Localizacao)
VALUES ('7898749020488', '10122351', 'Tensionador da Corrente', 'WGK', 'Sistema Original', 'CG-150', 0, 5, 0, 'Prateleira B-5');

INSERT INTO produtos (CodigoBarras, CodigoFabricante, NomeProduto, Marca, Descricao, Aplicacao, QuantidadeEstoque, EstoqueMinimo, Preco, Localizacao)
VALUES ('7898558330433', '1014401', 'Caixa de Direção', 'WGK', 'Superior e Inferior. Origem: China', 'NXR-150 BROS / XR-250 TORNADO', 0, 5, 0, 'Prateleira A-5');

CREATE TABLE historico_compras ( 
    id_compra INTEGER PRIMARY KEY AUTOINCREMENT, 
    id_produto INTEGER NOT NULL, -- Chave estrangeira para a tabela produtos
    data_compra DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')), 
    quantidade INTEGER NOT NULL, 
    preco_unitario DECIMAL(10, 2) NOT NULL, -- Preço pago por unidade
    preco_total DECIMAL(12, 2) NOT NULL, -- Preço total da compra (quantidade * preco_unitario)
    id_fornecedor INTEGER NULL, -- Chave estrangeira para a tabela fornecedores (opcional)
    nome_fornecedor VARCHAR(255) NULL, -- Nome do fornecedor (opcional)
    numero_nota_fiscal VARCHAR(255) NULL, -- Número da nota fiscal (opcional)
    observacoes TEXT NULL, -- Observações sobre a compra (opcional)
    id_usuario_compra INTEGER NULL,  -- id do usuario que realizou a compra (opcional)
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE RESTRICT, -- Vincula ao produto
    -- Adicionada a Foreign Key para usuários
    FOREIGN KEY (id_usuario_compra) REFERENCES usuarios(id_usuario) ON DELETE SET NULL -- Se o usuário for excluído, o histórico fica sem usuário associado (NULL)
    -- FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor) -- Se tiver tabela de fornecedores
);

INSERT INTO historico_compras (id_produto, data_compra, quantidade, preco_unitario, preco_total, numero_nota_fiscal)
VALUES (1, '2024-01-01 10:00:00', 5, 12.50, 62.50, 'NF-1234');

CREATE TABLE historico_vendas ( 
    id_venda INTEGER PRIMARY KEY AUTOINCREMENT, 
    id_produto INTEGER NOT NULL, -- Chave estrangeira para a tabela produtos
    data_venda DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')), 
    quantidade INTEGER NOT NULL, 
    preco_unitario DECIMAL(10, 2) NOT NULL, -- Preço vendido por unidade
    preco_total DECIMAL(12, 2) NOT NULL, -- Preço total da venda (quantidade * preco_unitario)
    id_cliente INTEGER NULL, -- Chave estrangeira para uma tabela de clientes (opcional)
    nome_cliente VARCHAR(255) NULL, -- Nome do cliente (opcional)
    numero_recibo VARCHAR(255) NULL, -- Número do recibo/nota (opcional)
    observacoes TEXT NULL,  -- Observações sobre a venda (opcional)
    id_usuario_venda INTEGER NULL, -- id do usuario que realizou a venda (opcional)
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE RESTRICT, -- Vincula ao produto
    FOREIGN KEY (id_usuario_venda) REFERENCES usuarios(id_usuario) ON DELETE SET NULL -- Se o usuário for excluído, o histórico fica sem usuário associado (NULL)
    -- FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) -- Se tiver tabela de clientes
);

INSERT INTO historico_vendas (id_produto, data_venda, quantidade, preco_unitario, preco_total, numero_recibo)
VALUES (1, '2024-01-02 14:30:00', 2, 25.00, 50.00, 'REC-5678');

CREATE INDEX idx_produtos_codigobarras ON produtos (CodigoBarras);
CREATE INDEX idx_produtos_codigofabricante ON produtos (CodigoFabricante);
CREATE INDEX idx_produtos_nomeproduto ON produtos (NomeProduto);

CREATE TABLE IF NOT EXISTS produto_fotos (
    id_foto INTEGER PRIMARY KEY AUTOINCREMENT,
    id_produto INTEGER NOT NULL, -- Chave estrangeira para produtos
    -- Guarda o NOME ÚNICO do arquivo copiado para a pasta da app
    nome_arquivo_foto TEXT NOT NULL UNIQUE,
    descricao_foto TEXT NULL, -- Descrição opcional (alt text)
    ordem INTEGER NOT NULL DEFAULT 0, -- Para ordenar a exibição das fotos
    data_cadastro DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE -- <<< IMPORTANTE: Exclui fotos se o produto for excluído
);

CREATE INDEX IF NOT EXISTS idx_fotos_produto ON produto_fotos (id_produto);

-- Trigger para atualizar estoque ao inserir compra
CREATE TRIGGER atualizar_estoque_compra
AFTER INSERT ON historico_compras
BEGIN
  UPDATE produtos
  SET QuantidadeEstoque = QuantidadeEstoque + NEW.quantidade,
      DataUltimaAtualizacao = strftime('%Y-%m-%d %H:%M:%S', 'now')
  WHERE id_produto = NEW.id_produto;
END;

-- Trigger para atualizar estoque ao inserir venda
CREATE TRIGGER atualizar_estoque_venda
AFTER INSERT ON historico_vendas
BEGIN
  UPDATE produtos
  SET QuantidadeEstoque = QuantidadeEstoque - NEW.quantidade,
      DataUltimaAtualizacao = strftime('%Y-%m-%d %H:%M:%S', 'now')
  WHERE id_produto = NEW.id_produto;
END;

-- Trigger para atualizar DataUltimaAtualizacao na tabela produtos em UPDATES
CREATE TRIGGER IF NOT EXISTS update_product_timestamp
AFTER UPDATE ON produtos
FOR EACH ROW
WHEN OLD.DataUltimaAtualizacao = NEW.DataUltimaAtualizacao -- Previne loop se o próprio trigger atualizar
BEGIN
    UPDATE produtos SET DataUltimaAtualizacao = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id_produto = OLD.id_produto;
END;

-- =============================================
-- Tabela de Usuários
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_usuario VARCHAR(50) NOT NULL UNIQUE,     -- Nome de login único (ex: 'admin', 'joao.silva')
    senha_hash VARCHAR(255) NOT NULL,             -- Hash da senha (NUNCA armazene a senha em texto plano!)
    nome_completo VARCHAR(100) NOT NULL,          -- Nome completo do usuário para exibição
    permissao VARCHAR(20) NOT NULL DEFAULT 'vendedor', -- Nível de acesso (ex: 'admin', 'vendedor', 'estoquista')
    ativo BOOLEAN NOT NULL DEFAULT TRUE,             -- Indica se o usuário pode logar no sistema
    data_cadastro DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')), -- Data de criação do usuário
    data_ultimo_login DATETIME NULL                  -- Data do último acesso (atualizar via aplicação)
    -- email VARCHAR(255) UNIQUE NULL,              -- Opcional: E-mail do usuário
    -- telefone VARCHAR(20) NULL                    -- Opcional: Telefone do usuário
);

-- Índice para otimizar a busca por nome de usuário (login)
CREATE INDEX IF NOT EXISTS idx_usuarios_nome_usuario ON usuarios (nome_usuario);

-- Exemplo de Inserção de Usuário (A SENHA DEVE SER HASHADA PELA APLICAÇÃO!)
-- O valor 'hash_seguro_da_senha_aqui' é apenas um placeholder.
-- Use bibliotecas como bcrypt no seu backend Node.js/Electron para gerar o hash.
INSERT INTO usuarios (nome_usuario, senha_hash, nome_completo, permissao, ativo)
VALUES ('admin', '$2b$10$PlaceholderHashParaAdmin...........', 'Administrador Principal', 'admin', TRUE),
('vendedor1', '$2b$10$PlaceholderHashParaVendedor1.......', 'Funcionário Vendas 01', 'vendedor', TRUE),
('desativado', '$2b$10$PlaceholderHashParaDesativado....', 'Usuário Antigo', 'vendedor', FALSE); -- Exemplo de usuário inativo