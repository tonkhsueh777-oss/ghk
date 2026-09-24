const FIELDS=[
{id:'luermen',name:'鹿耳门',effect:'海战：舰队 +1',reward:'海路先机｜立即抽2张'},
{id:'anping',name:'安平',effect:'登陆：郑成功军部队 +1',reward:'登陆优势｜下回合 +1 行动点'},
{id:'beixianwei',name:'北线尾',effect:'北线要冲：精锐步兵、火枪队 +1',reward:'切断补给｜免费调动1次'},
{id:'tainan',name:'台南城',effect:'陆战：步兵 +1',reward:'民军响应｜获得1张部队牌'},
{id:'zeelandia',name:'热兰遮城',effect:'荷军城防 +2；郑军火炮 +1',reward:'军械战利品｜以后一次决战 +2'}
];

const EVENTS=[
{id:'spring_tide',name:'大潮来袭',text:'本回合鹿耳门所有舰队额外 +2。'},
{id:'heavy_rain',name:'暴雨压炮',text:'本回合所有火炮 -1。'},
{id:'wall_damage',name:'城墙受损',text:'本回合热兰遮城的荷军 +2 城防失效。'},
{id:'reinforcements',name:'援军抵达',text:'当前攻下战场较少的一方额外抽2张；平手则双方各抽1张。'}
];

const TRUMPS={
zheng:{name:'国姓爷亲征',text:'整局一次：争夺中的战场郑军 +2，并加入1点临时援军。'},
dutch:{name:'总督死守',text:'整局一次：争夺中的战场荷军 +3，并清除荷军受到的战术压制。'}
};

const DECKS={
zheng:[
['义勇军','unit',1,'步兵','台南城 +1'],['义勇军','unit',1,'步兵','台南城 +1'],['义勇军','unit',1,'步兵','台南城 +1'],['义勇军','unit',1,'步兵','台南城 +1'],
['精锐步兵','unit',2,'步兵','北线尾 +1'],['精锐步兵','unit',2,'步兵','北线尾 +1'],['精锐步兵','unit',2,'步兵','北线尾 +1'],
['水师舰队','unit',3,'舰队','鹿耳门 +1'],['水师舰队','unit',3,'舰队','鹿耳门 +1'],['水师舰队','unit',3,'舰队','鹿耳门 +1'],
['火炮营','unit',3,'火炮','攻热兰遮城 +1'],['火炮营','unit',3,'火炮','攻热兰遮城 +1'],
['北线突击','tactic',0,'战术','北线尾己方有部队：+2'],['强行登陆','tactic',0,'战术','安平己方有部队：+2'],['炮火轰城','tactic',0,'战术','热兰遮城：荷军 -2'],['调虎离山','tactic',0,'战术','移除敌方最弱1支部队'],['增援','tactic',0,'战术','加入1点临时援军']
],
dutch:[
['守备步兵','unit',2,'步兵','台南城 +1'],['守备步兵','unit',2,'步兵','台南城 +1'],['守备步兵','unit',2,'步兵','台南城 +1'],['守备步兵','unit',2,'步兵','台南城 +1'],
['火枪队','unit',2,'火枪','北线尾 +1'],['火枪队','unit',2,'火枪','北线尾 +1'],['火枪队','unit',2,'火枪','北线尾 +1'],
['荷兰舰队','unit',3,'舰队','鹿耳门 +1'],['荷兰舰队','unit',3,'舰队','鹿耳门 +1'],['荷兰舰队','unit',3,'舰队','鹿耳门 +1'],
['城防炮台','unit',3,'火炮','热兰遮城守备'],['城防炮台','unit',3,'火炮','热兰遮城守备'],
['城墙加固','tactic',0,'战术','己方有部队：本次决战 +2'],['北线阻击','tactic',0,'战术','北线尾有敌军：敌军 -2'],['海上封锁','tactic',0,'战术','鹿耳门敌军 -2'],['反击','tactic',0,'战术','双方都有部队：己方 +3'],['增援守军','tactic',0,'战术','加入1点临时援军']
]};

let G={};

function sideName(s){return s==='zheng'?'郑成功军':'荷兰守军'}
function enemyOf(s){return s==='zheng'?'dutch':'zheng'}
function whoForSide(s){return s===G.playerSide?'player':'ai'}
function fieldById(id){return FIELDS.find(f=>f.id===id)}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeDeck(side){return shuffle(DECKS[side].map((x,i)=>({name:x[0],type:x[1],power:x[2],kind:x[3],text:x[4],owner:side,id:side+'-'+i+'-'+Math.random()})))}
function totalUnits(id){const s=G.fields[id];return s.units.zheng.length+s.units.dutch.length}
function wins(side){return FIELDS.filter(f=>G.fields[f.id].resolved&&G.fields[f.id].winner===side).length}
function ensureTemp(id){if(!G.temp[id])G.temp[id]={zheng:0,dutch:0,minus_zheng:0,minus_dutch:0,labels:[],cards:[]};return G.temp[id]}
function getPiles(who){return who==='player'?{deck:G.playerDeck,hand:G.playerHand,discard:G.playerDiscard}:{deck:G.aiDeck,hand:G.aiHand,discard:G.aiDiscard}}
function recycle(who){const p=getPiles(who);if(!p.deck.length&&p.discard.length){p.deck.push(...shuffle(p.discard.splice(0)));addLog(`${who==='player'?'你的':'AI 的'}弃牌堆已重新洗回牌库。`)}}
function draw(who,n=1){const p=getPiles(who),allowed=GameCore.drawCountWithLimit(p.hand.length,n);let got=0;for(let i=0;i<allowed;i++){recycle(who);if(!p.deck.length)break;p.hand.push(p.deck.pop());got++}return got}
function discardCard(card){if(!card||card.transient||!card.owner)return;(card.owner===G.playerSide?G.playerDiscard:G.aiDiscard).push(card)}
function activeEventId(){return G.currentEvent?G.currentEvent.id:null}
function hasActiveAmbush(side){return GameCore.hasActiveAmbush(G.fields,side)}
function ambushLocation(side){return FIELDS.find(f=>G.fields[f.id].ambush[side])||null}
function setMessage(t){document.getElementById('message').innerHTML=t}
function addLog(t){const box=document.getElementById('log'),d=document.createElement('div');d.textContent=t;box.prepend(d)}

function startGame(playerSide){
  G={
    playerSide,aiSide:enemyOf(playerSide),round:1,turn:'player',actionsLeft:2,maxActions:2,
    playerDeck:makeDeck(playerSide),aiDeck:makeDeck(enemyOf(playerSide)),
    playerDiscard:[],aiDiscard:[],playerHand:[],aiHand:[],
    fields:{},temp:{},deployedFields:{zheng:[],dutch:[]},rewards:GameCore.createRewardState(),
    eventDeck:shuffle(EVENTS.map(e=>({...e}))),currentEvent:null,
    trumpUsed:{zheng:false,dutch:false},selectedCard:null,selectedField:null,specialMode:null,moveSelection:null,
    battle:null,pendingReaction:null,finalQueue:null,gameOver:false
  };
  FIELDS.forEach(f=>{
    G.fields[f.id]={units:{zheng:[],dutch:[]},ambush:{zheng:null,dutch:null},resolved:false,winner:null,firstEntrant:null};
    G.temp[f.id]={zheng:0,dutch:0,minus_zheng:0,minus_dutch:0,labels:[],cards:[]};
  });
  draw('player',4);draw('ai',4);
  document.getElementById('selectScreen').classList.remove('active');
  document.getElementById('gameScreen').classList.add('active');
  document.getElementById('roleText').textContent=`你：${sideName(G.playerSide)}｜AI：${sideName(G.aiSide)}`;
  document.getElementById('log').innerHTML='';
  addLog('V10.3 玩法实验开始：五战场，先拿下3个战场获胜。');
  startPlayerTurn(true);
  showRules();
}

function resetTurn(side){
  G.maxActions=GameCore.actionsForTurn(G.rewards,side);
  G.actionsLeft=G.maxActions;
  G.deployedFields[side]=[];
  G.selectedCard=null;G.selectedField=null;G.specialMode=null;G.moveSelection=null;
}
function spendAP(){if(G.actionsLeft<=0)return false;G.actionsLeft--;return true}

function applyRoundEvent(){
  G.currentEvent=null;
  if(!GameCore.isEventRound(G.round))return;
  G.currentEvent=G.eventDeck.shift()||null;
  if(!G.currentEvent)return;
  addLog(`【公共事件】${G.currentEvent.name}：${G.currentEvent.text}`);
  if(G.currentEvent.id==='reinforcements'){
    const p=wins(G.playerSide),a=wins(G.aiSide);
    if(p<a){const n=draw('player',2);addLog(`你当前战果落后，额外抽 ${n} 张。`)}
    else if(a<p){const n=draw('ai',2);addLog(`AI 当前战果落后，额外抽 ${n} 张。`)}
    else{draw('player',1);draw('ai',1);addLog('双方战果相同，各额外抽1张。')}
  }
}
function startPlayerTurn(first=false){
  if(G.gameOver)return;
  G.turn='player';resetTurn(G.playerSide);applyRoundEvent();const n=draw('player',2);
  setMessage(`你的回合开始，抽到 ${n} 张。<b>本回合有 ${G.maxActions} 个行动点。</b>`);
  render();
}
function beginAITurn(){
  if(G.gameOver)return;
  G.turn='ai';resetTurn(G.aiSide);draw('ai',2);
  useAIFreeMoveIfAny();
  maybeAITrump();
  render();
  setTimeout(aiStep,260);
}

function addUnit(id,side,card){
  const st=G.fields[id];
  if(!st.firstEntrant&&totalUnits(id)===0)st.firstEntrant=side;
  st.units[side].push(card);
}
function unitBonus(card,field,side){
  let b=0;
  if(field.id==='luermen'&&card.kind==='舰队')b++;
  if(field.id==='anping'&&side==='zheng')b++;
  if(field.id==='beixianwei'&&((side==='zheng'&&card.name==='精锐步兵')||(side==='dutch'&&card.name==='火枪队')))b++;
  if(field.id==='tainan'&&card.kind==='步兵')b++;
  if(field.id==='zeelandia'&&side==='zheng'&&card.kind==='火炮')b++;
  return b;
}
function battleBase(id,side){
  const f=fieldById(id),st=G.fields[id],t=ensureTemp(id);
  let base=0,terrain=0,event=0;
  st.units[side].forEach(c=>{base+=c.power;terrain+=unitBonus(c,f,side);event+=GameCore.eventUnitModifier(activeEventId(),id,c)});
  const fortress=GameCore.fortressBonus(activeEventId(),id,side);
  const tactic=t[side]||0,penalty=t['minus_'+side]||0;
  return {base,terrain,event,fortress,tactic,penalty,total:GameCore.clampBattleTotal(base+terrain+event+fortress+tactic-penalty)};
}
function addPersistentTactic(id,card,side,label,fn){const t=ensureTemp(id);fn(t);t.labels.push({side,label});t.cards.push(card)}
function applyCard(card,id,side,{reaction=false}={}){
  const st=G.fields[id],enemy=enemyOf(side);
  if(card.type==='unit'){addUnit(id,side,card);return}
  switch(card.name){
    case'北线突击':addPersistentTactic(id,card,side,`${sideName(side)} 北线突击 +2`,t=>t[side]+=2);break;
    case'城墙加固':addPersistentTactic(id,card,side,`${sideName(side)} 城墙加固 +2`,t=>t[side]+=2);break;
    case'强行登陆':addPersistentTactic(id,card,side,`${sideName(side)} 强行登陆 +2`,t=>t[side]+=2);break;
    case'炮火轰城':addPersistentTactic(id,card,side,'荷兰守军受炮火压制 -2',t=>t.minus_dutch+=2);break;
    case'北线阻击':addPersistentTactic(id,card,side,`${sideName(enemy)} 受北线阻击 -2`,t=>t['minus_'+enemy]+=2);break;
    case'海上封锁':addPersistentTactic(id,card,side,`${sideName(enemy)} 受海上封锁 -2`,t=>t['minus_'+enemy]+=2);break;
    case'反击':addPersistentTactic(id,card,side,`${sideName(side)} 反击 +3`,t=>t[side]+=3);break;
    case'调虎离山':
      if(st.units[enemy].length){st.units[enemy].sort((a,b)=>a.power-b.power);const gone=st.units[enemy].shift();discardCard(gone);addLog(`【调虎离山】移除 ${sideName(enemy)} 的【${gone.name}】。`)}discardCard(card);break;
    case'增援':case'增援守军':
      addPersistentTactic(id,card,side,`${sideName(side)} 临时增援 +1`,t=>t[side]+=1);break;
    default:discardCard(card);
  }
}
