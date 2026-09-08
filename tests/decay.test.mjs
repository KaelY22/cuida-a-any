import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/blank') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html><body></body></html>'); return; }
    if (p === '/') p = '/index.html';
    const file = path.join(DIST, p);
    if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
});

const report = {};
server.listen(8124, async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();

    await page.goto('http://localhost:8124/blank', { waitUntil: 'load', timeout: 40000 });
    await page.evaluate(() => {
        const data = JSON.stringify({ hunger: 50, thirst: 50, sleep: 60, health: 80, isSleeping: false, currentScene: 'KitchenScene', currentFoodIndex: 0, outfit: 'any_base', lastSavedTime: Date.now() - 30 * 60 * 1000 });
        localStorage.setItem('any_game_data', data);
    });
    await page.goto('http://localhost:8124/?renderer=canvas', { waitUntil: 'networkidle', timeout: 40000 });
    await page.waitForFunction(() => window.game && window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'RoomScene', { timeout: 30000 });
    const stats = await page.evaluate(async () => {
        for (let i = 0; i < 80; i++) {
            await new Promise(r => setTimeout(r, 300));
            const saved = JSON.parse(localStorage.getItem('any_game_data'));
            if (saved.hunger !== 50) return { hunger: saved.hunger, thirst: saved.thirst, sleep: saved.sleep, health: saved.health };
        }
        return { hungr: -1 };
    });
    report.decayAwake30m = stats;

    await page.goto('http://localhost:8124/blank', { waitUntil: 'load', timeout: 40000 });
    await page.evaluate(() => {
        const data = JSON.stringify({ hunger: 50, thirst: 50, sleep: 40, health: 80, isSleeping: true, currentScene: 'KitchenScene', currentFoodIndex: 0, outfit: 'any_base', lastSavedTime: Date.now() - 30 * 60 * 1000 });
        localStorage.setItem('any_game_data', data);
    });
    await page.goto('http://localhost:8124/?renderer=canvas', { waitUntil: 'networkidle', timeout: 40000 });
    await page.waitForTimeout(2000);
    const sleepStats = await page.evaluate(async () => {
        for (let i = 0; i < 80; i++) {
            await new Promise(r => setTimeout(r, 300));
            const saved = JSON.parse(localStorage.getItem('any_game_data'));
            if (saved.sleep !== 40) return { sleep: saved.sleep, health: saved.health };
        }
        return { sleep: -1 };
    });
    report.decaySleeping30m = sleepStats;

    const r = report.decayAwake30m, s = report.decaySleeping30m;
    const ok = r && r.hunger < 22 && r.hunger > 17 && r.sleep === 0 && r.health > 70 && r.health < 75 && s && s.sleep === 100;
    console.log(JSON.stringify(report, null, 1));
    console.log(ok ? 'DECAY TEST: PASS' : 'DECAY TEST: FAIL');
    await browser.close();
    server.close();
    process.exit(ok ? 0 : 1);
});
