
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qdrpxvfnuitnwbnvirtt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnB4dmZudWl0bndibnZpcnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjA1NzcsImV4cCI6MjA4MzczNjU3N30.Dq2X7hD96RIJDWIdLJK4lzOYI1zzsBGIrkAK-0uo-GM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDistribution() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

    console.log(`Checking schedules from ${startOfMonth} to ${endOfMonth}`);

    const { data: schedules, error } = await supabase
        .from('schedules')
        .select('shift_type, employee_id')
        .gte('schedule_date', startOfMonth)
        .lte('schedule_date', endOfMonth);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total schedules found: ${schedules.length}`);

    const counts = {};
    schedules.forEach(s => {
        const type = s.shift_type || 'NULL/EMPTY';
        counts[type] = (counts[type] || 0) + 1;
    });

    console.log('Shift Type Distribution:');
    console.table(counts);
}

checkDistribution();
