// Общий интерфейс: разделы и хотбар, значки (SVG), ссылки на панели,
// переключение вкладок, renderAll и анимация циклов (tickCycleBars).

const SECTIONS=[
  {id:'hq',label:'Штаб-квартира',short:'Штаб',color:'tier0'},
  {id:'buildings',label:'Здания',short:'Здания',color:'tier1'},
  {id:'build',label:'Построить',short:'Стройка',color:'tier2'},
  {id:'workers',label:'Рабочие',short:'Рабочие',color:'class1'},
  {id:'skills',label:'Навыки',short:'Навыки',color:'skill'},
  {id:'production',label:'Производство',short:'Цех',color:'tier3'},
  {id:'warehouse',label:'Склад',short:'Склад',color:'tier4'},
];
// Иконки разделов для хотбара — отдельный холст 48×48 (детальнее, чем ICONS 20×20).
// Тёмные/светлые детали красятся через style (--ink/--hi), основная заливка — currentColor.
const SECTION_ICONS={
  hq:'<rect x="5" y="41" width="38" height="2.5" rx="1.25" opacity=".3"/>'+
     '<path d="M7 41V26a2 2 0 0 1 2-2h9v17z" opacity=".6"/><path d="M30 41V24h9a2 2 0 0 1 2 2v15z" opacity=".6"/>'+
     '<path d="M17 41V15a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v26z"/>'+
     '<path d="M24 13V6.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="24" cy="5" r="2.2" style="fill:var(--hi)"/>'+
     '<path d="M8.6 23.2c0-4.3 3.1-7.2 7.3-7.2" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round"/><path d="M11 21.4l3.6-3.2" stroke="currentColor" stroke-width="1.2"/>'+
     '<g style="fill:var(--hi)" opacity=".85"><rect x="20" y="16" width="3" height="2.3" rx=".4"/><rect x="25" y="16" width="3" height="2.3" rx=".4"/><rect x="20" y="20.5" width="3" height="2.3" rx=".4"/><rect x="25" y="20.5" width="3" height="2.3" rx=".4"/><rect x="20" y="25" width="3" height="2.3" rx=".4"/><rect x="25" y="25" width="3" height="2.3" rx=".4"/></g>'+
     '<g style="fill:var(--hi)" opacity=".5"><rect x="10" y="28" width="5" height="2" rx=".4"/><rect x="10" y="32.5" width="5" height="2" rx=".4"/><rect x="33" y="28" width="5" height="2" rx=".4"/><rect x="33" y="32.5" width="5" height="2" rx=".4"/></g>'+
     '<rect x="21" y="33" width="6" height="8" rx="1" style="fill:var(--ink)" opacity=".55"/>',
  buildings:'<rect x="3" y="41" width="42" height="2.5" rx="1.25" opacity=".3"/>'+
     '<circle cx="30" cy="7" r="2.6" opacity=".32"/><circle cx="34.6" cy="4.2" r="1.9" opacity=".22"/>'+
     '<path d="M4 41V27l7-4.5V27l7-4.5V27l7-4.5V41z" opacity=".6"/>'+
     '<rect x="26.5" y="11" width="6" height="30" rx="1"/><rect x="26.5" y="15" width="6" height="1.6" style="fill:var(--ink)" opacity=".4"/>'+
     '<rect x="34" y="21" width="10" height="20" rx="1.5" opacity=".82"/>'+
     '<g style="fill:var(--hi)" opacity=".7"><rect x="7" y="31" width="3.5" height="3" rx=".4"/><rect x="13.5" y="31" width="3.5" height="3" rx=".4"/><rect x="20" y="31" width="3" height="3" rx=".4"/><rect x="7" y="36" width="3.5" height="3" rx=".4"/><rect x="13.5" y="36" width="3.5" height="3" rx=".4"/></g>'+
     '<g style="fill:var(--hi)" opacity=".8"><rect x="36" y="24" width="2.5" height="2.5" rx=".3"/><rect x="39.5" y="24" width="2.5" height="2.5" rx=".3"/><rect x="36" y="29" width="2.5" height="2.5" rx=".3"/><rect x="39.5" y="29" width="2.5" height="2.5" rx=".3"/><rect x="36" y="34" width="2.5" height="2.5" rx=".3"/><rect x="39.5" y="34" width="2.5" height="2.5" rx=".3"/></g>',
  build:'<rect x="8" y="41" width="14" height="2.5" rx="1.25" opacity=".35"/>'+
     '<path d="M13 41V12h4v29z"/>'+
     '<path d="M13 16l4 4M17 20l-4 4M13 24l4 4M17 28l-4 4M13 32l4 4M17 36l-4 4" style="stroke:var(--ink)" stroke-width="1" opacity=".45"/>'+
     '<path d="M13 12l2-7.5 2 7.5z" opacity=".9"/>'+
     '<path d="M15 4.5L6 10M15 4.5L42 10" stroke="currentColor" stroke-width="1" fill="none" opacity=".6"/>'+
     '<rect x="5" y="10" width="38" height="3" rx="1"/>'+
     '<rect x="5" y="13" width="6" height="5" rx="1" opacity=".75"/>'+
     '<rect x="17" y="13" width="4.5" height="4" rx="1" style="fill:var(--hi)" opacity=".8"/>'+
     '<rect x="32" y="13" width="4" height="2" opacity=".9"/>'+
     '<path d="M34 15v12" stroke="currentColor" stroke-width="1.1"/>'+
     '<path d="M34 27l-6 5M34 27l6 5" stroke="currentColor" stroke-width="1" fill="none" opacity=".75"/>'+
     '<rect x="26" y="32" width="16" height="4.2" rx="1" style="fill:var(--hi)" opacity=".85"/>'+
     '<path d="M30 32v4.2M34 32v4.2M38 32v4.2" style="stroke:var(--ink)" stroke-width="1" opacity=".3"/>',
  workers:'<path d="M26 35c1-6.5 4.8-9.5 9-9.5s8.2 3 9.2 9.5z" opacity=".28"/><circle cx="35" cy="18" r="5" opacity=".35"/><path d="M29.5 16a5.5 5.5 0 0 1 11 0z" opacity=".5"/><rect x="28.5" y="15.3" width="13" height="1.8" rx=".9" opacity=".5"/>'+
     '<path d="M7 44c0-9.5 7.5-14 17-14s17 4.5 17 14z" opacity=".68"/>'+
     '<path d="M11.5 38.8h25" style="stroke:var(--hi)" stroke-width="2" opacity=".65"/>'+
     '<circle cx="24" cy="22.5" r="7.5" opacity=".92"/>'+
     '<path d="M14.5 19.5a9.5 9.5 0 0 1 19 0z"/><rect x="12" y="18.5" width="24" height="3" rx="1.5"/>'+
     '<rect x="22.8" y="10.8" width="2.4" height="7.5" rx="1" style="fill:var(--hi)" opacity=".45"/>',
  skills:'<path d="M5 15.5c7-2.5 13-1.5 18 2.5v23c-5-3.5-11-4.5-18-2z" opacity=".6"/>'+
     '<path d="M43 15.5c-7-2.5-13-1.5-18 2.5v23c5-3.5 11-4.5 18-2z" opacity=".92"/>'+
     '<path d="M9 22.5c4-1 7-.6 10 1M9 27.5c4-1 7-.6 10 1M9 32.5c4-1 7-.6 10 1" style="stroke:var(--hi)" stroke-width="1.1" fill="none" opacity=".45"/>'+
     '<path d="M29 23.5c3-1.6 6-2 10-1M29 28.5c3-1.6 6-2 10-1M29 33.5c3-1.6 6-2 10-1" style="stroke:var(--ink)" stroke-width="1.1" fill="none" opacity=".35"/>'+
     '<polygon points="24,2 25.53,5.9 29.71,6.15 26.47,8.8 27.53,12.85 24,10.6 20.47,12.85 21.53,8.8 18.29,6.15 22.47,5.9" style="fill:var(--hi)"/>'+
     '<circle cx="13.5" cy="8" r="1.1" opacity=".7"/><circle cx="34.5" cy="9.5" r="1.3" opacity=".7"/><circle cx="38" cy="4.5" r=".8" opacity=".5"/>',
  production:'<path class="gear-sm" fill-rule="evenodd" opacity=".6" d="M34.03 5.87 L34.41 3.87 L36.59 3.87 L36.97 5.87 L38.79 6.63 L40.47 5.48 L42.02 7.03 L40.87 8.71 L41.63 10.53 L43.63 10.91 L43.63 13.09 L41.63 13.47 L40.87 15.29 L42.02 16.97 L40.47 18.52 L38.79 17.37 L36.97 18.13 L36.59 20.13 L34.41 20.13 L34.03 18.13 L32.21 17.37 L30.53 18.52 L28.98 16.97 L30.13 15.29 L29.37 13.47 L27.37 13.09 L27.37 10.91 L29.37 10.53 L30.13 8.71 L28.98 7.03 L30.53 5.48 L32.21 6.63 Z M37.9 12 A2.4 2.4 0 1 0 33.1 12 A2.4 2.4 0 1 0 37.9 12 Z"/>'+
     '<path class="gear-lg" fill-rule="evenodd" d="M15.98 10.39 L16.56 7.58 L19.44 7.58 L20.02 10.39 L22.60 11.23 L24.73 9.29 L27.05 10.99 L25.87 13.61 L27.46 15.80 L30.32 15.48 L31.21 18.22 L28.71 19.65 L28.71 22.35 L31.21 23.78 L30.32 26.52 L27.46 26.20 L25.87 28.39 L27.05 31.01 L24.73 32.71 L22.60 30.77 L20.02 31.61 L19.44 34.42 L16.56 34.42 L15.98 31.61 L13.40 30.77 L11.27 32.71 L8.95 31.01 L10.13 28.39 L8.54 26.20 L5.68 26.52 L4.79 23.78 L7.29 22.35 L7.29 19.65 L4.79 18.22 L5.68 15.48 L8.54 15.80 L10.13 13.61 L8.95 10.99 L11.27 9.29 L13.40 11.23 Z M22.2 21 A4.2 4.2 0 1 0 13.8 21 A4.2 4.2 0 1 0 22.2 21 Z"/>'+
     '<rect x="3" y="37.5" width="42" height="6" rx="3" opacity=".55"/>'+
     '<g style="fill:var(--hi)" opacity=".7"><circle cx="7" cy="40.5" r="1.3"/><circle cx="15" cy="40.5" r="1.3"/><circle cx="23" cy="40.5" r="1.3"/><circle cx="31" cy="40.5" r="1.3"/><circle cx="39" cy="40.5" r="1.3"/></g>'+
     '<rect x="33" y="28.5" width="8.5" height="8.5" rx="1" style="fill:var(--hi)" opacity=".85"/><path d="M33 32.7h8.5" style="stroke:var(--ink)" stroke-width="1" opacity=".3"/>',
  warehouse:'<rect x="3" y="41" width="42" height="2.5" rx="1.25" opacity=".3"/>'+
     '<rect x="5" y="25" width="18" height="16" rx="1.5" opacity=".7"/><rect x="25" y="25" width="18" height="16" rx="1.5" opacity=".86"/><rect x="15" y="8.5" width="18" height="16" rx="1.5"/>'+
     '<g style="stroke:var(--ink)" stroke-width="1.3" fill="none" opacity=".4">'+
       '<rect x="7.2" y="27.2" width="13.6" height="11.6" rx=".5"/><path d="M7.2 38.8L20.8 27.2"/>'+
       '<rect x="27.2" y="27.2" width="13.6" height="11.6" rx=".5"/><path d="M27.2 38.8L40.8 27.2"/>'+
       '<rect x="17.2" y="10.7" width="13.6" height="11.6" rx=".5"/><path d="M17.2 22.3L30.8 10.7"/></g>'+
     '<path d="M16 9.5h16" style="stroke:var(--hi)" stroke-width="1" opacity=".35"/>',
};
const ICONS={
  // Ресурсы: разная форма силуэта на каждый (угловатая руда / гроздь самородков / капля),
  // цвет берётся отдельно через colorVar ресурса (--iron/--copper/--water), не общий tier0.
  iron_ore:'<polygon points="4,13 2,8 6,3 12,2 17,6 18,12 13,17 7,18 3,16" opacity="0.88"/><polygon points="6,8 10,5 14,8 12,12 8,12"/><polygon points="9,9 12,8 13,11 10,12" opacity="0.8"/><circle cx="14" cy="5.5" r="1.1"/>',
  copper_ore:'<circle cx="7" cy="8.5" r="4.3" opacity="0.88"/><circle cx="13.2" cy="7.6" r="3.7" opacity="0.88"/><circle cx="10" cy="13.3" r="4.7" opacity="0.88"/><polygon points="8,8 11.2,7 12.3,11 9,12.2"/><circle cx="15" cy="9.3" r="1"/>',
  water:'<path d="M10 2C10 2 4 10.5 4 14A6 6 0 0 0 16 14C16 10.5 10 2 10 2Z" opacity="0.9"/><ellipse cx="8.1" cy="9.6" rx="1.1" ry="1.8" transform="rotate(-20 8.1 9.6)"/>',
  class1:'<path d="M3 13a7 5 0 0 1 14 0v1H3z"/><rect x="2" y="13" width="16" height="2.2" rx="1"/><rect x="9" y="6" width="2" height="4" opacity="0.6"/>',
  skillT0:'<path d="M2 11c4-6 8-7.5 13-5.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="8.7" y="8" width="2.2" height="11" rx="1" transform="rotate(28 8.7 8)"/>',
  housing:'<path d="M10 2 2 8v10h16V8z"/><rect x="8" y="12" width="4" height="6" opacity="0.5"/>',
  academy:'<path d="M10 3 1 7l9 4 9-4z"/><path d="M5 9v4c0 1.5 2.5 3 5 3s5-1.5 5-3V9" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  // Типы зданий: силуэт похож на саму установку, не на добываемый ресурс.
  // Шахтный копёр — колесо-шкив наверху, А-образная рама, линия земли внизу.
  rigMiner:'<circle cx="10" cy="4.3" r="2.1" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="4.3" r="0.6"/><path d="M10 6.3 L5.5 18 M10 6.3 L14.5 18" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8.3 9.2 L11.7 9.2" stroke="currentColor" stroke-width="1" fill="none" opacity="0.45"/><path d="M7 12.3 L13 12.3" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.6"/><path d="M3 18h14" stroke="currentColor" stroke-width="1.5"/><path d="M2 18 Q10 15.6 18 18 Z" opacity="0.3"/>',
  // Буровая вышка — та же А-рама, но уже и без колеса, заканчивается каплей у земли.
  rigDrill:'<path d="M10 2 L6.3 15.5 M10 2 L13.7 15.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8.5 6 L11.5 6" stroke="currentColor" stroke-width="1" fill="none" opacity="0.45"/><path d="M7.6 9.6 L12.4 9.6" stroke="currentColor" stroke-width="1.1" fill="none" opacity="0.6"/><path d="M10 13c0 0 -2.3 2.9 -2.3 4.6a2.3 2.3 0 0 0 4.6 0c0-1.7-2.3-4.6-2.3-4.6z"/>',
  // Мелкие функциональные значки для действий на плитке установки (ремонт/снос) — без своего colorVar, красятся через CSS color кнопки.
  wrench:'<path d="M13.7 2.3a4.2 4.2 0 0 0-5.6 5l-6 6 2.6 2.6 6-6a4.2 4.2 0 0 0 5-5.6l-2.5 2.5-2-.4-.4-2z"/>',
  trash:'<path d="M4 6.2h12" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7.6 6.2V4.8a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v1.4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M5.4 6.2 6.1 16a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9l.7-9.8z"/><path d="M8.3 8.6v6M10 8.6v6M11.7 8.6v6" stroke="var(--card)" stroke-width="1" fill="none"/>',
};
function iconSvg(key,colorVar){
  const inner=ICONS[key] || '<circle cx="10" cy="10" r="7"/>';
  return '<svg viewBox="0 0 20 20" width="26" height="26" style="color:var(--'+colorVar+')" fill="currentColor">'+inner+'</svg>';
}
function miniIcon(key){
  return '<svg viewBox="0 0 20 20" fill="currentColor">'+(ICONS[key]||'')+'</svg>';
}


let activeTier=0;
let activeSection='hq';

const sectionsEl=document.getElementById('sections');
const tabsEl=document.getElementById('tabs');
const bgridEl=document.getElementById('bgrid');
const hqPanelEl=document.getElementById('hqPanel');
const buildingsPanelEl=document.getElementById('buildingsPanel');
const productionPanelEl=document.getElementById('productionPanel');
const warehousePanelEl=document.getElementById('warehousePanel');
const popPanelEl=document.getElementById('popPanel');
const skillsPanelEl=document.getElementById('skillsPanel');
const modalEl=document.getElementById('offlineModal');

function sectionInfo(id){
  const units=state.units.length;
  if(id==='hq') return {stat:'Обзор базы'};
  if(id==='buildings') return {stat:'Построено объектов: '+units, badge:units||null};
  if(id==='build') return {stat:'Площадь участка: '+usedArea()+' / '+BASE_AREA};
  if(id==='workers'){
    const assigned=Object.values(lastWorkforce).reduce((s,c)=>s+Math.floor(c.assigned),0);
    const cap=Object.values(lastWorkforce).reduce((s,c)=>s+Math.floor(c.cap),0);
    return {stat:'Персонал: '+assigned+' / '+cap+' чел.', badge:assigned||null};
  }
  if(id==='skills'){
    const sk=SKILLS.find(x=>x.id===state.training);
    return {stat:sk?('Изучается: '+sk.name+' · ур. '+skillLevelById(sk.id)):'Ничего не изучается'};
  }
  if(id==='production') return {stat:'Установок в цеху: '+units, badge:units||null};
  if(id==='warehouse'){
    const used=totalCargoWeight(), cap=warehouseCapacityKg();
    return {stat:Math.round(used).toLocaleString('ru-RU')+' / '+cap.toLocaleString('ru-RU')+' кг', fill:Math.min(100,used/cap*100)};
  }
  return {stat:''};
}
let lastSectionsKey='';
function renderSections(){
  const infos=SECTIONS.map(s=>sectionInfo(s.id));
  const prodActive=BUILDINGS.some(b=>util[b.id] && util[b.id].frac>0.001);
  const cur=SECTIONS.find(s=>s.id===activeSection);
  const curInfo=infos[SECTIONS.indexOf(cur)];
  // Хотбар вызывается каждый тик. Пересоздаём кнопки только при смене структуры
  // (активный раздел, счётчики, работа цеха) — иначе сбрасывалась бы анимация
  // шестерёнок и терялся клик между mousedown и mouseup. Остальное правим на месте.
  const key=activeSection+'|'+prodActive+'|'+infos.map(i=>i.badge==null?'':i.badge).join(',');
  if(key===lastSectionsKey){
    infos.forEach((info,i)=>{
      if(info.fill==null) return;
      const el=sectionsEl.querySelector('[data-section="'+SECTIONS[i].id+'"] .hb-fill i');
      if(el) el.style.width=info.fill.toFixed(1)+'%';
    });
    const statEl=sectionsEl.querySelector('.hb-stat');
    if(statEl && statEl.textContent!==curInfo.stat) statEl.textContent=curInfo.stat;
    return;
  }
  lastSectionsKey=key;
  let slots='';
  SECTIONS.forEach((s,i)=>{
    const info=infos[i];
    const spin = s.id==='production' && prodActive ? ' spinning' : '';
    slots+='<button type="button" class="hb-slot'+(s.id===activeSection?' active':'')+spin+'" style="--c:var(--'+s.color+')" data-section="'+s.id+'" title="'+s.label+' ('+(i+1)+')">'+
      '<span class="hb-key">'+(i+1)+'</span>'+
      '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">'+SECTION_ICONS[s.id]+'</svg>'+
      '<span class="hb-name">'+s.short+'</span>'+
      (info.badge!=null?'<span class="hb-dot">'+info.badge+'</span>':'')+
      (info.fill!=null?'<span class="hb-fill"><i style="width:'+info.fill.toFixed(1)+'%"></i></span>':'')+
    '</button>';
  });
  sectionsEl.innerHTML='<div class="hotbar">'+slots+'</div>'+
    '<div class="hb-caption" style="--c:var(--'+cur.color+')"><b>'+cur.label+'</b><span class="hb-stat">'+curInfo.stat+'</span>'+
    '<span class="hb-hint">клавиши <kbd>1</kbd>–<kbd>'+SECTIONS.length+'</kbd></span></div>';
}

const RES48={
  iron_ore:'<ellipse cx="24" cy="42.5" rx="17" ry="2.6" opacity=".22"/>'+
    '<polygon points="8,34 5,24 11,13 22,7 34,9 42,18 43,30 35,39 18,41" opacity=".92"/>'+
    '<polygon points="11,13 22,7 34,9 27,17 16,19" style="fill:var(--hi)" opacity=".28"/>'+
    '<polygon points="35,39 43,30 42,18 34,24 30,36" style="fill:var(--ink)" opacity=".28"/>'+
    '<polygon points="8,34 5,24 11,13 16,19 14,31" style="fill:var(--ink)" opacity=".14"/>'+
    '<g style="fill:var(--hi)" opacity=".85"><polygon points="18,24 22,21 25,25 21,28"/><polygon points="28,28 31,26 33,29 30,31"/><polygon points="24,33 26,32 27,34 25,35"/><circle cx="37" cy="15" r="1.3"/></g>'+
    '<path d="M11 13 22 7 34 9" style="stroke:var(--hi)" stroke-width="1.2" fill="none" opacity=".5"/>',
  copper_ore:'<ellipse cx="24" cy="42.5" rx="17" ry="2.6" opacity=".22"/>'+
    '<circle cx="24" cy="16" r="8.5" opacity=".78"/><circle cx="15" cy="28" r="10.5" opacity=".92"/><circle cx="32.5" cy="28.5" r="9.5"/>'+
    '<g style="fill:var(--hi)" opacity=".55"><ellipse cx="21" cy="12.5" rx="2.6" ry="1.5" transform="rotate(-30 21 12.5)"/><ellipse cx="11" cy="23.5" rx="3.2" ry="1.9" transform="rotate(-30 11 23.5)"/><ellipse cx="29" cy="24.5" rx="2.8" ry="1.7" transform="rotate(-30 29 24.5)"/></g>'+
    '<path d="M22 33c3 2.5 6 2.5 8 .5M20 20c2 1.5 4.5 1.5 6.5 0" style="stroke:var(--ink)" stroke-width="1.2" fill="none" opacity=".3"/>'+
    '<path d="M39 8.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" style="fill:var(--hi)" opacity=".85"/>',
  water:'<ellipse cx="24" cy="44" rx="12" ry="2.2" opacity=".22"/>'+
    '<path d="M24 3C24 3 9.5 19.5 9.5 29a14.5 14.5 0 0 0 29 0C38.5 19.5 24 3 24 3z" opacity=".9"/>'+
    '<path d="M10.8 32.5c4.2-2.6 8.8-2.6 13.2 0s9 2.6 13.2 0A14.5 14.5 0 0 1 10.8 32.5z" style="fill:var(--ink)" opacity=".18"/>'+
    '<path d="M11.5 29c4-2.4 8.4-2.4 12.5 0s8.5 2.4 12.5 0" style="stroke:var(--hi)" stroke-width="1.5" fill="none" opacity=".45"/>'+
    '<ellipse cx="17.5" cy="22" rx="2.3" ry="4.8" transform="rotate(-25 17.5 22)" style="fill:var(--hi)" opacity=".75"/><circle cx="16" cy="30" r="1.2" style="fill:var(--hi)" opacity=".6"/>',
};
// Крупные силуэты установок. Колесо/шкив (.rig-wheel) крутится, пока установка работает;
// руда в вагонетке и вода в баке красятся в цвет того, что сейчас добывается (--oc).
const TYPE48={
  miner:'<rect x="2" y="41" width="44" height="2.5" rx="1.25" opacity=".3"/>'+
    '<path d="M12 30 17 10M26 30 21 10" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
    '<path d="M14.2 22.5h9.6M15.8 16h6.4" stroke="currentColor" stroke-width="1.5" fill="none" opacity=".7"/>'+
    '<path d="M19 12.4V30" stroke="currentColor" stroke-width="1" opacity=".7"/>'+
    '<g class="rig-wheel"><circle cx="19" cy="8" r="4.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 3.6v8.8M14.6 8h8.8" stroke="currentColor" stroke-width="1" opacity=".65"/><circle cx="19" cy="8" r="1.3" style="fill:var(--hi)"/></g>'+
    '<rect x="4" y="30" width="30" height="11" rx="1.5" opacity=".62"/>'+
    '<g style="fill:var(--hi)" opacity=".7"><rect x="7" y="33" width="3.2" height="2.6" rx=".4"/><rect x="12" y="33" width="3.2" height="2.6" rx=".4"/><rect x="27" y="33" width="3.2" height="2.6" rx=".4"/></g>'+
    '<rect x="17.5" y="34" width="4" height="7" rx=".8" style="fill:var(--ink)" opacity=".5"/>'+
    '<path d="M34 41.8h12" stroke="currentColor" stroke-width="1" opacity=".5"/>'+
    '<g style="fill:var(--oc,var(--hi))"><circle cx="37.6" cy="32.4" r="1.7"/><circle cx="40.6" cy="31.6" r="1.9"/><circle cx="43.2" cy="32.6" r="1.5"/></g>'+
    '<path d="M35 33.2h10.4l-1.6 5.8h-7.2z"/>'+
    '<circle cx="37.8" cy="40.2" r="1.4" style="fill:var(--ink)"/><circle cx="42.6" cy="40.2" r="1.4" style="fill:var(--ink)"/>',
  drill:'<rect x="2" y="41" width="44" height="2.5" rx="1.25" opacity=".3"/>'+
    '<path d="M11 37 18 8M29 37 22 8" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
    '<path d="M13 30h14M15 22h10M17 14.5h6M13 30l12-8M27 30l-12-8M15 22l8-7.5M25 22l-8-7.5" stroke="currentColor" stroke-width="1.1" fill="none" opacity=".55"/>'+
    '<path d="M20 7.5V36" stroke="currentColor" stroke-width="1" opacity=".7"/>'+
    '<g class="rig-wheel"><circle cx="20" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M20 2v6M17 5h6" stroke="currentColor" stroke-width=".9" opacity=".65"/></g>'+
    '<rect x="6" y="36" width="28" height="5" rx="1" opacity=".65"/>'+
    '<path d="M34 38.5h3" stroke="currentColor" stroke-width="2"/>'+
    '<rect x="36.5" y="24" width="9.5" height="17" rx="2" opacity=".45"/>'+
    '<rect x="38" y="31" width="6.5" height="8.5" rx="1" style="fill:var(--oc,var(--hi))"/>'+
    '<path d="M38.8 27v10" style="stroke:var(--hi)" stroke-width=".9" opacity=".45"/>',
};
const UI20={
  worker:'<path d="M4.5 9a5.5 5.5 0 0 1 11 0z"/><rect x="3" y="8.3" width="14" height="2" rx="1"/><circle cx="10" cy="12" r="2.6" opacity=".85"/><path d="M4 19.5c0-3.6 2.6-5.3 6-5.3s6 1.7 6 5.3z" opacity=".7"/>',
  gem:'<path d="M5 3h10l3.5 5L10 18 1.5 8z" opacity=".9"/><path d="M1.5 8h17M7 3 5.8 8 10 18M13 3l1.2 5L10 18" style="stroke:var(--ink)" stroke-width=".9" fill="none" opacity=".4"/>',
};
function svg48(inner,colorVar,cls,extraStyle){ return '<svg class="'+(cls||'')+'" viewBox="0 0 48 48" fill="currentColor" style="color:var(--'+colorVar+')'+(extraStyle||'')+'" aria-hidden="true">'+inner+'</svg>'; }
function resIcon48(id){ const r=resById(id); return svg48(RES48[id]||'<circle cx="24" cy="24" r="16"/>',colorVarOf(r)); }
function ui20(k,colorVar){ return '<svg viewBox="0 0 20 20" fill="currentColor" style="color:var(--'+colorVar+')" aria-hidden="true">'+UI20[k]+'</svg>'; }
function renderStats(){
  document.getElementById('statTime').textContent=fmtElapsed(Date.now()-state.startTs);
  document.getElementById('statBuilt').textContent=Object.values(state.buildings).reduce((s,n)=>s+n,0);
  document.getElementById('statWorkers').textContent=Object.values(lastWorkforce).reduce((s,c)=>s+Math.floor(c.assigned),0);
  document.getElementById('statSaved').textContent=new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
}

function renderView(){
  hqPanelEl.hidden = activeSection!=='hq';
  buildingsPanelEl.hidden = activeSection!=='buildings';
  bgridEl.hidden = activeSection!=='build';
  tabsEl.style.display = (activeSection==='build' && TAB_LABELS.length>1) ? '' : 'none';
  productionPanelEl.hidden = activeSection!=='production';
  popPanelEl.hidden = activeSection!=='workers';
  skillsPanelEl.hidden = activeSection!=='skills';
  warehousePanelEl.hidden = activeSection!=='warehouse';
  if(activeSection==='hq') renderHQ();
  else if(activeSection==='buildings') renderBuildingsStatus();
  else if(activeSection==='build') renderBuildings();
  else if(activeSection==='production') renderProduction();
  else if(activeSection==='workers') renderPopulation();
  else if(activeSection==='skills') renderSkills();
  else if(activeSection==='warehouse'){ if(!warehouseDragging) renderWarehouse(); }
}

function renderAll(){
  renderSections();
  if(activeSection==='build') renderTabs();
  renderView();
  renderStats();
}

function openSection(id){
  activeSection=id;
  renderSections();
  if(activeSection==='production') renderTabs();
  renderView();
}
sectionsEl.addEventListener('click', e=>{
  const btn=e.target.closest('[data-section]');
  if(!btn) return;
  openSection(btn.dataset.section);
});
document.addEventListener('keydown', e=>{
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  const tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable) return;
  const n=parseInt(e.key,10);
  if(n>=1 && n<=SECTIONS.length) openSection(SECTIONS[n-1].id);
});
const lastCyclePhase={};
function tickCycleBars(){
  const now=Date.now()/1000;
  document.querySelectorAll('[data-cycle-unit]').forEach(el=>{
    const uid=Number(el.dataset.cycleUnit);
    const st=unitCycleState(uid,now);
    el.style.setProperty('--p', st.p.toFixed(4));
    if(!el.classList.contains('cv-row')) return;
    // Прошлая фаза хранится по номеру установки, а не на элементе — строка может
    // перерисоваться прямо в момент конца цикла, и «+N» тогда потерялся бы.
    const prev=lastCyclePhase[uid];
    lastCyclePhase[uid]=st.p;
    // Цикл замкнулся — партия руды ушла на склад: всплывает «+N», значок на выходе подпрыгивает.
    if(!st.idle && prev!=null && prev-st.p>0.5){
      const out=el.querySelector('[data-cycle-out]');
      const b=out && out.querySelector('b');
      if(b){
        const g=document.createElement('span'); g.className='cv-gain'; g.textContent=b.textContent; el.appendChild(g);
        setTimeout(()=>g.remove(),1000);
        out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop');
      }
    }
  });
  document.querySelectorAll('[data-cycle-time]').forEach(el=>{
    const st=unitCycleState(Number(el.dataset.cycleTime),now);
    const t=st.idle?'—:—':fmtMMSS(st.left);
    if(el.textContent!==t) el.textContent=t;
  });
}
