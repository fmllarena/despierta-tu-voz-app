const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const metaTokenMatch = envContent.match(/META_USER_ACCESS_TOKEN=([^\s]+)/);
const token = metaTokenMatch ? metaTokenMatch[1] : null;
const igId = envContent.match(/META_INSTAGRAM_ACCOUNT_ID=([^\s]+)/)[1];

const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/${igId}?fields=username,name,biography,website&access_token=${token}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('IG Account Data:', data);
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
