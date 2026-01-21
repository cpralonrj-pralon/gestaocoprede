-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE hierarchy_level_type AS ENUM ('root', 'c2', 'c1', 'team');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status_type AS ENUM ('active', 'inactive', 'on_leave', 'vacation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE schedule_status_type AS ENUM ('approved', 'planned', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE overtime_status_type AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE certificate_status_type AS ENUM ('valid', 'expired', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_type_enum AS ENUM ('reports_to', 'collaborates_with');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hours_bank_status_type AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hours_bank_transaction_type AS ENUM ('credit', 'debit', 'adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    photo_url TEXT,
    role TEXT,
    cluster TEXT,
    store TEXT,
    admission_date DATE,
    salary NUMERIC,
    manager_id UUID REFERENCES employees(id),
    hierarchy_level hierarchy_level_type,
    performance_score NUMERIC,
    graph_position_x NUMERIC,
    graph_position_y NUMERIC,
    status employee_status_type DEFAULT 'active',
    employee_number TEXT UNIQUE,
    login TEXT UNIQUE,
    address TEXT,
    city TEXT,
    uf TEXT,
    shift TEXT,
    current_hours_balance NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    must_change_password BOOLEAN DEFAULT FALSE
);

-- Create Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    period_month INTEGER,
    period_year INTEGER,
    strengths TEXT,
    improvements TEXT,
    overall_rating NUMERIC,
    status TEXT CHECK (status IN ('draft', 'sent', 'acknowledged')),
    sent_at TIMESTAMPTZ,
    email_preview TEXT
);

-- Create Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    shift_type TEXT,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    status schedule_status_type DEFAULT 'planned',
    UNIQUE(employee_id, schedule_date)
);

-- Create Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certificate_name TEXT NOT NULL,
    issuer TEXT,
    issue_date DATE,
    expiry_date DATE,
    file_url TEXT,
    file_name TEXT,
    status certificate_status_type DEFAULT 'valid'
);

-- Create Hierarchy Connections Table
CREATE TABLE IF NOT EXISTS hierarchy_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    target_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    connection_type connection_type_enum DEFAULT 'reports_to',
    UNIQUE(source_employee_id, target_employee_id)
);

-- Create Hours Bank Table
CREATE TABLE IF NOT EXISTS hours_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    transaction_type hours_bank_transaction_type NOT NULL,
    transaction_date DATE NOT NULL,
    hours NUMERIC NOT NULL,
    balance_after NUMERIC,
    overtime_id UUID,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    description TEXT,
    notes TEXT,
    status hours_bank_status_type DEFAULT 'pending',
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    import_batch_id UUID,
    source_file TEXT
);

-- Create View: employee_hours_balance
CREATE OR REPLACE VIEW employee_hours_balance AS
SELECT 
    e.id AS employee_id,
    COALESCE(SUM(
        CASE 
            WHEN hb.status = 'approved' AND hb.transaction_type = 'credit' THEN hb.hours
            WHEN hb.status = 'approved' AND hb.transaction_type = 'debit' THEN -hb.hours
            ELSE 0 
        END
    ), 0) AS total_balance,
    COALESCE(SUM(
        CASE 
            WHEN hb.status = 'approved' AND hb.transaction_type = 'credit' THEN hb.hours
            ELSE 0 
        END
    ), 0) AS total_credits,
    COALESCE(SUM(
        CASE 
            WHEN hb.status = 'approved' AND hb.transaction_type = 'debit' THEN hb.hours
            ELSE 0 
        END
    ), 0) AS total_debits,
    MAX(hb.transaction_date) AS last_transaction_date,
    COUNT(hb.id) AS transaction_count,
    COUNT(CASE WHEN hb.status = 'pending' THEN 1 END) AS pending_count
FROM 
    employees e
LEFT JOIN 
    hours_bank hb ON e.id = hb.employee_id
GROUP BY 
    e.id;

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours_bank ENABLE ROW LEVEL SECURITY;

-- Create Policies
DO $$ BEGIN
    CREATE POLICY "Enable read access for all users" ON employees FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable insert for all users" ON employees FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable update for all users" ON employees FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Enable delete for all users" ON employees FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policies for other tables
DO $$ BEGIN CREATE POLICY "Enable read access for all users" ON feedbacks FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable insert for all users" ON feedbacks FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable update for all users" ON feedbacks FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable delete for all users" ON feedbacks FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Enable read access for all users" ON schedules FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable insert for all users" ON schedules FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable update for all users" ON schedules FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable delete for all users" ON schedules FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Enable read access for all users" ON certificates FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable insert for all users" ON certificates FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable update for all users" ON certificates FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable delete for all users" ON certificates FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Enable read access for all users" ON hierarchy_connections FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable insert for all users" ON hierarchy_connections FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable update for all users" ON hierarchy_connections FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable delete for all users" ON hierarchy_connections FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE POLICY "Enable read access for all users" ON hours_bank FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable insert for all users" ON hours_bank FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable update for all users" ON hours_bank FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Enable delete for all users" ON hours_bank FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
