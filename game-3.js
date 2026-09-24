function resolveFormalBattle(){
  const b=G.battle,id=b.fieldId,st=G.fields[id];
  const zChoice=G.playerSide==='zheng'?b.playerChoice:b.aiChoice;
  const dChoice=G.playerSide==='dutch'?b.playerChoice:b.aiChoice;
  const tactic=GameCore.battleTacticResult(zChoice,dChoice);
  revealAmbushes(id);
  const z=battleBase(id,'zheng'),d=battleBase(id,'dutch');
  let zArsenal=0,dArsenal=0;
  if(b.usePlayerArsenal){const side=G.playerSide,val=GameCore.consumeArsenal(G.rewards,side);if(side==='zheng')zArsenal=val;else dArsenal=val}
  if(b.useAIArsenal){const side=G.aiSide,val=GameCore.consumeArsenal(G.rewards,side);if(side==='zheng')zArsenal=val;else dArsenal=val}
  const zFinal=GameCore.clampBattleTotal(z.total+tactic.zhengBonus+zArsenal);
  const dFinal=GameCore.clampBattleTotal(d.total+tactic.dutchBonus+dArsenal);
  const winner=GameCore.resolveBattleWinner({zhengPower:zFinal,dutchPower:dFinal,zhengUnits:st.units.zheng.length,dutchUnits:st.units.dutch.length,firstEntrant:st.firstEntrant});
  const rewardText=settleTerritory(id,winner,'正式决战',{silentModal:true});
  const myChoice=GameCore.tacticName(b.playerChoice),aiChoice=GameCore.tacticName(b.aiChoice);
  const relation=tactic.text;
  const myFinal=G.playerSide==='zheng'?zFinal:dFinal,aiFinal=G.aiSide==='zheng'?zFinal:dFinal;
  document.getElementById('battleChoose').style.display='none';
  document.getElementById('battleResult').style.display='block';
  document.getElementById('battleResult').innerHTML=`<h2>决战结果</h2><div class="battleResult">
    你：<b>${myChoice}</b><br>AI：<b>${aiChoice}</b><br>
    <b>${relation}</b>${tactic.zhengBonus||tactic.dutchBonus?'｜克制方 +2':''}<br><br>
    最终战力：你 <b>${myFinal}</b> ： AI <b>${aiFinal}</b><br>
    <div class="bigResult">${sideName(winner)}攻下 ${fieldById(id).name}</div>
    战役点 +1｜${rewardText}<br>战场永久封锁 🔒
  </div><button class="btn primary" style="margin-top:12px" onclick="closeBattleResult()">继续</button>`;
  render();
}
function closeBattleResult(){
  document.getElementById('battleModal').classList.remove('show');
  const wasFinal=G.battle&&G.battle.final;G.battle=null;
  render();
  if(G.gameOver)return;
  if(wasFinal&&G.finalQueue){processFinalQueue();return}
  if(G.turn==='ai')setTimeout(aiStep,250);
}

function discardField(id){
  const st=G.fields[id];
  [...st.units.zheng,...st.units.dutch].forEach(discardCard);
  (ensureTemp(id).cards||[]).forEach(discardCard);
  ['zheng','dutch'].forEach(s=>{if(st.ambush[s])discardCard(st.ambush[s])});
  st.units.zheng=[];st.units.dutch=[];st.ambush.zheng=null;st.ambush.dutch=null;
  G.temp[id]={zheng:0,dutch:0,minus_zheng:0,minus_dutch:0,labels:[],cards:[]};
}
function settleTerritory(id,winner,reason,{silentModal=false,final=false}={}){
  const st=G.fields[id];if(st.resolved)return'';
  st.resolved=true;st.winner=winner;
  discardField(id);
  const rewardText=applyFieldReward(id,winner,final);
  addLog(`【${reason}】${sideName(winner)}攻下 ${fieldById(id).name}，战役点 +1；${rewardText}；战场封锁。`);
  render();
  if(GameCore.hasWonByTerritories(wins(winner)))finishGame(winner,'先攻下3个战场');
  return rewardText;
}
function applyFieldReward(id,side,final=false){
  const who=whoForSide(side),r=GameCore.rewardForField(id);
  if(id==='luermen'){const n=draw(who,2);return`【${r.name}】抽 ${n} 张牌`}
  if(id==='anping'){GameCore.grantReward(G.rewards,id,side);return`【${r.name}】下个自己的回合 +1 行动点`}
  if(id==='beixianwei'){
    GameCore.grantReward(G.rewards,id,side);
    if(side===G.aiSide)setTimeout(useAIFreeMoveIfAny,80);
    return`【${r.name}】获得1次免费调动`
  }
  if(id==='tainan'){const ok=drawUnitCard(who);return`【${r.name}】${ok?'获得1张部队牌':'手牌已满或没有可用部队牌'}`}
  if(id==='zeelandia'){GameCore.grantReward(G.rewards,id,side);return`【${r.name}】获得1枚以后决战可用的 +2 标记`}
  return'';
}
function drawUnitCard(who){
  const p=getPiles(who);if(p.hand.length>=GameCore.HAND_LIMIT)return false;
  let idx=p.deck.findIndex(c=>c.type==='unit');
  if(idx>=0){p.hand.push(p.deck.splice(idx,1)[0]);return true}
  idx=p.discard.findIndex(c=>c.type==='unit');
  if(idx>=0){p.hand.push(p.discard.splice(idx,1)[0]);return true}
  return false;
}
