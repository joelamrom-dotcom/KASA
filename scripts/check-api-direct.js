// Check what the API actually returns
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/kasa/families',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const families = JSON.parse(data);
      console.log(`Found ${families.length} families\n`);
      
      families.forEach((family, index) => {
        console.log(`Family ${index + 1}: ${family.name}`);
        console.log(`  hebrewName: ${family.hebrewName || '(missing)'}`);
        console.log(`  husbandHebrewName: ${family.husbandHebrewName || '(missing)'}`);
        console.log(`  husbandFatherHebrewName: ${family.husbandFatherHebrewName || '(missing)'}`);
        console.log(`  wifeHebrewName: ${family.wifeHebrewName || '(missing)'}`);
        console.log(`  wifeFatherHebrewName: ${family.wifeFatherHebrewName || '(missing)'}`);
        console.log('');
      });
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();

