const https = require('https');

const SUPABASE_URL = 'https://hvznldvsxqxefriflccu.supabase.co';
// Preencha com sua nova chave para testar
const SUPABASE_ANON_KEY = '';

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
