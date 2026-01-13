# Gestão CopRede - Gestão Operacional & IA

O Gestão CopRede é uma plataforma inteligente voltada para a gestão de colaboradores e inteligência operacional para a rede COP. A ferramenta oferece dashboards analíticos, gestão de escalas, feedbacks automatizados e insights gerados por IA para otimizar a performance da equipe.

## 🚀 Funcionalidades

- **Dashboard Geral**: Visualização macro de métricas de performance e presença.
- **Hierarquia Visual**: Grafo interativo da estrutura organizacional.
- **Autenticação Segura**: Login corporativo, fluxo de primeiro acesso com troca de senha obrigatória e recuperação de senha.
- **Gestão de Perfil**: Upload de avatar, dados pessoais e reset de senha administrativo.
- **Feedbacks & Desempenho**: Registro e consulta de avaliações e produtividade com histórico.
- **Insights com IA**: Análise estratégica via Google Gemini para melhoria contínua.
- **Gestão de Escalas & Férias**: Planejamento operacional e controle de ausências.
- **Portal do Colaborador**: Acesso self-service a holerites, pontos e dados cadastrais.

## 🛠️ Tecnologias Utilizadas

- **React 19** - Biblioteca core para interface.
- **Vite** - Build tool e dev server.
- **TypeScript** - Tipagem estática para robustez do código.
- **Supabase** - Backend as a Service (Auth, Database, Storage, Edge Functions).
- **Recharts** - Visualização de dados e gráficos.
- **Tailwind CSS** - Estilização moderna e responsiva.
- **Gemini AI** - Inteligência artificial para análise de dados.

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### Passos
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env.local` na raiz.
   - Adicione sua chave do Gemini: `GEMINI_API_KEY=sua_chave_aqui`
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🏗️ Build

Para gerar a versão de produção:
```bash
npm run build
```
O build será gerado na pasta `/dist`.

## 🚀 Deploy no GitHub Pages

Este projeto está configurado para deploy automático via GitHub Actions.

### Configuração inicial:
1. Vá em **Settings → Secrets and variables → Actions**
2. Adicione o secret `GEMINI_API_KEY` com sua chave da API
3. Vá em **Settings → Pages**
4. Em **Source**, selecione **GitHub Actions**

### Deploy automático:
- Cada push na branch `main` dispara o workflow automaticamente
- O build é gerado e publicado em `https://cpralonrj-pralon.github.io/gestaocoprede/`

---
*Gestão Colaborador COP REDE - Transformando dados em performance.*
