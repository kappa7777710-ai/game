// Вкладка 7 · «Склад» — голографическая сетка ресурсов с перетаскиванием.

function defaultWarehouseOrder(){
  const ids=[];
  [0,1,2,3,4].forEach(t=>{ RESOURCES.filter(r=>r.tier===t).forEach(r=>ids.push(r.id)); });
  POP_GOODS.forEach(r=>ids.push(r.id));
  return ids;
}
function warehouseOrder(){
  const all=defaultWarehouseOrder();
  if(!state.warehouseOrder) state.warehouseOrder=all.slice();
  const known=new Set(all);
  let order=state.warehouseOrder.filter(id=>known.has(id));
  all.forEach(id=>{ if(!order.includes(id)) order.push(id); });
  state.warehouseOrder=order;
  return order;
}
// Склад — голографическая сетка: прозрачные ячейки с уголками, строками развёртки и
// светящимся значком. Число и полоса веса правятся на месте, DOM пересоздаётся только при
// смене набора/порядка ресурсов — иначе развёртка и мерцание сбрасывались бы каждый тик.
const WH_MIN_CELLS=12;
function whFillKey(){ return warehouseOrder().filter(id=>{ const r=resById(id); return r && (POP_GOODS.some(p=>p.id===id) || resourceVisible(r)); }); }
function whTip(r){
  const amt=state.resources[r.id]||0;
  const rate=netRate(r.id)*3600;
  return r.name+' · '+Math.round(amt*(r.weight||0)).toLocaleString('ru-RU')+' кг'+(Math.abs(rate)>0.05?' · '+(rate>0?'+':'−')+fmtRate(Math.abs(rate))+'/ч':'');
}
function whTile(r,i){
  const amt=state.resources[r.id]||0;
  const tip=whTip(r);
  return '<div class="wh-tile'+(amt<0.05?' empty':'')+'" draggable="true" data-res="'+r.id+'" style="--rc:var(--'+colorVarOf(r)+');--dl:'+(i*1.7%5).toFixed(1)+'s" title="'+tip+'">'+
    resIcon48(r.id)+'<span class="wh-amt">'+Math.floor(amt)+'</span><span class="wh-name">'+resName(r.id)+'</span></div>';
}
let lastWhKey='';
function renderWarehouse(){
  const used=totalCargoWeight(), cap=warehouseCapacityKg();
  const pct=Math.max(0,Math.min(100,(used/cap)*100));
  const ids=whFillKey();
  const valStr=Math.round(used).toLocaleString('ru-RU')+' / '+cap.toLocaleString('ru-RU')+' кг';
  if(ids.join(',')===lastWhKey && warehousePanelEl.querySelector('.wh-grid')){
    ids.forEach(id=>{
      const el=warehousePanelEl.querySelector('.wh-tile[data-res="'+id+'"]');
      if(!el) return;
      const r=resById(id), amt=state.resources[id]||0;
      const n=el.querySelector('.wh-amt'), t=String(Math.floor(amt));
      if(n.textContent!==t) n.textContent=t;
      el.classList.toggle('empty',amt<0.05);
      el.title=whTip(r);
    });
    const fill=warehousePanelEl.querySelector('.wh-cap-fill'); if(fill) fill.style.width=pct.toFixed(1)+'%';
    const bar=warehousePanelEl.querySelector('.wh-cap-bar'); if(bar) bar.classList.toggle('full',pct>=99.5);
    const val=warehousePanelEl.querySelector('.wh-cap-val'); if(val && val.textContent!==valStr) val.textContent=valStr;
    return;
  }
  lastWhKey=ids.join(',');
  const tiles=ids.map((id,i)=>whTile(resById(id),i)).join('');
  const empties='<div class="wh-empty"></div>'.repeat(Math.max(0,WH_MIN_CELLS-ids.length));
  warehousePanelEl.innerHTML=
    '<div class="wh-cap bevel-frame"><svg class="wh-cap-icon" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">'+SECTION_ICONS.warehouse+'</svg>'+
      '<div class="wh-cap-bar sunk'+(pct>=99.5?' full':'')+'"><i class="wh-cap-fill" style="width:'+pct.toFixed(1)+'%"></i></div>'+
      '<span class="wh-cap-val">'+valStr+'</span></div>'+
    '<div class="wh-grid" id="whGrid">'+tiles+empties+'</div>';
}
let dragSrcId=null;
let warehouseDragging=false;
warehousePanelEl.addEventListener('dragstart', e=>{
  const tile=e.target.closest('.wh-tile');
  if(!tile) return;
  dragSrcId=tile.dataset.res;
  warehouseDragging=true;
  tile.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  try{ e.dataTransfer.setData('text/plain', dragSrcId); }catch(err){}
});
warehousePanelEl.addEventListener('dragover', e=>{
  const tile=e.target.closest('.wh-tile');
  if(!tile) return;
  e.preventDefault();
  document.querySelectorAll('.wh-tile.drag-over').forEach(t=>{ if(t!==tile) t.classList.remove('drag-over'); });
  if(tile.dataset.res!==dragSrcId) tile.classList.add('drag-over');
});
warehousePanelEl.addEventListener('drop', e=>{
  const tile=e.target.closest('.wh-tile');
  warehouseDragging=false;
  if(!tile || !dragSrcId){ return; }
  e.preventDefault();
  const targetId=tile.dataset.res;
  tile.classList.remove('drag-over');
  if(targetId!==dragSrcId){
    const order=warehouseOrder().slice();
    const from=order.indexOf(dragSrcId);
    const to=order.indexOf(targetId);
    if(from>=0 && to>=0){
      order.splice(from,1);
      order.splice(to,0,dragSrcId);
      state.warehouseOrder=order;
      saveState();
    }
  }
  dragSrcId=null;
  renderWarehouse();
});
warehousePanelEl.addEventListener('dragend', e=>{
  warehouseDragging=false;
  dragSrcId=null;
  document.querySelectorAll('.wh-tile.dragging,.wh-tile.drag-over').forEach(t=>t.classList.remove('dragging','drag-over'));
});
