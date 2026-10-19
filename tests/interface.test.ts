import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {campaign,evaluate,orderedRoutes,sweepClear} from '../src/engine.ts';
test('parcours complet via les commandes : 50 réussites, succès, sauvegarde, verrous et mode libre',async()=>{
 const dom=new JSDOM('<!doctype html><div id="app"></div><dialog id="modal"></dialog><div id="toast"></div>',{url:'https://example.test/point-impact/'});const w=dom.window;
 const noop=()=>{};const context=new Proxy({},{get:()=>noop,set:()=>true});
 w.HTMLCanvasElement.prototype.getContext=()=>context as any;
 w.HTMLElement.prototype.scrollIntoView=noop;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 Object.defineProperty(w.HTMLDialogElement.prototype,'open',{get(){return this.hasAttribute('open');}});
 class ResizeObserver{callback:()=>void;constructor(callback:()=>void){this.callback=callback;}observe(){this.callback();}disconnect(){}}
 class Path2D{moveTo(){}lineTo(){}}
 for(const [key,val] of Object.entries({window:w,document:w.document,navigator:w.navigator,localStorage:w.localStorage,matchMedia:()=>({matches:true}),ResizeObserver,Path2D,devicePixelRatio:1,requestAnimationFrame:()=>0,cancelAnimationFrame:noop,clearInterval:w.clearInterval.bind(w),clearTimeout:w.clearTimeout.bind(w)}))Object.defineProperty(globalThis,key,{value:val,configurable:true});
 const q=(s:string)=>w.document.querySelector(s) as any;
 const click=(s:string)=>{assert.ok(q(s),s);q(s).click();};
 try{
  await import('../src/app.ts');
  assert.equal(w.document.querySelectorAll('[data-world]').length,5);click('[data-world="1"]');assert.match(q('#toast').textContent,/Termine le monde/);assert.ok(q('.home'));
  click('[data-action="continue"]');
  // Une courbe incorrecte ne déclenche pas de réussite et la validation ne fige pas les réglages.
  click('#validate');assert.ok(q('#feedback').classList.contains('error'));assert.equal(q('#validate').disabled,false);
  for(let i=0;i<50;i++){
   const l=campaign[i];
   const route=l.route||[l.initial,l.solution];
   for(const to of route.slice(1))for(const key of l.free){if(Number(q('#range-'+key).value)===to[key])continue;const range=q('#range-'+key);range.dispatchEvent(new w.Event('pointerdown'));range.value=String(to[key]);range.dispatchEvent(new w.Event('input'));range.dispatchEvent(new w.Event('change'));}

   click('#validate');assert.ok(q('.result:not(.failure)'),`réussite ${l.id}`);
   const stored=JSON.parse(w.localStorage.getItem('point-impact-v1')!);assert.ok(stored.stars[l.id]);
   click('#next');
  }
  assert.ok(q('.home'));const stored=JSON.parse(w.localStorage.getItem('point-impact-v1')!);assert.equal(Object.keys(stored.stars).length,50);assert.equal(stored.wins,50);assert.equal(stored.bestStreak,50);
  click('[data-world="4"]');assert.equal(w.document.querySelectorAll('.level-card:not(:disabled)').length,10);
  click('[data-level="0"]');
  // Un saut de curseur dans un ordre interdit est arrêté avant l'obstacle.
  const l=campaign[40];const bad=orderedRoutes(l.initial,l.solution).find(r=>r.slice(1).some((to,i)=>!sweepClear(r[i],to,l.obstacles)))!;
  let blocked=false;
  for(const to of bad.slice(1)){
   for(const key of l.free){if(Number(q('#range-'+key).value)===to[key])continue;const range=q('#range-'+key);range.dispatchEvent(new w.Event('pointerdown'));range.value=String(to[key]);range.dispatchEvent(new w.Event('input'));range.dispatchEvent(new w.Event('change'));if(Number(range.value)!==to[key])blocked=true;}
   if(blocked)break;
  }
  assert.ok(blocked);assert.match(q('#feedback').textContent,/Passage bloqué/);
  // Recommencer redonne un départ libre ; les allers-retours sûrs épuisent le budget.
  click('[data-action="retry"]');const first=l.route![1];const key=l.free.find(k=>first[k]!==l.initial[k])!;const delta=Math.sign(first[key]-l.initial[key])*.25;
  for(let i=0;i<12;i++)click(`[data-step="${key}"][data-delta="${i%2?-delta:delta}"]`);
  assert.match(q('#moves').textContent,/12 \/ 12/);assert.equal(q('#range-h').disabled,true);click('#validate');assert.ok(q('.failure'));
  click('[data-action="home"]');click('[data-action="achievements"]');assert.ok(w.document.querySelectorAll('.achievement.earned').length>=9);click('.modal-close');
  click('[data-action="practice"]');assert.match(q('.game-title .eyebrow').textContent,/LABORATOIRE/);assert.equal(JSON.parse(w.localStorage.getItem('point-impact-v1')!).wins,50);
 }finally{w.close();}
});
