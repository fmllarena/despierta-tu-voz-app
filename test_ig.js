const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.agent', 'skills', 'dtv_marketing_manager', '.env') });

const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
const igId = process.env.META_INSTAGRAM_ACCOUNT_ID;
const apiVersion = 'v18.0';

async function testInstagram() {
    console.log('--- TEST INSTAGRAM ---');
    const imageUrl = 'https://despiertatuvoz.com/wp-content/themes/dtv-theme/assets/hero-v2.png';
    const caption = 'Test de publicación Instagram desde DTV Marketing Manager 🚀';

    try {
        console.log('1. Creating container...');
        const postData = new URLSearchParams({
            image_url: imageUrl,
            caption: caption,
            access_token: pageToken
        }).toString();

        const options = {
            hostname: 'graph.facebook.com',
            path: `/${apiVersion}/${igId}/media`,
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

testInstagram();
