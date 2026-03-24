(function(){
'use strict';
const $ = id => document.getElementById(id);
const fmt = n => (n >= 0 ? '$' : '-$') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

/* ── Dice ── */
const FACE_MAP = { 1:'front', 6:'back', 2:'right', 5:'left', 3:'top', 4:'bottom' };
const DICE_ROT = {
  1:'rotateX(0deg) rotateY(0deg)',
  6:'rotateY(180deg)',
  2:'rotateY(90deg)',
  5:'rotateY(-90deg)',
  3:'rotateX(-90deg)',
  4:'rotateX(90deg)',
};
const FACE_DOTS = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };

function updateDiceDots(result) {
  const dg = $('dg-' + result);
  if (!dg) return;
  dg.querySelectorAll('.ddot').forEach((d, i) => {
    d.classList.toggle('on', (FACE_DOTS[result] || []).includes(i + 1));
  });
}

function animateDice(result) {
  const dice = $('dice');
  dice.classList.remove('rolling');
  void dice.offsetWidth;
  dice.classList.add('rolling');
  dice.style.transform = DICE_ROT[result] || DICE_ROT[1];
  updateDiceDots(result);
  setTimeout(() => dice.classList.remove('rolling'), 420);
}

/* ── Strategy descriptions ── */
const STRAT_DESC = {
  fixed: '每局下注相同金额，稳定亏损。大数定律的最纯粹演示。',
  martingale: '输了翻倍下注，赢了回到最低注。短期可能小赚，但一次连输就爆仓。',
  parlay: '把赢来的利润全部押上，滚雪球。看起来很爽，但一把输光所有利润。',
  ratio: '每次下注本金的10%。听起来保守，但持续亏损时同样必然归零。',
  random: '情绪化下注——赢时加大注，输时急于翻本乱加注。',
};

/* ── Speed ── */
const SPEEDS = { 1:30, 2:100, 3:300, 4:700, 5:1500 };
const SPEED_LABELS = { 1:'闪电', 2:'标准', 3:'中速', 4:'慢速', 5:'极慢' };

/* ── State ── */
let S = {};
function resetState() {
  S = {
    mode: 'classic',
    initialBalance: 10000,
    baseBet: 100,
    maxRounds: 500,
    speed: 2,
    strategy: 'fixed',
    balance: 10000,
    currentBet: 100,
    wins: 0, losses: 0, rounds: 0,
    history: [], balHistory: [10000],
    maxWin: 0, maxLose: 0,
    streakWins: 0, streakLosses: 0,
    maxStreakWins: 0, maxStreakLosses: 0,
    martingaleLoss: 0,
    running: false, paused: false,
    timer: null,
    dispBal: 10000,
    animId: null,
    consecutiveSign: 0,
  };
}
resetState();

/* ── Game Logic ── */
function winProb() { return S.mode === 'classic' ? 0.5 : 0.48; }
function houseEdge() { return S.mode === 'baccarat' ? 0.05 : 0; }

function computeBet() {
  const s = S.strategy;
  if (s === 'fixed') return S.baseBet;
  if (s === 'martingale') {
    return S.martingaleLoss > 0
      ? Math.min(S.baseBet * Math.pow(2, S.martingaleLoss), S.balance)
      : S.baseBet;
  }
  if (s === 'parlay') return S.currentBet;
  if (s === 'ratio') return Math.max(Math.floor(S.balance * 0.1), 1);
  if (s === 'random') {
    const f = 0.05 + Math.random() * 0.5;
    return Math.max(Math.floor(S.balance * f), 1);
  }
  return S.baseBet;
}

function gameStep() {
  if (!S.running || S.paused) return;
  if (S.rounds >= S.maxRounds || S.balance <= 0) {
    stopGame();
    if (S.balance <= 0) showGameOver();
    return;
  }

  S.currentBet = Math.min(computeBet(), S.balance);
  const result = Math.floor(Math.random() * 6) + 1;
  const isWin = Math.random() < winProb();
  const edge = houseEdge();
  const payout = isWin ? S.currentBet * (1 - edge) : -S.currentBet;

  animateDice(result);
  setTimeout(() => {}, 0);

  const prevBal = S.balance;
  S.balance = Math.max(0, S.balance + payout);
  S.rounds++;

  animBalance(S.balance);
  const chg = $('bal-c');
  chg.textContent = (payout >= 0 ? '+' : '') + fmt(payout);
  chg.className = 'bal-chg ' + (payout >= 0 ? 'p' : 'n');

  flashResult(isWin);
  spawnParticles(isWin);

  if (isWin) {
    S.wins++;
    S.maxWin = Math.max(S.maxWin, payout);
    S.martingaleLoss = 0;
    S.streakWins++;
    S.streakLosses = 0;
    S.maxStreakWins = Math.max(S.maxStreakWins, S.streakWins);
  } else {
    S.losses++;
    S.maxLose = Math.max(S.maxLose, Math.abs(payout));
    S.martingaleLoss++;
    S.streakLosses++;
    S.streakWins = 0;
    S.maxStreakLosses = Math.max(S.maxStreakLosses, S.streakLosses);
  }

  S.history.push(isWin ? 1 : 0);
  if (S.history.length > 50) S.history.shift();
  if (S.rounds % 2 === 0 || S.rounds <= 20) {
    S.balHistory.push(S.balance);
    if (S.balHistory.length > 2000) S.balHistory.shift();
  }

  addDot(isWin);
  updateHeatmap(isWin);
  updateUI();
  updateBalColor();
  updateEdgeWarn();

  if (S.balance <= 0) {
    S.balance = 0;
    stopGame();
    showGameOver();
  }
}

/* ── Animation ── */
function animBalance(target) {
  if (S.animId) cancelAnimationFrame(S.animId);
  const from = S.dispBal;
  const diff = target - from;
  const dur = 280;
  const t0 = performance.now();
  function step(now) {
    const t = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    S.dispBal = from + diff * ease;
    $('bal-v').textContent = fmt(Math.round(S.dispBal));
    if (t < 1) S.animId = requestAnimationFrame(step);
    else { S.dispBal = target; $('bal-v').textContent = fmt(target); }
  }
  S.animId = requestAnimationFrame(step);
}

/* ── Flash result ── */
function flashResult(isWin) {
  const el = $('flash');
  el.textContent = isWin ? '\u2726 WIN' : '\u2715 LOSE';
  el.className = 'rf ' + (isWin ? 'win' : 'lose');
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 700);
}

/* ── Particles ── */
function spawnParticles(isWin) {
  const ga = $('ga');
  const r = ga.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const color = isWin ? 'var(--win)' : 'var(--lose)';
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className = 'par';
    const sz = 4 + Math.random() * 6;
    const ang = (Math.PI * 2 / 10) * i;
    const dist = 60 + Math.random() * 100;
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${color};--tx:${Math.cos(ang)*dist}px;--ty:${Math.sin(ang)*dist}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 850);
  }
}

/* ── Balance color ── */
function updateBalColor() {
  const el = $('bal-v');
  const r = S.balance / S.initialBalance;
  el.classList.remove('normal', 'warn', 'dan');
  if (r > 0.5) el.classList.add('normal');
  else if (r > 0.2) el.classList.add('warn');
  else el.classList.add('dan');
}

function updateEdgeWarn() {
  const ew = $('ew');
  if (S.balance / S.initialBalance < 0.2) ew.classList.add('on');
  else ew.classList.remove('on');
}

/* ── History dot ── */
function addDot(isWin) {
  const hd = $('hd');
  const d = document.createElement('div');
  d.className = 'hdot ' + (isWin ? 'w' : 'l');
  hd.appendChild(d);
  if (hd.children.length > 50) hd.removeChild(hd.firstChild);
}

/* ── Heatmap ── */
function initHeatmap() {
  const g = $('hmg');
  g.innerHTML = '';
  for (let i = 0; i < 50; i++) {
    const c = document.createElement('div');
    c.className = 'hmc';
    c.id = 'hm' + i;
    g.appendChild(c);
  }
}

function updateHeatmap() {
  S.history.forEach((v, i) => {
    const c = $('hm' + i);
    if (!c) return;
    if (v === 1) {
      c.style.background = 'var(--win)';
      c.style.boxShadow = '0 0 3px var(--win)';
    } else {
      c.style.background = 'var(--lose)';
      c.style.boxShadow = '0 0 3px var(--lose)';
    }
  });
}

/* ── Canvas ── */
function drawBalCanvas() {
  const cv = $('bal-canvas');
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  cv.width = cv.offsetWidth * dpr;
  cv.height = 110 * dpr;
  ctx.scale(dpr, dpr);
  const W = cv.offsetWidth, H = 110;
  ctx.clearRect(0, 0, W, H);
  if (S.balHistory.length < 2) return;
  const data = S.balHistory;
  const max = Math.max(...data, S.initialBalance);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  // Grid
  ctx.strokeStyle = '#1a2332'; ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = H * i / 4;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Initial line
  const iy = H - (S.initialBalance - min) / range * H;
  ctx.strokeStyle = '#2a3a50'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(W, iy); ctx.stroke();
  ctx.setLineDash([]);
  // Line
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#00b0ff'); grad.addColorStop(1, '#7c4dff');
  ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.beginPath();
  data.forEach((v, i) => {
    const x = i / (data.length - 1) * W;
    const y = H - (v - min) / range * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Fill
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  const fg = ctx.createLinearGradient(0, 0, 0, H);
  fg.addColorStop(0, 'rgba(0,176,255,0.15)'); fg.addColorStop(1, 'rgba(0,176,255,0)');
  ctx.fillStyle = fg; ctx.fill();
}

function drawWinrateCanvas() {
  const cv = $('wr-canvas');
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  cv.width = cv.offsetWidth * dpr;
  cv.height = 38 * dpr;
  ctx.scale(dpr, dpr);
  const W = cv.offsetWidth, H = 38;
  ctx.clearRect(0, 0, W, H);
  const total = S.wins + S.losses;
  if (total === 0) return;
  const wr = S.wins / total;
  const theory = winProb();
  const tx = theory * W;
  // Theory line
  ctx.strokeStyle = '#ffd600'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, H); ctx.stroke();
  ctx.setLineDash([]);
  // Bar: win green, loss red
  const wW = wr * W;
  const bg = ctx.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, '#00e676'); bg.addColorStop(Math.max(0, wr - 0.01), '#00e676');
  bg.addColorStop(Math.min(1, wr + 0.01), '#ff3d3d'); bg.addColorStop(1, '#ff3d3d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, H - 7, wW, 7);
  // Ticks
  ctx.fillStyle = '#2a3a50';
  for (let i = 0; i <= 10; i++) {
    ctx.fillRect(i / 10 * W, H - 7, 1, 7);
  }
}

/* ── Update UI ── */
function updateUI() {
  const total = S.wins + S.losses;
  const wp = total > 0 ? (S.wins / total * 100).toFixed(1) : null;
  const theory = winProb();
  const dev = total > 0 ? ((S.wins / total - theory) * 100).toFixed(2) : null;

  $('wr-pct').textContent = wp ? wp + '%' : '—';
  $('th-rt').textContent = (theory * 100).toFixed(0) + '%';
  $('rt-dev').textContent = dev !== null ? ((parseFloat(dev) >= 0 ? '+' : '') + dev + '%') : '—';

  $('sc-w').textContent = S.wins;
  $('sc-l').textContent = S.losses;
  $('sc-mw').textContent = fmt(S.maxWin);
  $('sc-ml').textContent = fmt(S.maxLose);
  $('sc-sw').textContent = S.maxStreakWins;
  $('sc-sl').textContent = S.maxStreakLosses;

  const roi = S.initialBalance > 0 ? ((S.balance - S.initialBalance) / S.initialBalance * 100).toFixed(1) : '0';
  const roiEl = $('sc-roi');
  roiEl.textContent = (parseFloat(roi) >= 0 ? '+' : '') + roi + '%';
  roiEl.style.color = parseFloat(roi) >= 0 ? 'var(--win)' : 'var(--lose)';

  const evLoss = S.rounds * S.baseBet * houseEdge();
  $('sc-ev').textContent = '-$' + Math.round(evLoss).toLocaleString();

  // Progress
  const pct = (S.rounds / S.maxRounds * 100).toFixed(1);
  $('pbf').style.width = pct + '%';
  $('pl-t').textContent = `${S.rounds} / ${S.maxRounds} 局`;
  $('pl-s').textContent = `连胜 ${S.maxStreakWins} | 连负 ${S.maxStreakLosses}`;
  $('ft-rnd').textContent = S.rounds;

  // Bet display
  $('chip').textContent = fmt(S.currentBet);
  $('cur-bet').textContent = fmt(S.currentBet);

  updateConclusion();
  drawBalCanvas();
  drawWinrateCanvas();
}

function updateConclusion() {
  if (S.rounds === 0) {
    $('cl1').textContent = '开始模拟，观察大数定律如何蚕食本金。';
    $('cl2').textContent = '50% 胜率不等于能赢——长期玩必然归零。';
    return;
  }
  const total = S.wins + S.losses;
  const actualRate = total > 0 ? (S.wins / total * 100).toFixed(1) : '0';
  const theoryPct = (winProb() * 100).toFixed(0);
  const ratio = S.balance / S.initialBalance;
  const evPct = (houseEdge() * 100).toFixed(1);

  $('cl1').innerHTML = `玩了 <em>${S.rounds}</em> 局，实际胜率 <strong>${actualRate}%</strong>（理论 ${theoryPct}%）`;

  if (parseFloat(evPct) > 0) {
    const evLossPct = (S.rounds * S.baseBet * houseEdge() / S.initialBalance * 100).toFixed(1);
    $('cl2').innerHTML = `庄家抽水 ${evPct}% · 每100局蒸发约<strong>${evLossPct}%</strong>本金 · ${ratio < 0.5 ? '⚠️' : ''} 剩余 <em>${ratio < 0.01 ? '<1' : (ratio * 100).toFixed(1)}%</em>`;
  } else {
    if (ratio < 0.1) {
      $('cl2').innerHTML = `本金只剩 <strong>${(ratio * 100).toFixed(1)}%</strong> · 破产倒计时开始`;
    } else if (ratio < 0.5) {
      $('cl2').innerHTML = `本金已蒸发 <strong>${((1 - ratio) * 100).toFixed(1)}%</strong> · 继续玩只会更接近零`;
    } else {
      $('cl2').innerHTML = `大数定律需要更多局数才能显现——胜率越接近50%，亏损显现越慢`;
    }
  }
}

/* ── Game control ── */
function startGame() {
  if (S.running) {
    S.paused = !S.paused;
    const btn = $('btn-main');
    if (S.paused) {
      btn.textContent = '\u25B6 继续';
      btn.className = 'btn btn-start';
    } else {
      btn.textContent = '\u23F8 暂停';
      btn.className = 'btn btn-pause';
    }
    return;
  }

  S.running = true;
  S.paused = false;
  S.balance = S.initialBalance;
  S.dispBal = S.initialBalance;
  S.currentBet = S.baseBet;
  S.wins = 0; S.losses = 0; S.rounds = 0;
  S.history = []; S.balHistory = [S.initialBalance];
  S.maxWin = 0; S.maxLose = 0;
  S.streakWins = 0; S.streakLosses = 0;
  S.maxStreakWins = 0; S.maxStreakLosses = 0;
  S.martingaleLoss = 0;

  $('bal-v').textContent = fmt(S.initialBalance);
  $('bal-v').className = 'bal-val normal';
  $('bal-c').textContent = '';
  $('hd').innerHTML = '';
  $('pbf').style.width = '0%';
  $('pl-t').textContent = `0 / ${S.maxRounds} 局`;
  $('ft-rnd').textContent = '0';
  $('ew').classList.remove('on');
  $('go').classList.remove('show');
  initHeatmap();

  const btn = $('btn-main');
  btn.textContent = '\u23F8 暂停';
  btn.className = 'btn btn-pause';

  $('ft-dly').textContent = SPEEDS[S.speed] + 'ms';
  S.timer = setInterval(gameStep, SPEEDS[S.speed]);
}

function stopGame() {
  S.running = false;
  S.paused = false;
  if (S.timer) { clearInterval(S.timer); S.timer = null; }
  const btn = $('btn-main');
  btn.textContent = '\u25B6 开始模拟';
  btn.className = 'btn btn-start';
}

function resetGame() {
  stopGame();
  resetState();
  S.initialBalance = parseInt($('inp-ib').value) || 10000;
  S.balance = S.initialBalance;
  S.dispBal = S.initialBalance;
  S.baseBet = parseInt($('sl-bet').value);
  S.maxRounds = parseInt($('sl-rnd').value);
  S.strategy = $('sel-str').value;
  S.balHistory = [S.initialBalance];

  $('bal-v').textContent = fmt(S.initialBalance);
  $('bal-v').className = 'bal-val normal';
  $('bal-c').textContent = '';
  $('hd').innerHTML = '';
  $('pbf').style.width = '0%';
  $('ew').classList.remove('on');
  $('go').classList.remove('show');
  $('ft-rnd').textContent = '0';

  updateUI();
  drawBalCanvas();
  drawWinrateCanvas();
}

function showGameOver() {
  const total = S.wins + S.losses;
  const rate = total > 0 ? (S.wins / total * 100).toFixed(1) + '%' : '0%';
  $('go-r').textContent = S.rounds;
  $('go-w').textContent = S.wins;
  $('go-p').textContent = rate;

  const msgs = [
    `坚持了 ${S.rounds} 局，最终还是输光了本金。数学不会骗人。`,
    `${S.rounds} 局后归零——这不是运气不好，这是概率的必然结果。`,
    `胜率 ${rate}，和理论的 ${(winProb()*100).toFixed(0)}% 相差不大。大数定律显现了。`,
  ];
  $('go-s').textContent = msgs[Math.floor(Math.random() * msgs.length)];
  $('go').classList.add('show');
}

/* ── Events ── */
$('tab-classic').addEventListener('click', () => {
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  $('tab-classic').classList.add('active');
  S.mode = 'classic';
  $('badge').textContent = '经典模式 \u00b7 50% 胜率';
  drawWinrateCanvas(); updateConclusion();
});

$('tab-baccarat').addEventListener('click', () => {
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  $('tab-baccarat').classList.add('active');
  S.mode = 'baccarat';
  $('badge').textContent = '百家乐模式 \u00b7 48% 胜率 + 5% 抽水';
  drawWinrateCanvas(); updateConclusion();
});

$('sl-bet').addEventListener('input', e => {
  S.baseBet = parseInt(e.target.value);
  $('fv-bet').textContent = fmt(S.baseBet);
  if (!S.running) { S.currentBet = S.baseBet; $('chip').textContent = fmt(S.baseBet); $('cur-bet').textContent = fmt(S.baseBet); }
});

$('sl-rnd').addEventListener('input', e => {
  S.maxRounds = parseInt(e.target.value);
  $('fv-rnd').textContent = S.maxRounds;
  $('pl-t').textContent = `${S.rounds} / ${S.maxRounds} 局`;
});

$('sl-spd').addEventListener('input', e => {
  S.speed = parseInt(e.target.value);
  $('fv-spd').textContent = SPEED_LABELS[S.speed];
  $('ft-spd').innerHTML = `<span class="sd"></span>${SPEED_LABELS[S.speed]}`;
  if (S.running) {
    clearInterval(S.timer);
    $('ft-dly').textContent = SPEEDS[S.speed] + 'ms';
    S.timer = setInterval(gameStep, SPEEDS[S.speed]);
  }
});

$('inp-ib').addEventListener('change', e => {
  S.initialBalance = Math.max(100, parseInt(e.target.value) || 10000);
  e.target.value = S.initialBalance;
  $('fv-ib').textContent = fmt(S.initialBalance);
  if (!S.running) {
    S.balance = S.initialBalance;
    S.dispBal = S.initialBalance;
    S.balHistory = [S.initialBalance];
    $('bal-v').textContent = fmt(S.initialBalance);
    drawBalCanvas();
    updateConclusion();
  }
});

$('sel-str').addEventListener('change', e => {
  S.strategy = e.target.value;
  $('sdesc').textContent = STRAT_DESC[S.strategy] || '';
  S.martingaleLoss = 0;
  if (!S.running) { S.currentBet = S.baseBet; $('chip').textContent = fmt(S.baseBet); $('cur-bet').textContent = fmt(S.baseBet); }
});

$('btn-main').addEventListener('click', startGame);
$('btn-rst').addEventListener('click', resetGame);
$('go-b').addEventListener('click', () => { $('go').classList.remove('show'); resetGame(); });

/* Visibility change: auto-pause */
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.running && !S.paused) {
    S.paused = true;
    const btn = $('btn-main');
    btn.textContent = '\u25B6 继续';
    btn.className = 'btn btn-start';
  }
});

/* Resize */
let rTimer;
window.addEventListener('resize', () => {
  clearTimeout(rTimer);
  rTimer = setTimeout(() => { drawBalCanvas(); drawWinrateCanvas(); }, 100);
});

/* ── Init ── */
function initDiceDots() {
  const FACE_DOTS_9 = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
  const faceMap = { 1:'df-1', 6:'df-6', 2:'df-2', 5:'df-5', 3:'df-3', 4:'df-4' };
  Object.entries(faceMap).forEach(([result, faceId]) => {
    const dg = $('dg-' + result);
    if (!dg) return;
    dg.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
      const dot = document.createElement('div');
      dot.className = 'ddot';
      if ((FACE_DOTS_9[result] || []).includes(i)) dot.classList.add('on');
      dg.appendChild(dot);
    }
  });
}
initDiceDots();
initHeatmap();
updateUI();
$('fv-ib').textContent = fmt(S.initialBalance);
})();
