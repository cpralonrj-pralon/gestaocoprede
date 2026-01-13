import { supabase, Schedule } from './client';

/**
 * Get schedules for a date range
 */
export async function getSchedulesByRange(startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('schedules')
        .select('*, employees(*)')
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate);

    if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get schedules for an employee in a range
 */
export async function getEmployeeSchedules(employeeId: string, startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('schedules')
        .select('*, employees(*)')
        .eq('employee_id', employeeId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .order('schedule_date');

    if (error) {
        console.error('Error fetching employee schedules:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create or update multiple schedules (bulk)
 */
export async function saveSchedulesBulk(schedules: any[]): Promise<any[]> {
    const { data, error } = await supabase
        .from('schedules')
        .upsert(schedules, { onConflict: 'employee_id,schedule_date' })
        .select();

    if (error) {
        console.error('Error saving schedules in bulk:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create or update a single schedule
 */
export async function saveSchedule(schedule: any): Promise<any> {
    const { data, error } = await supabase
        .from('schedules')
        .upsert(schedule, { onConflict: 'employee_id,schedule_date' })
        .select()
        .single();

    if (error) {
        console.error('Error saving schedule:', error);
        throw error;
    }

    return data;
}

/**
 * Delete schedules in a specific range for an employee
 */
export async function deleteSchedulesByRange(employeeId: string, startDate: string, endDate: string): Promise<void> {
    const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('employee_id', employeeId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate);

    if (error) {
        console.error('Error deleting schedules:', error);
        throw error;
    }
}

/**
 * Subscribe to schedules
 */
export function subscribeToSchedules(callback: (payload: any) => void) {
    return supabase
        .channel('schedules_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'schedules' },
            callback
        )
        .subscribe();
}
