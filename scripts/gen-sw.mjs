import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const swPath = join(dist, 'sw.js');

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        if (name === 'sw.js') continue;
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else out.push('./' + relative(dist, full).replaceAll('\\', '/'));
    }
    return out;
}

const ESSENTIAL = [
    /index\.html$/,
    /manifest.*\.json$/,
    /assets\/(index|phaser)[\w.-]*\.js$/,
    /assets\/[^/]*\.css$/,
    /_redirects/,
    /icons?\//,
    /fonts\//,
];

const files = walk(dist).sort();
const list = files.filter((f) => ESSENTIAL.some((re) => re.test(f.slice(2))))
    .map((f) => JSON.stringify(f)).join(',\n    ');
const sw = readFileSync(swPath, 'utf8').replace('__PRECACHE_LIST__', list);
writeFileSync(swPath, sw);
console.log('SW precache esencial:', list.split('\n').length, 'de', files.length, 'archivos');
