# Sistema de Gerenciamento de Estoque

## 🇧🇷 Português

### Descrição
Este é um sistema completo de gerenciamento de estoque desenvolvido com Electron e React, projetado para pequenas e médias empresas que precisam controlar seu inventário de produtos, compras e vendas. O sistema oferece uma interface moderna e intuitiva, com suporte para modo claro e escuro, e funciona como uma aplicação desktop multiplataforma.

Este projeto foi inteiramente desenvolvido na plataforma trae.ai, em conjunto com o modelo Google/Gemini-2.5-pro-exp-03-25:free. O sistema será implementado em uma oficina de motos de uma cidade com aproximadamente 15.000 habitantes, tendo como único custo o tempo de desenvolvimento, estimado em uma semana de trabalho.

### Processo de Desenvolvimento

#### Metodologia
O desenvolvimento seguiu uma abordagem ágil, com ciclos curtos de implementação e testes. A cada funcionalidade implementada, foram realizados testes para garantir a qualidade e a usabilidade do sistema.

#### Fluxo de Trabalho
1. **Análise de Requisitos**: Levantamento das necessidades específicas da oficina de motos
2. **Prototipagem**: Criação de wireframes e definição da experiência do usuário
3. **Desenvolvimento**: Implementação das funcionalidades utilizando Electron e React
4. **Testes**: Verificação da qualidade e usabilidade de cada funcionalidade
5. **Refinamento**: Ajustes e melhorias com base nos testes realizados

#### Desafios Superados
- Integração entre Electron e React para criar uma aplicação desktop robusta
- Implementação de um banco de dados local eficiente com Better-SQLite3
- Desenvolvimento de uma interface responsiva e intuitiva para diferentes tipos de usuários
- Criação de um sistema de autenticação seguro com diferentes níveis de permissão

#### Arquitetura do Sistema
O sistema foi desenvolvido seguindo uma arquitetura de componentes, com separação clara entre interface do usuário, lógica de negócios e acesso a dados. A estrutura de diretórios foi organizada de forma a facilitar a manutenção e a escalabilidade do sistema.

### Funcionalidades Principais

#### Estrutura do Projeto
O projeto está organizado da seguinte forma:

```
src/
  ├── components/     # Componentes reutilizáveis
  │   ├── Modal.jsx   # Componente de modal genérico
  │   ├── ProtectedRoute.jsx # Rota protegida por autenticação
  │   └── layout/     # Componentes de layout
  │       ├── Layout.jsx    # Layout principal da aplicação
  │       ├── Navbar.jsx    # Barra de navegação superior
  │       └── Sidebar.jsx   # Barra lateral de navegação
  ├── context/        # Contextos React para gerenciamento de estado
  │   └── AuthContext.jsx # Contexto de autenticação
  ├── pages/          # Páginas da aplicação
  │   ├── LoginPage.jsx    # Página de login
  │   ├── DashboardPage.jsx # Página principal
  │   ├── ProductsPage.jsx  # Gerenciamento de produtos
  │   ├── UsersPage.jsx     # Gerenciamento de usuários
  │   ├── ComprasPage.jsx   # Registro de compras
  │   ├── VendasPage.jsx    # Registro de vendas
  │   └── ...               # Outras páginas
  ├── App.jsx         # Componente principal da aplicação
  ├── main.jsx        # Ponto de entrada da aplicação React
  └── index.css       # Estilos globais
```

#### Tecnologias Utilizadas
- **Frontend**: React com Hooks e Context API para gerenciamento de estado
- **Estilização**: Tailwind CSS para design responsivo e moderno
- **Backend**: Electron para criar a aplicação desktop
- **Banco de Dados**: Better-SQLite3 para armazenamento local de dados
- **Autenticação**: Sistema próprio com bcrypt para criptografia de senhas

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

### Funcionalidades Prontas

 - login
 - adicionar usuario
 - editar usuario
 - listar usuarios
 - ativar e desativar usuario
 - so admin pode acessar o menu de usuarios
 - adicionar produto
 - editar produto
 - listar produtos
 - ativar e desativar produto
 - buscar por nome do produto
 - adicionar compra
 - listar compras
 - buscar por nome do fornecedor na compra
 - adicionar venda
 - listar vendas
 - buscar por nome do cliente na venda

### Funcionalidades em Desenvolvimento

 - fazer a tela de configuração
 - criar testes
 - aplicar segurança

---

## 🇬🇧 English

### Description
This is a complete inventory management system developed with Electron and React, designed for small and medium businesses that need to control their product inventory, purchases, and sales. The system offers a modern and intuitive interface, with support for light and dark mode, and works as a cross-platform desktop application.

This project was entirely developed on the trae.ai platform, in conjunction with the Google/Gemini-2.5-pro-exp-03-25:free model. The system will be implemented in a motorcycle repair shop in a town of approximately 15,000 inhabitants, with the only cost being development time, estimated at one week of work.

### Development Process

#### Methodology
The development followed an agile approach, with short implementation and testing cycles. For each implemented feature, tests were conducted to ensure the quality and usability of the system.

#### Workflow
1. **Requirements Analysis**: Assessment of the specific needs of the motorcycle repair shop
2. **Prototyping**: Creation of wireframes and definition of the user experience
3. **Development**: Implementation of features using Electron and React
4. **Testing**: Verification of the quality and usability of each feature
5. **Refinement**: Adjustments and improvements based on the tests performed

#### Challenges Overcome
- Integration between Electron and React to create a robust desktop application
- Implementation of an efficient local database with Better-SQLite3
- Development of a responsive and intuitive interface for different types of users
- Creation of a secure authentication system with different permission levels

#### System Architecture
The system was developed following a component architecture, with a clear separation between user interface, business logic, and data access. The directory structure was organized to facilitate system maintenance and scalability.

#### Project Structure
The project is organized as follows:

```
src/
  ├── components/     # Reusable components
  │   ├── Modal.jsx   # Generic modal component
  │   ├── ProtectedRoute.jsx # Authentication protected route
  │   └── layout/     # Layout components
  │       ├── Layout.jsx    # Main application layout
  │       ├── Navbar.jsx    # Top navigation bar
  │       └── Sidebar.jsx   # Side navigation bar
  ├── context/        # React contexts for state management
  │   └── AuthContext.jsx # Authentication context
  ├── pages/          # Application pages
  │   ├── LoginPage.jsx    # Login page
  │   ├── DashboardPage.jsx # Main page
  │   ├── ProductsPage.jsx  # Product management
  │   ├── UsersPage.jsx     # User management
  │   ├── ComprasPage.jsx   # Purchase registration
  │   ├── VendasPage.jsx    # Sales registration
  │   └── ...               # Other pages
  ├── App.jsx         # Main application component
  ├── main.jsx        # React application entry point
  └── index.css       # Global styles
```

#### Technologies Used
- **Frontend**: React with Hooks and Context API for state management
- **Styling**: Tailwind CSS for responsive and modern design
- **Backend**: Electron to create the desktop application
- **Database**: Better-SQLite3 for local data storage
- **Authentication**: Custom system with bcrypt for password encryption

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