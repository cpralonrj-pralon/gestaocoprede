const https = require('https');

const SUPABASE_URL = 'https://qdrpxvfnuitnwbnvirtt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnB4dmZudWl0bndibnZpcnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjA1NzcsImV4cCI6MjA4MzczNjU3N30.Dq2X7hD96RIJDWIdLJK4lzOYI1zzsBGIrkAK-0uo-GM';

console.log('Testing connection to:', SUPABASE_URL);

const url = `${SUPABASE_URL}/rest/v1/employees?select=*&limit=1`;

const options = {
    method: 'GET',
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(url, options, (res) => {
    console.log(`Response Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Connection Successful!');
            console.log('Data sample:', data.substring(0, 200) + '...');
        } else {
            console.error('Connection Failed!');
            console.error('Error Body:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Request Error: ${e.message}`);
});

req.end();
