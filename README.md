# Sistema de Gerenciamento de Estoque

## 🇧🇷 Português

### Descrição
Este é um sistema completo de gerenciamento de estoque desenvolvido com Electron e React, projetado para pequenas e médias empresas que precisam controlar seu inventário de produtos, compras e vendas. O sistema oferece uma interface moderna e intuitiva, com suporte para modo claro e escuro, e funciona como uma aplicação desktop multiplataforma.

### Funcionalidades Principais

#### Gerenciamento de Produtos
- Cadastro completo de produtos com informações detalhadas
- Código de barras e código do fabricante
- Controle de estoque mínimo com alertas visuais
- Localização física do produto no estabelecimento
- Aplicação/compatibilidade do produto
- Ativação/desativação de produtos sem exclusão permanente

#### Controle de Estoque
- Monitoramento em tempo real da quantidade em estoque
- Alertas visuais para produtos abaixo do estoque mínimo
- Atualização automática do estoque ao registrar compras e vendas

#### Registro de Compras
- Entrada de produtos no estoque
- Registro de fornecedores
- Controle de notas fiscais
- Histórico completo de compras

#### Registro de Vendas
- Saída de produtos do estoque
- Registro de clientes
- Emissão de recibos
- Histórico completo de vendas

#### Gerenciamento de Usuários
- Controle de acesso com diferentes níveis de permissão (admin, vendedor)
- Autenticação segura com senhas criptografadas
- Ativação/desativação de usuários

#### Relatórios e Histórico
- Histórico detalhado de compras e vendas
- Filtros por data, produto, fornecedor ou cliente
- Rastreabilidade completa das operações

### Requisitos Técnicos

#### Requisitos de Sistema
- Windows, macOS ou Linux
- Node.js (versão recomendada: 18.x ou superior)
- NPM ou Yarn

#### Dependências Principais
- Electron: Framework para desenvolvimento de aplicações desktop
- React: Biblioteca para construção de interfaces
- Better-SQLite3: Banco de dados SQLite para armazenamento local
- Bcrypt: Criptografia de senhas
- React Router: Navegação entre páginas
- Tailwind CSS: Framework CSS para estilização

### Instalação e Execução

1. Clone o repositório:
   ```
   git clone [URL_DO_REPOSITÓRIO]
   cd projetoestoque
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Execute em modo de desenvolvimento:
   ```
   npm run dev
   ```

4. Para construir a aplicação para produção:
   ```
   npm run build:renderer
   npm run build:electron
   ```

### Credenciais Iniciais
- **Usuário**: admin
- **Senha**: admin

---

## 🇬🇧 English

### Description
This is a complete inventory management system developed with Electron and React, designed for small and medium businesses that need to control their product inventory, purchases, and sales. The system offers a modern and intuitive interface, with support for light and dark mode, and works as a cross-platform desktop application.

### Main Features

#### Product Management
- Complete product registration with detailed information
- Barcode and manufacturer code
- Minimum stock control with visual alerts
- Physical location of the product in the establishment
- Product application/compatibility
- Activation/deactivation of products without permanent deletion

#### Inventory Control
- Real-time monitoring of stock quantity
- Visual alerts for products below minimum stock
- Automatic stock update when registering purchases and sales

#### Purchase Registration
- Entry of products into inventory
- Supplier registration
- Invoice control
- Complete purchase history

#### Sales Registration
- Output of products from inventory
- Customer registration
- Receipt issuance
- Complete sales history

#### User Management
- Access control with different permission levels (admin, seller)
- Secure authentication with encrypted passwords
- User activation/deactivation

#### Reports and History
- Detailed history of purchases and sales
- Filters by date, product, supplier, or customer
- Complete traceability of operations

### Technical Requirements

#### System Requirements
- Windows, macOS, or Linux
- Node.js (recommended version: 18.x or higher)
- NPM or Yarn

#### Main Dependencies
- Electron: Framework for desktop application development
- React: Library for building interfaces
- Better-SQLite3: SQLite database for local storage
- Bcrypt: Password encryption
- React Router: Navigation between pages
- Tailwind CSS: CSS framework for styling

### Installation and Execution

1. Clone the repository:
   ```
   git clone [REPOSITORY_URL]
   cd projetoestoque
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run in development mode:
   ```
   npm run dev
   ```

4. To build the application for production:
   ```
   npm run build:renderer
   npm run build:electron
   ```

### Initial Credentials
- **Username**: admin
- **Password**: admin