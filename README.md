# PeopleOps - Gestão Operacional & IA

O PeopleOps é uma plataforma inteligente voltada para a gestão de colaboradores e inteligência operacional para a rede COP. A ferramenta oferece dashboards analíticos, gestão de escalas, feedbacks automatizados e insights gerados por IA para otimizar a performance da equipe.

## 🚀 Funcionalidades

- **Dashboard Geral**: Visualização macro de métricas de performance e presença.
- **Hierarquia**: Gerenciamento da estrutura organizacional (Cluster, Loja, Cargo).
- **Feedbacks & Desempenho**: Registro e consulta de avaliações e produtividade.
- **Insights com IA**: Análise estratégica via Google Gemini para melhoria contínua.
- **Gestão de Escalas & Férias**: Planejamento operacional e controle de ausências.
- **Portal do Colaborador**: Perfil detalhado com histórico de certificados e horas extras.

## 🛠️ Tecnologias Utilizadas

- **React 19** - Biblioteca core para interface.
- **Vite** - Build tool e dev server.
- **TypeScript** - Tipagem estática para robustez do código.
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

---
*Gestão Colaborador COP REDE - Transformando dados em performance.*
