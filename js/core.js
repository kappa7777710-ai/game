// Ядро игры: данные (ресурсы, здания, навыки, жильё), сохранение, симуляция,
// действия игрока (стройка, ремонт, снос, смена руды) и общие форматтеры.
// Ничего не рисует — только состояние и правила.

// Единый грузовой склад колонии — вес в кг, не отдельный лимит на ресурс (WAREHOUSE_BASE_KG ниже).
// Этап 1: только T0. Остальные тиры удалены до тех пор, пока эта цепочка не будет
// полностью проработана — см. README (v17) для деталей и что было убрано.
const RESOURCES=[
  {id:'iron_ore',name:'Железная руда',formula:'Fe₂O₃',tier:0,weight:2,shapeIdx:0,family:'iron',colorVar:'iron'},
  {id:'copper_ore',name:'Медная руда',formula:'Cu₂S',tier:0,weight:2.2,shapeIdx:1,family:'copper',colorVar:'copper'},
  {id:'water',name:'Вода',formula:'H₂O',tier:0,weight:1,shapeIdx:2,colorVar:'water'},
];

const POP_GOODS=[];

const WAREHOUSE_BASE_KG=10000; // единый грузовой склад колонии, 10 тонн на старте
function totalCargoWeight(){
  let sum=0;
  RESOURCES.forEach(r=>{ sum+=(state.resources[r.id]||0)*(r.weight||0); });
  POP_GOODS.forEach(r=>{ sum+=(state.resources[r.id]||0)*(r.weight||0); });
  return sum;
}
function warehouseCapacityKg(){ return WAREHOUSE_BASE_KG; }
function warehouseFreeKg(){ return Math.max(0, warehouseCapacityKg()-totalCargoWeight()); }

// Тип здания = универсальная установка (цена, рост цены, площадь). Рецепт = что она выпускает.
// Рецепт открывается уровнем навыка recipe.skill (по умолчанию навык своего тира) >= recipe.unlock.
// У рецептов T2+ пока нет type: каждый из них — сам себе тип со своей ценой (старая схема).
const BUILDING_TYPES=[
  {id:'miner',name:'Горнодобывающая установка',cost:{iron_ore:60},area:25,icon:'rigMiner',neutralColor:'miner'},
  {id:'drill',name:'Буровая установка',cost:{iron_ore:40},area:10,icon:'rigDrill',neutralColor:'water'},
];
const RETOOL_FEE=0.1; // доля базовой цены за перенастройку одной установки на другой рецепт

// Площадь участка базы: каждая построенная установка занимает area своего типа,
// суммарно не больше BASE_AREA. Отдельный лимит от весового склада — можно упереться
// в площадь, даже если по весу и ресурсам всё ещё есть запас.
const BASE_AREA=500;
function usedArea(){ return state.units.reduce((s,u)=>{ const b=BUILDINGS.find(x=>x.id===u.recipe); return s+(b?(typeOf(b).area||0):0); },0); }
function freeArea(){ return Math.max(0, BASE_AREA-usedArea()); }

// Износ: прочность 0-100, падает со временем независимо от того, работает ли установка.
// Ссылочная точка: -30 п.п. за 45 суток непрерывной работы. Ниже пола установка не изнашивается
// дальше сама (иначе она бы совсем переставала работать) — чинится ремонтом за стройматериалы.
const DURABILITY_MAX=100;
const DURABILITY_FLOOR=20;
const DURABILITY_LIFE_DAYS=45;
const DURABILITY_LOSS_AT_LIFE=30;
const DURABILITY_DECAY_PER_SEC=DURABILITY_LOSS_AT_LIFE/(DURABILITY_LIFE_DAYS*86400);
const REPAIR_FACTOR=1; // ремонт 1% прочности = 1% ресурсов, потраченных на установку (полный ремонт = полная цена)
const DEMOLISH_REFUND=0.25; // снос возвращает 25% ресурсов, потраченных на последнюю построенную установку

const BUILDINGS=[
  {id:'iron_ore',type:'miner',unlock:0,tier:0,cycle:400,in:{},out:{iron_ore:4},workers:3},
  {id:'copper_ore',type:'miner',unlock:0,tier:0,cycle:450,in:{},out:{copper_ore:4},workers:3},
  {id:'water',type:'drill',unlock:0,tier:0,cycle:350,in:{},out:{water:3},workers:3},
];

const SERVICE_BUILDINGS=[];

const HOUSING=[
  {id:'house_c1',name:'Жилой блок: разнорабочие',cls:1,capacity:20,cost:{iron_ore:50,water:30}},
];

const CLASSES=[
  {id:1,name:'Разнорабочие',needsWeighted:[
    {id:'water',label:'Вода',weight:1},
  ]},
];

const CLASS_OF_TIER={0:1};
const BASE_FREE_CAPACITY={1:8};
const SEC_PER_DAY=86400;
const PER_WORKER_RATE={
  water:1/SEC_PER_DAY,
};

const SKILLS=[
  {id:'t0',tier:0,name:'Горное дело',icon:'skillT0'},
];
// 150 уровней вместо 5: тот же максимальный бонус (+40% скорость, −25% персонал),
// просто размазанный на длинную дистанцию, плюс новая линейная прибавка к богатству
// месторождения (до +100% на максимуме) — раньше richness была статичной на весь забег.
const MAX_SKILL_LEVEL=150;
const SKILL_SPEED_BONUS=0.40/MAX_SKILL_LEVEL;
const SKILL_WORKFORCE_CUT=0.25/MAX_SKILL_LEVEL;
const SKILL_RICHNESS_BONUS=1.0/MAX_SKILL_LEVEL;
// SP на T0 = фактически добытые ресурсы (1 добытая единица = 1 SP, с учётом реальной
// загрузки/богатства/бонуса скорости), а не плоская ставка за факт существования здания.
const SP_PER_UNIT_T0=1;
const ACADEMY_SP_PER_HOUR=90;
const ACADEMY={id:'academy',name:'Учебный центр',cost:{iron_ore:80,copper_ore:40}};
const SKILL_BUILDINGS=[ACADEMY];

// Каждый следующий уровень дороже предыдущего на 70%: level 1 = 20 SP, level 2 = 34,
// ..., level 20 уже ~478 тыс., level 50 — триллионы. Выше ~25-30 уровня — не про то,
// чтобы туда реально дойти: рост чисто экспоненциальный без потолка, 150 — формальный
// максимум переменной MAX_SKILL_LEVEL, а не ориентир прокачки.
const SKILL_LEVEL_BASE_SP=20;
const SKILL_LEVEL_GROWTH=1.7;
function skillLevelCost(level){ return Math.round(SKILL_LEVEL_BASE_SP*Math.pow(SKILL_LEVEL_GROWTH,level-1)); }
function skillLevelById(id){ return (state.skills && state.skills[id] && state.skills[id].level) || 0; }
function skillName(id){ const sk=SKILLS.find(x=>x.id===id); return sk?sk.name:id; }
function recipeSkillId(b){ return b.skill || ('t'+b.tier); }
function recipeUnlocked(b){ return skillLevelById(recipeSkillId(b))>=(b.unlock||0); }
function speedMultForRecipe(b){ return 1+SKILL_SPEED_BONUS*skillLevelById(recipeSkillId(b)); }
function workforceCutForRecipe(b){ return SKILL_WORKFORCE_CUT*skillLevelById(recipeSkillId(b)); }
function outId(b){ return Object.keys(b.out)[0]; }
function recipeLabel(b){ return b.label || resName(outId(b)); }
function richOf(b){
  const r=resById(outId(b));
  const base=state.richness[(r&&r.family)||outId(b)]||1;
  return base+SKILL_RICHNESS_BONUS*skillLevelById(recipeSkillId(b));
}
function skillAffectsRichness(skId){ return BUILDINGS.some(b=>b.tier===0 && recipeSkillId(b)===skId); }
function resourceVisible(r){
  if((state.resources[r.id]||0)>0.05) return true;
  if(Math.abs(netRate(r.id))>1e-6) return true;
  return BUILDINGS.some(b=>outId(b)===r.id && recipeUnlocked(b));
}
function recipeVisible(b){
  if(!b.optional) return true;
  return Object.keys(b.in).every(rid=>{ const r=resById(rid); return r && resourceVisible(r); });
}
function typeKey(b){ return b.type || b.id; }
function typeOf(b){ return b.type ? BUILDING_TYPES.find(t=>t.id===b.type) : b; }
function typeCount(b){ const k=typeKey(b); return BUILDINGS.filter(x=>typeKey(x)===k).reduce((sum,x)=>sum+(state.buildings[x.id]||0),0); }
// Каждая установка — отдельный объект в state.units: {id, recipe, builtAt, durability}.
// state.buildings[recipeId] остаётся синхронным кэшем количества (используется везде,
// где нужна просто цифра: наём персонала, разблокировка тиров, очки навыков, бейджи).
function unitsOf(recipeId){ return state.units.filter(u=>u.recipe===recipeId); }
function syncBuildingCount(recipeId){ state.buildings[recipeId]=unitsOf(recipeId).length; }
function baseCostOf(b){ return (b.type?typeOf(b):b).cost; }
function repairCost(u,b){
  const wear=Math.max(0,(DURABILITY_MAX-u.durability)/100);
  const result={};
  if(wear<=0.001) return result;
  Object.entries(baseCostOf(b)).forEach(([rid,q])=>{
    const amt=Math.ceil(q*wear*REPAIR_FACTOR);
    if(amt>0) result[rid]=amt;
  });
  return result;
}
function retoolFee(b){
  const fee={};
  Object.entries(typeOf(b).cost).forEach(([rid,q])=>{ fee[rid]=Math.ceil(q*RETOOL_FEE); });
  return fee;
}

const TAB_LABELS=['Добыча'];
const SAVE_KEY='industrial_belt_v19';
const OFFLINE_CAP_SEC=12*3600;
const OFFLINE_STEP=30;

function resById(id){ return RESOURCES.find(r=>r.id===id) || POP_GOODS.find(r=>r.id===id); }
// В интерфейсе ресурс подписан химической формулой (руда — формулой минерала: Fe₂O₃ гематит,
// Cu₂S халькозин — чтобы голые Fe/Cu остались за чистым металлом). Полное название — во всплывающей подсказке.
function resName(id){ const r=resById(id); return r?(r.formula||r.name):id; }
function resFullName(id){ const r=resById(id); return r?r.name:id; }
function resTag(id){ return '<span class="res-f" title="'+resFullName(id)+'">'+resName(id)+'</span>'; }
function colorVarOf(res){ return res.colorVar || ('tier'+res.tier); }

function freshState(){
  const resources={};
  RESOURCES.forEach(r=>resources[r.id]=0);
  POP_GOODS.forEach(r=>resources[r.id]=0);
  const cargo={iron_ore:300,copper_ore:150,water:200};
  Object.entries(cargo).forEach(([k,v])=>resources[k]=v);
  const richness={};
  RESOURCES.filter(r=>r.tier===0).forEach(r=>{ const k=r.family||r.id; if(richness[k]==null) richness[k]=Math.round((0.8+Math.random()*0.5)*100)/100; });
  const skills={};
  SKILLS.forEach(s=>skills[s.id]={level:0,sp:0});
  const now=Date.now();
  return {resources,buildings:{},richness,skills,units:[],nextUnitId:1,training:'t0',lastTs:now,startTs:now,playSeconds:0};
}

function loadState(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return null;
}
function saveState(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
}

let state=loadState();
let isNew=!state;
if(!state) state=freshState();
POP_GOODS.forEach(r=>{ if(state.resources[r.id]==null) state.resources[r.id]=0; });
if(!state.units) state.units=[];
if(!state.nextUnitId) state.nextUnitId=1;

const util={};
function blankWf(){ return {cap:0,demand:0,assigned:0,staffing:1,satisfaction:1,weighted:[],extras:[],base:null}; }
let lastWorkforce={}; CLASSES.forEach(c=>{ lastWorkforce[c.id]=blankWf(); });

function runProdBuilding(b, dt, richMult, speedMult, countOverride){
  if(speedMult==null) speedMult=1;
  const count = countOverride!=null ? countOverride : (state.buildings[b.id]||0);
  if(count<=0){ return {frac:0, reason:'idle'}; }
  const outQty=b.out[outId(b)];
  const outPerSec=outQty*count/b.cycle*speedMult;
  const desiredOut=outPerSec*dt*richMult;
  const entries=Object.entries(b.in||{});
  const desiredIns={};
  let inputFraction=1;
  entries.forEach(([rid,q])=>{
    const perSec=q*count/b.cycle*speedMult;
    const desired=perSec*dt;
    desiredIns[rid]=desired;
    if(desired>0){
      const avail=state.resources[rid]||0;
      inputFraction=Math.min(inputFraction, avail/desired);
    }
  });
  const outMeta=resById(outId(b));
  const capSpaceUnits=warehouseFreeKg()/(outMeta.weight||1);
  let outCapFraction=1;
  if(desiredOut>0){ outCapFraction=Math.min(1, Math.max(0,capSpaceUnits)/desiredOut); }
  return {inputFraction, outCapFraction, desiredOut, desiredIns, entries};
}

function computeWorkforce(dt){
  const wf={};
  let class1Sat=1;
  CLASSES.map(c=>c.id).forEach(c=>{
    const housing=HOUSING.find(h=>h.cls===c);
    const builtCap=(state.buildings[housing.id]||0)*housing.capacity;
    const cap=builtCap+(BASE_FREE_CAPACITY[c]||0);
    const demand=BUILDINGS.filter(b=>CLASS_OF_TIER[b.tier]===c).reduce((s,b)=>s+(state.buildings[b.id]||0)*b.workers*(1-workforceCutForRecipe(b)),0);
    const staffing=demand>0?Math.min(1,cap/demand):1;
    const assigned=Math.min(cap,demand);
    const cls=CLASSES.find(x=>x.id===c);
    let satisfaction;
    const weighted=[];
    const extras=[];
    if(c===1){
      satisfaction=0;
      cls.needsWeighted.forEach(n=>{
        const rate=PER_WORKER_RATE[n.id];
        const desired=rate*assigned*dt;
        let fraction=1;
        if(desired>0){
          const avail=state.resources[n.id]||0;
          fraction=Math.max(0,Math.min(1, avail/desired));
        }
        satisfaction+=n.weight*fraction;
        const consume=desired*fraction;
        state.resources[n.id]=Math.max(0,(state.resources[n.id]||0)-consume);
        weighted.push({id:n.id,label:n.label,weight:n.weight,fraction});
      });
      satisfaction=Math.max(0,Math.min(1,satisfaction));
      class1Sat=satisfaction;
    }else{
      satisfaction=class1Sat;
      (cls.extraNeeds||[]).forEach(gid=>{
        const rate=PER_WORKER_RATE[gid];
        const desired=rate*assigned*dt;
        let fraction=1;
        if(desired>0){
          const avail=state.resources[gid]||0;
          fraction=Math.max(0,Math.min(1, avail/desired));
        }
        satisfaction=Math.min(satisfaction, fraction);
        extras.push({id:gid,fraction});
      });
      satisfaction=Math.max(0,Math.min(1,satisfaction));
      (cls.extraNeeds||[]).forEach(gid=>{
        const rate=PER_WORKER_RATE[gid];
        const desired=rate*assigned*dt;
        const consume=desired*satisfaction;
        state.resources[gid]=Math.max(0,(state.resources[gid]||0)-consume);
      });
    }
    wf[c]={cap,demand,assigned,staffing,satisfaction,weighted,extras,base:c===1?null:class1Sat};
  });
  return wf;
}

// Фактический выпуск ресурса всеми установками рецепта в час — то же, что видно
// в netRate: простаивающая установка (нет персонала/сырья/места на складе) даёт 0.
function recipeRatePerHour(b){
  const count=state.buildings[b.id]||0;
  if(count<=0) return 0;
  const u=(util[b.id]&&util[b.id].frac)||0;
  if(u<=0) return 0;
  return (b.out[outId(b)]*count/b.cycle)*3600*richOf(b)*speedMultForRecipe(b)*u;
}
// T0 больше не даёт плоскую ставку СП — она равна фактическому выпуску (см. выше),
// т.е. простаивающая установка добывает 0 СП, а не свою "долю" просто за факт существования.
function spFromT0PerHour(){
  return BUILDINGS.filter(b=>b.tier===0).reduce((s,b)=>s+recipeRatePerHour(b)*SP_PER_UNIT_T0,0);
}
function spFromOtherTiersPerHour(){
  const academies=state.buildings[ACADEMY.id]||0;
  return {fromTiers:0, fromAcademy:academies*ACADEMY_SP_PER_HOUR};
}
function spPerHourTotal(){
  const fromT0=spFromT0PerHour();
  const other=spFromOtherTiersPerHour();
  const fromBuildings=fromT0+other.fromTiers;
  return {fromBuildings, fromAcademy:other.fromAcademy, total:fromBuildings+other.fromAcademy};
}

function tickSkills(dt, t0OutputUnits){
  const other=spFromOtherTiersPerHour();
  const otherSpPerSec=(other.fromTiers+other.fromAcademy)/3600;
  const spGain=(t0OutputUnits||0)*SP_PER_UNIT_T0+otherSpPerSec*dt;
  if(!state.training) return;
  const sk=state.skills[state.training];
  if(!sk || sk.level>=MAX_SKILL_LEVEL) return;
  sk.sp+=spGain;
  while(sk.level<MAX_SKILL_LEVEL && sk.sp>=skillLevelCost(sk.level+1)){
    sk.sp-=skillLevelCost(sk.level+1);
    sk.level+=1;
  }
}

function decayDurability(dt){
  state.units.forEach(u=>{
    if(u.durability<=DURABILITY_FLOOR) return;
    u.durability=Math.max(DURABILITY_FLOOR, u.durability-DURABILITY_DECAY_PER_SEC*dt);
  });
}

function simulateStep(dt){
  decayDurability(dt);
  SERVICE_BUILDINGS.forEach(sb=>{
    const count=state.buildings[sb.id]||0;
    if(count<=0){ util[sb.id]={frac:0,reason:'idle'}; return; }
    const calc=runProdBuilding(sb, dt, 1);
    const fraction=Math.max(0,Math.min(1,calc.inputFraction,calc.outCapFraction));
    calc.entries.forEach(([rid,q])=>{
      const next=(state.resources[rid]||0)-calc.desiredIns[rid]*fraction;
      state.resources[rid]=next<0?0:next;
    });
    state.resources[sb.id]=(state.resources[sb.id]||0)+calc.desiredOut*fraction;
    let reason='full';
    if(fraction<0.999){
      reason = calc.inputFraction<=calc.outCapFraction ? 'input' : 'storage';
    }
    util[sb.id]={frac:fraction,reason};
  });

  const wf=computeWorkforce(dt);
  lastWorkforce=wf;

  let t0OutputUnits=0;
  [0,1,2,3,4].forEach(t=>{
    BUILDINGS.filter(b=>b.tier===t).forEach(b=>{
      const units=unitsOf(b.id);
      const unitCount=units.length;
      if(unitCount<=0){ util[b.id]={frac:0,reason:'idle'}; return; }
      const effCapacity=units.reduce((s,u)=>s+Math.max(0,u.durability)/100,0);
      const richMult = t===0 ? richOf(b) : 1;
      const speedMult = speedMultForRecipe(b);
      const calc=runProdBuilding(b, dt, richMult, speedMult, effCapacity);
      const cls=wf[CLASS_OF_TIER[t]];
      const factors={staff:cls.staffing, comfort:cls.satisfaction, input:calc.inputFraction, storage:calc.outCapFraction};
      let fraction=1, reason='full';
      ['staff','comfort','input','storage'].forEach(k=>{
        if(factors[k]<fraction-1e-6){ fraction=factors[k]; reason=k; }
      });
      fraction=Math.max(0,Math.min(1,fraction));
      const avgWear=unitCount>0?effCapacity/unitCount:1;
      if(fraction>=0.999 && avgWear<0.999-1e-6){ reason='wear'; }
      calc.entries.forEach(([rid,q])=>{
        const next=(state.resources[rid]||0)-calc.desiredIns[rid]*fraction;
        state.resources[rid]=next<0?0:next;
      });
      const producedNow=calc.desiredOut*fraction;
      state.resources[outId(b)]=(state.resources[outId(b)]||0)+producedNow;
      if(t===0) t0OutputUnits+=producedNow;
      util[b.id]={frac:fraction*avgWear,reason};
    });
  });
  tickSkills(dt, t0OutputUnits);
  state.playSeconds=(state.playSeconds||0)+dt;
}

function netRate(resId){
  let rate=0;
  BUILDINGS.concat(SERVICE_BUILDINGS).forEach(b=>{
    const count=state.buildings[b.id]||0;
    if(count<=0) return;
    const u=(util[b.id]&&util[b.id].frac)||0;
    if(b.out && b.out[resId]!=null){
      const rich = (b.tier===0) ? richOf(b) : 1;
      rate += (b.out[resId]*count/b.cycle)*u*rich;
    }
    if(b.in && b.in[resId]!=null){
      rate -= (b.in[resId]*count/b.cycle)*u;
    }
  });
  return rate;
}

function scaledCost(b,count){
  const result={};
  Object.entries(b.cost).forEach(([rid,q])=>{
    result[rid]=Math.ceil(q*Math.pow(1.15,count));
  });
  return result;
}

function fmtDuration(sec){
  sec=Math.round(sec);
  const m=Math.floor(sec/60), r=sec%60;
  return m+':'+String(r).padStart(2,'0');
}
function fmtDurationWords(sec){
  sec=Math.round(sec);
  const m=Math.floor(sec/60), r=sec%60;
  if(m<=0) return r+' сек';
  if(r<=0) return m+' мин';
  return m+' мин '+r+' сек';
}
function fmtElapsed(ms){
  let s=Math.floor(ms/1000);
  const d=Math.floor(s/86400); s%=86400;
  const h=Math.floor(s/3600); s%=3600;
  const m=Math.floor(s/60);
  if(d>0) return d+'д '+h+'ч '+m+'м';
  if(h>0) return h+'ч '+m+'м';
  return m+'м';
}

function tierUnlocked(t){
  if(t===0) return true;
  return BUILDINGS.filter(b=>b.tier===t-1).some(b=>(state.buildings[b.id]||0)>0);
}

const REASON_LABELS={
  full:'Работает на полную мощность',
  input:'Не хватает сырья',
  storage:'Склад заполнен',
  staff:'Не хватает персонала',
  comfort:'Персонал недоволен бытом',
  wear:'Изношено оборудование',
  idle:'Ожидает первого тика симуляции',
};

function fmtRate(r){ return r>=10?String(Math.round(r)):r.toFixed(1); }
function unitPotentialPerHour(b){ return b.out[outId(b)]*3600/b.cycle*richOf(b)*speedMultForRecipe(b); }
function unitWorking(b){ const u=util[b.id]; return !!(u && u.frac>0.001); }
function tryBuild(id){
  let b=BUILDINGS.find(x=>x.id===id) || SERVICE_BUILDINGS.find(x=>x.id===id) || HOUSING.find(x=>x.id===id) || SKILL_BUILDINGS.find(x=>x.id===id);
  if(!b) return;
  let unlocked=true;
  if(b.tier!=null) unlocked=tierUnlocked(b.tier);
  else if(b.cls!=null) unlocked=popUnlocked(b.cls);
  if(!unlocked) return;
  const isRecipe=BUILDINGS.includes(b);
  if(isRecipe && !recipeUnlocked(b)) return;
  if(isRecipe && (typeOf(b).area||0)>freeArea()) return;
  const count=state.buildings[id]||0;
  const cost=isRecipe ? scaledCost(typeOf(b),typeCount(b)) : scaledCost(b,count);
  const afford=Object.entries(cost).every(([rid,q])=>(state.resources[rid]||0)>=q);
  if(!afford) return;
  Object.entries(cost).forEach(([rid,q])=>{ state.resources[rid]-=q; });
  if(isRecipe){
    const uid=state.nextUnitId++;
    state.units.push({id:uid, recipe:id, builtAt:Date.now(), durability:DURABILITY_MAX});
    syncBuildingCount(id);
  }else{
    state.buildings[id]=count+1;
  }
  saveState();
  renderAll();
}

function tryRepairUnit(unitId){
  const u=state.units.find(x=>x.id===unitId);
  if(!u) return;
  const b=BUILDINGS.find(x=>x.id===u.recipe);
  if(!b) return;
  const cost=repairCost(u,b);
  if(!Object.keys(cost).length) return;
  if(!Object.entries(cost).every(([rid,q])=>(state.resources[rid]||0)>=q)) return;
  Object.entries(cost).forEach(([rid,q])=>{ state.resources[rid]-=q; });
  u.durability=DURABILITY_MAX;
  saveState();
  renderAll();
}

function tryDemolishUnit(unitId){
  const idx=state.units.findIndex(x=>x.id===unitId);
  if(idx<0) return;
  const u=state.units[idx];
  const b=BUILDINGS.find(x=>x.id===u.recipe);
  if(!b) return;
  const refund=demolishCost(b);
  state.units.splice(idx,1);
  syncBuildingCount(u.recipe);
  const refundKg=Object.entries(refund).reduce((sum,[rid,q])=>sum+q*(resById(rid).weight||0),0);
  const free=warehouseFreeKg();
  const scale = (refundKg>free && refundKg>0) ? free/refundKg : 1;
  Object.entries(refund).forEach(([rid,q])=>{
    const add=Math.floor(q*scale);
    if(add>0) state.resources[rid]=(state.resources[rid]||0)+add;
  });
  saveState();
  renderAll();
}

function tryRetoolUnit(unitId,toId){
  const u=state.units.find(x=>x.id===unitId);
  if(!u) return;
  const from=BUILDINGS.find(x=>x.id===u.recipe), to=BUILDINGS.find(x=>x.id===toId);
  if(!from || !to || !from.type || from.type!==to.type) return;
  if(!recipeUnlocked(to)) return;
  const fee=retoolFee(from);
  if(!Object.entries(fee).every(([rid,q])=>(state.resources[rid]||0)>=q)) return;
  Object.entries(fee).forEach(([rid,q])=>{ state.resources[rid]-=q; });
  const oldRecipe=u.recipe;
  u.recipe=toId;
  u.builtAt=Date.now(); // цикл новой руды начинается заново, а не с фазы старой
  syncBuildingCount(oldRecipe);
  syncBuildingCount(toId);
  saveState();
  renderAll();
}

function fmtMMSS(sec){
  sec=Math.max(0,Math.round(sec));
  const m=Math.floor(sec/60), r=sec%60;
  return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');
}
function unitCycleState(uid,now){
  const unit=state.units.find(x=>x.id===uid);
  const b=unit && BUILDINGS.find(x=>x.id===unit.recipe);
  if(!b || !unitWorking(b)) return {p:0,left:0,idle:true};
  const eff=Math.max(0.5, b.cycle/speedMultForRecipe(b));
  const phase=(((now-unit.builtAt/1000)%eff)+eff)%eff/eff;
  return {p:phase,left:eff-phase*eff,idle:false};
}
