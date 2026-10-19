export type Params = { a: number; h: number; k: number };
export type Point = { x: number; y: number; vertex?: boolean };
export type Level = { id: string; world: number; index: number; title: string; goal: string; hint: string; solution: Params; initial: Params; targets: Point[]; obstacles: Point[]; free: (keyof Params)[]; limit?: number; seconds?: number };
export const worlds = ['Le sommet', 'L’ouverture', 'Les racines', 'La précision', 'Le maître des paraboles'];
export const value = (p: Params, x: number) => p.a * (x - p.h) ** 2 + p.k;
export function random(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Distance exacte à la portion visible en abscisse : les extrema du carré
// de la distance sont les racines d'un polynôme de degré trois.
export function distance(p: Params, q: Point): number {
  const lo = -6 - p.h, hi = 6 - p.h, c = p.k - q.y;
  const g = (t: number) => 2*p.a*p.a*t*t*t + (2*p.a*c+1)*t + p.h-q.x;
  const d = (t: number) => (t+p.h-q.x)**2+(p.a*t*t+c)**2;
  const cuts = [lo, hi]; const r2 = -(2*p.a*c+1)/(6*p.a*p.a);
  if (r2 > 0) for (const t of [-Math.sqrt(r2), Math.sqrt(r2)]) if (t>lo && t<hi) cuts.push(t);
  cuts.sort((a,b)=>a-b); const candidates = [...cuts];
  for(let i=1;i<cuts.length;i++) { let l=cuts[i-1],r=cuts[i]; if(g(l)*g(r)>0) continue; for(let j=0;j<52;j++){const m=(l+r)/2;if(g(l)*g(m)<=0)r=m;else l=m;} candidates.push((l+r)/2); }
  return Math.sqrt(Math.min(...candidates.map(d)));
}
export function evaluate(level: Level, p: Params) {
  const hits=level.targets.map(q=>q.vertex?Math.hypot(p.h-q.x,p.k-q.y)<0.12:distance(p,q)<0.12);
  const blocked=level.obstacles.map(q=>distance(p,q)<=0.42);
  return {hits, blocked, success:hits.every(Boolean)&&!blocked.some(Boolean)};
}
export function makeLevel(world: number, index: number, seed = world*1000+index): Level {
  const rng=random(seed+117); const pick=<T>(xs:T[])=>xs[Math.floor(rng()*xs.length)];
  let p:Params={a:1,h:pick([-2,-1,1,2]),k:pick([-2,-1,1,2])};
  let free: (keyof Params)[]=['h','k']; let targets:Point[]=[]; const obstacles:Point[]=[];
  let title='Coordonnées du sommet', goal='Place le sommet S sur le losange doré.', hint='Dans a(x − α)² + β, le sommet est S(α ; β). Lis ses coordonnées sur le repère.';
  if(world===0){ if(index<2) {p.k=0;free=['h'];} else if(index<4){p.h=0;free=['k'];} targets=[{x:p.h,y:p.k,vertex:true}]; }
  if(world===1){p={a:pick(index<4?[0.5,1,1.5,2]:[-2,-1.5,-1,-0.5,0.5,1,1.5,2]),h:index<3?0:pick([-1,0,1]),k:0};free=['a'];targets=[-1,1].map(d=>({x:p.h+d,y:value(p,p.h+d)}));title=p.a<0?'Vers le bas':'Trouver l’ouverture';goal='Traverse les deux cristaux verts. Le sommet est fixé.';hint='À une unité du sommet, la variation verticale vaut a. Son signe donne le sens d’ouverture.';}
  if(world===2){const r=pick(index<3?[1]:[1,2]);p={a:pick(index<5?[0.5,1]:[0.5,1,-0.5,-1]),h:index<2?0:pick([-2,-1,1,2]),k:0};p.k=-p.a*r*r;free=['h','k'];targets=[{x:p.h-r,y:0},{x:p.h+r,y:0}];title='Deux racines, une symétrie';goal='Fais passer la courbe par les deux racines indiquées.';hint='α est le milieu des racines r₁ et r₂. Puis β = −a(r₁ − α)². Le coefficient a est fixé.';}
  if(world>=3){p.a=pick([-1,-0.5,0.5,1]);p.k=pick(p.a<0?[0,1,2]:[-2,-1,0,1,2]);free=['a','h','k'];targets=[{x:p.h,y:p.k,vertex:true},...[-2,2].map(d=>({x:p.h+d,y:value(p,p.h+d)}))];title=world===3?'Double impact':'Sous contrainte';goal='Place le sommet et traverse les deux cristaux sans toucher les disques rouges.';hint='Lis d’abord (α ; β) au sommet, puis calcule a = (y − β)/(x − α)² avec un cristal.';
    for(let i=0;i<300&&obstacles.length<2;i++){const q={x:pick([-4,-3,-2,-1,0,1,2,3,4]),y:pick([-3,-2,-1,0,1,2,3,4,5])};if(distance(p,q)>0.9&&targets.every(t=>Math.hypot(t.x-q.x,t.y-q.y)>1)&&obstacles.every(t=>Math.hypot(t.x-q.x,t.y-q.y)>1))obstacles.push(q);}
  }
  const initial: Params = world===4 ? {a:p.a>0?p.a+0.25:p.a-0.25,h:p.h-0.5,k:p.k+0.5} : {a:world===1? (p.a===1?0.5:1):p.a,h:free.includes('h')?0:p.h,k:free.includes('k')?0:p.k};
  if(world===3)initial.a=1;
  if(evaluate({targets,obstacles} as Level,initial).success) {if(free.includes('h'))initial.h+=1;else if(free.includes('k'))initial.k+=1;else initial.a=0.25;}
  return {id:`${world}-${index}`,world,index,title,goal,hint,solution:p,initial,targets,obstacles,free,...world===4?{limit:6,seconds:45}:{}};
}
export const campaign = Array.from({length:50},(_,i)=>makeLevel(Math.floor(i/10),i%10));
export function dateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function daily(date=new Date()){const key=dateKey(date);const seed=Number(key.replaceAll('-',''));return {...makeLevel(4,0,seed),id:`daily-${key}`,title:'Le défi quotidien'};}
