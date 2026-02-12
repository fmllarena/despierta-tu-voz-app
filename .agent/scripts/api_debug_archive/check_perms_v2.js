const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const token = process.env.META_USER_ACCESS_TOKEN;

const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/me/permissions?access_token=${token}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const perms = JSON.parse(data);
        console.log('PERMISSIONS_LIST_START');
        perms.data.forEach(p => {
            console.log(`PERMISSION: ${p.permission} - STATUS: ${p.status}`);
        });
        console.log('PERMISSIONS_LIST_END');
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
