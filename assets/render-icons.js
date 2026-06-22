const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const dir = __dirname;
const svgs = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

for (const file of svgs) {
  const svg = fs.readFileSync(path.join(dir, file));
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 64 } });
  const png = resvg.render().asPng();
  const out = `${path.basename(file, '.svg')}.png`;
  fs.writeFileSync(path.join(dir, out), png);
  console.log(`${file} -> ${out}`);
}
