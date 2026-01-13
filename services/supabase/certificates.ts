import { supabase, Certificate } from './client';

/**
 * Get all certificates
 */
export async function getAllCertificates(): Promise<any[]> {
    const { data, error } = await supabase
        .from('certificates')
        .select('*, employees(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get certificates for an employee
 */
export async function getEmployeeCertificates(employeeId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('certificates')
        .select('*, employees(*)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching employee certificates:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create or update certificate
 */
export async function saveCertificate(certificate: Omit<Certificate, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Certificate> {
    const { data, error } = await supabase
        .from('certificates')
        .upsert(certificate)
        .select()
        .single();

    if (error) {
        console.error('Error saving certificate:', error);
        throw error;
    }

    return data;
}

/**
 * Delete certificate
 */
export async function deleteCertificate(id: string): Promise<void> {
    const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting certificate:', error);
        throw error;
    }
}

/**
 * Subscribe to certificates
 */
export function subscribeToCertificates(callback: (payload: any) => void) {
    return supabase
        .channel('certificates_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'certificates' },
            callback
        )
        .subscribe();
}
