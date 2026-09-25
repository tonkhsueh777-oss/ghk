let game=null;
let ui={selectedCard:null,selectedField:null,mode:null,moveFrom:null,battle:null,finalQueue:null};
const FIELD_BY_ID=Object.fromEntries(GameData.FIELDS.map(f=>[f.id,f]));
const DOM_IDS=['playerHero','playerName','playerDesc','playerScore','aiHero','aiName','aiDesc','aiScore','playerPiles','aiPiles','playerTrumpText','aiTrumpText','rewardText','freeMoveBtn','ambushText','aiAmbushText','roundText','turnText','phaseText','apText','eventName','eventText','battlefieldGrid','handCount','handGrid','endTurnBtn','playBtn','discardBtn','moveBtn','ambushBtn','trumpBtn','reactionText','reactionOptions','battleTitle','arsenalLabel','arsenalCheck','battleChoice','battleResult','resultTitle','resultScore','resultText','deckContent'];
for(const id of DOM_IDS) window[id]=document.getElementById(id);

const FACTIONS={
  zheng:{name:'郑成功军',desc:'驱逐荷虏 · 光复台湾',sprite:'zheng'},
  dutch:{name:'荷兰守军',desc:'坚守城池 · 顽强抵抗',sprite:'dutch'}
};
const SPRITE_URL=window.SPRITE_URL;
const SPRITE_SIZE={w:751,h:372};
const SPRITE_MAP={
  zheng:[0,0,150,166],dutch:[152,0,150,173],event:[304,0,179,80],
  luermen:[0,175,150,81],anping:[152,175,150,85],beixianwei:[304,175,143,85],tainan:[449,175,150,85],zeelandia:[601,175,150,84],
  zhengcard:[0,262,80,107],dutchcard:[82,262,78,110],tacticcard:[162,262,80,108]
};
function spriteKeyForCard(c){return c.type==='tactic'?'tacticcard':(c.owner==='dutch'?'dutchcard':'zhengcard')}
function applySprite(el){
  const key=el.dataset.sprite,map=SPRITE_MAP[key];if(!map)return;
  const [x,y,w,h]=map,box=el.getBoundingClientRect(),W=Math.max(1,box.width),H=Math.max(1,box.height);
  const scale=Math.max(W/w,H/h);
  el.style.backgroundImage=`url(${SPRITE_URL})`;
  el.style.backgroundSize=`${SPRITE_SIZE.w*scale}px ${SPRITE_SIZE.h*scale}px`;
  el.style.backgroundPosition=`${(W-w*scale)/2-x*scale}px ${(H-h*scale)/2-y*scale}px`;
  el.style.backgroundRepeat='no-repeat';
}
function applySprites(root=document){root.querySelectorAll('[data-sprite]').forEach(applySprite)}
window.addEventListener('resize',()=>applySprites());
function whoSide(who){return who==='player'?game.playerSide:game.aiSide}
function whoForSide(side){return side===game.playerSide?'player':'ai'}
function log(t){const p=document.createElement('p');p.textContent=t;document.getElementById('logList').prepend(p)}
function msg(t){document.getElementById('message').innerHTML=t}
function show(id){document.getElementById(id).classList.add('show')}
function hideModal(id){document.getElementById(id).classList.remove('show')}

function startGame(side){
  game=new GameEngine(side);
  ui={selectedCard:null,selectedField:null,mode:null,moveFrom:null,battle:null,finalQueue:null};
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('logList').innerHTML='';
  log(`【开局】你选择${FACTIONS[side].name}。`);
  log(`【地图】${game.state.fieldOrder.map(id=>FIELD_BY_ID[id].name).join(' → ')}`);
  msg('你的回合开始。选择手牌，再选择战场。');
  render();
  showRules();
}
function resetGame(){['rulesModal','deckModal','reactionModal','battleModal','resultModal'].forEach(hideModal);game=null;document.getElementById('gameScreen').classList.add('hidden');document.getElementById('startScreen').classList.remove('hidden')}

function render(){if(!game)return;renderFlow();renderSides();renderEvent();renderFields();renderHand();renderButtons();requestAnimationFrame(()=>applySprites())}
function renderFlow(){
  let step=1;if(ui.selectedCard!==null||ui.mode)step=2;if(ui.selectedField||ui.moveFrom)step=3;if(game.state.actionsLeft===0)step=4;
  const names=['进行行动','选择战场','执行','结束回合'];
  document.getElementById('flow').innerHTML=names.map((n,i)=>`<div class="flow-step ${i+1===step?'active':''}"><span>0${i+1}</span><b>${n}</b></div>`).join('');
}
function renderSides(){
  const p=FACTIONS[game.playerSide],a=FACTIONS[game.aiSide];
  playerHero.dataset.sprite=p.sprite;playerName.textContent=p.name;playerDesc.textContent=p.desc;
  aiHero.dataset.sprite=a.sprite;aiName.textContent=a.name;aiDesc.textContent=a.desc;
  playerScore.textContent=`${game.wins(game.playerSide)} / 3`;aiScore.textContent=`${game.wins(game.aiSide)} / 3`;
  playerPiles.textContent=`手牌 ${game.state.playerHand.length}｜牌库 ${game.state.playerDeck.length}｜弃牌 ${game.state.playerDiscard.length}`;
  aiPiles.textContent=`手牌 ${game.state.aiHand.length}｜牌库 ${game.state.aiDeck.length}｜弃牌 ${game.state.aiDiscard.length}`;
  playerTrumpText.textContent=`${GameData.TRUMPS[game.playerSide].name}｜${game.state.trumpUsed[game.playerSide]?'已使用':'尚未使用'}`;
  aiTrumpText.textContent=`王牌：${GameData.TRUMPS[game.aiSide].name}｜${game.state.trumpUsed[game.aiSide]?'已使用':'尚未使用'}`;
  const r=game.state.rewards,side=game.playerSide;
  rewardText.innerHTML=`安平行动奖励：${r.nextTurnExtraAP[side]?'待使用':'无'}<br>免费调动：${r.freeMove[side]}次<br>军械 +2：${r.arsenalToken[side]}枚`;
  freeMoveBtn.classList.toggle('hidden',r.freeMove[side]<=0);
  const pa=Object.entries(game.state.fields).find(([,st])=>st.ambush[side]);ambushText.textContent=pa?`活动伏兵：${FIELD_BY_ID[pa[0]].name}`:'活动伏兵：无';
  const aa=Object.entries(game.state.fields).find(([,st])=>st.ambush[game.aiSide]);aiAmbushText.textContent=aa?`伏兵：已布置于${FIELD_BY_ID[aa[0]].name}`:'伏兵：无';
  roundText.textContent=`第 ${game.state.round} / ${GameCore.MAX_ROUNDS} 回合 · ${GameCore.roundPhase(game.state.round)}`;
  turnText.textContent=game.state.turn==='player'?'你的回合':'AI 回合';
  phaseText.textContent=ui.mode==='move'?'调动模式':ui.mode==='freeMove'?'免费调动模式':ui.mode==='trump'?'王牌目标选择':'部署 / 战术 / 伏兵 / 调动';
  apText.textContent=`${game.state.turn==='player'?game.state.actionsLeft:0} / ${game.state.turn==='player'?game.state.maxActions:2}`;
}
function renderEvent(){const ev=game.state.currentEvent;if(ev){eventName.textContent=ev.name;eventText.textContent=ev.text}else{const next=[3,6,9].find(x=>x>game.state.round);eventName.textContent='等待事件揭晓';eventText.textContent=next?`第 ${next} 回合翻开下一张公共事件牌。`:'本局公共事件已经全部揭晓。'}}

function stateText(id){const st=game.state.fields[id],s=GameCore.territoryState(st),z=st.units.zheng.length,d=st.units.dutch.length,total=z+d;if(s==='resolved')return`${FACTIONS[st.winner].name}已攻下｜战役点已入袋｜永久封锁`;if(s==='unresolved')return'尚未驻军｜0分';if(s==='garrison'){const n=z||d;return`${z?'郑军':'荷军'}驻军 ${n}/3｜再来 ${3-n} 支可无抵抗占领`}return`争夺中 ${total}/5｜再进入 ${5-total} 支触发正式决战`}
function renderFields(){
  battlefieldGrid.innerHTML=game.state.fieldOrder.map((id,pos)=>{
    const f=FIELD_BY_ID[id],st=game.state.fields[id],resolved=st.resolved,zp=game.battleBase(id,'zheng'),dp=game.battleBase(id,'dutch');
    const zP=st.units.zheng.map((c,i)=>`<button class="pill zheng ${ui.mode&&game.playerSide==='zheng'?'moveable':''}" onclick="event.stopPropagation();selectMoveUnit('${id}',${i},'zheng')">${c.name.slice(0,2)} ${c.power}</button>`).join('');
    const dP=st.units.dutch.map((c,i)=>`<button class="pill dutch ${ui.mode&&game.playerSide==='dutch'?'moveable':''}" onclick="event.stopPropagation();selectMoveUnit('${id}',${i},'dutch')">${c.name.slice(0,2)} ${c.power}</button>`).join('');
    const tags=[...st.temp.labels.map(x=>`<span class="tag">${x.label}</span>`),st.ambush.zheng?`<span class="tag">郑军伏兵</span>`:'',st.ambush.dutch?`<span class="tag">荷军伏兵</span>`:''].join('');
    return `<article data-field="${id}" class="battle-card ${resolved?'resolved':''} ${ui.selectedField===id?'selected':''}" onclick="selectField('${id}')"><div class="battle-image sprite" data-sprite="${id}"><div class="battle-index">${pos+1}</div></div><div class="battle-body"><div class="battle-title"><h3>${f.name}</h3><span class="point-tag">战役点1</span></div><p>${f.effect}</p><div class="reward-box">胜利奖励：${f.reward}</div><div class="state-box">${stateText(id)}</div><div class="tags">${tags}</div><div class="army-row"><span>郑军战力</span><b>${zp}</b></div><div class="unit-pills">${zP}</div><div class="army-row"><span>荷军战力</span><b>${dp}</b></div><div class="unit-pills">${dP}</div></div></article>`
  }).join('')
}
function renderHand(){
  handCount.textContent=`${game.state.playerHand.length} / 6`;
  handGrid.innerHTML=game.state.playerHand.map((c,i)=>`<div class="hand-card ${ui.selectedCard===i?'selected':''}" onclick="selectCard(${i})"><div class="card-art sprite" data-sprite="${spriteKeyForCard(c)}"></div><div class="card-copy"><h4>${c.name}</h4><p>${c.type==='unit'?`${c.kind} · 战力${c.power} · ${c.text}`:`战术 · ${c.text}`}</p></div></div>`).join('')
}
function renderButtons(){const playerTurn=game.state.turn==='player'&&!game.state.gameOver;endTurnBtn.disabled=!playerTurn||ui.battle!==null;playBtn.disabled=!playerTurn||game.state.actionsLeft<=0||ui.selectedCard===null||!ui.selectedField||!!ui.mode;discardBtn.disabled=!playerTurn||game.state.actionsLeft<=0||ui.selectedCard===null||!!ui.mode;moveBtn.disabled=!playerTurn||game.state.actionsLeft<=0;ambushBtn.disabled=!playerTurn||game.state.actionsLeft<=0||ui.selectedCard===null||!ui.selectedField||!!ui.mode;trumpBtn.disabled=!playerTurn||game.state.trumpUsed[game.playerSide];moveBtn.textContent=ui.mode==='move'?'取消调动':'调动部队';trumpBtn.textContent=ui.mode==='trump'?'取消王牌':'发动王牌'}

function selectCard(i){if(!game||game.state.turn!=='player'||ui.mode)return;ui.selectedCard=i;ui.selectedField=null;msg(`已选择【${game.state.playerHand[i].name}】，请选择战场。`);render()}
function selectField(id){if(!game||game.state.turn!=='player')return;if(ui.mode==='trump'){if(game.useTrump(game.playerSide,id)){log(`【王牌】发动${GameData.TRUMPS[game.playerSide].name}于${FIELD_BY_ID[id].name}`);ui.mode=null;afterActionTrigger(id,game.playerSide)}else msg('王牌只能用于双方都已有部队的争夺中战场。');render();return}if(ui.mode==='move'||ui.mode==='freeMove'){if(!ui.moveFrom){msg('请先点击一支己方正面部队。');return}performMove(id);return}ui.selectedField=id;msg(`已选择${FIELD_BY_ID[id].name}。点击“打出这张牌”。`);render()}
function playSelected(){if(ui.selectedCard===null||!ui.selectedField)return;const r=game.playFromHand('player',ui.selectedCard,ui.selectedField);if(!r.ok){msg(r.reason);return}log(`【你】在${FIELD_BY_ID[ui.selectedField].name}使用【${r.card.name}】。`);const id=ui.selectedField;ui.selectedCard=null;ui.selectedField=null;afterActionTrigger(id,game.playerSide);render()}
function discardSelected(){if(ui.selectedCard===null)return;const c=game.state.playerHand[ui.selectedCard];if(game.discardAndDraw('player',ui.selectedCard)){log(`【你】弃掉【${c.name}】并换1张。`);ui.selectedCard=null;ui.selectedField=null;render()}}
function setAmbush(){if(ui.selectedCard===null||!ui.selectedField)return;const c=game.state.playerHand[ui.selectedCard];if(game.placeAmbush('player',ui.selectedCard,ui.selectedField)){log(`【你】在${FIELD_BY_ID[ui.selectedField].name}布置伏兵。`);ui.selectedCard=null;ui.selectedField=null;render()}else msg('伏兵必须是部队牌，放在已有己方部队的未结算战场；每方同时只能有1张伏兵。')}
function toggleMove(){ui.mode=ui.mode==='move'?null:'move';ui.moveFrom=null;ui.selectedCard=null;ui.selectedField=null;msg(ui.mode?'调动：先点击己方正面部队，再点击当前排列中相邻的战场。':'已取消调动。');render()}
function toggleFreeMove(){ui.mode=ui.mode==='freeMove'?null:'freeMove';ui.moveFrom=null;ui.selectedCard=null;ui.selectedField=null;msg(ui.mode?'免费调动：先点击己方部队，再点相邻战场。':'已取消。');render()}
function toggleTrump(){ui.mode=ui.mode==='trump'?null:'trump';ui.selectedCard=null;ui.selectedField=null;msg(ui.mode?`选择争夺中的战场发动【${GameData.TRUMPS[game.playerSide].name}】。`:'已取消王牌选择。');render()}
function selectMoveUnit(id,index,side){if(!['move','freeMove'].includes(ui.mode)||side!==game.playerSide)return;ui.moveFrom={id,index};msg(`已选择${FIELD_BY_ID[id].name}的一支部队，请点击相邻战场。`);render()}
function performMove(to){if(!ui.moveFrom)return;const free=ui.mode==='freeMove';if(game.moveUnit('player',ui.moveFrom.id,ui.moveFrom.index,to,free)){log(`【你】${free?'免费':''}调动部队：${FIELD_BY_ID[ui.moveFrom.id].name} → ${FIELD_BY_ID[to].name}`);ui.mode=null;ui.moveFrom=null;afterActionTrigger(to,game.playerSide);render()}else msg('只能移动到当前随机排列中相邻且未封锁的战场。')}

function afterActionTrigger(id,triggerSide){const kind=game.triggerKind(id);if(kind==='unopposed'){const st=game.state.fields[id],winner=st.units.zheng.length?'zheng':'dutch';game.resolveUnopposed(id,winner);log(`【无抵抗占领】${FACTIONS[winner].name}攻下${FIELD_BY_ID[id].name}。`);checkGameEnd();return}if(kind==='battle'){beginBattle(id,triggerSide);return}if(game.state.turn==='ai')setTimeout(runAI,350)}
function beginBattle(id,triggerSide,isFinal=false){ui.battle={id,triggerSide,isFinal};const responder=triggerSide==='zheng'?'dutch':'zheng';if(responder===game.playerSide){const opts=game.reactionOptions('player',id);if(opts.length){reactionText.textContent=`${FACTIONS[triggerSide].name}触发${FIELD_BY_ID[id].name}决战。你可以免费使用1张战术牌。`;reactionOptions.innerHTML=opts.map(o=>`<button class="reaction-option" onclick="useReaction(${o.i})">【${o.c.name}】${o.c.text}</button>`).join('');show('reactionModal');return}}else{const opts=game.reactionOptions('ai',id);if(opts.length){const pick=opts[0];game.useReaction('ai',pick.i,id);log(`【AI应战】免费使用【${pick.c.name}】。`)}}openBattleChoice()}
function useReaction(index){if(!ui.battle)return;if(game.useReaction('player',index,ui.battle.id)){log(`【你应战】免费使用1张战术牌。`);hideModal('reactionModal');openBattleChoice();render()}}
function skipReaction(){hideModal('reactionModal');openBattleChoice()}
function aiTactic(id){const side=game.aiSide;let weights={assault:1,defend:1,raid:1};if(side==='dutch'&&id==='zeelandia')weights.defend+=3;if(side==='zheng'&&['luermen','anping'].includes(id))weights.assault+=2;if(side==='zheng'&&id==='zeelandia')weights.raid+=1;const keys=Object.keys(weights),sum=keys.reduce((s,k)=>s+weights[k],0);let x=Math.random()*sum;for(const k of keys){x-=weights[k];if(x<=0)return k}return'raid'}
function openBattleChoice(){const b=ui.battle;if(!b)return;b.aiChoice=aiTactic(b.id);battleTitle.textContent=`${FIELD_BY_ID[b.id].name}｜选择决战战法`;arsenalLabel.classList.toggle('hidden',game.state.rewards.arsenalToken[game.playerSide]<=0);arsenalCheck.checked=false;battleChoice.classList.remove('hidden');battleResult.classList.add('hidden');show('battleModal')}
function chooseBattleTactic(choice){const b=ui.battle;if(!b)return;const zChoice=game.playerSide==='zheng'?choice:b.aiChoice,dChoice=game.playerSide==='dutch'?choice:b.aiChoice;const playerArsenal=!arsenalLabel.classList.contains('hidden')&&arsenalCheck.checked;const aiBase=game.battleBase(b.id,game.aiSide),pBase=game.battleBase(b.id,game.playerSide),aiUse=game.state.rewards.arsenalToken[game.aiSide]>0&&aiBase<=pBase+2;const opts={zArsenal:(game.playerSide==='zheng'&&playerArsenal)||(game.aiSide==='zheng'&&aiUse),dArsenal:(game.playerSide==='dutch'&&playerArsenal)||(game.aiSide==='dutch'&&aiUse)};const r=game.resolveBattle(b.id,zChoice,dChoice,opts);const myPower=game.playerSide==='zheng'?r.zPower:r.dPower,aiPower=game.aiSide==='zheng'?r.zPower:r.dPower;const myChoice=GameCore.tacticName(choice),aChoice=GameCore.tacticName(b.aiChoice);battleChoice.classList.add('hidden');battleResult.classList.remove('hidden');battleResult.innerHTML=`<div class="battle-result-card"><h2>${FACTIONS[r.winner].name}攻下${FIELD_BY_ID[b.id].name}</h2><p>你：<b>${myChoice}</b>｜AI：<b>${aChoice}</b></p><p>最终战力：你 <b>${myPower}</b> ： AI <b>${aiPower}</b></p><p>战役点 +1，战场永久封锁。</p></div><button class="gold-btn" onclick="closeBattleResult()">继续</button>`;log(`【正式决战】${FIELD_BY_ID[b.id].name}：${FACTIONS[r.winner].name}获胜。`);render()}
function closeBattleResult(){hideModal('battleModal');const wasFinal=ui.battle&&ui.battle.isFinal;ui.battle=null;render();if(checkGameEnd())return;if(wasFinal&&ui.finalQueue){processFinalQueue();return}if(game.state.turn==='ai')setTimeout(runAI,300)}

function endPlayerTurn(){if(!game||game.state.turn!=='player'||ui.battle)return;ui.selectedCard=null;ui.selectedField=null;ui.mode=null;game.endPlayerTurn();msg('AI 正在行动……');render();useAIFreeMove();maybeAITrump();setTimeout(runAI,450)}
function useAIFreeMove(){const side=game.aiSide;if(game.state.rewards.freeMove[side]<=0)return false;for(const from of game.state.fieldOrder){const st=game.state.fields[from];for(let i=0;i<st.units[side].length;i++){for(const to of game.state.fieldOrder){if(game.isAdjacent(from,to)&&!game.state.fields[to].resolved){if(game.moveUnit('ai',from,i,to,true)){log(`【AI奖励】免费调动至${FIELD_BY_ID[to].name}。`);afterActionTrigger(to,side);return true}}}}}game.state.rewards.freeMove[side]--;return false}
function maybeAITrump(){const side=game.aiSide;if(game.state.trumpUsed[side])return;const target=game.state.fieldOrder.find(id=>GameCore.territoryState(game.state.fields[id])==='contested'&&game.state.fields[id].units[side].length&&(game.state.fields[id].units.zheng.length+game.state.fields[id].units.dutch.length>=4||game.state.round>=8));if(target&&game.useTrump(side,target))log(`【AI王牌】发动${GameData.TRUMPS[side].name}。`)}
function aiOptions(){const side=game.aiSide,hand=game.state.aiHand,opts=[];hand.forEach((c,ci)=>game.state.fieldOrder.forEach(id=>{if(!game.canTarget(c,id,side))return;const st=game.state.fields[id],own=st.units[side].length,opp=st.units[game.playerSide].length;let score=Math.random();if(c.type==='unit'){score+=c.power;if(opp===2&&!own)score+=7;if(own===2&&!opp)score+=6;if(own&&opp)score+=3;if(own+opp===4)score+=4}else score+=own+opp+(own&&opp?2:0);opts.push({ci,id,score})}));return opts.sort((a,b)=>b.score-a.score)}
function runAI(){if(!game||game.state.gameOver||ui.battle)return;if(game.state.turn!=='ai')return;if(game.state.actionsLeft<=0){finishRound();return}const opts=aiOptions();if(!opts.length){if(game.state.aiHand.length){const c=game.state.aiHand[0];game.discardAndDraw('ai',0);log(`【AI】弃掉【${c.name}】并换牌。`)}else game.state.actionsLeft=0;render();setTimeout(runAI,300);return}const o=opts[0],c=game.state.aiHand[o.ci],r=game.playFromHand('ai',o.ci,o.id);if(r.ok){log(`【AI】在${FIELD_BY_ID[o.id].name}使用【${c.name}】。`);render();afterActionTrigger(o.id,game.aiSide)}else{game.state.actionsLeft--;setTimeout(runAI,200)}}
function finishRound(){if(game.state.round>=GameCore.MAX_ROUNDS){startFinalSettlement();return}game.finishAIRound();log(`【回合】进入第${game.state.round}回合。`);if(game.state.currentEvent)log(`【公共事件】${game.state.currentEvent.name}：${game.state.currentEvent.text}`);msg('你的回合开始。');render()}
function startFinalSettlement(){log('【最终结算】第10回合结束。');ui.finalQueue=game.state.fieldOrder.filter(id=>!game.state.fields[id].resolved&&(game.state.fields[id].units.zheng.length+game.state.fields[id].units.dutch.length));processFinalQueue()}
function processFinalQueue(){if(checkGameEnd())return;while(ui.finalQueue.length){const id=ui.finalQueue.shift(),st=game.state.fields[id];if(st.resolved)continue;const z=st.units.zheng.length,d=st.units.dutch.length;if(z&&!d){game.resolveUnopposed(id,'zheng');log(`【最终结算】郑成功军拿下${FIELD_BY_ID[id].name}。`);continue}if(d&&!z){game.resolveUnopposed(id,'dutch');log(`【最终结算】荷兰守军拿下${FIELD_BY_ID[id].name}。`);continue}if(z&&d){beginBattle(id,game.playerSide,true);return}}const winner=game.checkWinner()||game.finalFallback();finishGame(winner,'第10回合最终结算')}
function checkGameEnd(){const w=game.checkWinner()||game.state.winner;if(w){finishGame(w,'先攻下3个战场');return true}return false}
function finishGame(winner,reason){game.state.gameOver=true;game.state.winner=winner;resultTitle.textContent=winner===game.playerSide?'你获胜':'AI 获胜';resultScore.textContent=`${game.wins(game.playerSide)} ： ${game.wins(game.aiSide)}`;resultText.textContent=`${FACTIONS[winner].name}获胜。${reason}。`;show('resultModal');render()}

function showRules(){show('rulesModal')}
function showDecks(){const rows=(side)=>GameData.DECKS[side].map(x=>`<p>${x[0]}｜${x[1]==='unit'?`战力${x[2]} · ${x[3]}`:'战术'}｜${x[4]}</p>`).join('');deckContent.innerHTML=`<div class="deck-columns"><div class="deck-list"><h3>郑成功军</h3>${rows('zheng')}</div><div class="deck-list"><h3>荷兰守军</h3>${rows('dutch')}</div></div>`;show('deckModal')}

requestAnimationFrame(()=>applySprites());
