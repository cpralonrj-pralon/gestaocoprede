import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hvznldvsxqxefriflccu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2em5sZHZzeHF4ZWZyaWZsY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDc3MjgsImV4cCI6MjA4NDU4MzcyOH0.6tJNNIAotUaqEN76fPBFo9numEKPbL1ocr6W7sxa8ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdmin() {
    const email = 'admin2@claro.com.br';
    const password = 'admin_password_123'; // Hardcoded for initial setup

    console.log(`Creating user ${email}...`);

    // 1. Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: 'Administrador 2'
            }
        }
    });

    if (authError) {
        console.error('Error creating auth user FULL:', JSON.stringify(authError, null, 2));
        return;
    }

    if (!authData.user) {
        console.error('User created but no user object returned (maybe confirmation required?)');
        return;
    }

    const userId = authData.user.id;
    console.log('User created with ID:', userId);

    // 2. Create Employee Record
    const employeeData = {
        full_name: 'Administrador 2',
        email: email,
        role: 'Diretoria',
        hierarchy_level: 'root',
        status: 'active',
        admission_date: new Date().toISOString().split('T')[0],
        user_id: userId,
        salary: 0,
        cluster: 'Matriz',
        store: 'Matriz',
        performance_score: 100,
        graph_position_x: 0,
        graph_position_y: 0
    };

    const { data: empData, error: empError } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

    if (empError) {
        console.error('Error creating employee record:', empError.message);
        // If employee creation fails, we might want to cleanup the auth user, 
        // but for now let's just report the error.
    } else {
        console.log('Employee record created successfully:', empData.id);
        console.log('------------------------------------------------');
        console.log('Admin User Created Successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('------------------------------------------------');
    }
}

createAdmin();
