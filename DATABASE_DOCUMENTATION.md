# Documentação da Estrutura de Banco de Dados (Supabase)

Esta documentação descreve a estrutura do banco de dados utilizado no sistema Gestão CopRede.

## Tipos Enumerados (Enums)

O banco de dados utiliza tipos enumerados para garantir integridade e consistência nos campos de status e categorias.

| Tipo | Valores | Descrição |
| :--- | :--- | :--- |
| `hierarchy_level_type` | `root`, `c2`, `c1`, `team` | Define o nível hierárquico do colaborador na árvore organizacional. |
| `employee_status_type` | `active`, `inactive`, `on_leave`, `vacation` | Status atual do colaborador. |
| `schedule_status_type` | `approved`, `planned`, `pending` | Status de uma escala de trabalho. |
| `overtime_status_type` | `pending`, `approved`, `rejected` | Status de uma solicitação de hora extra (legado/tabela futura). |
| `certificate_status_type` | `valid`, `expired`, `pending` | Validade de um atestado ou certificação. |
| `connection_type_enum` | `reports_to`, `collaborates_with` | Tipo de conexão hierárquica entre colaboradores. |
| `hours_bank_status_type` | `pending`, `approved`, `rejected` | Status de aprovação de um lançamento no banco de horas. |
| `hours_bank_transaction_type` | `credit`, `debit`, `adjustment` | Tipo de movimentação no banco de horas. |

---

## Tabelas

### 1. `employees` (Colaboradores)
Tabela principal que armazena os dados cadastrais e operacionais de todos os colaboradores.

| Coluna | Tipo | Obrigatório | Referência | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Sim | PK | Identificador único do colaborador. |
| `full_name` | TEXT | Sim | - | Nome completo. |
| `email` | TEXT | Não | UNIQUE | Endereço de email corporativo. |
| `role` | TEXT | Não | - | Cargo ou função (ex: Gerente, Analista). |
| `cluster` | TEXT | Não | - | Agrupamento ou área (ex: Matriz, Loja X). |
| `manager_id` | UUID | Não | `employees(id)` | ID do gestor direto (auto-relacionamento). |
| `hierarchy_level` | ENUM | Não | `hierarchy_level_type` | Nível na hierarquia visual. |
| `status` | ENUM | Padrão: 'active' | `employee_status_type` | Situação cadastral. |
| `user_id` | UUID | Não | `auth.users(id)` | Vínculo com usuário de autenticação do Supabase. |
| `current_hours_balance` | NUMERIC | Padrão: 0 | - | Saldo atualizado do banco de horas (cache). |
| `admission_date` | DATE | Não | - | Data de admissão. |

### 2. `hierarchy_connections` (Conexões Hierárquicas)
Define a estrutura de reporte e relacionamentos entre colaboradores para o organograma visual.

| Coluna | Tipo | Obrigatório | Referência | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Sim | PK | Identificador da conexão. |
| `source_employee_id` | UUID | Sim | `employees(id)` | Colaborador "Origem" (Gestor/Líder). |
| `target_employee_id` | UUID | Sim | `employees(id)` | Colaborador "Alvo" (Liderado). |
| `connection_type` | ENUM | Padrão: 'reports_to' | `connection_type_enum` | Tipo de relação. |

### 3. `schedules` (Escalas)
Armazena as escalas de trabalho diárias dos colaboradores.

| Coluna | Tipo | Obrigatório | Referência | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Sim | PK | Identificador da escala. |
| `employee_id` | UUID | Sim | `employees(id)` | Colaborador escalar. |
| `schedule_date` | DATE | Sim | - | Data da escala. |
| `shift_type` | TEXT | Não | - | Tipo de turno (ex: Manhã, Tarde). |
| `start_time` | TIME | Não | - | Horário de entrada. |
| `end_time` | TIME | Não | - | Horário de saída. |
| `status` | ENUM | Padrão: 'planned' | `schedule_status_type` | Status do agendamento. |

### 4. `hours_bank` (Banco de Horas)
Registra todas as movimentações (créditos e débitos) do banco de horas.

| Coluna | Tipo | Obrigatório | Referência | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Sim | PK | Identificador da transação. |
| `employee_id` | UUID | Sim | `employees(id)` | Dono do banco de horas. |
| `transaction_type` | ENUM | Sim | `hours_bank_transaction_type`| Crédito ou Débito. |
| `transaction_date` | DATE | Sim | - | Data da ocorrência. |
| `hours` | NUMERIC | Sim | - | Quantidade de horas. |
| `balance_after` | NUMERIC | Não | - | Saldo após a transação (histórico). |
| `status` | ENUM | Padrão: 'pending'| `hours_bank_status_type` | Status de aprovação. |
| `import_batch_id` | UUID | Não | - | ID do lote (se importado via CSV). |

### 5. `feedbacks` (Avaliações)
Registra feedbacks e avaliações de desempenho.

| Coluna | Tipo | Obrigatório | Referência | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Sim | PK | Identificador do feedback. |
| `employee_id` | UUID | Sim | `employees(id)` | Quem recebeu o feedback. |
| `evaluator_id` | UUID | Não | `employees(id)` | Quem deu o feedback. |
| `period_month` | INT | Não | - | Mês de referência. |
| `period_year` | INT | Não | - | Ano de referência. |
| `overall_rating` | NUMERIC | Não | - | Nota geral. |

### 6. `certificates` (Atestados e Certificados)
Armazena referências a arquivos de atestados ou certificados.

| Coluna | Tipo | Obrigatório | Referência | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Sim | PK | Identificador do documento. |
| `employee_id` | UUID | Sim | `employees(id)` | Titular do documento. |
| `certificate_name` | TEXT | Sim | - | Nome/Tipo do documento. |
| `file_url` | TEXT | Não | - | Link para o arquivo (Storage). |
| `expiry_date` | DATE | Não | - | Data de validade. |

---

## Views (Visões)

### `employee_hours_balance`
Uma view que agrega automaticamente o saldo do banco de horas por colaborador.
*   Soma créditos aprovados.
*   Subtrai débitos aprovados.
*   Calcula o `total_balance`.

---

## Segurança (RLS - Row Level Security)

Todas as tabelas possuem RLS habilitado.
*   **Políticas Atuais:** Para facilitar a migração e uso inicial, foram criadas políticas permissivas ("Enable ... for all users") que permitem SELECT, INSERT, UPDATE e DELETE para qualquer usuário autenticado ou anônimo com a chave correta.
*   **Recomendação Futura:** Restringir as políticas para que colaboradores vejam apenas seus próprios dados e gestores vejam apenas dados de suas equipes.
