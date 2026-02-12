const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const pageTokenMatch = envContent.match(/META_PAGE_ACCESS_TOKEN=([^\s]+)/);
const token = pageTokenMatch ? pageTokenMatch[1] : null;

const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/me/permissions?access_token=${token}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const perms = JSON.parse(data);
            console.log('--- PAGE TOKEN PERMISSIONS ---');
            if (perms.data) {
                perms.data.forEach(p => {
                    console.log(`PERMISSION: ${p.permission} - STATUS: ${p.status}`);
                });
            } else {
                console.log('Error details:', data);
            }
        } catch (e) {
            console.error('Parse error:', data);
        }
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
