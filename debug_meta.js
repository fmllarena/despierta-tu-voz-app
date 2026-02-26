const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.agent', 'skills', 'dtv_marketing_manager', '.env') });

const userToken = process.env.META_USER_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const pageId = process.env.META_PAGE_ID;
const apiVersion = 'v18.0';

async function debugMeta() {
    console.log('--- DEBUG META ---');
    console.log('Page ID:', pageId);

    try {
        console.log('\n1. Checking Instagram Account linked to Page...');
        const pageInfo = await makeRequest(`/${apiVersion}/${pageId}?fields=instagram_business_account,name&access_token=${userToken}`);
        console.log('Page Info:', JSON.stringify(pageInfo, null, 2));

        if (pageInfo.instagram_business_account) {
            const igId = pageInfo.instagram_business_account.id;
            console.log('\n2. Checking Instagram Account Info...');
            const igInfo = await makeRequest(`/${apiVersion}/${igId}?fields=username,name&access_token=${userToken}`);
            console.log('IG Info:', JSON.stringify(igInfo, null, 2));
        } else {
            console.error('❌ No Instagram account linked to this Page.');
        }

        console.log('\n3. Checking Token Permissions...');
        const tokenInfo = await makeRequest(`/debug_token?input_token=${userToken}&access_token=${userToken}`);
        console.log('Token Info:', JSON.stringify(tokenInfo, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'graph.facebook.com',
            path: path,
            method: 'GET'
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON: ' + data));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

debugMeta();
