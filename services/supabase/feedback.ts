import { supabase, Feedback } from './client';

/**
 * Get all feedbacks
 */
export async function getAllFeedbacks(): Promise<any[]> {
    const { data, error } = await supabase
        .from('feedbacks')
        .select('*, employees(*)')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    if (error) {
        console.error('Error fetching feedbacks:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get feedbacks for an employee
 */
export async function getEmployeeFeedbacks(employeeId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('feedbacks')
        .select('*, employees(*)')
        .eq('employee_id', employeeId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    if (error) {
        console.error('Error fetching employee feedbacks:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create or update feedback
 */
export async function saveFeedback(feedback: Omit<Feedback, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Feedback> {
    const { data, error } = await supabase
        .from('feedbacks')
        .upsert(feedback)
        .select()
        .single();

    if (error) {
        console.error('Error saving feedback:', error);
        throw error;
    }

    return data;
}

/**
 * Delete feedback
 */
export async function deleteFeedback(id: string): Promise<void> {
    const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting feedback:', error);
        throw error;
    }
}

/**
 * Subscribe to feedbacks
 */
export function subscribeToFeedbacks(callback: (payload: any) => void) {
    return supabase
        .channel('feedbacks_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'feedbacks' },
            callback
        )
        .subscribe();
}
