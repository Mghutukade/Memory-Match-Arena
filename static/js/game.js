/* Memory Match Arena — browser gameplay and leaderboard UI. */
(() => {
  'use strict';
  const levels = {easy: 6, medium: 8, hard: 12};
  const icons = ['🚀','🎮','🌈','🪐','🎯','🦋','⚡','🎨','🐙','💎','🌙','🦄'];
  const $ = id => document.getElementById(id);
  const el = {
    board:$('board'), difficulty:$('difficulty'), name:$('playerName'), timer:$('timer'), moves:$('moves'), matches:$('matches'), score:$('score'), status:$('gameStatus'), feedback:$('feedback'), modal:$('winModal'), save:$('saveBtn'), hint:$('hintBtn'), leaderboard:$('leaderboard'), stars:$('starsRating')
  };
  let cards = [], first = null, second = null, locked = false, moveCount = 0, matchCount = 0, seconds = 0, starRating = 3;
  let started = false, finished = false, timerId = null, flipTimeout = null, peekTimeout = null, peekUsed = false, epoch = 0;
  let finishData = null;
  const pad = n => String(n).padStart(2, '0');
  const formatTime = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const currentScore = () => Math.max(100, levels[el.difficulty.value] * 250 - seconds * 3 - (moveCount - levels[el.difficulty.value]) * 20);

  function calculateStars() {
    const totalPairs = levels[el.difficulty.value];
    if (moveCount <= totalPairs * 1.5) return 3;
    if (moveCount <= totalPairs * 2.2) return 2;
    return 1;
  }

  function renderStars() {
    if (!el.stars) return;
    starRating = calculateStars();
    const starIcons = el.stars.querySelectorAll('.star');
    starIcons.forEach((star, index) => {
      if (index < starRating) {
        star.classList.remove('dimmed');
      } else {
        star.classList.add('dimmed');
      }
    });
  }

  function renderStats(){ 
    el.timer.textContent=formatTime(seconds); 
    el.moves.textContent=moveCount; 
    el.matches.textContent=`${matchCount}/${levels[el.difficulty.value]}`; 
    el.score.textContent=currentScore(); 
    renderStars();
  }

  function startTimer(){ if(started)return; started=true; el.status.textContent='In progress'; timerId=setInterval(()=>{seconds++;renderStats();if(seconds>=3600){clearInterval(timerId);timerId=null;el.status.textContent='Time limit reached';el.feedback.textContent='Start a new game to try again.';locked=true;}},1000); }
  function shuffle(items){ for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items; }
  
  function reset(){
    epoch++; clearInterval(timerId);clearTimeout(flipTimeout);clearTimeout(peekTimeout);timerId=null;first=null;second=null;locked=false;moveCount=0;matchCount=0;seconds=0;starRating=3;started=false;finished=false;peekUsed=false;finishData=null;
    el.hint.disabled=false;el.name.disabled=false;el.difficulty.disabled=false;el.feedback.textContent='';el.modal.classList.add('hidden');el.status.textContent='Ready to play';
    const deck=shuffle([...icons.slice(0,levels[el.difficulty.value]),...icons.slice(0,levels[el.difficulty.value])]);
    el.board.className=`board ${el.difficulty.value==='hard'?'hard':''}`;
    cards=deck.map((symbol,i)=>({symbol,id:i,matched:false,flipped:false}));
    el.board.replaceChildren();
    cards.forEach(card=>{
      const btn=document.createElement('button');btn.className='card';btn.type='button';btn.setAttribute('aria-label',`Hidden card ${card.id+1}`);
      btn.innerHTML='<span class="card-face card-back" aria-hidden="true">✦</span><span class="card-face card-front" aria-hidden="true"></span>';
      btn.querySelector('.card-front').textContent=card.symbol;
      btn.addEventListener('click',()=>flip(card));card.button=btn;el.board.append(btn);
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
    finished=true;clearInterval(timerId);timerId=null;el.status.textContent='Completed!';
    finishData={player:el.name.value.trim(),difficulty:el.difficulty.value,seconds:Math.max(1,seconds),moves:moveCount,stars:starRating};
    $('finalTime').textContent=formatTime(seconds);$('finalMoves').textContent=moveCount;$('finalScore').textContent=currentScore();
    if($('finalStars')) $('finalStars').textContent = '★'.repeat(starRating) + '☆'.repeat(3 - starRating);
    $('saveFeedback').textContent='';el.save.disabled=false;el.modal.classList.remove('hidden');
  }

  function peek(){
    if(locked||finished||peekUsed||first||seconds>=3585)return;
    startTimer();el.name.disabled=true;el.difficulty.disabled=true;peekUsed=true;el.hint.disabled=true;locked=true;seconds+=15;renderStats();
    const temporary=cards.filter(c=>!c.matched&&!c.flipped);temporary.forEach(showCard);
    const currentEpoch=epoch;peekTimeout=setTimeout(()=>{if(currentEpoch!==epoch)return;temporary.forEach(hideCard);locked=false;el.feedback.textContent='Peek used! 15-second penalty applied.';},1500);
  }

  async function saveScore(){
    if(!finishData)return;
    el.save.disabled=true;$('saveFeedback').textContent='Saving…';
    try{
      const response=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(finishData)});
      const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to save.');
      $('saveFeedback').textContent=`Saved! Your official score is ${data.score}.`;await loadLeaderboard();
    }catch(error){$('saveFeedback').textContent=error.message;el.save.disabled=false;}
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

  $('restartBtn').addEventListener('click',reset);$('againBtn').addEventListener('click',reset);$('hintBtn').addEventListener('click',peek);$('saveBtn').addEventListener('click',saveScore);$('refreshBtn').addEventListener('click',loadLeaderboard);
  el.difficulty.addEventListener('change',reset);
  $('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');$('themeBtn').textContent=document.body.classList.contains('light')?'☀':'☾';});
  reset();

})();