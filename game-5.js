function selectCard(i){
  if(G.turn!=='player'||G.actionsLeft<=0||G.specialMode||G.gameOver)return;
  G.selectedCard=i;G.selectedField=null;setMessage(`已选【${G.playerHand[i].name}】。请选择未封锁战场。`);render();
}
function selectField(id){
  if(G.turn!=='player'||G.gameOver)return;
  if(G.specialMode==='trump'){if(validTrumpField(id,G.playerSide)){G.specialMode=null;useTrump(G.playerSide,id)}else setMessage('王牌只能用于“争夺中”的战场。');return}
  if(['move','freeMove'].includes(G.specialMode)){if(!G.moveSelection){setMessage('请先点自己的一支部队。');return}executeMove(id);return}
  if(G.actionsLeft<=0){setMessage('行动点已用完。');return}
  if(G.selectedCard===null){setMessage('请先选一张手牌。');return}
  const c=G.playerHand[G.selectedCard];if(!isValidTarget(c,id,G.playerSide)){setMessage(invalidReason(c,id,G.playerSide));return}
  G.selectedField=id;setMessage(`已选 ${fieldById(id).name}，点击“打出这张牌”。`);render();
}
function playSelected(){
  if(G.turn!=='player'||G.actionsLeft<=0||G.selectedCard===null||!G.selectedField||G.specialMode||G.gameOver)return;
  const c=G.playerHand[G.selectedCard],id=G.selectedField;
  if(!isValidTarget(c,id,G.playerSide)){setMessage(invalidReason(c,id,G.playerSide));return}
  G.playerHand.splice(G.selectedCard,1);if(c.type==='unit')G.deployedFields[G.playerSide].push(id);
  applyCard(c,id,G.playerSide);spendAP();addLog(`你在 ${fieldById(id).name} 使用【${c.name}】。`);
  G.selectedCard=null;G.selectedField=null;
  const triggered=checkFieldTrigger(id,G.playerSide);
  if(!triggered)setMessage(`行动完成。${statusText(id)}｜还剩 ${G.actionsLeft} 行动点。`);
  render();
}
function discardSelected(){
  if(G.turn!=='player'||G.actionsLeft<=0||G.selectedCard===null||G.specialMode||G.gameOver)return;
  const c=G.playerHand.splice(G.selectedCard,1)[0];discardCard(c);const n=draw('player',1);spendAP();G.selectedCard=null;G.selectedField=null;
  addLog(`你弃掉【${c.name}】，补 ${n} 张。`);setMessage(`换牌完成，还剩 ${G.actionsLeft} 行动点。`);render();
}
function endPlayerTurn(){
  if(G.turn!=='player'||G.gameOver||G.battle||G.pendingReaction)return;
  if(G.actionsLeft===G.maxActions){setMessage('至少行动1次再结束回合。');return}
  G.turn='ai';G.specialMode=null;render();setMessage('AI 正在行动……');setTimeout(beginAITurn,250);
}

function maybeAIAmbush(){
  if(G.actionsLeft<=0||hasActiveAmbush(G.aiSide)||G.round<3)return false;
  const units=G.aiHand.map((c,i)=>({c,i})).filter(x=>x.c.type==='unit');
  const fields=FIELDS.filter(f=>!G.fields[f.id].resolved&&G.fields[f.id].units[G.aiSide].length>0&&totalUnits(f.id)<GameCore.CONTESTED_TRIGGER);
  if(!units.length||!fields.length||Math.random()>.30)return false;
  fields.sort((a,b)=>G.fields[b.id].units[G.playerSide].length-G.fields[a.id].units[G.playerSide].length);
  const pick=units.sort((a,b)=>b.c.power-a.c.power)[0],f=fields[0];G.aiHand.splice(pick.i,1);G.fields[f.id].ambush[G.aiSide]=pick.c;spendAP();
  addLog(`AI 在 ${f.name} 布置1张伏兵。`);return true;
}
function buildAIOptions(){
  const opts=[];
  G.aiHand.forEach((c,ci)=>FIELDS.forEach(f=>{
    if(!isValidTarget(c,f.id,G.aiSide))return;
    const st=G.fields[f.id],state=GameCore.territoryState(st),enemyCount=st.units[G.playerSide].length,ownCount=st.units[G.aiSide].length;
    let score=1+Math.random();
    if(c.type==='unit'){
      score+=c.power+unitBonus(c,f,G.aiSide);
      if(enemyCount===2&&ownCount===0)score+=5;
      if(ownCount===2&&enemyCount===0)score+=4;
      if(state==='contested')score+=2;
      if(totalUnits(f.id)===4)score+=3;
    }else{
      score+=enemyCount*.7+(state==='contested'?1.5:0);
    }
    if(f.id==='zeelandia')score+=.4;
    opts.push({type:'card',ci,id:f.id,score});
  }));
  FIELDS.forEach(from=>{
    if(G.fields[from.id].resolved)return;
    G.fields[from.id].units[G.aiSide].forEach((c,idx)=>FIELDS.forEach(to=>{
      if(G.fields[to.id].resolved||!GameCore.isAdjacentField(from.id,to.id))return;
      let score=.2+G.fields[to.id].units[G.playerSide].length*.8+(GameCore.territoryState(G.fields[to.id])==='contested'?1:0)+Math.random()*.3;
      if(score>1.2)opts.push({type:'move',from:from.id,to:to.id,idx,score});
    }))
  });
  return opts;
}
function performAIOption(o){
  if(o.type==='move'){
    const arr=G.fields[o.from].units[G.aiSide],c=arr[o.idx];if(!c)return false;arr.splice(o.idx,1);addUnit(o.to,G.aiSide,c);spendAP();addLog(`AI 调动【${c.name}】到 ${fieldById(o.to).name}。`);checkFieldTrigger(o.to,G.aiSide);return true
  }
  const c=G.aiHand.splice(o.ci,1)[0];if(!c)return false;if(c.type==='unit')G.deployedFields[G.aiSide].push(o.id);
  applyCard(c,o.id,G.aiSide);spendAP();addLog(`AI 在 ${fieldById(o.id).name} 使用【${c.name}】。`);checkFieldTrigger(o.id,G.aiSide);return true;
}
function aiStep(){
  if(G.gameOver||G.pendingReaction||G.battle)return;
  if(G.actionsLeft<=0){render();setTimeout(finishRound,260);return}
  if(maybeAIAmbush()){render();setTimeout(aiStep,230);return}
  const opts=buildAIOptions();if(!opts.length){const c=G.aiHand.shift();if(c){discardCard(c);draw('ai',1);spendAP();addLog(`AI 弃掉【${c.name}】并换牌。`)}else G.actionsLeft=0;render();setTimeout(aiStep,220);return}
  opts.sort((a,b)=>b.score-a.score);performAIOption(opts[0]);render();
  if(!G.pendingReaction&&!G.battle)setTimeout(aiStep,240);
}
