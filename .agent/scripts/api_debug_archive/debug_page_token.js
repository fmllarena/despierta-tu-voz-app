const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const pageTokenMatch = envContent.match(/META_PAGE_ACCESS_TOKEN=([^\s]+)/);
const token = pageTokenMatch ? pageTokenMatch[1] : null;

// Use /debug_token to check Page Token
const options = {
    hostname: 'graph.facebook.com',
    path: `/debug_token?input_token=${token}&access_token=${token}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('page_token_debug.json', data);
        console.log('Output written to page_token_debug.json');
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
