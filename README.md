# Lidere University - Plataforma de Gestão

Bem-vindo à documentação da plataforma de gestão Lidere University. Este é um sistema completo construído em Next.js, projetado para gerenciar todos os aspectos do seu negócio digital, desde vendas e finanças até a entrega de conteúdo e acompanhamento de clientes.

## Arquitetura e Tecnologias

A aplicação utiliza uma stack moderna e robusta para garantir performance, escalabilidade e uma ótima experiência de desenvolvimento.

- **Frontend:** [Next.js](https://nextjs.org/) com [React](https://react.dev/) e [TypeScript](https://www.typescriptlang.org/).
- **UI:** [Shadcn/ui](https://ui.shadcn.com/) e [Tailwind CSS](https://tailwindcss.com/) para uma interface de usuário moderna, responsiva e customizável.
- **Backend & Banco de Dados:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage) para persistência de dados, autenticação e armazenamento de arquivos.
- **Inteligência Artificial:** [Google AI com Genkit](https://firebase.google.com/docs/genkit) para funcionalidades de IA, como a geração de emails.
- **Roteamento:** Next.js App Router para um roteamento otimizado e baseado em componentes de servidor.

## Principais Funcionalidades

A plataforma está organizada em módulos, com acesso controlado por um sistema de cargos e permissões.

### Vendas & CRM
- **Funil de Vendas (`/pipeline`):** Visualize e gerencie seus negócios em um funil de vendas customizável.
- **Gestão de Contatos (`/contacts`):** Centralize as informações dos seus clientes e leads, com suporte a tags, dados demográficos e importação via CSV.
- **Email Inteligente (`/smart-email`):** Utilize IA (Genkit) para gerar emails de vendas personalizados com base no perfil do cliente.

### Operações
- **Onboarding de Clientes (`/onboarding`):** Um quadro Kanban para gerenciar o processo de onboarding de novos clientes, com etapas e tarefas definidas por produto.
- **Acompanhamento (`/acompanhamento`):** Gerencie o acompanhamento contínuo de clientes, registrando mentorias, definindo planos de ação e validando tarefas. Inclui uma página pública para o cliente acompanhar seu progresso.

### Conteúdo
- **Formações (`/formacoes`):** Plataforma para hospedar e consumir cursos e treinamentos, com estrutura de módulos e aulas. O acesso é controlado por produto.
- **Gerenciamento de Conteúdo (`/gerenciar-formacoes`):** Ferramenta para criar e editar as formações, módulos e aulas.

### Financeiro
- **Visão Geral (`/financeiro`):** Um dashboard para registrar e visualizar todas as entradas e saídas financeiras.
- **Contas a Pagar e Receber (`/contas`):** Controle detalhado de contas recorrentes e pontuais, com status de pagamento.
- **Gestão de Dívidas (`/dividas`):** Cadastre e acompanhe empréstimos e financiamentos, com geração automática das parcelas em contas a pagar.
- **Empresas (`/empresas`):** Gerencie múltiplas empresas ou centros de custo, incluindo seus respectivos cartões de crédito.

### Gestão e Administração
- **Controle de Acesso:** Sistema robusto baseado em Cargos (`/roles`) e Usuários (`/users`), permitindo permissões flexíveis para cada tela da plataforma.
- **Gestão de Alunos (`/gerenciar-alunos`):** Conceda, edite e revogue o acesso de contatos à área de conteúdo.
- **Gestão de Produtos (`/products`):** Crie e gerencie os produtos vendidos, vinculando-os a formações, processos de onboarding e regras de acesso.
- **Automações (`/automacoes`):** Configure um webhook para receber informações de novas vendas de plataformas de pagamento externas, criando contatos e acessos automaticamente.

## Configuração do Ambiente

Para que a aplicação funcione corretamente, é **essencial** configurar as variáveis de ambiente.

1.  **Renomeie o arquivo:** Se ainda não o fez, renomeie o arquivo `.env.example` (se houver) para `.env` na raiz do projeto.
2.  **Preencha as variáveis do Firebase:**
    - Vá para o seu projeto no [Console do Firebase](https://console.firebase.google.com/).
    - Em "Configurações do Projeto" > "Geral", encontre as configurações do seu aplicativo da web.
    - Copie os valores e cole-os no seu arquivo `.env`:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="1:..."
    ```
3.  **Configure a Chave do Webhook:**
    - Crie uma chave secreta forte e aleatória para proteger sua API de webhook.
    ```env
    WEBHOOK_API_KEY="sua-chave-secreta-aqui"
    ```
4.  **Configure o Servidor de Email (SMTP):**
    - Para o envio de emails (como o de boas-vindas para novos alunos), configure suas credenciais SMTP.
    ```env
    SMTP_HOST="smtp.seu-provedor.com"
    SMTP_PORT="587"
    SMTP_USER="seu-email@dominio.com"
    SMTP_PASS="sua-senha-de-app"
    EMAIL_FROM="Seu Nome <seu-email@dominio.com>"
    ```

**Importante:** Após alterar o arquivo `.env`, você **precisa reiniciar o servidor de desenvolvimento** para que as novas variáveis sejam carregadas.

## Como Rodar o Projeto

Com o ambiente configurado, você pode rodar a aplicação localmente.

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Inicie o servidor de desenvolvimento do Next.js:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

3.  **(Opcional) Inicie o servidor do Genkit para IA:**
    - Para testar as funcionalidades de IA localmente, abra um **novo terminal** e rode:
    ```bash
    npm run genkit:watch
    ```
    Isso iniciará o Genkit Dev UI, geralmente em [http://localhost:4000](http://localhost:4000), e permitirá que a aplicação Next.js se comunique com ele.
