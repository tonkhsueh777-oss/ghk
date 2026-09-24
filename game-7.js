function render(){
  if(!G.playerSide)return;
  const p=wins(G.playerSide),a=wins(G.aiSide);
  document.getElementById('roundBadge').textContent=`第 ${G.round} / ${GameCore.MAX_ROUNDS} 回合 · ${GameCore.roundPhase(G.round)}`;
  document.getElementById('youName').textContent=sideName(G.playerSide);document.getElementById('aiName').textContent=sideName(G.aiSide);
  document.getElementById('youScore').textContent=`${p} / 3`;document.getElementById('aiScore').textContent=`${a} / 3`;
  document.getElementById('youDeck').textContent=`牌库 ${G.playerDeck.length}｜弃牌 ${G.playerDiscard.length}`;document.getElementById('aiHand').textContent=`手牌 ${G.aiHand.length}｜弃牌 ${G.aiDiscard.length}`;
  document.getElementById('handCount').textContent=`${G.playerHand.length} / 6`;
  document.getElementById('turnText').textContent=G.turn==='player'?`你的回合｜行动点 ${G.actionsLeft}/${G.maxActions}`:'AI 回合';
  document.getElementById('phaseText').textContent=G.specialMode==='move'?'普通调动模式':G.specialMode==='freeMove'?'奖励：免费调动':G.specialMode==='trump'?'王牌目标选择':'部署 / 战术 / 伏兵 / 调动';
  document.getElementById('apValue').textContent=`${G.turn==='player'?G.actionsLeft:0} / ${G.turn==='player'?G.maxActions:2}`;
  document.getElementById('playerTrumpName').textContent=`${TRUMPS[G.playerSide].name}：${TRUMPS[G.playerSide].text}`;document.getElementById('playerTrumpState').textContent=G.trumpUsed[G.playerSide]?'已使用':'尚未使用';
  document.getElementById('aiTrumpState').textContent=`${TRUMPS[G.aiSide].name}｜${G.trumpUsed[G.aiSide]?'已使用':'尚未使用'}`;
  const pa=ambushLocation(G.playerSide),aa=ambushLocation(G.aiSide);document.getElementById('playerAmbushState').textContent=pa?`活动伏兵：${pa.name}`:'活动伏兵：无';document.getElementById('aiAmbushState').textContent=aa?`已在 ${aa.name} 布置1张（内容未知）`:'尚未布置';
  const r=G.rewards;document.getElementById('rewardState').innerHTML=`安平行动奖励：${r.nextTurnExtraAP[G.playerSide]?'待使用':'无'}<br>免费调动：${r.freeMove[G.playerSide]} 次<br>军械 +2：${r.arsenalToken[G.playerSide]} 枚`;
  document.getElementById('freeMoveBtn').style.display=r.freeMove[G.playerSide]>0?'inline-block':'none';

  const eb=document.getElementById('eventBar');
  if(G.currentEvent){eb.className='eventBar';eb.innerHTML=`<div><b>本回合事件｜${G.currentEvent.name}</b><div class="eventText">${G.currentEvent.text}</div></div><div class="small">本回合有效</div>`}
  else{const next=[3,6,9].find(x=>x>G.round);eb.className='eventBar quiet';eb.innerHTML=`<div><b>公共事件</b><div class="eventText">${next?'第 '+next+' 回合揭晓下一张':'本局事件已全部出现'}</div></div><div class="small">3 / 6 / 9</div>`}

  const selected=G.selectedCard!==null?G.playerHand[G.selectedCard]:null;
  document.getElementById('endBtn').disabled=G.turn!=='player'||G.actionsLeft===G.maxActions||G.gameOver||!!G.battle;
  document.getElementById('playBtn').disabled=G.turn!=='player'||G.actionsLeft<=0||G.specialMode||!selected||!G.selectedField||G.gameOver;
  document.getElementById('discardBtn').disabled=G.turn!=='player'||G.actionsLeft<=0||G.specialMode||!selected||G.gameOver;
  document.getElementById('moveBtn').disabled=G.turn!=='player'||G.actionsLeft<=0||G.specialMode==='trump'||G.specialMode==='freeMove'||G.gameOver;
  document.getElementById('moveBtn').textContent=G.specialMode==='move'?'取消调动':'调动部队';
  document.getElementById('trumpBtn').disabled=G.turn!=='player'||G.trumpUsed[G.playerSide]||G.gameOver;
  document.getElementById('trumpBtn').textContent=G.specialMode==='trump'?'取消王牌选择':G.trumpUsed[G.playerSide]?'王牌已使用':'发动王牌';
  document.getElementById('ambushBtn').disabled=!(G.turn==='player'&&G.actionsLeft>0&&!G.specialMode&&selected&&selected.type==='unit'&&G.selectedField&&!G.fields[G.selectedField].resolved&&G.fields[G.selectedField].units[G.playerSide].length>0&&!hasActiveAmbush(G.playerSide));
  document.getElementById('selectedHint').textContent=G.specialMode==='move'||G.specialMode==='freeMove'?(G.moveSelection?'已选部队，请点相邻战场':'请点自己的部队'):G.specialMode==='trump'?'请选择争夺中的战场':selected?`已选：${selected.name}｜${targetHint(selected)}`:`还剩 ${G.actionsLeft} 行动点`;
  renderGuide();

  document.getElementById('battlefields').innerHTML=FIELDS.map(f=>{
    const st=G.fields[f.id],state=GameCore.territoryState(st),z=battleBase(f.id,'zheng').total,d=battleBase(f.id,'dutch').total,total=totalUnits(f.id);
    let valid=!st.resolved;
    if(G.specialMode==='trump')valid=validTrumpField(f.id,G.playerSide);
    else if(['move','freeMove'].includes(G.specialMode)&&G.moveSelection)valid=!st.resolved&&GameCore.isAdjacentField(G.moveSelection.from,f.id);
    else if(selected)valid=isValidTarget(selected,f.id,G.playerSide);
    if(st.resolved)return`<div class="field resolved"><div class="point">战役点 1</div><h4>${f.name}</h4><div class="effect">${f.effect}</div><div class="reward">胜利奖励：${f.reward}</div><div class="state resolved">${statusText(f.id)}</div><div class="winner">${sideName(st.winner)}</div><div class="lock">🔒</div></div>`;
    const target=state==='contested'?GameCore.CONTESTED_TRIGGER:GameCore.UNOPPOSED_TRIGGER;
    const progress=state==='contested'?total:(st.units.zheng.length||st.units.dutch.length);
    const zPips=st.units.zheng.map((c,i)=>`<span class="pip zheng ${['move','freeMove'].includes(G.specialMode)&&G.playerSide==='zheng'?'moveable':''}" onclick="event.stopPropagation();selectMoveUnit('${f.id}',${i},'zheng')">${c.name.slice(0,2)} ${c.power}</span>`).join('');
    const dPips=st.units.dutch.map((c,i)=>`<span class="pip dutch ${['move','freeMove'].includes(G.specialMode)&&G.playerSide==='dutch'?'moveable':''}" onclick="event.stopPropagation();selectMoveUnit('${f.id}',${i},'dutch')">${c.name.slice(0,2)} ${c.power}</span>`).join('');
    const tags=ensureTemp(f.id).labels.map(x=>`<span class="tag">${x.label}</span>`).join('');
    const amb=[st.ambush.zheng?`<span class="tag ambushTag">郑军伏兵：${G.playerSide==='zheng'?st.ambush.zheng.name:'未知'}</span>`:'',st.ambush.dutch?`<span class="tag ambushTag">荷军伏兵：${G.playerSide==='dutch'?st.ambush.dutch.name:'未知'}</span>`:''].join('');
    const warn=state==='contested'&&total===4?'⚠ 再进入1支立即正式决战':state==='garrison'&&progress===2?'⚠ 再部署1支且无人应战，就无抵抗占领':'';
    return`<div class="field ${G.selectedField===f.id?'selected':''} ${valid?'':'invalid'}" onclick="selectField('${f.id}')"><div class="point">战役点 1</div><h4>${f.name}</h4><div class="effect">${f.effect}</div><div class="reward">胜利奖励：${f.reward}</div><div class="meterTop"><span>${state==='contested'?'争夺进度':'驻军进度'} ${progress}/${target}</span><span>${state==='contested'?'5支决战':'3支占领'}</span></div><div class="meter"><span style="width:${Math.min(100,progress/target*100)}%"></span></div><div class="state ${state}">${statusText(f.id)}</div><div class="tags">${amb}${tags}</div><div class="army"><div class="armyline"><span>郑军战力</span><b>${z}</b></div><div class="pips">${zPips}</div><div class="armyline"><span>荷军战力</span><b>${d}</b></div><div class="pips">${dPips}</div></div>${warn?`<div class="warn">${warn}</div>`:''}</div>`;
  }).join('');

  document.getElementById('hand').innerHTML=G.playerHand.map((c,i)=>`<div class="card ${G.selectedCard===i?'selected':''}" onclick="selectCard(${i})"><div class="type">${c.type==='unit'?'部队牌 · '+c.kind:'战术牌'}</div><h5>${c.name}</h5><p>${c.text}</p><div class="hint">${targetHint(c)}</div>${c.type==='unit'?`<div class="power">战力 <b>${c.power}</b></div>`:''}</div>`).join('');
}
function showRules(){document.getElementById('rulesModal').classList.add('show')}
function hideRules(){document.getElementById('rulesModal').classList.remove('show')}
function showDecks(){document.getElementById('deckModal').classList.add('show')}
function hideDecks(){document.getElementById('deckModal').classList.remove('show')}
function resetGame(){
  ['rulesModal','deckModal','reactionModal','battleModal','resultModal'].forEach(id=>document.getElementById(id).classList.remove('show'));
  document.getElementById('gameScreen').classList.remove('active');document.getElementById('selectScreen').classList.add('active');G={};
}
