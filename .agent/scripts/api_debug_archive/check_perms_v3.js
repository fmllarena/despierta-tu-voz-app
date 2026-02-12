const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const metaTokenMatch = envContent.match(/META_USER_ACCESS_TOKEN=([^\s]+)/);
const token = metaTokenMatch ? metaTokenMatch[1] : null;

if (!token) {
    console.error('No token found in .env');
    process.exit(1);
}

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
            console.log('PERMISSIONS_LIST_START');
            if (perms.data) {
                perms.data.forEach(p => {
                    console.log(`PERMISSION: ${p.permission} - STATUS: ${p.status}`);
                });
            } else {
                console.log('No data in response:', data);
            }
            console.log('PERMISSIONS_LIST_END');
        } catch (e) {
            console.error('Error parsing response:', data);
        }
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
