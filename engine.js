(function(root,factory){
  const out=factory();
  if(typeof module==='object'&&module.exports) module.exports=out;
  else { root.GameEngine=out.GameEngine; root.GameCore=out.Core; root.GameData=out.Data; }
})(typeof self!=='undefined'?self:this,function(){
  const Core={
    MAX_ROUNDS:10,TERRITORIES_TO_WIN:3,UNOPPOSED_TRIGGER:3,CONTESTED_TRIGGER:5,ACTIONS_PER_TURN:2,HAND_LIMIT:6,
    tacticName(id){return ({assault:'强攻',defend:'固守',raid:'奇袭'})[id]||id},
    tacticBonus(a,b){return ({assault:'defend',defend:'raid',raid:'assault'})[a]===b?2:0},
    territoryState(st){if(st.resolved)return'resolved';const z=st.units.zheng.length,d=st.units.dutch.length;if(z&&d)return'contested';if(z+d)return'garrison';return'unresolved'},
    eventRound(r){return r===3||r===6||r===9},
    roundPhase(r){return r<=3?'部署期':r<=6?'争夺期':'决战期'},
    battleWinner({zPower,dPower,zUnits,dUnits,firstEntrant}){if(zPower!==dPower)return zPower>dPower?'zheng':'dutch';if(zUnits!==dUnits)return zUnits>dUnits?'zheng':'dutch';return firstEntrant||'zheng'}
  };

  const FIELDS=[
    {id:'luermen',name:'鹿耳门',effect:'海战：舰队 +1',reward:'海路先机｜立即抽2张',img:'assets/battlefields/luermen.webp'},
    {id:'anping',name:'安平',effect:'登陆：郑军部队 +1',reward:'登陆优势｜下回合 +1行动点',img:'assets/battlefields/anping.webp'},
    {id:'beixianwei',name:'北线尾',effect:'北线要冲：精锐步兵 / 火枪队 +1',reward:'切断补给｜免费调动1次',img:'assets/battlefields/beixianwei.webp'},
    {id:'tainan',name:'台南城',effect:'陆战：步兵 +1',reward:'民军响应｜获得1张部队牌',img:'assets/battlefields/tainan.webp'},
    {id:'zeelandia',name:'热兰遮城',effect:'荷军城防 +2；郑军火炮 +1',reward:'军械战利品｜以后一次决战 +2',img:'assets/battlefields/zeelandia.webp'}
  ];
  const EVENTS=[
    {id:'spring_tide',name:'大潮来袭',text:'本回合鹿耳门所有舰队额外 +2。'},
    {id:'heavy_rain',name:'暴雨压炮',text:'本回合所有火炮 -1。'},
    {id:'wall_damage',name:'城墙受损',text:'本回合热兰遮城的荷军 +2 城防失效。'},
    {id:'reinforcements',name:'援军抵达',text:'当前攻下战场较少的一方额外抽2张；平手则双方各抽1张。'}
  ];
  const TRUMPS={
    zheng:{name:'国姓爷亲征',text:'整局一次：争夺中的战场郑军 +3。'},
    dutch:{name:'总督死守',text:'整局一次：争夺中的战场荷军 +3，并清除荷军受到的战术压制。'}
  };
  const DECKS={
    zheng:[
      ['义勇军','unit',1,'步兵','台南城 +1'],['义勇军','unit',1,'步兵','台南城 +1'],['义勇军','unit',1,'步兵','台南城 +1'],['义勇军','unit',1,'步兵','台南城 +1'],
      ['精锐步兵','unit',2,'步兵','北线尾 +1'],['精锐步兵','unit',2,'步兵','北线尾 +1'],['精锐步兵','unit',2,'步兵','北线尾 +1'],
      ['水师舰队','unit',3,'舰队','鹿耳门 +1'],['水师舰队','unit',3,'舰队','鹿耳门 +1'],['水师舰队','unit',3,'舰队','鹿耳门 +1'],
      ['火炮营','unit',3,'火炮','热兰遮城 +1'],['火炮营','unit',3,'火炮','热兰遮城 +1'],
      ['北线突击','tactic',0,'战术','北线尾己方有部队：+2'],['强行登陆','tactic',0,'战术','安平己方有部队：+2'],['炮火轰城','tactic',0,'战术','热兰遮城：荷军 -2'],['调虎离山','tactic',0,'战术','移除敌方最弱1支部队'],['增援','tactic',0,'战术','本战场临时 +1战力']
    ],
    dutch:[
      ['守备步兵','unit',2,'步兵','台南城 +1'],['守备步兵','unit',2,'步兵','台南城 +1'],['守备步兵','unit',2,'步兵','台南城 +1'],['守备步兵','unit',2,'步兵','台南城 +1'],
      ['火枪队','unit',2,'火枪','北线尾 +1'],['火枪队','unit',2,'火枪','北线尾 +1'],['火枪队','unit',2,'火枪','北线尾 +1'],
      ['荷兰舰队','unit',3,'舰队','鹿耳门 +1'],['荷兰舰队','unit',3,'舰队','鹿耳门 +1'],['荷兰舰队','unit',3,'舰队','鹿耳门 +1'],
      ['城防炮台','unit',3,'火炮','热兰遮城守备'],['城防炮台','unit',3,'火炮','热兰遮城守备'],
      ['城墙加固','tactic',0,'战术','己方有部队：+2'],['北线阻击','tactic',0,'战术','北线尾敌军 -2'],['海上封锁','tactic',0,'战术','鹿耳门敌军 -2'],['反击','tactic',0,'战术','争夺中己方 +3'],['增援守军','tactic',0,'战术','本战场临时 +1战力']
    ]
  };
  const REWARDS={luermen:'draw2',anping:'extraAP',beixianwei:'freeMove',tainan:'drawUnit',zeelandia:'arsenal'};
  const Data={FIELDS,EVENTS,TRUMPS,DECKS,REWARDS};

  class GameEngine{
    constructor(playerSide='zheng',rng=Math.random){
      this.rng=rng;this.playerSide=playerSide;this.aiSide=playerSide==='zheng'?'dutch':'zheng';
      const fields={};FIELDS.forEach(f=>fields[f.id]={units:{zheng:[],dutch:[]},ambush:{zheng:null,dutch:null},resolved:false,winner:null,firstEntrant:null,temp:{zheng:0,dutch:0,minus_zheng:0,minus_dutch:0,labels:[],cards:[]}});
      this.state={round:1,turn:'player',actionsLeft:2,maxActions:2,fields,fieldOrder:this.shuffle(FIELDS.map(x=>x.id)),
        playerDeck:this.makeDeck(playerSide),aiDeck:this.makeDeck(this.aiSide),playerDiscard:[],aiDiscard:[],playerHand:[],aiHand:[],
        rewards:{nextTurnExtraAP:{zheng:0,dutch:0},freeMove:{zheng:0,dutch:0},arsenalToken:{zheng:0,dutch:0}},
        trumpUsed:{zheng:false,dutch:false},deployedFields:{zheng:[],dutch:[]},eventDeck:this.shuffle(EVENTS.map(x=>({...x}))),currentEvent:null,gameOver:false,winner:null};
      this.draw('player',4);this.draw('ai',4);this.startTurn('player',true);
    }
    shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
    makeDeck(side){return this.shuffle(DECKS[side].map((x,i)=>({name:x[0],type:x[1],power:x[2],kind:x[3],text:x[4],owner:side,id:side+'-'+i+'-'+Math.floor(this.rng()*1e9)})))}
    sideName(s){return s==='zheng'?'郑成功军':'荷兰守军'}
    opponent(s){return s==='zheng'?'dutch':'zheng'}
    field(id){return FIELDS.find(f=>f.id===id)}
    isAdjacent(a,b){const ia=this.state.fieldOrder.indexOf(a),ib=this.state.fieldOrder.indexOf(b);return ia>=0&&ib>=0&&Math.abs(ia-ib)===1}
    wins(side){return Object.values(this.state.fields).filter(st=>st.resolved&&st.winner===side).length}
    checkWinner(){if(this.wins('zheng')>=3)return'zheng';if(this.wins('dutch')>=3)return'dutch';return null}
    piles(who){return who==='player'?{deck:this.state.playerDeck,hand:this.state.playerHand,discard:this.state.playerDiscard}:{deck:this.state.aiDeck,hand:this.state.aiHand,discard:this.state.aiDiscard}}
    recycle(who){const p=this.piles(who);if(!p.deck.length&&p.discard.length)p.deck.push(...this.shuffle(p.discard.splice(0)))}
    draw(who,n=1){const p=this.piles(who);let got=0;for(let i=0;i<n&&p.hand.length<Core.HAND_LIMIT;i++){this.recycle(who);if(!p.deck.length)break;p.hand.push(p.deck.pop());got++}return got}
    discard(card){if(!card||!card.owner)return;const who=card.owner===this.playerSide?'player':'ai';this.piles(who).discard.push(card)}
    consumeTurnAP(side){const bonus=this.state.rewards.nextTurnExtraAP[side]>0?1:0;if(bonus)this.state.rewards.nextTurnExtraAP[side]--;return 2+bonus}
    consumeArsenal(side){if(this.state.rewards.arsenalToken[side]<=0)return 0;this.state.rewards.arsenalToken[side]--;return 2}
    grantReward(fieldId,side){const t=REWARDS[fieldId];if(t==='extraAP')this.state.rewards.nextTurnExtraAP[side]++;else if(t==='freeMove')this.state.rewards.freeMove[side]++;else if(t==='arsenal')this.state.rewards.arsenalToken[side]++}
    startTurn(who,first=false){const side=who==='player'?this.playerSide:this.aiSide;this.state.turn=who;this.state.maxActions=this.consumeTurnAP(side);this.state.actionsLeft=this.state.maxActions;this.state.deployedFields[side]=[];if(!first)this.draw(who,2);else this.draw(who,2);if(who==='player')this.applyRoundEvent();return this.state.actionsLeft}
    applyRoundEvent(){this.state.currentEvent=null;if(!Core.eventRound(this.state.round))return null;const ev=this.state.eventDeck.shift()||null;this.state.currentEvent=ev;if(ev&&ev.id==='reinforcements'){const p=this.wins(this.playerSide),a=this.wins(this.aiSide);if(p<a)this.draw('player',2);else if(a<p)this.draw('ai',2);else{this.draw('player',1);this.draw('ai',1)}}return ev}
    triggerKind(id){const st=this.state.fields[id];if(st.resolved)return null;const z=st.units.zheng.length,d=st.units.dutch.length;if((z>=3&&!d)||(d>=3&&!z))return'unopposed';if(z&&d&&z+d>=5)return'battle';return null}
    addUnit(id,side,card){const st=this.state.fields[id];if(!st.firstEntrant&&!st.units.zheng.length&&!st.units.dutch.length)st.firstEntrant=side;st.units[side].push(card)}
    unitBonus(card,id,side){let b=0;if(id==='luermen'&&card.kind==='舰队')b++;if(id==='anping'&&side==='zheng')b++;if(id==='beixianwei'&&((side==='zheng'&&card.name==='精锐步兵')||(side==='dutch'&&card.name==='火枪队')))b++;if(id==='tainan'&&card.kind==='步兵')b++;if(id==='zeelandia'&&side==='zheng'&&card.kind==='火炮')b++;return b}
    eventUnitBonus(card,id){const ev=this.state.currentEvent;if(!ev)return 0;if(ev.id==='spring_tide'&&id==='luermen'&&card.kind==='舰队')return 2;if(ev.id==='heavy_rain'&&card.kind==='火炮')return-1;return 0}
    battleBase(id,side){const st=this.state.fields[id],t=st.temp;let n=0;for(const c of st.units[side])n+=(c.power||0)+this.unitBonus(c,id,side)+this.eventUnitBonus(c,id);if(id==='zeelandia'&&side==='dutch'&&(!this.state.currentEvent||this.state.currentEvent.id!=='wall_damage'))n+=2;n+=(t[side]||0)-(t['minus_'+side]||0);return Math.max(0,n)}
    canTarget(card,id,side){const st=this.state.fields[id];if(st.resolved)return false;const own=st.units[side].length,opp=st.units[this.opponent(side)].length;if(card.type==='unit')return!this.state.deployedFields[side].includes(id);if(card.name==='北线突击')return id==='beixianwei'&&own>0;if(card.name==='强行登陆')return id==='anping'&&own>0;if(card.name==='炮火轰城')return id==='zeelandia'&&opp>0;if(card.name==='调虎离山')return opp>0;if(card.name==='城墙加固')return own>0;if(card.name==='北线阻击')return id==='beixianwei'&&opp>0;if(card.name==='海上封锁')return id==='luermen'&&opp>0;if(card.name==='反击')return own>0&&opp>0;if(card.name==='增援'||card.name==='增援守军')return own>0;return false}
    playFromHand(who,index,id){const side=who==='player'?this.playerSide:this.aiSide,p=this.piles(who);if(this.state.turn!==who||this.state.actionsLeft<=0)return{ok:false,reason:'不是行动时机'};const card=p.hand[index];if(!card||!this.canTarget(card,id,side))return{ok:false,reason:'这张牌不能用于该战场'};p.hand.splice(index,1);if(card.type==='unit'){this.addUnit(id,side,card);this.state.deployedFields[side].push(id)}else this.applyTactic(card,id,side);this.state.actionsLeft--;return{ok:true,card,trigger:this.triggerKind(id)}}
    applyTactic(card,id,side){const st=this.state.fields[id],enemy=this.opponent(side),t=st.temp;const persist=(label,fn)=>{fn();t.labels.push({side,label});t.cards.push(card)};switch(card.name){case'北线突击':persist('北线突击 +2',()=>t[side]+=2);break;case'强行登陆':persist('强行登陆 +2',()=>t[side]+=2);break;case'炮火轰城':persist('荷军 -2',()=>t.minus_dutch+=2);break;case'城墙加固':persist('城墙加固 +2',()=>t[side]+=2);break;case'北线阻击':persist('北线阻击 -2',()=>t['minus_'+enemy]+=2);break;case'海上封锁':persist('海上封锁 -2',()=>t['minus_'+enemy]+=2);break;case'反击':persist('反击 +3',()=>t[side]+=3);break;case'增援':case'增援守军':persist('临时增援 +1',()=>t[side]+=1);break;case'调虎离山':if(st.units[enemy].length){st.units[enemy].sort((a,b)=>(a.power||0)-(b.power||0));this.discard(st.units[enemy].shift())}this.discard(card);break;default:this.discard(card)}}
    placeAmbush(who,index,id){const side=who==='player'?this.playerSide:this.aiSide,p=this.piles(who),st=this.state.fields[id];if(this.state.turn!==who||this.state.actionsLeft<=0)return false;const c=p.hand[index];if(!c||c.type!=='unit'||st.resolved||!st.units[side].length)return false;if(Object.values(this.state.fields).some(x=>x.ambush[side]))return false;p.hand.splice(index,1);st.ambush[side]=c;this.state.actionsLeft--;return true}
    moveUnit(who,from,idx,to,free=false){const side=who==='player'?this.playerSide:this.aiSide;if(this.state.turn!==who)return false;if(free&&this.state.rewards.freeMove[side]<=0)return false;if(!free&&this.state.actionsLeft<=0)return false;if(!this.isAdjacent(from,to)||this.state.fields[to].resolved||this.state.fields[from].resolved)return false;const arr=this.state.fields[from].units[side],c=arr[idx];if(!c)return false;arr.splice(idx,1);this.addUnit(to,side,c);if(free)this.state.rewards.freeMove[side]--;else this.state.actionsLeft--;return true}
    useTrump(side,id){const st=this.state.fields[id];if(this.state.trumpUsed[side]||Core.territoryState(st)!=='contested'||!st.units[side].length)return false;this.state.trumpUsed[side]=true;if(side==='zheng')st.temp.zheng+=3;else{st.temp.dutch+=3;st.temp.minus_dutch=0}st.temp.labels.push({side,label:TRUMPS[side].name+' +3'});return true}
    reactionOptions(who,id){const side=who==='player'?this.playerSide:this.aiSide,st=this.state.fields[id];if(!st.units[side].length)return[];return this.piles(who).hand.map((c,i)=>({c,i})).filter(x=>x.c.type==='tactic'&&this.canTarget(x.c,id,side)&&!['调虎离山','增援','增援守军'].includes(x.c.name))}
    useReaction(who,index,id){const side=who==='player'?this.playerSide:this.aiSide,p=this.piles(who),c=p.hand[index];if(!this.reactionOptions(who,id).some(x=>x.i===index))return false;p.hand.splice(index,1);this.applyTactic(c,id,side);return true}
    revealAmbushes(id){const st=this.state.fields[id];for(const side of ['zheng','dutch'])if(st.ambush[side]){st.units[side].push(st.ambush[side]);st.ambush[side]=null}}
    resolveBattle(id,zChoice,dChoice,{zArsenal=false,dArsenal=false}={}){const st=this.state.fields[id];this.revealAmbushes(id);let zp=this.battleBase(id,'zheng'),dp=this.battleBase(id,'dutch');zp+=Core.tacticBonus(zChoice,dChoice);dp+=Core.tacticBonus(dChoice,zChoice);if(zArsenal)zp+=this.consumeArsenal('zheng');if(dArsenal)dp+=this.consumeArsenal('dutch');const winner=Core.battleWinner({zPower:zp,dPower:dp,zUnits:st.units.zheng.length,dUnits:st.units.dutch.length,firstEntrant:st.firstEntrant});const result={winner,zPower:zp,dPower:dp,zChoice,dChoice};this.settleField(id,winner);return result}
    resolveUnopposed(id,winner){this.settleField(id,winner);return winner}
    settleField(id,winner){const st=this.state.fields[id];if(st.resolved)return;const unitCards=[...st.units.zheng,...st.units.dutch];for(const c of unitCards)this.discard(c);for(const c of st.temp.cards)this.discard(c);for(const side of ['zheng','dutch'])if(st.ambush[side])this.discard(st.ambush[side]);st.units={zheng:[],dutch:[]};st.ambush={zheng:null,dutch:null};st.resolved=true;st.winner=winner;st.temp={zheng:0,dutch:0,minus_zheng:0,minus_dutch:0,labels:[],cards:[]};this.applyReward(id,winner);const w=this.checkWinner();if(w){this.state.gameOver=true;this.state.winner=w}}
    applyReward(id,side){const type=REWARDS[id],who=side===this.playerSide?'player':'ai';if(type==='draw2')this.draw(who,2);else if(type==='drawUnit')this.drawUnit(who);else this.grantReward(id,side)}
    drawUnit(who){const p=this.piles(who);if(p.hand.length>=Core.HAND_LIMIT)return false;let i=p.deck.findIndex(c=>c.type==='unit');if(i<0)i=p.discard.findIndex(c=>c.type==='unit');if(i>=0){const src=p.deck.findIndex(c=>c.type==='unit')>=0?p.deck:p.discard;p.hand.push(src.splice(i,1)[0]);return true}return false}
    discardAndDraw(who,index){if(this.state.turn!==who||this.state.actionsLeft<=0)return false;const p=this.piles(who),c=p.hand[index];if(!c)return false;p.hand.splice(index,1);this.discard(c);this.draw(who,1);this.state.actionsLeft--;return true}
    endPlayerTurn(){if(this.state.turn!=='player')return false;this.startTurn('ai');return true}
    finishAIRound(){if(this.state.round>=Core.MAX_ROUNDS)return'final';this.state.round++;this.startTurn('player');return'player'}
    reservePower(side){const hand=side===this.playerSide?this.state.playerHand:this.state.aiHand;return hand.filter(c=>c.type==='unit').reduce((s,c)=>s+c.power,0)}
    finalFallback(){const z=this.wins('zheng'),d=this.wins('dutch');if(z!==d)return z>d?'zheng':'dutch';const zp=this.reservePower('zheng'),dp=this.reservePower('dutch');if(zp!==dp)return zp>dp?'zheng':'dutch';return this.state.fieldOrder.map(id=>this.state.fields[id].firstEntrant).find(Boolean)||'zheng'}
  }
  return {GameEngine,Core,Data};
});
