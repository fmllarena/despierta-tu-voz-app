const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const pageToken = envContent.match(/META_PAGE_ACCESS_TOKEN=([^\s]+)/)[1];
const igId = envContent.match(/META_INSTAGRAM_ACCOUNT_ID=([^\s]+)/)[1];

const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/${igId}?fields=name&access_token=${pageToken}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('ig_meta_full.json', data);
        console.log('Written to ig_meta_full.json');
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
