import { supabase, Employee } from './client';

const SUPABASE_URL = 'https://qdrpxvfnuitnwbnvirtt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnB4dmZudWl0bndibnZpcnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjA1NzcsImV4cCI6MjA4MzczNjU3N30.Dq2X7hD96RIJDWIdLJK4lzOYI1zzsBGIrkAK-0uo-GM';

/**
 * Get all employees - usa fetch direto para evitar AbortError
 */
export async function getAllEmployees(): Promise<Employee[]> {
    // Tentar fetch direto primeiro
    try {
        const directResult = await getAllEmployeesDirect();
        console.log(`[getAllEmployees] ✅ Fetch direto retornou ${directResult?.length || 0} employees`);
        if (directResult && directResult.length > 0) {
            console.log('[getAllEmployees] 📤 Retornando', directResult.length, 'employees');
            return directResult;
        }
    } catch (directError) {
        console.log('[getAllEmployees] ❌ Fetch direto falhou:', directError);
    }

    // Fallback para cliente Supabase
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('full_name');

        if (error) {
            console.error('Error fetching employees:', error);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.error('Error fetching employees:', err);
        return [];
    }
}

/**
 * Versão com fetch direto para employees
 */
async function getAllEmployeesDirect(): Promise<Employee[]> {
    const url = `${SUPABASE_URL}/rest/v1/employees?select=*&order=full_name`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        console.error('[getAllEmployeesDirect] HTTP Error:', response.status);
        return [];
    }

    return await response.json();
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching employee:', error);
        return null;
    }

    return data;
}

/**
 * Get employee by User ID (auth.users.id)
 * Includes retry mechanism for AbortError
 */
export async function getEmployeeByUserId(userId: string, retries: number = 3): Promise<Employee | null> {
    console.log('[getEmployeeByUserId] Buscando employee para user_id:', userId);

    // Tentar primeiro com fetch direto (mais confiável)
    try {
        const directResult = await getEmployeeByUserIdDirect(userId);
        if (directResult) {
            return directResult;
        }
    } catch (directError) {
        console.log('[getEmployeeByUserId] Fetch direto falhou, tentando via cliente...');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // Se for AbortError e ainda temos tentativas, fazer retry
                if ((error.message?.includes('abort') || error.message?.includes('Abort')) && attempt < retries) {
                    console.log(`[getEmployeeByUserId] AbortError detected, retry ${attempt}/${retries}...`);
                    await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // delay crescente
                    continue;
                }

                console.error('[getEmployeeByUserId] Erro na consulta:', error.message, error.code);
                return null;
            }

            console.log('[getEmployeeByUserId] Employee encontrado:', data?.full_name, data?.role);
            return data;
        } catch (err: any) {
            // Se for AbortError e ainda temos tentativas, fazer retry
            if ((err?.name === 'AbortError' || err?.message?.includes('abort')) && attempt < retries) {
                console.log(`[getEmployeeByUserId] AbortError exception, retry ${attempt}/${retries}...`);
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                continue;
            }
            console.error('[getEmployeeByUserId] Exception:', err);
            return null;
        }
    }

    return null;
}

/**
 * Versão alternativa usando fetch direto - bypassa problemas do Supabase Client
 */
async function getEmployeeByUserIdDirect(userId: string): Promise<Employee | null> {
    const SUPABASE_URL = 'https://qdrpxvfnuitnwbnvirtt.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnB4dmZudWl0bndibnZpcnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjA1NzcsImV4cCI6MjA4MzczNjU3N30.Dq2X7hD96RIJDWIdLJK4lzOYI1zzsBGIrkAK-0uo-GM';

    const url = `${SUPABASE_URL}/rest/v1/employees?user_id=eq.${userId}&select=*`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    });

    if (!response.ok) {
        console.error('[getEmployeeByUserIdDirect] HTTP Error:', response.status);
        return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
        console.log('[getEmployeeByUserIdDirect] Employee encontrado via fetch:', data[0]?.full_name);
        return data[0] as Employee;
    }

    return null;
}

/**
 * Get employees by manager
 */
export async function getEmployeesByManager(managerId: string): Promise<Employee[]> {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('manager_id', managerId)
        .order('full_name');

    if (error) {
        console.error('Error fetching employees by manager:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get employees by cluster
 */
export async function getEmployeesByCluster(cluster: string): Promise<Employee[]> {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('cluster', cluster)
        .order('full_name');

    if (error) {
        console.error('Error fetching employees by cluster:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create new employee
 */
export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select()
        .single();

    if (error) {
        console.error('Error creating employee:', error);
        throw error;
    }

    return data;
}

/**
 * Create multiple employees (bulk import)
 */
export async function createEmployeesBulk(employees: Omit<Employee, 'id' | 'created_at' | 'updated_at'>[]): Promise<Employee[]> {
    const { data, error } = await supabase
        .from('employees')
        .insert(employees)
        .select();

    if (error) {
        console.error('Error creating employees in bulk:', error);
        throw error;
    }

    return data || [];
}

/**
 * Update employee
 */
export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating employee:', error);
        throw error;
    }

    return data;
}

/**
 * Delete employee
 */
export async function deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting employee:', error);
        throw error;
    }
}

/**
 * Update employee graph position
 */
export async function updateEmployeePosition(id: string, x: number, y: number): Promise<void> {
    const { error } = await supabase
        .from('employees')
        .update({
            graph_position_x: x,
            graph_position_y: y
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating employee position:', error);
        throw error;
    }
}

/**
 * Get hierarchy tree (employees with their subordinates)
 */
export async function getHierarchyTree(): Promise<Employee[]> {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('hierarchy_level')
        .order('full_name');

    if (error) {
        console.error('Error fetching hierarchy tree:', error);
        throw error;
    }

    return data || [];
}

/**
 * Search employees by name or email
 */
export async function searchEmployees(query: string): Promise<Employee[]> {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('full_name');

    if (error) {
        console.error('Error searching employees:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get employees count by role
 */
export async function getEmployeeCountByRole(): Promise<Record<string, number>> {
    const { data, error } = await supabase
        .from('employees')
        .select('role')
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching employee count:', error);
        return {};
    }

    const counts: Record<string, number> = {};
    data.forEach(emp => {
        counts[emp.role] = (counts[emp.role] || 0) + 1;
    });

    return counts;
}

/**
 * Subscribe to employees changes (realtime)
 */
export function subscribeToEmployees(callback: (payload: any) => void) {
    return supabase
        .channel('employees_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'employees' },
            callback
        )
        .subscribe();
}

/**
 * Cria um usuário de autenticação com senha padrão e vincula ao employee
 * @param employeeId - ID do funcionário
 * @param email - Email do funcionário
 * @param defaultPassword - Senha padrão (default: claro123)
 */
export async function createUserWithDefaultPassword(
    employeeId: string,
    email: string,
    defaultPassword: string = 'claro123'
): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
        // Usar a API REST do Supabase para criar usuário (via admin invite)
        // Nota: Esta função requer uma Edge Function com permissões de admin
        // Por enquanto, vamos usar signUp que cria o usuário diretamente

        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password: defaultPassword,
            options: {
                data: {
                    employee_id: employeeId
                }
            }
        });

        if (error) {
            console.error('[createUserWithDefaultPassword] Erro ao criar usuário:', error);
            return { success: false, error: error.message };
        }

        if (data.user) {
            // Vincular o user_id ao employee e marcar que precisa trocar senha
            const { error: updateError } = await supabase
                .from('employees')
                .update({
                    user_id: data.user.id,
                    must_change_password: true
                })
                .eq('id', employeeId);

            if (updateError) {
                console.error('[createUserWithDefaultPassword] Erro ao vincular user_id:', updateError);
                return { success: false, error: updateError.message };
            }

            console.log('[createUserWithDefaultPassword] Usuário criado com sucesso:', email);
            return { success: true, userId: data.user.id };
        }

        return { success: false, error: 'Usuário não foi criado' };
    } catch (err: any) {
        console.error('[createUserWithDefaultPassword] Erro:', err);
        return { success: false, error: err.message };
    }
}
