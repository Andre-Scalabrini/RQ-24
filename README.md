# RQ-24 - Sistema de Aprovação de Peças em Processo

Sistema web completo para gerenciamento de fichas de aprovação de peças em processo industrial (fundição), com interface Kanban, geração de PDF, e preparação para versão mobile futura.

## 🚀 Stack Tecnológico

- **Frontend**: React.js 19
- **Backend**: Node.js com Express
- **Banco de Dados**: MySQL
- **Autenticação**: JWT

## 📋 Funcionalidades

### Kanban Board
- Visualização de todas as fichas organizadas por etapa
- Drag-and-drop para movimentação de fichas (para usuários autorizados)
- Destaque visual para fichas atrasadas
- Atualização automática do status

### Etapas do Processo
1. Criação da Ficha
2. Modelação
3. Moldagem
4. Fusão
5. Rebarbação
6. Inspeção
7. Usinagem (se aplicável)
8. Aprovado

### Grupos de Usuários
- **Administrador**: Acesso total, pode mover fichas entre todas as etapas
- **Superior**: Pode mover fichas para próxima etapa
- **Comum**: Pode criar e editar dados

### Formulário de Ficha
- Campos dinâmicos para Caixas de Macho
- Campos dinâmicos para Moldes de Árvore
- Cálculo automático de RAM e RM
- Validação de campos obrigatórios

### Outras Funcionalidades
- Geração de PDF das fichas
- Sistema de notificações visuais
- Alertas para fichas atrasadas
- Upload de imagens por etapa
- Histórico de movimentações

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- MySQL 8+

### Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas configurações de banco de dados
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 🔑 Credenciais Padrão

- **Email**: admin@empresa.com
- **Senha**: admin123

## 📁 Estrutura do Projeto

```
RQ-24/
├── backend/
│   ├── src/
│   │   ├── config/         # Configurações (DB, Auth)
│   │   ├── controllers/    # Controladores
│   │   ├── middlewares/    # Middlewares (Auth, Upload, etc)
│   │   ├── models/         # Modelos Sequelize
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços (PDF, Notificações)
│   │   ├── app.js          # Configuração Express
│   │   └── server.js       # Inicialização do servidor
│   └── uploads/            # Arquivos enviados
│
└── frontend/
    ├── public/
    └── src/
        ├── components/     # Componentes React
        │   ├── admin/      # Gerenciamento de usuários
        │   ├── auth/       # Login
        │   ├── ficha/      # Formulários e detalhes
        │   ├── kanban/     # Quadro Kanban
        │   └── layout/     # Layout principal
        ├── contexts/       # Context API
        ├── services/       # API client
        └── styles/         # CSS
```

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado
- `PUT /api/auth/alterar-senha` - Alterar senha

### Fichas
- `GET /api/fichas` - Listar fichas
- `GET /api/fichas/kanban` - Dados do Kanban
- `GET /api/fichas/:id` - Detalhes da ficha
- `POST /api/fichas` - Criar ficha
- `PUT /api/fichas/:id` - Atualizar ficha
- `POST /api/fichas/:id/mover` - Mover etapa
- `DELETE /api/fichas/:id` - Excluir ficha

### PDF
- `GET /api/pdf/ficha/:id` - Gerar PDF da ficha

### Notificações
- `GET /api/notificacoes` - Listar notificações
- `GET /api/notificacoes/nao-lidas` - Contar não lidas
- `PUT /api/notificacoes/:id/lida` - Marcar como lida

### Usuários
- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário
- `PUT /api/usuarios/:id` - Atualizar usuário
- `DELETE /api/usuarios/:id` - Desativar usuário

### Setores
- `GET /api/setores` - Listar setores
- `POST /api/setores` - Criar setor

## 📱 Responsividade

O sistema foi desenvolvido com design responsivo, preparado para uso em:
- Desktop
- Tablets
- Dispositivos móveis

## 🔒 Segurança

- Autenticação via JWT
- Middleware de autorização por grupo/setor
- Helmet para proteção de headers
- Validação de campos com express-validator
- CORS configurado

## 📄 Licença

ISC
