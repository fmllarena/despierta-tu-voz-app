const fs = require('fs');
const html = fs.readFileSync('roles-dashboard.html', 'utf8');
const idx = html.indexOf('<script type="module">');
const idx2 = html.indexOf('</script>', idx);
const js = html.substring(idx + 22, idx2);
let d = 0;
for (let i = 0; i < js.length; i++) {
  const c = js[i];
  if ('{(['.includes(c)) d++;
  else if ('}])'.includes(c)) d--;
}
console.log(d === 0 ? 'OK - balanced' : 'Unbalanced: ' + d);
