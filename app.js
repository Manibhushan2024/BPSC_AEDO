// BPSC AEDO 2026 — Main Application Logic
const pqData = [...pqData1, ...pqData2, ...pqData3];
let answered = 0, correct = 0;
let currentCat = 'all', currentPage = 1;
const PER_PAGE = 15;
let testTimer = null, testSeconds = 0, testQs = [], testAnswers = {};

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById(target).classList.add('active');
    if (target === 'pq') renderPQ();
  });
});

// Search handlers
document.getElementById('akSearch').addEventListener('input', filterAK);
document.getElementById('langSearch').addEventListener('input', filterLang);

// Render answer key cards
function renderCards(data, containerId) {
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  if (data.length === 0) {
    c.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3)">No results found</div>';
    return;
  }
  data.forEach(item => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `<div class="topic-badge">${item.topic}</div>
      <div class="q-header">
        <div class="q-num">Q${item.q}</div>
        <div class="q-text">${item.text}</div>
      </div>
      <div class="ans-row">
        <div class="ans-badge">✓ ${item.ans}</div>
        <div class="explanation">${item.exp}</div>
      </div>`;
    c.appendChild(d);
  });
}

function filterAK() {
  const q = document.getElementById('akSearch').value.toLowerCase();
  const filtered = akData.filter(item =>
    item.text.toLowerCase().includes(q) ||
    item.topic.toLowerCase().includes(q) ||
    item.ans.toLowerCase().includes(q) ||
    item.exp.toLowerCase().includes(q)
  );
  renderCards(filtered, 'akList');
}

function filterLang() {
  const q = document.getElementById('langSearch').value.toLowerCase();
  const filtered = langData.filter(item =>
    (item.text || '').toLowerCase().includes(q) ||
    item.topic.toLowerCase().includes(q) ||
    item.ans.toLowerCase().includes(q)
  );
  renderCards(filtered, 'langList');
}

// Practice Questions
function renderPQ() {
  const fRow = document.getElementById('pqFilters');
  if (!fRow.children.length) {
    const cats = ['all', ...new Set(pqData.map(q => q.cat))];
    cats.forEach(cat => {
      const b = document.createElement('button');
      b.className = 'filter-btn' + (cat === 'all' ? ' on' : '');
      b.textContent = cat === 'all' ? '📚 All' : cat;
      b.onclick = () => {
        currentCat = cat; currentPage = 1;
        document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        renderPQ();
      };
      fRow.appendChild(b);
    });
  }
  const filtered = currentCat === 'all' ? pqData : pqData.filter(q => q.cat === currentCat);
  const pages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const c = document.getElementById('pqList');
  c.innerHTML = '';
  pageData.forEach(item => {
    const d = document.createElement('div');
    d.className = 'pq-card';
    d.id = `pq${item.id}`;
    d.innerHTML = `<div class="topic-badge">${item.cat}</div>
      <div class="pq-text"><span class="q-label">Q${item.id}.</span> ${item.q || item.text}</div>
      <div class="opts" id="opts${item.id}">
        ${item.opts.map((o, i) => `<div class="opt" onclick="selectOpt(${item.id},${i},${item.ans})">${o}</div>`).join('')}
      </div>
      <div class="pq-exp" id="exp${item.id}">💡 ${item.exp}</div>`;
    c.appendChild(d);
  });
  renderPagination(pages, filtered.length);
}

function renderPagination(pages, total) {
  const pg = document.getElementById('pqPagination');
  pg.innerHTML = '';
  if (pages <= 1) return;
  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '← Prev';
  prev.disabled = currentPage <= 1;
  prev.onclick = () => { if (currentPage > 1) { currentPage--; renderPQ(); window.scrollTo(0, document.getElementById('pq').offsetTop - 80); } };
  pg.appendChild(prev);

  const maxBtns = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(pages, start + maxBtns - 1);
  if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);

  for (let i = start; i <= end; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === currentPage ? ' active' : '');
    b.textContent = i;
    b.onclick = () => { currentPage = i; renderPQ(); window.scrollTo(0, document.getElementById('pq').offsetTop - 80); };
    pg.appendChild(b);
  }

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `${total} questions`;
  pg.appendChild(info);

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Next →';
  next.disabled = currentPage >= pages;
  next.onclick = () => { if (currentPage < pages) { currentPage++; renderPQ(); window.scrollTo(0, document.getElementById('pq').offsetTop - 80); } };
  pg.appendChild(next);
}

function selectOpt(id, chosen, correctIdx) {
  const opts = document.querySelectorAll(`#opts${id} .opt`);
  opts.forEach(o => { o.classList.add('disabled'); });
  opts[chosen].classList.add(chosen === correctIdx ? 'correct' : 'wrong');
  if (chosen !== correctIdx) opts[correctIdx].classList.add('show-correct');
  document.getElementById(`exp${id}`).classList.add('show');
  const card = document.getElementById(`pq${id}`);
  if (!card.dataset.answered) {
    card.dataset.answered = '1';
    answered++;
    if (chosen === correctIdx) correct++;
    updateStats();
  }
}

function updateStats() {
  document.getElementById('sAnswered').textContent = answered;
  document.getElementById('sCorrect').textContent = correct;
  const acc = answered > 0 ? Math.round((correct / answered) * 100) + '%' : '—';
  document.getElementById('sAccuracy').textContent = acc;
  document.getElementById('progFill').style.width = Math.round((answered / pqData.length) * 100) + '%';
  document.getElementById('progText').textContent = `${answered} / ${pqData.length}`;
}

// Mock Test
function startTest(count) {
  const shuffled = [...pqData].sort(() => Math.random() - 0.5);
  testQs = shuffled.slice(0, count);
  testAnswers = {};
  testSeconds = count === 25 ? 15 * 60 : count === 50 ? 30 * 60 : 60 * 60;

  document.getElementById('testConfig').style.display = 'none';
  document.getElementById('testResult').style.display = 'none';
  document.getElementById('testArea').style.display = 'block';
  document.getElementById('testProgress').textContent = `0/${count}`;

  const c = document.getElementById('testQuestions');
  c.innerHTML = '';
  testQs.forEach((item, idx) => {
    const d = document.createElement('div');
    d.className = 'pq-card';
    d.id = `tq${idx}`;
    d.innerHTML = `<div class="topic-badge">${item.cat}</div>
      <div class="pq-text"><span class="q-label">Q${idx + 1}.</span> ${item.q || item.text}</div>
      <div class="opts" id="topts${idx}">
        ${item.opts.map((o, i) => `<div class="opt" onclick="selectTestOpt(${idx},${i})">${o}</div>`).join('')}
      </div>`;
    c.appendChild(d);
  });

  startTimer();
}

function selectTestOpt(qIdx, optIdx) {
  const opts = document.querySelectorAll(`#topts${qIdx} .opt`);
  opts.forEach(o => o.classList.remove('correct'));
  opts.forEach((o, i) => { o.style.background = i === optIdx ? 'var(--accent-glow)' : ''; o.style.borderColor = i === optIdx ? 'var(--accent)' : ''; o.style.color = i === optIdx ? 'var(--text)' : ''; });
  const wasAnswered = testAnswers[qIdx] !== undefined;
  testAnswers[qIdx] = optIdx;
  if (!wasAnswered) {
    document.getElementById('testProgress').textContent = `${Object.keys(testAnswers).length}/${testQs.length}`;
  }
}

function startTimer() {
  updateTimerDisplay();
  testTimer = setInterval(() => {
    testSeconds--;
    if (testSeconds <= 0) { clearInterval(testTimer); submitTest(); return; }
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(testSeconds / 60);
  const s = testSeconds % 60;
  const el = document.getElementById('testTimer');
  el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  if (testSeconds < 60) el.style.color = 'var(--red)';
  else if (testSeconds < 300) el.style.color = 'var(--yellow)';
}

function submitTest() {
  clearInterval(testTimer);
  let testCorrect = 0, testAttempted = Object.keys(testAnswers).length;
  const total = testQs.length;

  // Show correct/wrong
  testQs.forEach((item, idx) => {
    const opts = document.querySelectorAll(`#topts${idx} .opt`);
    opts.forEach(o => { o.classList.add('disabled'); o.style.background = ''; o.style.borderColor = ''; o.style.color = ''; });
    opts[item.ans].classList.add('show-correct');
    if (testAnswers[idx] !== undefined) {
      if (testAnswers[idx] === item.ans) { opts[testAnswers[idx]].classList.add('correct'); testCorrect++; }
      else { opts[testAnswers[idx]].classList.add('wrong'); }
    }
  });

  document.getElementById('btnSubmit').style.display = 'none';
  document.getElementById('testTimer').textContent = '✅ Done';
  document.getElementById('testTimer').style.color = 'var(--green)';

  const pct = testAttempted > 0 ? Math.round((testCorrect / total) * 100) : 0;
  const wrong = testAttempted - testCorrect;
  const notAttempted = total - testAttempted;
  // Negative marking: -1/3 for wrong
  const marks = testCorrect - (wrong / 3);

  const result = document.getElementById('testResult');
  result.style.display = 'block';
  result.innerHTML = `<div class="result-card">
    <h2>📊 Test Result</h2>
    <div class="result-score ${pct >= 40 ? 'pass' : 'fail'}">${pct}%</div>
    <p style="color:var(--text2)">${pct >= 40 ? '🎉 Great job!' : '📖 Keep practicing!'}</p>
    <div class="result-detail">
      <div class="result-item"><div class="result-item-label">Total</div><div class="result-item-val">${total}</div></div>
      <div class="result-item"><div class="result-item-label">Attempted</div><div class="result-item-val">${testAttempted}</div></div>
      <div class="result-item"><div class="result-item-label" style="color:var(--green)">Correct</div><div class="result-item-val" style="color:var(--green)">${testCorrect}</div></div>
      <div class="result-item"><div class="result-item-label" style="color:var(--red)">Wrong</div><div class="result-item-val" style="color:var(--red)">${wrong}</div></div>
      <div class="result-item"><div class="result-item-label">Not Attempted</div><div class="result-item-val">${notAttempted}</div></div>
      <div class="result-item"><div class="result-item-label">Marks (−1/3)</div><div class="result-item-val">${marks.toFixed(1)}/${total}</div></div>
    </div>
    <button class="btn-retry" onclick="resetTest()">🔄 Take Another Test</button>
  </div>`;
  result.scrollIntoView({ behavior: 'smooth' });
}

function resetTest() {
  document.getElementById('testConfig').style.display = 'block';
  document.getElementById('testArea').style.display = 'none';
  document.getElementById('testResult').style.display = 'none';
  document.getElementById('btnSubmit').style.display = 'block';
}

// Update total count
document.getElementById('sTotal').textContent = pqData.length;

// Initial render
renderCards(akData, 'akList');
renderCards(langData, 'langList');
