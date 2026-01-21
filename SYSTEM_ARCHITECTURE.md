# Documentação da Arquitetura do Sistema - Gestão CopRede

Este documento descreve a arquitetura técnica, organização de código e fluxo de dados da aplicação **Gestão CopRede**.

## 1. Visão Geral (Tech Stack)

A aplicação é uma plataforma de gestão de recursos humanos (PeopleOps) focada em operações de campo.

*   **Frontend**: React 19 + TypeScript + Vite.
*   **Banco de Dados & Auth**: Supabase (PostgreSQL).
*   **Estilização**: TailwindCSS (Utility-first framework).
*   **Visualização de Dados**: Recharts (Gráficos), @xyflow/react (Organogramas).
*   **Inteligência Artificial**: Google Gemini AI (via API) para insights preditivos e geração de escalas.
*   **Gerenciamento de Estado**: React Context API (AuthContext e EmployeeContext).

---

## 2. Estrutura do Projeto

A organização de pastas segue uma arquitetura baseada em funcionalidades e camadas de serviço.

```
gestaocoprede/
├── components/         # Componentes reutilizáveis de interface (Modais, Sidebar, Cards)
│   ├── Sidebar.tsx     # Menu lateral com lógica de permissões baseada em cargo
│   ├── Header.tsx      # Cabeçalho global com busca e filtros
│   └── ... (Modais de cadastro, edição de senha, etc.)
│
├── context/            # Gerenciamento de estado global (Context API)
│   ├── AuthContext.tsx     # Autenticação, sessão do usuário e perfil
│   └── EmployeeContext.tsx # Cache de colaboradores e lógicas compartilhadas
│
├── services/           # Camada de comunicação com APIs externas
│   ├── gemini.ts       # Integração com a IA do Google (Provisão de insights)
│   └── supabase/       # Clientes e funções de acesso ao banco de dados
│       ├── client.ts   # Configuração do cliente Supabase e tipagens globais
│       ├── employees.ts # CRUD de colaboradores
│       ├── hierarchy.ts # Gestão de conexões do organograma
│       └── ... (schedules, feedback, hoursBank, certificates)
│
├── views/              # Telas principais da aplicação (Páginas)
│   ├── DashboardView.tsx   # Painel principal com KPIs e gráficos
│   ├── HierarchyView.tsx   # Organograma interativo (React Flow)
│   ├── AIInsightsView.tsx  # Chatbot e análises preditivas via Gemini
│   ├── LoginView.tsx       # Tela de login
│   └── ... (ScheduleView, FeedbackView, etc.)
│
├── utils/              # Funções utilitárias e helpers
│   ├── csvParser.ts    # Lógica de importação de planilhas
│   └── roleUtils.ts    # Helpers para verificação de permissões
│
├── types.ts            # Definições de tipos TypeScript compartilhados
├── App.tsx             # Componente raiz com roteamento condicional (Menus)
└── supabase_migration.sql # Script SQL de definição do esquema do banco
```

---

## 3. Fluxo de Dados e Autenticação

### Autenticação (AuthContext)
1.  O sistema utiliza o **Supabase Auth** para login (Email/Senha).
2.  Ao fazer login, o `AuthContext` recupera a sessão e o usuário.
3.  O `user.id` da autenticação é usado para buscar o perfil correspondente na tabela `employees` (campo `user_id`).
4.  O perfil do colaborador determina o **Cargo (Role)** (ex: ADMIN, GESTOR, COLABORADOR), que controla o acesso aos módulos.

### Integração com Banco de Dados (Services Layer)
*   **Padrão de Serviço**: Cada entidade (Employees, Schedules, etc.) possui um arquivo dedicado em `services/supabase/`.
*   **Conexão Segura**: Utiliza variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) definidas em `.env.local`.
*   **RLS (Row Level Security)**: A segurança é aplicada no nível do banco de dados, embora policies permissivas tenham sido usadas inicialmente para facilitar a migração.

### Inteligência Artificial (Gemini Service)
*   O arquivo `services/gemini.ts` centraliza as chamadas à API do Google.
*   Funcionalidades:
    *   **Insights de KPI**: Analisa números e sugere ações.
    *   **Smart Schedule**: Gera escalas de trabalho otimizadas respeitando CLT 5x2.
    *   **Chatbot**: Assistente virtual para dúvidas de gestão.

---

## 4. Principais Módulos

### Dashboard
*   Exibe KPIs em tempo real (Headcount, Turnover, Absenteísmo).
*   Gráficos construídos com `recharts`.
*   Filtros por cluster e período.

### Hierarquia (Organograma)
*   Utiliza `@xyflow/react` para renderizar uma árvore interativa.
*   Permite criar conexões arrastando nós ("drag-and-connect").
*   Edição visual de estrutura (gestores e subordinados).

### Escalas (Smart Scheduling)
*   Visualização de calendário mensal.
*   Algoritmo de IA para preencher turnos automaticamente.
*   Validação de regras (folgas, domingos, 6 dias consecutivos).

---

## 5. Boas Práticas e Padrões
*   **Mobile-First / Responsividade**: Interface adaptável via TailwindCSS.
*   **Dark Mode**: Suporte nativo a tema escuro (`dark:` classes).
*   **Tipagem Forte**: Uso extensivo de TypeScript interfaces (`types.ts` e `services/supabase/client.ts`) para evitar erros em tempo de execução.
