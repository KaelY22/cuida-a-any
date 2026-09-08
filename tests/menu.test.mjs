import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(DIST, p);
    if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(8127, async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 150)); });
    page.on('pageerror', e => errors.push('[pageerror] ' + e.message.slice(0, 200)));
    await page.goto('http://localhost:8127/?renderer=canvas', { waitUntil: 'networkidle', timeout: 40000 });
    await page.waitForFunction(() => window.game && window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'RoomScene', { timeout: 30000 });
    await page.waitForTimeout(1000);

    const report = {};
    report.topbar = await page.evaluate(() => ({
        hamburgerGone: !document.getElementById('btn-rooms'),
        roomsModalGone: !document.getElementById('rooms-modal'),
        hasSettingsBtn: !!document.getElementById('btn-settings'),
        pillCount: document.querySelectorAll('.status-pill').length
    }));

    report.dockInit = await page.evaluate(() => {
        window.refreshDock?.();
        const btns = [...document.querySelectorAll('.dock-btn')];
        return {
            count: btns.length,
            labels: btns.map(b => b.querySelector('.dock-label').textContent),
            actives: btns.map(b => b.classList.contains('active')),
            dockVisible: !!document.getElementById('down-dock') && getComputedStyle(document.getElementById('down-dock')).display !== 'none'
        };
    });

    report.dockCentered = await page.evaluate(() => {
        const bar = document.getElementById('down-bar').getBoundingClientRect();
        const dock = document.getElementById('down-dock').getBoundingClientRect();
        return Math.abs((dock.left + dock.right) / 2 - (bar.left + bar.right) / 2) < 2;
    });

    report.activeIsHabitacion = await page.evaluate(() =>
        document.querySelector('.dock-btn.active .dock-label')?.textContent
    );

    await page.evaluate(() => document.querySelectorAll('.dock-btn')[1].click());
    await page.waitForFunction(() => window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'KitchenScene', { timeout: 15000 });
    await page.waitForTimeout(600);
    report.afterSwitch = await page.evaluate(() => ({
        scene: window.game.scene.getScenes(true)[0].scene.key,
        activeLabel: document.querySelector('.dock-btn.active .dock-label')?.textContent
    }));

    report.errors = errors;
    console.log('SMOKE MENU:', JSON.stringify(report, null, 1));
    browser.close();
    process.exit(0);
});
