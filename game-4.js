function useAIFreeMoveIfAny(){
  if(G.rewards.freeMove[G.aiSide]<=0||G.gameOver)return false;
  const moves=[];
  FIELDS.forEach(from=>{
    const st=G.fields[from.id];if(st.resolved)return;
    st.units[G.aiSide].forEach((c,idx)=>FIELDS.forEach(to=>{
      if(!G.fields[to.id].resolved&&GameCore.isAdjacentField(from.id,to.id))moves.push({from:from.id,to:to.id,idx,score:G.fields[to.id].units[G.playerSide].length*2+Math.random()})
    }))
  });
  G.rewards.freeMove[G.aiSide]--;
  if(!moves.length){addLog('AI 的【切断补给】没有可调动的部队，奖励结束。');return false}
  moves.sort((a,b)=>b.score-a.score);const m=moves[0],arr=G.fields[m.from].units[G.aiSide],card=arr[m.idx];arr.splice(m.idx,1);addUnit(m.to,G.aiSide,card);
  addLog(`AI 使用免费调动：把【${card.name}】调到 ${fieldById(m.to).name}。`);
  checkFieldTrigger(m.to,G.aiSide);render();return true;
}
function activateFreeMove(){
  if(G.rewards.freeMove[G.playerSide]<=0||G.gameOver)return;
  const legal=FIELDS.some(from=>!G.fields[from.id].resolved&&G.fields[from.id].units[G.playerSide].some(()=>FIELDS.some(to=>!G.fields[to.id].resolved&&GameCore.isAdjacentField(from.id,to.id))));
  if(!legal){G.rewards.freeMove[G.playerSide]--;setMessage('【切断补给】目前没有合法调动路线，这次免费调动结束。');render();return}
  G.specialMode=G.specialMode==='freeMove'?null:'freeMove';G.moveSelection=null;G.selectedCard=null;G.selectedField=null;
  setMessage(G.specialMode==='freeMove'?'免费调动：先点击自己的1支正面部队，再点击相邻未封锁战场。':'已取消免费调动。');render();
}

function placePlayerAmbush(){
  if(G.turn!=='player'||G.actionsLeft<=0||G.selectedCard===null||!G.selectedField||G.specialMode)return;
  const card=G.playerHand[G.selectedCard],id=G.selectedField,st=G.fields[id];
  if(card.type!=='unit'){setMessage('只有部队牌能设伏兵。');return}
  if(st.resolved||!st.units[G.playerSide].length||hasActiveAmbush(G.playerSide)){setMessage('伏兵必须放在已有己方部队的未结算战场，而且每方只能有1张活动伏兵。');return}
  G.playerHand.splice(G.selectedCard,1);st.ambush[G.playerSide]=card;spendAP();G.selectedCard=null;G.selectedField=null;
  addLog(`你在 ${fieldById(id).name} 设置了伏兵。`);setMessage(`伏兵已设置。还剩 ${G.actionsLeft} 行动点。`);render();
}

function activateMoveMode(){
  if(G.turn!=='player'||G.actionsLeft<=0||G.gameOver)return;
  G.specialMode=G.specialMode==='move'?null:'move';G.moveSelection=null;G.selectedCard=null;G.selectedField=null;
  setMessage(G.specialMode==='move'?'调动：先点己方部队，再点相邻未封锁战场。':'已取消调动。');render();
}
function selectMoveUnit(fieldId,index,side){
  if(G.turn!=='player'||!['move','freeMove'].includes(G.specialMode)||side!==G.playerSide)return;
  if(G.fields[fieldId].resolved)return;
  const card=G.fields[fieldId].units[side][index];if(!card)return;
  G.moveSelection={from:fieldId,index};setMessage(`已选择【${card.name}】，现在点相邻战场。`);render();
}
function executeMove(toId){
  const m=G.moveSelection;if(!m)return;
  if(G.fields[toId].resolved||!GameCore.isAdjacentField(m.from,toId)){setMessage('只能移动到相邻且未封锁的战场。');return}
  const arr=G.fields[m.from].units[G.playerSide],card=arr[m.index];if(!card)return;
  arr.splice(m.index,1);addUnit(toId,G.playerSide,card);
  if(G.specialMode==='freeMove')G.rewards.freeMove[G.playerSide]--;
  else spendAP();
  const free=G.specialMode==='freeMove';G.specialMode=null;G.moveSelection=null;
  addLog(`${free?'免费调动':'调动'}：【${card.name}】进入 ${fieldById(toId).name}。`);
  checkFieldTrigger(toId,G.playerSide);render();
}

function activateTrumpMode(){
  if(G.turn!=='player'||G.trumpUsed[G.playerSide]||G.gameOver)return;
  G.specialMode=G.specialMode==='trump'?null:'trump';G.selectedCard=null;G.selectedField=null;G.moveSelection=null;
  setMessage(G.specialMode==='trump'?`请选择一个“争夺中”的战场发动【${TRUMPS[G.playerSide].name}】。`:'已取消王牌。');render();
}
function validTrumpField(id,side){const st=G.fields[id];return !st.resolved&&!G.trumpUsed[side]&&GameCore.territoryState(st)==='contested'&&st.units[side].length>0}
function useTrump(side,id){
  if(!validTrumpField(id,side))return false;
  const t=ensureTemp(id);G.trumpUsed[side]=true;
  if(side==='zheng'){t.zheng+=3;t.labels.push({side,label:'国姓爷亲征 +3'})}
  else{t.dutch+=3;t.minus_dutch=0;t.labels=t.labels.filter(x=>!x.label.includes('荷兰守军受'));t.labels.push({side,label:'总督死守 +3'})}
  addLog(`【王牌】${sideName(side)}发动【${TRUMPS[side].name}】。`);
  checkFieldTrigger(id,side);render();return true;
}
function maybeAITrump(){
  if(G.trumpUsed[G.aiSide])return false;
  const opts=FIELDS.filter(f=>validTrumpField(f.id,G.aiSide)).sort((a,b)=>totalUnits(b.id)-totalUnits(a.id));
  if(opts.length&&(totalUnits(opts[0].id)>=4||G.round>=8))return useTrump(G.aiSide,opts[0].id);
  return false;
}
