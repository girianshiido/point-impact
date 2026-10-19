import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaign,makeLevel,evaluate,distance,value,daily,dateKey,sweepClear,sweepDistance,moveParameter,orderedRoutes,OBSTACLE_RADIUS,type Params,type Level} from '../src/engine.ts';

test('50 défis : solution valide, départ non résolu, paramètres accessibles et objectifs visibles',()=>{
  assert.equal(campaign.length,50);assert.equal(new Set(campaign.map(l=>l.id)).size,50);
  for(const l of campaign)verify(l);
});
function verify(l:Level){
 assert.ok(evaluate(l,l.solution).success,`solution ${l.id}`);
 assert.ok(!evaluate(l,l.initial).success,`départ ${l.id}`);
 for(const key of ['a','h','k'] as const){for(const p of [l.solution,l.initial]){assert.ok(Math.abs(p[key])<=(key==='a'?2:4));assert.equal(p[key]*4,Math.round(p[key]*4));}if(!l.free.includes(key))assert.equal(l.initial[key],l.solution[key]);}
 assert.notEqual(l.solution.a,0);assert.notEqual(l.initial.a,0);
 for(const q of [...l.targets,...l.obstacles]){assert.ok(q.x>=-5&&q.x<=5);assert.ok(q.y>=-4.5&&q.y<=6.5,`cible hors repère ${JSON.stringify(q)}`);}
 if(l.world>=3){
  assert.ok(l.obstacles.length>=1&&l.obstacles.length<=2);
  assert.ok(!evaluate(l,l.initial).blocked.some(Boolean),'départ sans collision');
  assert.ok(l.route);assert.deepEqual(l.route[0],l.initial);assert.deepEqual(l.route.at(-1),l.solution);
  let replay={...l.initial};let steps=0;
  for(const to of l.route.slice(1)){
   const key=(['a','h','k'] as const).find(k=>to[k]!==replay[k])!;
   assert.ok(sweepClear(replay,to,l.obstacles,.04),'trajet continu garanti');
   const move=moveParameter(replay,key,to[key],l.obstacles);assert.ok(!move.blocked);assert.deepEqual(move.params,to);steps+=Math.abs(to[key]-replay[key])*4;replay=move.params;
  }
  assert.ok(evaluate(l,replay).success);if(l.limit)assert.ok(steps<=l.limit);
  const orders=orderedRoutes(l.initial,l.solution);
  for(const obstacle of l.obstacles)assert.ok(orders.some(r=>r.slice(1).some((to,i)=>!sweepClear(r[i],to,[obstacle]))),'chaque obstacle interdit un trajet');
  const hard=(l.world===3&&l.index>=7)||(l.world===4&&l.index>=5);
  if(hard){assert.ok(l.targets.every(t=>!t.vertex&&t.x!==l.solution.h));assert.equal(new Set(l.targets.map(t=>t.x)).size,3);assert.equal(new Set(l.targets.map(t=>t.y)).size,3);}
 }
 if(l.limit){const buttonSteps=l.free.reduce((n,key)=>n+Math.abs(l.initial[key]-l.solution[key])*4,0);assert.ok(buttonSteps<=l.limit);}
}
test('5 000 niveaux générés : invariants de résolution et de visibilité',()=>{for(let seed=0;seed<1000;seed++)for(let w=0;w<5;w++)verify(makeLevel(w,seed%10,seed));});
test('distance à une parabole : sommet, points sur la courbe, symétrie et minimum double',()=>{
 const p={a:1,h:0,k:0};assert.ok(distance(p,{x:0,y:0})<1e-10);assert.ok(distance(p,{x:2,y:4})<1e-10);assert.ok(Math.abs(distance(p,{x:0,y:-1})-1)<1e-10);assert.ok(Math.abs(distance(p,{x:0,y:2})-Math.sqrt(1.75))<1e-10);
 assert.ok(Math.abs(distance(p,{x:2,y:1})-distance(p,{x:-2,y:1}))<1e-10);
});
test('distance analytique contre une référence dense, courbes positives et négatives',()=>{
 for(let j=0;j<40;j++){const p={a:(j%2?-1:1)*(.25+(j%8)*.25),h:(j%5)-2,k:(j%7)-3};const q={x:(j%9)-4+.13,y:(j%10)-4+.17};let minimum=Infinity;for(let i=0;i<=24000;i++){const x=-6+12*i/24000;minimum=Math.min(minimum,Math.hypot(x-q.x,value(p,x)-q.y));}assert.ok(Math.abs(distance(p,q)-minimum)<1e-4);}
});
test('obstacles : tangence et collision entre les échantillons du rendu',()=>{
 const l={targets:[{x:0,y:0}],obstacles:[{x:0,y:-.42}]} as Level;assert.equal(evaluate(l,{a:1,h:0,k:0}).success,false);
 const p={a:2,h:1,k:0};const q={x:1.013,y:value(p,1.013)};assert.ok(distance(p,q)<1e-9);
});
test('un cristal doré impose le sommet, pas seulement une intersection',()=>{
 const l={targets:[{x:1,y:1,vertex:true}],obstacles:[]} as Level;
 assert.equal(evaluate(l,{a:1,h:0,k:0}).success,false);assert.equal(evaluate(l,{a:1,h:1,k:1}).success,true);
});
test('les cibles doivent être simultanément atteintes',()=>{
 const l={targets:[{x:-1,y:1},{x:1,y:1}],obstacles:[]} as Level;assert.equal(evaluate(l,{a:1,h:0,k:0}).success,true);assert.equal(evaluate(l,{a:1,h:1,k:1}).success,false);
});
test('défi quotidien déterministe, renouvelé à la date locale',()=>{
 const a=new Date(2026,9,19,12),b=new Date(2026,9,20,12);assert.equal(dateKey(a),'2026-10-19');assert.deepEqual(daily(a),daily(a));assert.notEqual(daily(a).id,daily(b).id);verify(daily(a));
});


test('franchissement interdit même si les positions de départ et d’arrivée sont libres',()=>{
 const from={a:1,h:-2,k:0},to={a:1,h:2,k:0},q={x:0,y:0};
 assert.ok(distance(from,q)>OBSTACLE_RADIUS);assert.ok(distance(to,q)>OBSTACLE_RADIUS);
 assert.equal(sweepDistance(from,to,q),0);assert.ok(!sweepClear(from,to,[q]));
 const move=moveParameter(from,'h',2,[q]);assert.ok(move.blocked&&move.moved);assert.ok(move.params.h<0);assert.ok(distance(move.params,q)>OBSTACLE_RADIUS);
 const reverse=moveParameter(move.params,'h',-2,[q]);assert.ok(!reverse.blocked);assert.deepEqual(reverse.params,from);
});
test('un quart de pas ne permet pas de traverser un obstacle étroit entre deux états libres',()=>{
 const from={a:.25,h:0,k:0},to={a:.5,h:0,k:0},q={x:4,y:6};
 assert.ok(distance(from,q)>.42&&distance(to,q)>.42);
 assert.equal(sweepDistance(from,to,q),0);assert.ok(moveParameter(from,'a',.5,[q]).blocked);
 const verticalFrom={a:1,h:0,k:-2},verticalTo={a:1,h:0,k:2};
 assert.ok(!sweepClear(verticalFrom,verticalTo,[{x:0,y:0}]));
});
test('distance au volume balayé contre un balayage temporel dense',()=>{
 for(const key of ['a','h','k'] as const)for(let j=0;j<18;j++){
  const from={a:j%2?.5:-1,h:-2,k:1},to={...from,[key]:key==='a'?(from.a>0?1.5:-.25):2};
  const q={x:(j%9)-4+.17,y:(j%7)-2+.13};let ref=Infinity;
  for(let n=0;n<=1500;n++){const p={...from,[key]:from[key]+(to[key]-from[key])*n/1500};ref=Math.min(ref,distance(p,q));}
  const actual=sweepDistance(from,to,q);assert.ok(actual<=ref+1e-8);assert.ok(ref-actual<.01,`${key} ${j}: ${actual}/${ref}`);
 }
});
test('le signe de a reste constant pendant un niveau avec obstacles',()=>{
 const p={a:.25,h:0,k:0};const r=moveParameter(p,'a',-.25,[{x:4,y:-3}]);assert.ok(r.blocked);assert.equal(r.params.a,.25);
 assert.equal(moveParameter(p,'a',-.25,[]).params.a,-.25);
});
