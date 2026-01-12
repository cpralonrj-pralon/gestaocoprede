import { supabase } from './client';

export interface HoursBank {
    id: string;
    created_at: string;
    updated_at: string;
    employee_id: string;
    transaction_type: 'credit' | 'debit' | 'adjustment';
    transaction_date: string;
    hours: number;
    balance_after: number;
    overtime_id?: string;
    schedule_id?: string;
    description?: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: string;
    import_batch_id?: string;
    source_file?: string;
}

export interface HoursBankBalance {
    employee_id: string;
    total_balance: number;
    total_credits: number;
    total_debits: number;
    last_transaction_date: string;
    transaction_count: number;
    pending_count: number;
}

export interface HoursBankImportRow {
    employeeIdentifier: string; // matricula, email ou cpf
    name?: string;
    date: string;
    workedHours: number;
    expectedHours: number;
    type?: 'credit' | 'debit' | 'normal';
    notes?: string;
}

/**
 * Get all hours bank transactions
 */
export async function getAllHoursBankTransactions(): Promise<HoursBank[]> {
    const { data, error } = await supabase
        .from('hours_bank')
        .select('*')
        .order('transaction_date', { ascending: false });

    if (error) {
        console.error('Error fetching hours bank transactions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get hours bank transactions by employee
 */
export async function getEmployeeHoursBankTransactions(employeeId: string): Promise<HoursBank[]> {
    const { data, error } = await supabase
        .from('hours_bank')
        .select('*')
        .eq('employee_id', employeeId)
        .order('transaction_date', { ascending: false });

    if (error) {
        console.error('Error fetching employee hours bank:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get employee hours balance
 */
export async function getEmployeeBalance(employeeId: string): Promise<number> {
    const { data, error } = await supabase
        .from('employee_hours_balance')
        .select('total_balance')
        .eq('employee_id', employeeId)
        .single();

    if (error) {
        console.error('Error fetching employee balance:', error);
        return 0;
    }

    return data?.total_balance || 0;
}

/**
 * Get detailed balance for employee
 */
export async function getEmployeeDetailedBalance(employeeId: string): Promise<HoursBankBalance | null> {
    const { data, error } = await supabase
        .from('employee_hours_balance')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

    if (error) {
        console.error('Error fetching detailed balance:', error);
        return null;
    }

    return data;
}

/**
 * Create hours bank transaction
 */
export async function createHoursBankTransaction(
    transaction: Omit<HoursBank, 'id' | 'created_at' | 'updated_at'>
): Promise<HoursBank> {
    const { data, error } = await supabase
        .from('hours_bank')
        .insert([transaction])
        .select()
        .single();

    if (error) {
        console.error('Error creating hours bank transaction:', error);
        throw error;
    }

    return data;
}

/**
 * Create multiple hours bank transactions (bulk)
 */
export async function createHoursBankTransactionsBulk(
    transactions: Omit<HoursBank, 'id' | 'created_at' | 'updated_at'>[]
): Promise<HoursBank[]> {
    const { data, error } = await supabase
        .from('hours_bank')
        .insert(transactions)
        .select();

    if (error) {
        console.error('Error creating hours bank transactions in bulk:', error);
        throw error;
    }

    return data || [];
}

/**
 * Update hours bank transaction
 */
export async function updateHoursBankTransaction(
    id: string,
    updates: Partial<HoursBank>
): Promise<HoursBank> {
    const { data, error } = await supabase
        .from('hours_bank')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating hours bank transaction:', error);
        throw error;
    }

    return data;
}

/**
 * Approve hours bank transaction
 */
export async function approveHoursBankTransaction(
    id: string,
    approvedBy: string
): Promise<HoursBank> {
    return updateHoursBankTransaction(id, {
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
    });
}

/**
 * Reject hours bank transaction
 */
export async function rejectHoursBankTransaction(
    id: string,
    approvedBy: string
): Promise<HoursBank> {
    return updateHoursBankTransaction(id, {
        status: 'rejected',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
    });
}

/**
 * Delete hours bank transaction
 */
export async function deleteHoursBankTransaction(id: string): Promise<void> {
    const { error } = await supabase
        .from('hours_bank')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting hours bank transaction:', error);
        throw error;
    }
}

/**
 * Find employee by identifier (employee_number, email, or name)
 */
async function findEmployeeByIdentifier(identifier: string): Promise<any> {
    // Try by employee_number first
    let { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_number', identifier)
        .single();

    if (!error && data) return data;

    // Try by email
    ({ data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', identifier)
        .single());

    if (!error && data) return data;

    // Try by name (case insensitive)
    ({ data, error } = await supabase
        .from('employees')
        .select('*')
        .ilike('full_name', identifier)
        .single());

    if (!error && data) return data;

    return null;
}

/**
 * Import hours bank from file data
 */
export async function importHoursBank(
    rows: HoursBankImportRow[],
    sourceFile: string
): Promise<{ success: number; errors: Array<{ row: number; error: string }> }> {
    const batchId = crypto.randomUUID();
    const results = { success: 0, errors: [] as Array<{ row: number; error: string }> };

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because of header and 0-index

        try {
            // 1. Find employee
            const employee = await findEmployeeByIdentifier(row.employeeIdentifier);

            if (!employee) {
                results.errors.push({
                    row: rowNumber,
                    error: `Colaborador não encontrado: ${row.employeeIdentifier}`
                });
                continue;
            }

            // 2. Calculate difference
            const difference = row.workedHours - row.expectedHours;

            if (difference === 0) continue; // Normal workday, no transaction needed

            // 3. Determine transaction type
            let transactionType: 'credit' | 'debit' = difference > 0 ? 'credit' : 'debit';

            if (row.type && row.type !== 'normal') {
                transactionType = row.type;
            }

            // 4. Get current balance
            const currentBalance = await getEmployeeBalance(employee.id);

            // 5. Create transaction
            await createHoursBankTransaction({
                employee_id: employee.id,
                transaction_type: transactionType,
                transaction_date: row.date,
                hours: Math.abs(difference),
                balance_after: currentBalance + difference,
                description: `Importação: ${row.workedHours}h trabalhadas vs ${row.expectedHours}h previstas`,
                notes: row.notes,
                import_batch_id: batchId,
                source_file: sourceFile,
                status: 'approved' // Auto-approve imports, or use 'pending' if manual approval needed
            });

            results.success++;
        } catch (error: any) {
            results.errors.push({
                row: rowNumber,
                error: error.message || 'Erro desconhecido'
            });
        }
    }

    return results;
}

/**
 * Get transactions by batch ID
 */
export async function getTransactionsByBatch(batchId: string): Promise<HoursBank[]> {
    const { data, error } = await supabase
        .from('hours_bank')
        .select('*')
        .eq('import_batch_id', batchId)
        .order('transaction_date');

    if (error) {
        console.error('Error fetching batch transactions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get all balances (for dashboard)
 */
export async function getAllEmployeeBalances(): Promise<HoursBankBalance[]> {
    const { data, error } = await supabase
        .from('employee_hours_balance')
        .select('*')
        .order('total_balance', { ascending: false });

    if (error) {
        console.error('Error fetching all balances:', error);
        throw error;
    }

    return data || [];
}

/**
 * Subscribe to hours bank changes (realtime)
 */
export function subscribeToHoursBank(callback: (payload: any) => void) {
    return supabase
        .channel('hours_bank_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'hours_bank' },
            callback
        )
        .subscribe();
}
