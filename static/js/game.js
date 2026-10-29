/* Memory Match Arena — browser gameplay and leaderboard UI. */
(() => {
  'use strict';
  const levels = {easy: 6, medium: 8, hard: 12};
  const icons = ['🚀','🎮','🌈','🪐','🎯','🦋','⚡','🎨','🐙','💎','🌙','🦄'];
  const $ = id => document.getElementById(id);
const el = {
  board:$('board'),
  difficulty:$('difficulty'),
  name:$('playerName'),
  timer:$('timer'),
  moves:$('moves'),
  matches:$('matches'),
  score:$('score'),
  status:$('gameStatus'),
  feedback:$('feedback'),
  modal:$('winModal'),
  save:$('saveBtn'),
  hint:$('hintBtn'),
  leaderboard:$('leaderboard'),
  achievementList:$('achievementList'),
  achievementCount:$('achievementCount'),
  galleryAchievementList:$('galleryAchievementList'),
  galleryProgress:$('galleryProgress')
};
  let cards = [], first = null, second = null, locked = false, moveCount = 0, matchCount = 0, seconds = 0;
  let started = false, finished = false, timerId = null, flipTimeout = null, peekTimeout = null, peekUsed = false, epoch = 0;
  let finishData = null;
  const pad = n => String(n).padStart(2, '0');
  const formatTime = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const currentScore = () => Math.max(100, levels[el.difficulty.value] * 250 - seconds * 3 - (moveCount - levels[el.difficulty.value]) * 20);
  function renderStats(){ el.timer.textContent=formatTime(seconds); el.moves.textContent=moveCount; el.matches.textContent=`${matchCount}/${levels[el.difficulty.value]}`; el.score.textContent=currentScore(); }
  function startTimer(){ if(started)return; started=true; el.status.textContent='In progress'; timerId=setInterval(()=>{seconds++;renderStats();if(seconds>=3600){clearInterval(timerId);timerId=null;el.status.textContent='Time limit reached';el.feedback.textContent='Start a new game to try again.';locked=true;}},1000); }
  function shuffle(items){ for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items; }
  function reset(){
    epoch++; clearInterval(timerId);clearTimeout(flipTimeout);clearTimeout(peekTimeout);timerId=null;first=null;second=null;locked=false;moveCount=0;matchCount=0;seconds=0;started=false;finished=false;peekUsed=false;finishData=null;
    el.hint.disabled=false;el.name.disabled=false;el.difficulty.disabled=false;el.feedback.textContent='';el.modal.classList.add('hidden');el.status.textContent='Ready to play';
    const deck=shuffle([...icons.slice(0,levels[el.difficulty.value]),...icons.slice(0,levels[el.difficulty.value])]);
    el.board.className=`board ${el.difficulty.value==='hard'?'hard':''}`;
    cards=deck.map((symbol,i)=>({symbol,id:i,matched:false,flipped:false}));
    el.board.replaceChildren();
    cards.forEach(card=>{
      const btn=document.createElement('button');btn.className='card';btn.type='button';btn.setAttribute('aria-label',`Hidden card ${card.id+1}`);
      btn.innerHTML='<span class="card-face card-back" aria-hidden="true">✦</span><span class="card-face card-front" aria-hidden="true"></span>';
      btn.querySelector('.card-front').textContent=card.symbol;
      btn.addEventListener('click',()=>flip(card,btn));card.button=btn;el.board.append(btn);
    });
    renderStats();loadLeaderboard();
  }
  function showCard(card){card.flipped=true;card.button.classList.add('flipped');card.button.setAttribute('aria-label',`Card ${card.id+1}: ${card.symbol}`);}
  function hideCard(card){if(card.matched)return;card.flipped=false;card.button.classList.remove('flipped');card.button.setAttribute('aria-label',`Hidden card ${card.id+1}`);}
  function flip(card){
    if(locked||finished||card.flipped||card.matched||seconds>=3600)return;
    startTimer();el.name.disabled=true;el.difficulty.disabled=true;showCard(card);
    if(!first){first=card;return;}
    second=card;moveCount++;renderStats();locked=true;
    if(first.symbol===second.symbol){
      first.matched=second.matched=true;first.button.classList.add('matched');second.button.classList.add('matched');matchCount++;el.feedback.textContent='Nice match! ✨';first=null;second=null;locked=false;renderStats();
      if(matchCount===levels[el.difficulty.value])complete();
    }else{
      el.feedback.textContent='Not a match — remember those cards!';const currentEpoch=epoch;
      flipTimeout=setTimeout(()=>{if(currentEpoch!==epoch)return;hideCard(first);hideCard(second);first=null;second=null;locked=false;},850);
    }
  }
  function complete(){
    finished=true;
    clearInterval(timerId);
    timerId=null;
    el.status.textContent='Completed!';

    finishData={
      player:el.name.value.trim(),
      difficulty:el.difficulty.value,
      seconds:Math.max(1,seconds),
      moves:moveCount,
      peek_used:peekUsed
    };

    $('finalTime').textContent=formatTime(seconds);
    $('finalMoves').textContent=moveCount;
    $('finalScore').textContent=currentScore();
    $('saveFeedback').textContent='';
    el.save.disabled=false;
    el.modal.classList.remove('hidden');
  }
  function peek(){
    if(locked||finished||peekUsed||first||seconds>=3585)return;
    startTimer();el.name.disabled=true;el.difficulty.disabled=true;peekUsed=true;el.hint.disabled=true;locked=true;seconds+=15;renderStats();
    const temporary=cards.filter(c=>!c.matched&&!c.flipped);temporary.forEach(showCard);
    const currentEpoch=epoch;peekTimeout=setTimeout(()=>{if(currentEpoch!==epoch)return;temporary.forEach(hideCard);locked=false;el.feedback.textContent='Peek used! 15-second penalty applied.';},1500);
  }
  function renderAchievements(achievements){
  el.achievementList.replaceChildren();

  if(!achievements || !achievements.length){
    el.achievementCount.textContent='0 unlocked';

    const empty=document.createElement('p');
    empty.className='achievement-empty';
    empty.textContent='No new achievements this game. Keep playing!';
    el.achievementList.append(empty);

    return;
  }

  el.achievementCount.textContent=
    `${achievements.length} unlocked`;

  achievements.forEach(achievement=>{
    const item=document.createElement('div');
    item.className='achievement-card';

    const icon=document.createElement('span');
    icon.className='achievement-icon';
    icon.textContent=achievement.icon;
    icon.setAttribute('aria-hidden','true');

    const content=document.createElement('div');
    content.className='achievement-content';

    const name=document.createElement('strong');
    name.textContent=achievement.name;

    const description=document.createElement('span');
    description.textContent=achievement.description;

    content.append(name,description);
    item.append(icon,content);

    el.achievementList.append(item);
  });
}
async function loadAchievementGallery(){
  const player=el.name.value.trim();

  if(!player){
    el.galleryProgress.textContent='0 / 5';

    el.galleryAchievementList.innerHTML=`
      <div class="gallery-empty">
        <span class="gallery-empty-icon">🏆</span>
        <strong>Enter your player name to view your achievements.</strong>
        <span>Your progress will appear here.</span>
      </div>
    `;

    return;
  }

  try{
    const response=await fetch(
      `/api/achievements?player=${encodeURIComponent(player)}`
    );

    const data=await response.json();

    if(!response.ok){
      throw Error(data.error||'Unable to load achievements.');
    }

    el.galleryProgress.textContent=
      `${data.unlocked} / ${data.total}`;

    el.galleryAchievementList.replaceChildren();

    data.achievements.forEach(achievement=>{
      const card=document.createElement('div');

      card.className=
        `gallery-achievement-card ${
          achievement.unlocked ? 'unlocked' : 'locked'
        }`;

      const icon=document.createElement('div');

      icon.className='gallery-achievement-icon';
      icon.textContent=achievement.unlocked
        ? achievement.icon
        : '🔒';

      icon.setAttribute('aria-hidden','true');

      const content=document.createElement('div');
      content.className='gallery-achievement-content';

      const header=document.createElement('div');
      header.className='gallery-achievement-header';

      const name=document.createElement('strong');
      name.textContent=achievement.name;

      const status=document.createElement('span');
      status.className='gallery-achievement-status';

      status.textContent=achievement.unlocked
        ? 'UNLOCKED'
        : 'LOCKED';

      header.append(name,status);

      const description=document.createElement('span');
      description.className='gallery-achievement-description';
      description.textContent=achievement.description;

      content.append(header,description);

      if(achievement.unlocked && achievement.earned_at){
        const earned=document.createElement('small');

        earned.className='gallery-achievement-date';

        const date=new Date(achievement.earned_at);

        earned.textContent=
          `Unlocked ${date.toLocaleDateString()}`;

        content.append(earned);
      }

      card.append(icon,content);

      el.galleryAchievementList.append(card);
    });

  }catch(error){
    el.galleryProgress.textContent='—';

    el.galleryAchievementList.innerHTML=`
      <div class="gallery-empty">
        <span class="gallery-empty-icon">⚠</span>
        <strong>Unable to load achievements.</strong>
        <span>${error.message}</span>
      </div>
    `;
  }
}
async function saveScore(){
  if(!finishData)return;

  el.save.disabled=true;
  $('saveFeedback').textContent='Saving…';

  try{
    const response=await fetch('/api/scores',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(finishData)
    });

    const data=await response.json();

    if(!response.ok){
      throw Error(data.error||'Unable to save.');
    }

    $('saveFeedback').textContent=
      `Saved! Your official score is ${data.score}.`;

    renderAchievements(data.achievements);

    await loadLeaderboard();

  }catch(error){
    $('saveFeedback').textContent=error.message;
    el.save.disabled=false;
  }
}
  async function loadLeaderboard(){
    el.leaderboard.innerHTML='<p class="empty">Loading scores…</p>';
    try{
      const response=await fetch(`/api/leaderboard?difficulty=${encodeURIComponent(el.difficulty.value)}`);if(!response.ok)throw Error('Could not load scores');
      const data=await response.json();el.leaderboard.replaceChildren();
      if(!data.results.length){el.leaderboard.innerHTML='<p class="empty">No scores yet. Be the first! 🏆</p>';return;}
      data.results.forEach((entry,index)=>{
        const row=document.createElement('div');row.className='leader-row';
        const rank=document.createElement('span');rank.className='rank';rank.textContent=`#${index+1}`;
        const person=document.createElement('div');person.className='leader-name';person.textContent=entry.player;
        const pts=document.createElement('span');pts.className='leader-points';pts.textContent=entry.score;
        row.append(rank,person,pts);el.leaderboard.append(row);
      });
    }catch{el.leaderboard.innerHTML='<p class="empty">Leaderboard unavailable. Check the Flask server.</p>';}
  }
  $('restartBtn').addEventListener('click',reset);
  $('againBtn').addEventListener('click',reset);
  $('hintBtn').addEventListener('click',peek);
  $('saveBtn').addEventListener('click',saveScore);
  $('refreshBtn').addEventListener('click',loadLeaderboard);

  el.difficulty.addEventListener('change',reset);

  // Load achievement gallery when the player name is entered/changed
  el.name.addEventListener('blur',loadAchievementGallery);

  $('themeBtn').addEventListener('click',()=>{
    document.body.classList.toggle('light');
    $('themeBtn').textContent=
      document.body.classList.contains('light')?'☀':'☾';
  });

  reset();
})();
