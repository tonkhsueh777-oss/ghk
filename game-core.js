(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.GameCore=factory();
})(typeof self!=='undefined'?self:this,function(){
  const FIELD_ORDER=['luermen','anping','beixianwei','tainan','zeelandia'];
  const MAX_ROUNDS=10;
  const TERRITORIES_TO_WIN=3;
  const UNOPPOSED_TRIGGER=3;
  const CONTESTED_TRIGGER=5;
  const ACTIONS_PER_TURN=2;
  const HAND_LIMIT=6;

  const REWARDS={
    luermen:{type:'draw_two',name:'海路先机',text:'立即抽2张牌'},
    anping:{type:'extra_ap',name:'登陆优势',text:'下个自己的回合多1个行动点'},
    beixianwei:{type:'free_move',name:'切断补给',text:'立即获得1次免费调动'},
    tainan:{type:'draw_unit',name:'民军响应',text:'从牌库/弃牌堆获得1张部队牌'},
    zeelandia:{type:'arsenal',name:'军械战利品',text:'获得1枚“军械+2”标记'}
  };

  function counts(st){
    return {
      zheng:st.units.zheng.length,
      dutch:st.units.dutch.length,
      total:st.units.zheng.length+st.units.dutch.length
    };
  }
  function territoryState(st){
    if(st.resolved) return 'resolved';
    const c=counts(st);
    if(c.zheng>0&&c.dutch>0) return 'contested';
    if(c.total>0) return 'garrison';
    return 'unresolved';
  }
  function shouldResolveUnopposed(st){
    if(st.resolved) return false;
    const c=counts(st);
    return (c.zheng>=UNOPPOSED_TRIGGER&&c.dutch===0)||(c.dutch>=UNOPPOSED_TRIGGER&&c.zheng===0);
  }
  function shouldStartBattle(st){
    if(st.resolved) return false;
    const c=counts(st);
    return c.zheng>0&&c.dutch>0&&c.total>=CONTESTED_TRIGGER;
  }
  function canEnterTerritory(st){ return !st.resolved; }
  function hasWonByTerritories(n){ return n>=TERRITORIES_TO_WIN; }

  const BEATS={assault:'defend',defend:'raid',raid:'assault'};
  const NAMES={assault:'强攻',defend:'固守',raid:'奇袭'};
  function tacticName(id){ return NAMES[id]||id; }
  function tacticBonus(mine,theirs){ return BEATS[mine]===theirs?2:0; }

  function resolveBattleWinner(s){
    if(s.zhengPower>s.dutchPower) return 'zheng';
    if(s.dutchPower>s.zhengPower) return 'dutch';
    if(s.zhengUnits>s.dutchUnits) return 'zheng';
    if(s.dutchUnits>s.zhengUnits) return 'dutch';
    return s.firstEntrant||'zheng';
  }

  function rewardForField(id){ return REWARDS[id]; }
  function createRewardState(){
    return {
      nextTurnExtraAP:{zheng:0,dutch:0},
      freeMove:{zheng:0,dutch:0},
      arsenalToken:{zheng:0,dutch:0}
    };
  }
  function grantReward(state,fieldId,side){
    const r=REWARDS[fieldId];
    if(!r) return;
    if(r.type==='extra_ap') state.nextTurnExtraAP[side]+=1;
    if(r.type==='free_move') state.freeMove[side]+=1;
    if(r.type==='arsenal') state.arsenalToken[side]+=1;
  }
  function actionsForTurn(state,side){
    const bonus=state.nextTurnExtraAP[side]>0?1:0;
    if(bonus) state.nextTurnExtraAP[side]-=1;
    return ACTIONS_PER_TURN+bonus;
  }
  function consumeArsenal(state,side){
    if(state.arsenalToken[side]<=0) return 0;
    state.arsenalToken[side]-=1;
    return 2;
  }

  function canNormalDeploy(deployedFields,fieldId){ return !deployedFields.includes(fieldId); }
  function isAdjacentField(a,b){
    const ia=FIELD_ORDER.indexOf(a),ib=FIELD_ORDER.indexOf(b);
    return ia>=0&&ib>=0&&Math.abs(ia-ib)===1;
  }
  function drawCountWithLimit(handSize,requested){
    return Math.max(0,Math.min(requested,HAND_LIMIT-handSize));
  }
  function clampBattleTotal(v){ return Math.max(0,v); }

  function isEventRound(round){ return round===3||round===6||round===9; }
  function roundPhase(round){ if(round<=3)return'部署期'; if(round<=6)return'争夺期'; return'决战期'; }

  function eventUnitModifier(eventId,fieldId,card){
    if(eventId==='spring_tide'&&fieldId==='luermen'&&card.kind==='舰队') return 2;
    if(eventId==='heavy_rain'&&card.kind==='火炮') return -1;
    return 0;
  }
  function fortressBonus(eventId,fieldId,side){
    if(fieldId==='zeelandia'&&side==='dutch'&&eventId!=='wall_damage') return 2;
    return 0;
  }

  function aiTacticWeights(side,fieldId,powerDelta){
    const w={assault:1,defend:1,raid:1};
    if(side==='zheng'&&['luermen','anping'].includes(fieldId)) w.assault+=2;
    if(side==='zheng'&&fieldId==='zeelandia') w.raid+=1;
    if(side==='dutch'&&fieldId==='zeelandia') w.defend+=3;
    if(side==='dutch'&&fieldId==='tainan') w.defend+=1;
    if(side==='dutch'&&fieldId==='anping') w.raid+=1;
    if(powerDelta<=-3) w.raid+=2;
    if(powerDelta>=3) w.defend+=2;
    return w;
  }
  function weightedChoice(weights,rng=Math.random){
    const entries=Object.entries(weights);
    const total=entries.reduce((s,[,v])=>s+Math.max(0,v),0);
    if(total<=0) return entries[0][0];
    let x=rng()*total;
    for(const [k,v] of entries){
      x-=Math.max(0,v);
      if(x<=0) return k;
    }
    return entries[entries.length-1][0];
  }

  function triggerKind(st){
    if(shouldResolveUnopposed(st)) return 'unopposed';
    if(shouldStartBattle(st)) return 'battle';
    return null;
  }

  function battleTacticResult(zhengChoice,dutchChoice){
    const zb=tacticBonus(zhengChoice,dutchChoice);
    const db=tacticBonus(dutchChoice,zhengChoice);
    let text='双方战法相同';
    if(zb>db) text=`${tacticName(zhengChoice)}克${tacticName(dutchChoice)}`;
    else if(db>zb) text=`${tacticName(dutchChoice)}克${tacticName(zhengChoice)}`;
    return {zhengBonus:zb,dutchBonus:db,text};
  }

  function finalFallbackWinner(state){
    if(state.zhengWins>state.dutchWins) return 'zheng';
    if(state.dutchWins>state.zhengWins) return 'dutch';
    if(state.zhengReservePower>state.dutchReservePower) return 'zheng';
    if(state.dutchReservePower>state.zhengReservePower) return 'dutch';
    return state.firstEntrant||'zheng';
  }

  function hasActiveAmbush(fields,side){
    return Object.values(fields).some(st=>st.ambush&&st.ambush[side]);
  }

  return {
    FIELD_ORDER,MAX_ROUNDS,TERRITORIES_TO_WIN,UNOPPOSED_TRIGGER,CONTESTED_TRIGGER,
    ACTIONS_PER_TURN,HAND_LIMIT,REWARDS,
    counts,territoryState,shouldResolveUnopposed,shouldStartBattle,canEnterTerritory,
    hasWonByTerritories,tacticName,tacticBonus,resolveBattleWinner,rewardForField,
    createRewardState,grantReward,actionsForTurn,consumeArsenal,canNormalDeploy,
    isAdjacentField,drawCountWithLimit,clampBattleTotal,isEventRound,roundPhase,
    eventUnitModifier,fortressBonus,aiTacticWeights,weightedChoice,triggerKind,battleTacticResult,finalFallbackWinner,hasActiveAmbush
  };
});
