import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdrpxvfnuitnwbnvirtt.supabase.co';
// Usando a legacy anon key JWT que é compatível com o Supabase JS Client
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnB4dmZudWl0bndibnZpcnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjA1NzcsImV4cCI6MjA4MzczNjU3N30.Dq2X7hD96RIJDWIdLJK4lzOYI1zzsBGIrkAK-0uo-GM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Employee {
    id: string;
    created_at: string;
    updated_at: string;
    full_name: string;
    email?: string;
    phone?: string;
    photo_url?: string;
    role: string;
    cluster?: string;
    store?: string;
    admission_date?: string;
    salary?: number;
    manager_id?: string;
    hierarchy_level?: 'root' | 'c2' | 'c1' | 'team';
    performance_score?: number;
    graph_position_x?: number;
    graph_position_y?: number;
    status?: 'active' | 'inactive' | 'on_leave';
    employee_number?: string;
    login?: string;
    address?: string;
    city?: string;
    uf?: string;
    shift?: string;
    current_hours_balance?: number;
    metadata?: any;
    user_id?: string;
    must_change_password?: boolean;
}

export interface Feedback {
    id: string;
    created_at: string;
    updated_at: string;
    employee_id: string;
    evaluator_id?: string;
    period_month: number;
    period_year: number;
    strengths?: string;
    improvements?: string;
    overall_rating?: number;
    status?: 'draft' | 'sent' | 'acknowledged';
    sent_at?: string;
    email_preview?: string;
}

export interface Schedule {
    id: string;
    created_at: string;
    updated_at: string;
    employee_id: string;
    schedule_date: string;
    shift_type?: 'morning' | 'afternoon' | 'night' | 'off' | 'vacation' | 'dsr' | '08-17' | '09-18' | '10-19' | '13-22' | 'FOLGA' | 'FÉRIAS' | 'FB' | 'INSS' | 'ATESTADO' | 'AFAST' | 'FALTA JUSTIFICADA' | 'FALTA NÃO JUSTIFICADA';
    start_time?: string;
    end_time?: string;
    notes?: string;
    status?: 'approved' | 'planned' | 'pending';
}

export interface Overtime {
    id: string;
    created_at: string;
    updated_at: string;
    employee_id: string;
    overtime_date: string;
    hours: number;
    overtime_type?: 'regular' | 'holiday' | 'night';
    status?: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: string;
    reason?: string;
    notes?: string;
}

export interface Certificate {
    id: string;
    created_at: string;
    updated_at: string;
    employee_id: string;
    certificate_name: string;
    issuer?: string;
    issue_date?: string;
    expiry_date?: string;
    file_url?: string;
    file_name?: string;
    status?: 'valid' | 'expired' | 'pending';
}

export interface HierarchyConnection {
    id: string;
    created_at: string;
    source_employee_id: string;
    target_employee_id: string;
    connection_type?: 'reports_to' | 'collaborates_with';
}
