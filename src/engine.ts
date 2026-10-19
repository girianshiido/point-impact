export type Params = { a: number; h: number; k: number };
export type Point = { x: number; y: number; vertex?: boolean };
export type Level = { id: string; world: number; index: number; title: string; goal: string; hint: string; solution: Params; initial: Params; targets: Point[]; obstacles: Point[]; free: (keyof Params)[]; route?: Params[]; limit?: number; seconds?: number };
export const OBSTACLE_RADIUS = 0.42;
const CLEARANCE = 0.002;
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
  const blocked=level.obstacles.map(q=>distance(p,q)<=OBSTACLE_RADIUS);
  return {hits, blocked, success:hits.every(Boolean)&&!blocked.some(Boolean)};
}
// Une commande ne modifie qu'un paramètre. L'union des courbes pendant
// son déplacement a pour frontière les deux courbes extrêmes, plus le
// segment des sommets lorsque alpha varie. Aucune discrétisation temporelle
// n'est nécessaire : même un saut de curseur ne peut franchir un disque.
export function sweepDistance(from: Params, to: Params, q: Point): number {
  const changed = (['a','h','k'] as const).filter(key=>from[key]!==to[key]);
  if(changed.length>1) throw new Error('Une commande doit modifier un seul paramètre.');
  if(q.x < -6+OBSTACLE_RADIUS || q.x > 6-OBSTACLE_RADIUS) throw new Error('Obstacle trop proche du bord du repère.');
  const ys=[value(from,q.x),value(to,q.x)];
  let minimum=Math.min(distance(from,q),distance(to,q));
  if(changed[0]==='h'){
    const left=Math.min(from.h,to.h),right=Math.max(from.h,to.h);
    if(q.x>=left&&q.x<=right)ys.push(from.k);
    minimum=Math.min(minimum,Math.hypot(q.x-Math.max(left,Math.min(right,q.x)),q.y-from.k));
  }
  if(q.y>=Math.min(...ys)&&q.y<=Math.max(...ys))return 0;
  return minimum;
}
export function sweepClear(from:Params,to:Params,obstacles:Point[],margin=CLEARANCE){
  return obstacles.every(q=>sweepDistance(from,to,q)>OBSTACLE_RADIUS+margin);
}
export function moveParameter(from:Params,key:keyof Params,target:number,obstacles:Point[]){
  const end=Math.max(key==='a'?-2:-4,Math.min(key==='a'?2:4,Math.round(target*4)/4));
  const sign=Math.sign(end-from[key]);let current={...from},blocked=false;
  for(let i=0;i<64&&sign*(end-current[key])>1e-8;i++){
    let n=current[key]+sign*.25;
    if(key==='a'&&n===0){if(obstacles.length){blocked=true;break;}n+=sign*.25;}
    if(sign*(n-end)>1e-8)break;
    const next={...current,[key]:n};
    if(!sweepClear(current,next,obstacles)){blocked=true;break;}
    current=next;
  }
  return {params:current,blocked,moved:current[key]!==from[key]};
}
const orders:(keyof Params)[][]=[['a','h','k'],['a','k','h'],['h','a','k'],['h','k','a'],['k','a','h'],['k','h','a']];
export function orderedRoutes(initial:Params,solution:Params){
  return orders.map(order=>{let state={...initial};return [state,...order.map(key=>state={...state,[key]:solution[key]})];});
}
function motionPuzzle(solution:Params,rng:()=>number,index:number){
  for(let attempt=0;attempt<24;attempt++){
    const initial:Params={a:Math.sign(solution.a)*(Math.abs(solution.a)===1?.5:1),h:solution.h+(solution.h>0?-1:1),k:solution.k+(attempt%2===0?.75:-.75)};
    const routes=orderedRoutes(initial,solution);const candidates:Point[]=[];const seen=new Set<string>();
    for(const route of routes)for(let i=1;i<route.length;i++)for(const t of [.25,.5,.75,1]){
      const p={a:route[i-1].a+(route[i].a-route[i-1].a)*t,h:route[i-1].h+(route[i].h-route[i-1].h)*t,k:route[i-1].k+(route[i].k-route[i-1].k)*t};
      for(let x=-4;x<=4;x++){
        const q={x,y:Math.round(value(p,x)*4)/4};const id=`${q.x},${q.y}`;
        if(q.y < -3 || q.y>5||seen.has(id))continue;seen.add(id);
        if(distance(initial,q)>.6&&distance(solution,q)>.6&&[solution.h-2,solution.h,solution.h+2].every(tx=>Math.hypot(tx-q.x,value(solution,tx)-q.y)>.8))candidates.push(q);
      }
    }
    // Déterminisme du défi quotidien, tout en variant les obstacles générés.
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    let viable=routes.map((_,i)=>i);const obstacles:Point[]=[];
    for(const q of candidates){
      if(obstacles.some(o=>Math.hypot(q.x-o.x,q.y-o.y)<1))continue;
      const remaining=viable.filter(i=>routes[i].slice(1).every((to,j)=>sweepClear(routes[i][j],to,[q],.05)));
      if(remaining.length&&remaining.length<viable.length){obstacles.push(q);viable=remaining;if(obstacles.length===(index<3?1:2))break;}
    }
    if(obstacles.length)return {initial,obstacles,route:routes[viable[0]]};
  }
  // Repli sur un problème de déplacement déjà vérifié, plutôt qu'un niveau
  // aléatoire dont la possibilité de résolution serait seulement supposée.
  const initial={a:1,h:0,k:0},end={a:.5,h:1,k:1};
  const obstacles=[{x:1,y:0}],routes=orderedRoutes(initial,end);
  const route=routes.find(r=>r.slice(1).every((p,i)=>sweepClear(r[i],p,obstacles,.05)));
  if(!route)throw new Error('Le trajet de secours doit être résoluble.');
  return {initial,obstacles,route,solution:end};
}
export function makeLevel(world: number, index: number, seed = world*1000+index): Level {
  const rng=random(seed+117); const pick=<T>(xs:T[])=>xs[Math.floor(rng()*xs.length)];
  let p:Params={a:1,h:pick([-2,-1,1,2]),k:pick([-2,-1,1,2])};
  let free: (keyof Params)[]=['h','k']; let targets:Point[]=[]; const obstacles:Point[]=[];
  let title='Coordonnées du sommet', goal='Place le sommet S sur le losange doré.', hint='Dans a(x − α)² + β, le sommet est S(α ; β). Lis ses coordonnées sur le repère.';
  if(world===0){ if(index<2) {p.k=0;free=['h'];} else if(index<4){p.h=0;free=['k'];} targets=[{x:p.h,y:p.k,vertex:true}]; }
  if(world===1){p={a:pick(index<4?[0.5,1,1.5,2]:[-2,-1.5,-1,-0.5,0.5,1,1.5,2]),h:index<3?0:pick([-1,0,1]),k:0};free=['a'];targets=[-1,1].map(d=>({x:p.h+d,y:value(p,p.h+d)}));title=p.a<0?'Vers le bas':'Trouver l’ouverture';goal='Traverse les deux cristaux verts. Le sommet est fixé.';hint='À une unité du sommet, la variation verticale vaut a. Son signe donne le sens d’ouverture.';}
  if(world===2){const r=pick(index<3?[1]:[1,2]);p={a:pick(index<5?[0.5,1]:[0.5,1,-0.5,-1]),h:index<2?0:pick([-2,-1,1,2]),k:0};p.k=-p.a*r*r;free=['h','k'];targets=[{x:p.h-r,y:0},{x:p.h+r,y:0}];title='Deux racines, une symétrie';goal='Fais passer la courbe par les deux racines indiquées.';hint='α est le milieu des racines r₁ et r₂. Puis β = −a(r₁ − α)². Le coefficient a est fixé.';}
  let route:Params[]|undefined;
  const general=(world===3&&index>=7)||(world===4&&index>=5);
  if(world>=3){p.a=pick(general?[-.5,.5]:[-1,-0.5,0.5,1]);p.k=pick(p.a<0?[0,1,2]:[-2,-1,0,1,2]);free=['a','h','k'];title=world===3?'Le passage des paraboles':'Sous contrainte';goal='Contourne les obstacles, place le sommet et traverse les deux cristaux.';hint='Lis (α ; β) au sommet, puis détermine a. Pour déplacer la courbe, change l’ordre des réglages : certains passages sont bloqués.';}
  let initial:Params={a:world===1?(p.a===1?.5:1):p.a,h:free.includes('h')?0:p.h,k:free.includes('k')?0:p.k};
  if(world>=3){
    const puzzle=motionPuzzle(p,rng,index);initial=puzzle.initial;obstacles.push(...puzzle.obstacles);route=puzzle.route;
    if(puzzle.solution)p=puzzle.solution;
    targets=general?[-2,1,3].map(d=>({x:p.h+d,y:value(p,p.h+d)})):[{x:p.h,y:p.k,vertex:true},...[-2,2].map(d=>({x:p.h+d,y:value(p,p.h+d)}))];
    if(general){title='Trois points, une courbe';goal='Retrouve la parabole passant par les trois cristaux, puis conduis-la sans traverser les obstacles.';hint='Aucun point ne donne le sommet. Détermine A, B et C dans y = Ax² + Bx + C à partir des trois points ; puis a = A, α = −B/(2A), β = C − B²/(4A).';}
    const symbols={a:'a',h:'α',k:'β'};
    const sequence=route.slice(1).map((to,i)=>symbols[(['a','h','k'] as const).find(key=>to[key]!==route![i][key])!]);
    hint+=` Depuis le départ, un ordre possible est : ${sequence.join(' → ')}. Règle chaque paramètre à sa valeur finale avant de passer au suivant.`;
  }
  if(evaluate({targets,obstacles} as Level,initial).success) {if(free.includes('h'))initial.h+=1;else if(free.includes('k'))initial.k+=1;else initial.a=0.25;}

  return {id:`${world}-${index}`,world,index,title,goal,hint,solution:p,initial,targets,obstacles,free,route,...world===4?{limit:12,seconds:45}:{}};
}
export const campaign = Array.from({length:50},(_,i)=>makeLevel(Math.floor(i/10),i%10));
export function dateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function daily(date=new Date()){const key=dateKey(date);const seed=Number(key.replaceAll('-',''));return {...makeLevel(4,0,seed),id:`daily-${key}`,title:'Le défi quotidien'};}
