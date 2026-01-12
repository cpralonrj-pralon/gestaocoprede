import { supabase, Employee } from './client';

/**
 * Get all employees
 */
export async function getAllEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');

    if (error) {
        console.error('Error fetching employees:', error);
        throw error;
    }

    return data || [];
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
