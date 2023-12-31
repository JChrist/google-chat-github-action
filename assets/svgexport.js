const fs = require('node:fs');
const assetFiles = fs.readdirSync('./assets');
const files = assetFiles.filter(f => f.endsWith('svg'));
const data = files.map(f => ({ input: [`./${f}`], output: [[`./${f.split('.')[0]}.png`]] }));
module.exports = data;
