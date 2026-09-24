function finishRound(){
  if(G.gameOver)return;
  if(G.round>=GameCore.MAX_ROUNDS){startFinalSettlement();return}
  if(G.currentEvent)addLog(`【${G.currentEvent.name}】效果结束。`);
  G.currentEvent=null;G.round++;startPlayerTurn(false);
}
function startFinalSettlement(){
  addLog('第10回合结束：进入最终结算。');
  G.finalQueue=FIELDS.filter(f=>!G.fields[f.id].resolved&&totalUnits(f.id)>0).map(f=>f.id);
  processFinalQueue();
}
function processFinalQueue(){
  if(G.gameOver)return;
  while(G.finalQueue&&G.finalQueue.length){
    const id=G.finalQueue.shift(),st=G.fields[id];if(st.resolved)continue;
    const z=st.units.zheng.length,d=st.units.dutch.length;
    if(z>0&&d===0){settleTerritory(id,'zheng','最终无抵抗结算',{final:true});continue}
    if(d>0&&z===0){settleTerritory(id,'dutch','最终无抵抗结算',{final:true});continue}
    if(z>0&&d>0){beginFormalBattle(id,G.playerSide,{final:true});return}
  }
  if(G.gameOver)return;
  const z=wins('zheng'),d=wins('dutch');
  let winner;
  if(z!==d)winner=z>d?'zheng':'dutch';
  else{
    const zp=reservePower('zheng'),dp=reservePower('dutch');
    const first=FIELDS.map(f=>G.fields[f.id].firstEntrant).find(Boolean)||'zheng';
    winner=GameCore.finalFallbackWinner({zhengWins:z,dutchWins:d,zhengReservePower:zp,dutchReservePower:dp,firstEntrant:first});
    addLog(`残局平手：比较剩余手牌部队战力，郑军 ${zp} vs 荷军 ${dp}。`);
  }
  finishGame(winner,'第10回合最终结算');
}
function reservePower(side){const hand=side===G.playerSide?G.playerHand:G.aiHand;return hand.filter(c=>c.type==='unit').reduce((s,c)=>s+c.power,0)}

function finishGame(winner,reason){
  if(G.gameOver)return;G.gameOver=true;
  const p=wins(G.playerSide),a=wins(G.aiSide);
  document.getElementById('resultTitle').textContent=winner===G.playerSide?'你获胜':'AI 获胜';
  document.getElementById('resultScore').textContent=`${p} ： ${a}`;
  document.getElementById('resultText').textContent=`你攻下 ${p} 个战场，AI 攻下 ${a} 个战场。${reason}。`;
  document.getElementById('resultModal').classList.add('show');render();
}

function statusText(id){
  const st=G.fields[id],state=GameCore.territoryState(st),z=st.units.zheng.length,d=st.units.dutch.length,total=z+d;
  if(state==='resolved')return`${sideName(st.winner)}已攻下｜+1已入袋｜永久封锁`;
  if(state==='unresolved')return'尚未驻军｜0分';
  if(state==='garrison'){
    const side=z?'郑军':'荷军',n=z||d;
    return`${side}驻军 ${n}/3｜${3-n>0?'再来 '+(3-n)+' 支无抵抗占领':'触发占领'}`;
  }
  return`争夺中 ${total}/5｜${5-total>0?'再进入 '+(5-total)+' 支正式决战':'触发决战'}`;
}
function targetHint(c){if(c.type==='unit'){if(c.kind==='舰队')return'舰队：鹿耳门较强';if(c.kind==='火炮'&&G.playerSide==='zheng')return'火炮：攻热兰遮城';if(c.kind==='步兵')return'步兵：台南城较强';return'部队牌'}if(c.name==='北线突击'||c.name==='北线阻击')return'只用北线尾';if(c.name==='强行登陆')return'只用安平';if(c.name==='炮火轰城')return'只打热兰遮城';if(c.name==='海上封锁')return'只打鹿耳门';return'战术牌'}
function getStep(){if(G.turn!=='player')return 0;if(G.actionsLeft===0)return 4;if(G.specialMode)return 2;if(G.selectedCard===null)return 1;if(!G.selectedField)return 2;return 3}
function renderGuide(){const s=getStep(),steps=[['1','选行动'],['2','选战场'],['3','执行'],['4','结束回合']];document.getElementById('guide').innerHTML=steps.map((x,i)=>`<div class="guideStep ${s===i+1?'active':s>i+1?'done':''}"><b>第${x[0]}步</b>${x[1]}</div>`).join('')}
