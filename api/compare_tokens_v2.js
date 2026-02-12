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
                fs.appendFileSync('compare_full.txt', `\n--- Result for ${name} ---\nStatus: ${res.statusCode}\nResponse: ${data}\n`);
                resolve();
            });
        });

        req.on('error', (e) => {
            fs.appendFileSync('compare_full.txt', `\n--- Error for ${name} ---\n${e.message}\n`);
            resolve();
        });
        req.write(postData);
        req.end();
    });
}

async function run() {
    fs.writeFileSync('compare_full.txt', 'COMPARE TOKENS START\n');
    await testToken('User Token', userToken);
    await testToken('Page Token', pageToken);
    console.log('Results written to compare_full.txt');
}

run();
