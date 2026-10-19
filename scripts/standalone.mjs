import {readFile,writeFile} from 'node:fs/promises';
let engine=await readFile('dist/engine.js','utf8');engine=engine.replace(/^export /gm,'');
let app=await readFile('dist/app.js','utf8');app=app.replace(/^import .*from '\.\/engine.js';\n/m,'');const sw=app.lastIndexOf("\nif('serviceWorker' in navigator)");if(sw>=0)app=app.slice(0,sw);
const css=await readFile('dist/style.css','utf8');
await writeFile('Jouer.html',`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Point d’impact — Le défi des paraboles</title><style>${css}</style></head><body><div id="app"></div><dialog id="modal"></dialog><div id="toast" role="status" aria-live="polite"></div><script type="module">${engine}\n${app}</script></body></html>`);
console.log('Jouer.html : version autonome prête.');
