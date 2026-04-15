// BPSC AEDO 2026 — Main Application Logic
const pqData = [...pqData1, ...pqData2, ...pqData3, ...(typeof pqData4 !== 'undefined' ? pqData4 : [])];
const eqData = [...(typeof eqData1 !== 'undefined' ? eqData1 : []), ...(typeof eqData2 !== 'undefined' ? eqData2 : [])];
const allTestData = [...pqData, ...eqData];
let answered = 0, correct = 0;
let currentCat = 'all', currentPage = 1;
let eqCat = 'all', eqPage = 1, eqSearch = '';
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
    if (target === 'eq') renderEQ();
  });
});

// Search handlers
document.getElementById('akSearch').addEventListener('input', filterAK);
document.getElementById('langSearch').addEventListener('input', filterLang);
document.getElementById('eqSearch').addEventListener('input', e => { eqSearch = e.target.value.toLowerCase(); eqPage = 1; renderEQ(); });

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
    // If this is an answer-key card and a matching practice question exists, include the option text
    let optionDisplay = '';
    if (containerId === 'akList' && typeof item.q === 'number') {
      const pq = pqData.find(p => p.id === item.q);
      if (pq && Array.isArray(pq.opts) && typeof pq.ans === 'number') {
        const optText = pq.opts[pq.ans];
        optionDisplay = `<div class="ans-option">Option: <strong>${optText}</strong></div>`;
      }
    }

    d.innerHTML = `<div class="topic-badge">${item.topic}</div>
      <div class="q-header">
        <div class="q-num">Q${item.q}</div>
        <div class="q-text">${item.text}</div>
      </div>
      <div class="ans-row">
        <div class="ans-badge">✓ ${item.ans}</div>
        <div class="explanation">${item.exp}</div>
      </div>
      ${optionDisplay}`;
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
  const shuffled = [...allTestData].sort(() => Math.random() - 0.5);
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

// Update total count in stats
document.getElementById('sTotal').textContent = pqData.length + eqData.length;

// Initial render
renderCards(akData, 'akList');
renderCards(langData, 'langList');

// ═══════════════════════════════════════════
// MOST EXPECTED QUESTIONS — EQ Section Logic
// ═══════════════════════════════════════════

function getEQTypeTag(q) {
  const text = (q.q || '').toLowerCase();
  if (text.includes('कथन (a)') || text.includes('कथन a:') || text.includes('assertion') || (text.includes('a:') && text.includes('r:'))) return 'A&R';
  if (text.includes('मिलान') || text.includes('match')) return 'Matching';
  if (text.includes('कथन') && (text.includes('1.') || text.includes('1:'))) return 'Statements';
  if (q.cat && (q.cat.includes('Current') || q.cat.includes('Affairs'))) return 'Current Affairs';
  return 'MCQ';
}

function renderEQ() {
  // Build type filter bar (first time)
  const typeBar = document.getElementById('eqTypeBar');
  if (!typeBar.children.length) {
    const types = ['All', 'A&R', 'Matching', 'Statements', 'Current Affairs', 'MCQ'];
    types.forEach(t => {
      const b = document.createElement('button');
      b.className = 'type-btn' + (t === 'All' ? ' on' : '');
      b.textContent = t === 'A&R' ? '🔗 A&R' : t === 'Matching' ? '🔄 Matching' : t === 'Statements' ? '📝 Statements' : t === 'Current Affairs' ? '🗣️ CA' : t === 'All' ? '📚 All Types' : '❓ MCQ';
      b.dataset.type = t;
      b.onclick = () => {
        document.querySelectorAll('.type-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        eqPage = 1;
        renderEQCards();
      };
      typeBar.appendChild(b);
    });
  }

  // Build cat filter bar (first time)
  const fRow = document.getElementById('eqFilters');
  if (!fRow.children.length) {
    const cats = ['all', ...new Set(eqData.map(q => q.cat))];
    cats.slice(0, 18).forEach(cat => {
      const b = document.createElement('button');
      b.className = 'filter-btn' + (cat === 'all' ? ' on' : '');
      b.textContent = cat === 'all' ? '📚 All' : cat;
      b.dataset.cat = cat;
      b.onclick = () => {
        eqCat = cat; eqPage = 1;
        document.querySelectorAll('#eqFilters .filter-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        renderEQCards();
      };
      fRow.appendChild(b);
    });
  }

  renderEQCards();
}

function renderEQCards() {
  const activeType = document.querySelector('.type-btn.on')?.dataset.type || 'All';

  let filtered = eqData;
  if (eqCat !== 'all') filtered = filtered.filter(q => q.cat === eqCat);
  if (activeType !== 'All') filtered = filtered.filter(q => getEQTypeTag(q) === activeType);
  if (eqSearch) filtered = filtered.filter(q =>
    (q.q || '').toLowerCase().includes(eqSearch) ||
    (q.cat || '').toLowerCase().includes(eqSearch) ||
    (q.exp || '').toLowerCase().includes(eqSearch) ||
    (q.opts || []).some(o => o.toLowerCase().includes(eqSearch))
  );

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((eqPage - 1) * PER_PAGE, eqPage * PER_PAGE);
  const c = document.getElementById('eqList');
  c.innerHTML = '';

  if (pageData.length === 0) {
    c.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3)">No questions found. Try adjusting filters.</div>';
    document.getElementById('eqPagination').innerHTML = '';
    return;
  }

  const typeTag = getEQTypeTag;
  pageData.forEach(item => {
    const d = document.createElement('div');
    const tag = typeTag(item);
    const tagClass = tag === 'A&R' ? 'tag-ar' : tag === 'Matching' ? 'tag-match' : tag === 'Statements' ? 'tag-stmt' : 'tag-mcq';
    d.className = 'pq-card eq-card';
    d.id = `eq${item.id}`;

    // Format question text — preserve \n as line breaks
    const qText = (item.q || item.text || '').replace(/\n/g, '<br>');

    d.innerHTML = `
      <div class="eq-card-header">
        <span class="topic-badge">${item.cat}</span>
        <span class="eq-type-tag ${tagClass}">${tag}</span>
      </div>
      <div class="pq-text"><span class="q-label">${item.id}.</span> ${qText}</div>
      <div class="opts" id="eqopts${item.id}">
        ${item.opts.map((o, i) => `<div class="opt" onclick="selectEQOpt('${item.id}',${i},${item.ans})">${o}</div>`).join('')}
      </div>
      <div class="pq-exp" id="eqexp${item.id}">💡 <strong>Explanation:</strong> ${item.exp}</div>`;
    c.appendChild(d);
  });

  renderEQPagination(pages, filtered.length);
}

function selectEQOpt(id, chosen, correctIdx) {
  const opts = document.querySelectorAll(`#eqopts${id} .opt`);
  opts.forEach(o => o.classList.add('disabled'));
  opts[chosen].classList.add(chosen === correctIdx ? 'correct' : 'wrong');
  if (chosen !== correctIdx) opts[correctIdx].classList.add('show-correct');
  document.getElementById(`eqexp${id}`).classList.add('show');
  const card = document.getElementById(`eq${id}`);
  if (!card.dataset.answered) {
    card.dataset.answered = '1';
    answered++;
    if (chosen === correctIdx) correct++;
    updateStats();
  }
}

function renderEQPagination(pages, total) {
  const pg = document.getElementById('eqPagination');
  pg.innerHTML = '';
  if (pages <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '← Prev';
  prev.disabled = eqPage <= 1;
  prev.onclick = () => { if (eqPage > 1) { eqPage--; renderEQCards(); window.scrollTo(0, document.getElementById('eq').offsetTop - 80); } };
  pg.appendChild(prev);

  const maxBtns = 5;
  let start = Math.max(1, eqPage - 2);
  let end = Math.min(pages, start + maxBtns - 1);
  if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);

  for (let i = start; i <= end; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === eqPage ? ' active' : '');
    b.textContent = i;
    b.onclick = () => { eqPage = i; renderEQCards(); window.scrollTo(0, document.getElementById('eq').offsetTop - 80); };
    pg.appendChild(b);
  }

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `${total} questions`;
  pg.appendChild(info);

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Next →';
  next.disabled = eqPage >= pages;
  next.onclick = () => { if (eqPage < pages) { eqPage++; renderEQCards(); window.scrollTo(0, document.getElementById('eq').offsetTop - 80); } };
  pg.appendChild(next);
}
