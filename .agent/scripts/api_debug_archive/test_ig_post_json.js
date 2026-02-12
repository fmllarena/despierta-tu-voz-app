const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const pageTokenMatch = envContent.match(/META_PAGE_ACCESS_TOKEN=([^\s]+)/);
const token = pageTokenMatch ? pageTokenMatch[1] : null;
const igId = envContent.match(/META_INSTAGRAM_ACCOUNT_ID=([^\s]+)/)[1];

const postData = JSON.stringify({
    image_url: 'https://despiertatuvoz.com/wp-content/themes/dtv-theme/assets/hero-v2.png',
    caption: 'Test publish via API',
    access_token: token
});

const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/${igId}/media`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('IG Media Container Status:', res.statusCode);
        console.log('IG Media Container Response:', data);
    });
});

req.on('error', (e) => { console.error(e); });
req.write(postData);
req.end();
