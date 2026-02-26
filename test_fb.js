const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.agent', 'skills', 'dtv_marketing_manager', '.env') });

const userToken = process.env.META_PAGE_ACCESS_TOKEN || process.env.META_USER_ACCESS_TOKEN;
const pageId = process.env.META_PAGE_ID;
const apiVersion = 'v18.0';

async function testFacebook() {
    console.log('--- TEST FACEBOOK ---');
    const message = 'Test de publicación desde DTV Marketing Manager - Verificación de empresa OK! 🚀';

    try {
        const postData = new URLSearchParams({
            message: message,
            access_token: userToken
        }).toString();

        const options = {
            hostname: 'graph.facebook.com',
            path: `/${apiVersion}/${pageId}/feed`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const res = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data) }));
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log('Result:', JSON.stringify(res, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testFacebook();
