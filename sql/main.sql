CREATE TABLE produtos (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    CodigoBarras VARCHAR(255) NULL,  -- Permite nulo se nem todos os produtos têm código de barras
    CodigoFabricante VARCHAR(255) NULL, -- Permite nulo se não tiver
    NomeProduto VARCHAR(255) NOT NULL,  -- Obrigatório
    Marca VARCHAR(255) NULL,         -- Permite nulo
    Descricao TEXT NULL,            -- Permite nulo, pode ser longo
    Aplicacao TEXT NULL,             -- Compatibilidade (ex: modelos de moto), permite nulo
    QuantidadeEstoque INT NOT NULL DEFAULT 0, -- Não pode ser nulo, padrão é 0
    EstoqueMinimo INT NOT NULL DEFAULT 1,    -- Não pode ser nulo, padrão é 1 (ou outro valor razoável)
    Preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Preço com duas casas decimais, padrão é 0
    Localizacao VARCHAR(255) NULL,    -- Onde está fisicamente, permite nulo
    DataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Padrão é a data/hora atual
    DataUltimaAtualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Atualiza automaticamente
    Ativo BOOLEAN NOT NULL DEFAULT TRUE  -- Se o produto está ativo/disponível
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
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,  -- Chave estrangeira para a tabela produtos
    data_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,  -- Preço pago por unidade
    preco_total DECIMAL(12, 2) NOT NULL, -- Preço total da compra (quantidade * preco_unitario)
    id_fornecedor INT NULL,  -- Chave estrangeira para a tabela fornecedores (opcional)
    nome_fornecedor VARCHAR(255) NULL, -- Nome do fornecedor (opcional)
    numero_nota_fiscal VARCHAR(255) NULL, -- Número da nota fiscal (opcional)
    observacoes TEXT NULL,    -- Observações sobre a compra (opcional)
    usuario_compra INT NULL, -- id do usuario que realizou a compra (opcional)
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) -- Vincula ao produto
    -- FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor) -- Se tiver tabela de fornecedores
);

INSERT INTO historico_compras (id_produto, data_compra, quantidade, preco_unitario, preco_total, numero_nota_fiscal)
VALUES (1, '2024-01-01 10:00:00', 5, 12.50, 62.50, 'NF-1234');

CREATE TABLE historico_vendas (
    id_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,  -- Chave estrangeira para a tabela produtos
    data_venda DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,  -- Preço vendido por unidade
    preco_total DECIMAL(12, 2) NOT NULL, -- Preço total da venda (quantidade * preco_unitario)
    id_cliente INT NULL,  -- Chave estrangeira para uma tabela de clientes (opcional)
    nome_cliente VARCHAR(255) NULL, -- Nome do cliente (opcional)
    numero_recibo VARCHAR(255) NULL, -- Número do recibo/nota (opcional)
    observacoes TEXT NULL,    -- Observações sobre a venda (opcional)
    usuario_venda INT NULL, -- id do usuario que realizou a venda (opcional)
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) -- Vincula ao produto
    -- FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) -- Se tiver tabela de clientes
);

INSERT INTO historico_vendas (id_produto, data_venda, quantidade, preco_unitario, preco_total, numero_recibo)
VALUES (1, '2024-01-02 14:30:00', 2, 25.00, 50.00, 'REC-5678');