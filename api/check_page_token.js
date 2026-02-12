const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const pageTokenMatch = envContent.match(/META_PAGE_ACCESS_TOKEN=([^\s]+)/);
const token = pageTokenMatch ? pageTokenMatch[1] : null;

if (!token) {
    console.log('No Page Token found');
    process.exit(0);
}

const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/me?access_token=${token}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Page Token Check:', data);
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
