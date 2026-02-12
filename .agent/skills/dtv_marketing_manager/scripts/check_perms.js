const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const token = process.env.META_USER_ACCESS_TOKEN;
const appId = '508554969000051'; // This is the Page ID, need App ID or just use /debug_token if I have app token

// Simplest way: check /me/permissions
const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/me/permissions?access_token=${token}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Permissions:', data);
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
