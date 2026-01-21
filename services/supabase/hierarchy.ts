import { supabase, HierarchyConnection, SUPABASE_URL, SUPABASE_ANON_KEY } from './client';

// Constants now imported from ./client.ts

/**
 * Get all hierarchy connections - usa fetch direto para evitar AbortError
 */
export async function getAllConnections(): Promise<HierarchyConnection[]> {
    // Tentar fetch direto primeiro
    try {
        const url = `${SUPABASE_URL}/rest/v1/hierarchy_connections?select=*`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[getAllConnections] Carregadas ${data.length} conexões via fetch direto`);
            return data;
        }
    } catch (directError) {
        console.log('[getAllConnections] Fetch direto falhou, tentando via cliente...');
    }

    // Fallback para cliente Supabase
    const { data, error } = await supabase
        .from('hierarchy_connections')
        .select('*');

    if (error) {
        console.error('Error fetching connections:', error);
        return [];
    }

    return data || [];
}

/**
 * Get connections for an employee (as source)
 */
export async function getEmployeeConnections(employeeId: string): Promise<HierarchyConnection[]> {
    const { data, error } = await supabase
        .from('hierarchy_connections')
        .select('*')
        .eq('source_employee_id', employeeId);

    if (error) {
        console.error('Error fetching employee connections:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create hierarchy connection
 */
export async function createConnection(
    sourceId: string,
    targetId: string,
    type: 'reports_to' | 'collaborates_with' = 'reports_to'
): Promise<HierarchyConnection> {
    const { data, error } = await supabase
        .from('hierarchy_connections')
        .insert([{
            source_employee_id: sourceId,
            target_employee_id: targetId,
            connection_type: type
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating connection:', error);
        throw error;
    }

    return data;
}

/**
 * Delete hierarchy connection
 */
export async function deleteConnection(id: string): Promise<void> {
    const { error } = await supabase
        .from('hierarchy_connections')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting connection:', error);
        throw error;
    }
}

/**
 * Delete connection by employee IDs
 */
export async function deleteConnectionByEmployees(sourceId: string, targetId: string): Promise<void> {
    const { error } = await supabase
        .from('hierarchy_connections')
        .delete()
        .eq('source_employee_id', sourceId)
        .eq('target_employee_id', targetId);

    if (error) {
        console.error('Error deleting connection:', error);
        throw error;
    }
}

/**
 * Update connection type
 */
export async function updateConnectionType(
    id: string,
    type: 'reports_to' | 'collaborates_with'
): Promise<HierarchyConnection> {
    const { data, error } = await supabase
        .from('hierarchy_connections')
        .update({ connection_type: type })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating connection:', error);
        throw error;
    }

    return data;
}

/**
 * Subscribe to hierarchy changes (realtime)
 */
export function subscribeToHierarchy(callback: (payload: any) => void) {
    return supabase
        .channel('hierarchy_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'hierarchy_connections' },
            callback
        )
        .subscribe();
}
