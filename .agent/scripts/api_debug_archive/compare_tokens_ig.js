const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const userToken = envContent.match(/META_USER_ACCESS_TOKEN=([^\s]+)/)[1];
const pageToken = envContent.match(/META_PAGE_ACCESS_TOKEN=([^\s]+)/)[1];
const igId = envContent.match(/META_INSTAGRAM_ACCOUNT_ID=([^\s]+)/)[1];

async function testToken(name, token) {
    const postData = JSON.stringify({
        image_url: 'https://despiertatuvoz.com/wp-content/themes/dtv-theme/assets/hero-v2.png',
        caption: `Test publish with ${name}`,
        access_token: token
    });

    return new Promise((resolve) => {
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
                console.log(`--- Result for ${name} ---`);
                console.log('Status:', res.statusCode);
                console.log('Response:', data);
                resolve();
            });
        });

        req.on('error', (e) => { console.error(e); resolve(); });
        req.write(postData);
        req.end();
    });
}

async function run() {
    await testToken('User Token', userToken);
    await testToken('Page Token', pageToken);
}

run();
