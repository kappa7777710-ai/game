// Вкладка 3 · «Стройка» — карточки строительства по уровням (тирам).

function renderTabs(){
  let html='';
  TAB_LABELS.forEach((label,t)=>{
    const cls='t'+t;
    const count=BUILDINGS.filter(b=>b.tier===t).reduce((s,b)=>s+(state.buildings[b.id]||0),0);
    const badge='T'+t+' · '+count;
    html+='<button class="tab-btn '+cls+' '+(t===activeTier?'active':'')+'" data-tier="'+t+'">'+label+
      '<span class="tab-badge">'+badge+'</span></button>';
  });
  tabsEl.innerHTML=html;
}

function buildingCardBody(b,tierOk,type,count){
  const cls=CLASS_OF_TIER[b.tier];
  const className=CLASSES.find(c=>c.id===cls).name;
  const cost=scaledCost(type,count);
  const skOk=recipeUnlocked(b);
  const afford=Object.entries(cost).every(([rid,q])=>(state.resources[rid]||0)>=q);
  const areaOk=(type.area||0)<=freeArea();
  const outRes=resById(outId(b));
  const richBadge = b.tier===0 ? '<div class="bcard-richness">Богатство месторождения: '+Math.round(richOf(b)*100)+'%</div>' : '';
  const wCut=workforceCutForRecipe(b);
  const effWorkers=Math.max(1,Math.round(b.workers*(1-wCut)));
  const staffBadge = '<div class="bcard-staff">Персонал: '+effWorkers+' × '+className+(wCut>0?' (база '+b.workers+')':'')+' · Площадь: '+(type.area||0)+'</div>';
  const sMult=speedMultForRecipe(b);
  const speedBadge = sMult>1 ? '<div class="bcard-staff">Скорость с учётом навыка: ×'+sMult.toFixed(2)+'</div>' : '';
  const lockNote = skOk ? '' : '<div class="bcard-lock">Нужен навык «'+skillName(recipeSkillId(b))+'» ур. '+(b.unlock||0)+'</div>';
  const areaNote = (skOk && !areaOk) ? '<div class="bcard-lock">Не хватает площади участка ('+(type.area||0)+' нужно, '+freeArea()+' свободно)</div>' : '';
  const costStr=Object.entries(cost).map(([rid,q])=>{
    const ok=(state.resources[rid]||0)>=q;
    return '<span class="'+(ok?'ok':'bad')+'">'+q+' '+resTag(rid)+'</span>';
  }).join('');
  return {
    outRes, richBadge, staffBadge, speedBadge, lockNote, areaNote, costStr, count,
    disabled: !tierOk||!skOk||!afford||!areaOk,
  };
}
function renderSingleRecipeCard(b,tierOk){
  const type=typeOf(b);
  const count=state.buildings[b.id]||0;
  const bb=buildingCardBody(b,tierOk,type,count);
  const inputsStr='Месторождение';
  const cv=colorVarOf(bb.outRes);
  return '<div class="bcard" style="--tier-color:var(--'+cv+')'+(bb.disabled&&tierOk?';opacity:.6':'')+'">'+
    '<div class="bcard-head">'+iconSvg(type.icon||bb.outRes.id,cv)+
      '<div><h3>'+type.name+'</h3><div class="bcard-recipe">'+inputsStr+' → '+b.out[bb.outRes.id]+' '+resTag(bb.outRes.id)+'</div>'+bb.richBadge+bb.staffBadge+bb.speedBadge+'</div>'+
    '</div>'+
    '<div class="bcard-stats"><span>Уже построено: <strong>'+bb.count+'</strong></span><span>Цикл: '+fmtDuration(b.cycle)+' · '+fmtDurationWords(b.cycle)+'</span></div>'+
    bb.lockNote+bb.areaNote+
    '<div class="bcard-cost">'+bb.costStr+'</div>'+
    '<button class="build-btn" data-build="'+b.id+'" '+(bb.disabled?'disabled':'')+'>Построить (+1)</button>'+
  '</div>';
}
function renderTypeBuildCard(type,recipes,tierOk){
  const count=typeCount({type:type.id});
  const cost=scaledCost(type,count);
  const afford=Object.entries(cost).every(([rid,q])=>(state.resources[rid]||0)>=q);
  const areaOk=(type.area||0)<=freeArea();
  const disabled=!tierOk||!afford||!areaOk;
  const areaNote=(!areaOk)?'<div class="bcard-lock">Не хватает площади участка ('+(type.area||0)+' нужно, '+freeArea()+' свободно)</div>':'';
  const costStr=Object.entries(cost).map(([rid,q])=>{
    const ok=(state.resources[rid]||0)>=q;
    return '<span class="'+(ok?'ok':'bad')+'">'+q+' '+resTag(rid)+'</span>';
  }).join('');
  const recipeNames=recipes.map(r=>recipeLabel(r)).join(' / ');
  const buildId=recipes[0].id; // строится "вслепую" — конкретная руда выбирается позже, во вкладке «Производство»
  const repIcon=iconSvg(type.icon,type.neutralColor||'tier0');
  return '<div class="bcard" style="--tier-color:var(--'+(type.neutralColor||'tier0')+')'+(disabled&&tierOk?';opacity:.6':'')+'">'+
    '<div class="bcard-head">'+repIcon+
      '<div><h3>'+type.name+'</h3><div class="bcard-recipe">Может добывать: '+recipeNames+'</div>'+
      '<div class="bcard-staff">Рецепт выбирается после постройки, во вкладке «Производство» · Площадь: '+(type.area||0)+'</div></div>'+
    '</div>'+
    '<div class="bcard-stats"><span>Уже построено: <strong>'+count+'</strong></span></div>'+
    areaNote+
    '<div class="bcard-cost">'+costStr+'</div>'+
    '<button class="build-btn" data-build="'+buildId+'" '+(disabled?'disabled':'')+'>Построить (+1)</button>'+
  '</div>';
}
function renderBuildings(){
  const tierOk=tierUnlocked(activeTier);
  let html='';
  if(!tierOk){
    html+='<div class="locked-banner">Постройте хотя бы один объект уровня T'+(activeTier-1)+', чтобы открыть этот раздел цепочки.</div>';
  }
  const areaPct=Math.min(100,Math.round((usedArea()/BASE_AREA)*100));
  html+='<div class="area-summary"><span>Площадь участка</span>'+
    '<div class="warehouse-bar'+(areaPct>=99.5?' full':'')+'" style="flex:1"><div class="warehouse-bar-fill" style="width:'+areaPct+'%"></div></div>'+
    '<span class="warehouse-value">'+usedArea()+' / '+BASE_AREA+'</span></div>';
  const groups={};
  BUILDINGS.filter(b=>b.tier===activeTier && recipeVisible(b)).forEach(b=>{
    const k=typeKey(b);
    (groups[k]=groups[k]||[]).push(b);
  });
  Object.keys(groups).forEach(k=>{
    const recipes=groups[k];
    if(recipes.length>1 && recipes[0].type){
      html+=renderTypeBuildCard(typeOf(recipes[0]),recipes,tierOk);
    }else{
      recipes.forEach(b=>{ html+=renderSingleRecipeCard(b,tierOk); });
    }
  });
  bgridEl.innerHTML=html;
}

tabsEl.addEventListener('click', e=>{
  const btn=e.target.closest('[data-tier]');
  if(!btn) return;
  activeTier=parseInt(btn.dataset.tier,10);
  renderTabs();
  renderView();
});
bgridEl.addEventListener('click', e=>{
  const btn=e.target.closest('[data-build]');
  if(!btn) return;
  tryBuild(btn.dataset.build);
});
