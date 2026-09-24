function isValidTarget(card,id,side){
  const st=G.fields[id];if(!card||!GameCore.canEnterTerritory(st))return false;
  const enemy=enemyOf(side),own=st.units[side].length,opp=st.units[enemy].length;
  if(card.type==='unit')return GameCore.canNormalDeploy(G.deployedFields[side],id);
  if(card.name==='北线突击')return id==='beixianwei'&&own>0;
  if(card.name==='城墙加固')return own>0;
  if(card.name==='强行登陆')return id==='anping'&&own>0;
  if(card.name==='炮火轰城')return id==='zeelandia'&&opp>0;
  if(card.name==='北线阻击')return id==='beixianwei'&&opp>0;
  if(card.name==='调虎离山')return opp>0;
  if(card.name==='海上封锁')return id==='luermen'&&opp>0;
  if(card.name==='反击')return own>0&&opp>0;
  return true;
}
function invalidReason(card,id,side){
  if(G.fields[id].resolved)return'这个战场已经结算并永久封锁。';
  if(card.type==='unit'&&!GameCore.canNormalDeploy(G.deployedFields[side],id))return'同一战场每回合最多正常部署1支部队。';
  return'这张牌目前不能用在这个战场。';
}

function checkFieldTrigger(id,triggerSide){
  const kind=GameCore.triggerKind(G.fields[id]);
  if(kind==='unopposed'){const st=G.fields[id],winner=st.units.zheng.length?'zheng':'dutch';settleTerritory(id,winner,'无抵抗占领');return true}
  if(kind==='battle'){beginFormalBattle(id,triggerSide);return true}
  return false;
}

function reactionEligible(side,id,hand){
  if(G.fields[id].units[side].length===0)return[];
  return hand.map((c,i)=>({c,i})).filter(x=>x.c.type==='tactic'&&isValidTarget(x.c,id,side)&&!['调虎离山','增援','增援守军'].includes(x.c.name));
}
function beginFormalBattle(id,triggerSide,{final=false}={}){
  if(G.gameOver||G.fields[id].resolved)return;
  G.battle={fieldId:id,triggerSide,final,playerChoice:null,aiChoice:null,usePlayerArsenal:false,useAIArsenal:false};
  const responder=enemyOf(triggerSide);
  if(responder===G.playerSide){
    const opts=reactionEligible(G.playerSide,id,G.playerHand);
    if(opts.length){
      G.pendingReaction={id};
      document.getElementById('reactionText').textContent=`${sideName(triggerSide)}触发了 ${fieldById(id).name} 决战。你可以免费应战1次。`;
      document.getElementById('reactionList').innerHTML=opts.map(o=>`<button class="reactionCard" onclick="useReaction(${o.i})">【${o.c.name}】 ${o.c.text}</button>`).join('');
      document.getElementById('reactionModal').classList.add('show');
      return;
    }
  }else{
    const opts=reactionEligible(G.aiSide,id,G.aiHand);
    if(opts.length){
      opts.sort((a,b)=>{
        const rank={'反击':6,'城墙加固':5,'北线阻击':5,'海上封锁':5,'炮火轰城':5,'北线突击':4,'强行登陆':4};
        return (rank[b.c.name]||0)-(rank[a.c.name]||0)
      });
      const pick=opts[0],card=G.aiHand.splice(pick.i,1)[0];
      applyCard(card,id,G.aiSide,{reaction:true});addLog(`【AI应战】免费使用【${card.name}】。`);
    }
  }
  openTacticChoice();
}
function useReaction(index){
  if(!G.pendingReaction||!G.battle)return;
  const id=G.pendingReaction.id,card=G.playerHand[index];
  if(!card||!reactionEligible(G.playerSide,id,G.playerHand).some(x=>x.i===index))return;
  G.playerHand.splice(index,1);applyCard(card,id,G.playerSide,{reaction:true});addLog(`【你的应战】免费使用【${card.name}】。`);
  G.pendingReaction=null;document.getElementById('reactionModal').classList.remove('show');openTacticChoice();
}
function skipReaction(){if(!G.pendingReaction)return;G.pendingReaction=null;document.getElementById('reactionModal').classList.remove('show');openTacticChoice()}
function openTacticChoice(){
  if(!G.battle)return;
  const id=G.battle.fieldId,pb=battleBase(id,G.playerSide),ab=battleBase(id,G.aiSide);
  const delta=ab.total-pb.total;
  G.battle.aiChoice=GameCore.weightedChoice(GameCore.aiTacticWeights(G.aiSide,id,delta));
  G.battle.useAIArsenal=G.rewards.arsenalToken[G.aiSide]>0&&ab.total<=pb.total+2;
  document.getElementById('battleTitle').textContent=`${fieldById(id).name}｜选择决战战法`;
  document.getElementById('battleChoose').style.display='block';document.getElementById('battleResult').style.display='none';
  const hasArsenal=G.rewards.arsenalToken[G.playerSide]>0;
  document.getElementById('arsenalBox').style.display=hasArsenal?'flex':'none';
  document.getElementById('arsenalCheck').checked=false;
  document.getElementById('battleModal').classList.add('show');
}
function revealAmbushes(id){
  const st=G.fields[id];['zheng','dutch'].forEach(side=>{
    const c=st.ambush[side];if(c){st.ambush[side]=null;st.units[side].push(c);addLog(`【伏兵揭晓】${sideName(side)}翻开【${c.name}】。`)}
  });
}
function chooseBattleTactic(choice){
  if(!G.battle)return;
  G.battle.playerChoice=choice;
  G.battle.usePlayerArsenal=document.getElementById('arsenalCheck').checked&&G.rewards.arsenalToken[G.playerSide]>0;
  resolveFormalBattle();
}
