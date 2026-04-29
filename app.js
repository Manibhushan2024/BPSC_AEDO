// BPSC AEDO 2026 — Main Application Logic
const pqData = [...pqData1, ...pqData2, ...pqData3, ...(typeof pqData4 !== 'undefined' ? pqData4 : [])];
const eqData = [...(typeof eqData1 !== 'undefined' ? eqData1 : []), ...(typeof eqData2 !== 'undefined' ? eqData2 : [])];
const mathData = [...(typeof mathData1 !== 'undefined' ? mathData1 : []), ...(typeof mathData2 !== 'undefined' ? mathData2 : [])];
const cglData = [
  ...(typeof cglData1 !== 'undefined' ? cglData1 : []),
  ...(typeof cglData2 !== 'undefined' ? cglData2 : []),
  ...(typeof cglData3 !== 'undefined' ? cglData3 : []),
  ...(typeof cglData4 !== 'undefined' ? cglData4 : [])
];
const allTestData = [...pqData, ...eqData, ...mathData, ...cglData];
let cglCat = 'all', cglPage = 1, cglSearch = '';
let answered = 0, correct = 0;
let currentCat = 'all', currentPage = 1;
let eqCat = 'all', eqPage = 1, eqSearch = '';
let mathCat = 'all', mathPage = 1, mathSearch = '';
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
    if (target === 'math') renderMath();
    if (target === 'cgl') renderCGL();
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

// ═══ MATH & REASONING SECTION ═══
document.getElementById('mathSearch').addEventListener('input', e => { mathSearch = e.target.value.toLowerCase(); mathPage = 1; renderMathCards(); });

function renderMath() {
  const fRow = document.getElementById('mathFilters');
  if (!fRow.children.length) {
    const cats = ['all', ...new Set(mathData.map(q => q.cat))];
    cats.forEach(cat => {
      const b = document.createElement('button');
      b.className = 'filter-btn' + (cat === 'all' ? ' on' : '');
      b.textContent = cat === 'all' ? '📚 All Topics' : cat;
      b.onclick = () => {
        mathCat = cat; mathPage = 1;
        document.querySelectorAll('#mathFilters .filter-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        renderMathCards();
      };
      fRow.appendChild(b);
    });
  }
  renderMathCards();
}

function renderMathCards() {
  let filtered = mathData.filter(q => {
    const matchCat = mathCat === 'all' || q.cat === mathCat;
    const matchSearch = !mathSearch || q.q.toLowerCase().includes(mathSearch) || q.cat.toLowerCase().includes(mathSearch) || q.exp.toLowerCase().includes(mathSearch);
    return matchCat && matchSearch;
  });
  const total = filtered.length;
  const pages = Math.ceil(total / PER_PAGE);
  if (mathPage > pages) mathPage = 1;
  const slice = filtered.slice((mathPage - 1) * PER_PAGE, mathPage * PER_PAGE);
  const c = document.getElementById('mathList');
  c.innerHTML = '';
  slice.forEach(q => {
    const safeId = q.id.replace(/[^a-zA-Z0-9]/g, '_');
    const d = document.createElement('div');
    d.className = 'pq-card';
    d.id = `math_card_${safeId}`;
    d.innerHTML = `<div class="topic-badge">${q.cat}</div>
      <div class="pq-text"><span class="q-label">${q.id}.</span> ${q.q.split('\n').map((line, li) => li === 0 ? line : `<span class="q-sub">${line}</span>`).join('<br>')}</div>
      <div class="opts" id="math_opts_${safeId}">
        ${q.opts.map((o, i) => `<div class="opt" onclick="selectMathOpt('${safeId}',${i},${q.ans})">${o}</div>`).join('')}
      </div>
      <div class="pq-exp" id="math_exp_${safeId}">💡 ${q.exp}</div>`;
    c.appendChild(d);
  });
  renderMathPagination(pages, total);
}

function selectMathOpt(safeId, chosen, correctIdx) {
  const card = document.getElementById('math_card_' + safeId);
  if (card.dataset.answered) return;
  card.dataset.answered = '1';
  const opts = document.querySelectorAll(`#math_opts_${safeId} .opt`);
  opts.forEach(o => o.classList.add('disabled'));
  opts[chosen].classList.add(chosen === correctIdx ? 'correct' : 'wrong');
  if (chosen !== correctIdx) opts[correctIdx].classList.add('show-correct');
  document.getElementById('math_exp_' + safeId).classList.add('show');
  answered++;
  if (chosen === correctIdx) correct++;
  updateStats();
}

function renderMathPagination(pages, total) {
  const pg = document.getElementById('mathPagination');
  pg.innerHTML = '';
  if (pages <= 1) return;
  const prev = document.createElement('button');
  prev.className = 'page-btn'; prev.textContent = '← Prev'; prev.disabled = mathPage <= 1;
  prev.onclick = () => { if (mathPage > 1) { mathPage--; renderMathCards(); window.scrollTo(0, document.getElementById('math').offsetTop - 80); } };
  pg.appendChild(prev);
  const maxBtns = 5;
  let start = Math.max(1, mathPage - 2);
  let end = Math.min(pages, start + maxBtns - 1);
  if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);
  for (let i = start; i <= end; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === mathPage ? ' active' : '');
    b.textContent = i;
    b.onclick = () => { mathPage = i; renderMathCards(); window.scrollTo(0, document.getElementById('math').offsetTop - 80); };
    pg.appendChild(b);
  }
  const info = document.createElement('span');
  info.className = 'page-info'; info.textContent = `${total} questions`;
  pg.appendChild(info);
  const next = document.createElement('button');
  next.className = 'page-btn'; next.textContent = 'Next →'; next.disabled = mathPage >= pages;
  next.onclick = () => { if (mathPage < pages) { mathPage++; renderMathCards(); window.scrollTo(0, document.getElementById('math').offsetTop - 80); } };
  pg.appendChild(next);
}

// ═══ BIHAR CGL SECTION ═══
document.getElementById('cglSearch').addEventListener('input', e => { cglSearch = e.target.value.toLowerCase(); cglPage = 1; renderCGLCards(); });

function renderCGL() {
  const fRow = document.getElementById('cglFilters');
  if (!fRow.children.length) {
    const cats = ['all', ...new Set(cglData.map(q => q.cat))];
    cats.forEach(cat => {
      const b = document.createElement('button');
      b.className = 'filter-btn' + (cat === 'all' ? ' on' : '');
      b.textContent = cat === 'all' ? '📚 All Topics' : cat;
      b.onclick = () => {
        cglCat = cat; cglPage = 1;
        document.querySelectorAll('#cglFilters .filter-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        renderCGLCards();
      };
      fRow.appendChild(b);
    });
  }
  renderCGLCards();
}

function renderCGLCards() {
  let filtered = cglData.filter(q => {
    const matchCat = cglCat === 'all' || q.cat === cglCat;
    const matchSearch = !cglSearch || q.q.toLowerCase().includes(cglSearch) || q.cat.toLowerCase().includes(cglSearch) || (q.exp && q.exp.toLowerCase().includes(cglSearch));
    return matchCat && matchSearch;
  });
  const total = filtered.length;
  const pages = Math.ceil(total / PER_PAGE);
  if (cglPage > pages) cglPage = 1;
  const slice = filtered.slice((cglPage - 1) * PER_PAGE, cglPage * PER_PAGE);
  const c = document.getElementById('cglList');
  c.innerHTML = '';
  slice.forEach(q => {
    const safeId = q.id.replace(/[^a-zA-Z0-9]/g, '_');
    const d = document.createElement('div');
    d.className = 'pq-card';
    d.id = `cgl_card_${safeId}`;
    d.innerHTML = `<div class="topic-badge">${q.cat}</div>
      <div class="pq-text"><span class="q-label">${q.id}.</span> ${q.q.split('\n').map((line, li) => li === 0 ? line : `<span class="q-sub">${line}</span>`).join('<br>')}</div>
      <div class="opts" id="cgl_opts_${safeId}">
        ${q.opts.map((o, i) => `<div class="opt" onclick="selectCGLOpt('${safeId}',${i},${q.ans})">${o}</div>`).join('')}
      </div>
      <div class="pq-exp" id="cgl_exp_${safeId}">💡 ${q.exp}</div>`;
    c.appendChild(d);
  });
  renderCGLPagination(pages, total);
}

function selectCGLOpt(safeId, chosen, correctIdx) {
  const card = document.getElementById('cgl_card_' + safeId);
  if (card.dataset.answered) return;
  card.dataset.answered = '1';
  const opts = document.querySelectorAll(`#cgl_opts_${safeId} .opt`);
  opts.forEach(o => o.classList.add('disabled'));
  opts[chosen].classList.add(chosen === correctIdx ? 'correct' : 'wrong');
  if (chosen !== correctIdx) opts[correctIdx].classList.add('show-correct');
  document.getElementById('cgl_exp_' + safeId).classList.add('show');
  answered++;
  if (chosen === correctIdx) correct++;
  updateStats();
}

function renderCGLPagination(pages, total) {
  const pg = document.getElementById('cglPagination');
  pg.innerHTML = '';
  if (pages <= 1) return;
  const prev = document.createElement('button');
  prev.className = 'page-btn'; prev.textContent = '← Prev'; prev.disabled = cglPage <= 1;
  prev.onclick = () => { if (cglPage > 1) { cglPage--; renderCGLCards(); window.scrollTo(0, document.getElementById('cgl').offsetTop - 80); } };
  pg.appendChild(prev);
  const maxBtns = 5;
  let start = Math.max(1, cglPage - 2);
  let end = Math.min(pages, start + maxBtns - 1);
  if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);
  for (let i = start; i <= end; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === cglPage ? ' active' : '');
    b.textContent = i;
    b.onclick = () => { cglPage = i; renderCGLCards(); window.scrollTo(0, document.getElementById('cgl').offsetTop - 80); };
    pg.appendChild(b);
  }
  const info = document.createElement('span');
  info.className = 'page-info'; info.textContent = `${total} questions`;
  pg.appendChild(info);
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn'; nextBtn.textContent = 'Next →'; nextBtn.disabled = cglPage >= pages;
  nextBtn.onclick = () => { if (cglPage < pages) { cglPage++; renderCGLCards(); window.scrollTo(0, document.getElementById('cgl').offsetTop - 80); } };
  pg.appendChild(nextBtn);
}

// ═══════════════════════════════════════════
// PDF PRINT / DOWNLOAD FEATURE
// ═══════════════════════════════════════════

function printAsPDF(questions, title, subtitle) {
  if (!questions || questions.length === 0) {
    alert('कोई प्रश्न नहीं मिला! / No questions found for current filter.'); return;
  }
  const L = ['A','B','C','D'];

  let qHtml = '';
  questions.forEach((q, i) => {
    const parts = (q.q || q.text || '').split('\n');
    const hi = parts[0] || '';
    const en = parts[1] || '';
    qHtml += `<div class="qb">
      <div class="qn">Q${i+1}. <span class="qid">[${q.id || (i+1)}]</span><span class="qcat">${q.cat || ''}</span></div>
      <div class="qt">${hi}</div>
      ${en ? `<div class="qe">${en}</div>` : ''}
      <div class="opts4">
        ${(q.opts||[]).map(o=>`<div class="o4">${o}</div>`).join('')}
      </div>
    </div>`;
  });

  let akHtml = `<div class="pg-break"></div>
  <div class="ak-sec">
    <h2 class="ak-h">&#10003; Answer Key &nbsp;/&nbsp; उत्तर कुंजी</h2>
    <p class="ak-sub">${title} — ${questions.length} Questions</p>
    <table class="akt">
      <thead><tr><th>Q.No</th><th>ID</th><th>Category</th><th>Correct Answer</th></tr></thead>
      <tbody>`;
  questions.forEach((q, i) => {
    const ai = q.ans;
    const al = L[ai] || '?';
    const at = (q.opts||[])[ai] || '';
    akHtml += `<tr><td>Q${i+1}</td><td>${q.id||''}</td><td>${q.cat||''}</td><td><b>${al}.</b> ${at}</td></tr>`;
  });
  akHtml += `</tbody></table></div>`;

  const html = `<!DOCTYPE html>
<html lang="hi"><head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page{size:A4;margin:12mm 10mm}
*{box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:10.5pt;color:#000;margin:0;padding:0}
.cover{text-align:center;padding:60mm 20mm;border-bottom:3px solid #1a237e}
.cover h1{font-size:18pt;color:#1a237e;margin-bottom:8px}
.cover .csub{font-size:12pt;color:#37474f;margin-bottom:6px}
.cover .cmeta{font-size:10pt;color:#555;margin-top:18px;line-height:1.8}
.cover .ccount{font-size:22pt;font-weight:bold;color:#c62828;margin:12px 0}
.pg-break{page-break-after:always}
.sec-head{font-size:13pt;font-weight:bold;color:#1a237e;border-bottom:2px solid #1a237e;padding:4px 0;margin:6px 0 12px}
.qb{margin-bottom:11px;padding:6px 4px 8px;border-bottom:1px dashed #ccc;page-break-inside:avoid}
.qn{font-weight:bold;font-size:9.5pt;color:#333;margin-bottom:2px}
.qid{font-weight:normal;font-size:8.5pt;color:#888;margin-right:4px}
.qcat{font-size:8pt;background:#e8eaf6;color:#3949ab;padding:1px 6px;border-radius:10px;margin-left:6px;font-weight:normal}
.qt{font-size:10.5pt;font-weight:500;margin:2px 0}
.qe{font-size:9.5pt;color:#444;margin:1px 0 4px}
.opts4{display:grid;grid-template-columns:1fr 1fr;gap:1px 12px;margin-top:3px}
.o4{font-size:9.5pt;padding:1px 4px;color:#222}
.ak-sec{margin-top:8px}
.ak-h{text-align:center;font-size:15pt;color:#1a237e;margin-bottom:4px}
.ak-sub{text-align:center;font-size:10pt;color:#555;margin-bottom:12px}
.akt{width:100%;border-collapse:collapse;font-size:9pt}
.akt thead tr{background:#1a237e;color:#fff}
.akt th{padding:5px 7px;text-align:left;font-weight:600}
.akt td{border:1px solid #ccc;padding:3px 6px}
.akt tr:nth-child(even) td{background:#f5f5f5}
.akt td:first-child,.akt td:nth-child(2){text-align:center;font-weight:bold;white-space:nowrap}
.footer{text-align:center;font-size:8pt;color:#aaa;margin-top:14px;border-top:1px solid #eee;padding-top:6px}
@media print{.pg-break{page-break-after:always}.qb{page-break-inside:avoid}}
</style>
</head>
<body>
<div class="cover">
  <h1>${title}</h1>
  <div class="csub">${subtitle || 'BPSC AEDO / BSSC CGL Exam Preparation'}</div>
  <div class="ccount">${questions.length} Questions</div>
  <div class="cmeta">
    &#128197; Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}<br>
    &#127760; bpsc-aedo-app.vercel.app<br>
    <i>For Educational Purposes Only</i>
  </div>
</div>
<div class="pg-break"></div>
<div class="sec-head">&#128221; Questions / प्रश्न</div>
${qHtml}
${akHtml}
<div class="footer">BPSC AEDO / Bihar CGL Exam Preparation &mdash; Educational Use Only &mdash; bpsc-aedo-app.vercel.app</div>
<script>setTimeout(function(){window.print();},600);</script>
</body></html>`;

  const w = window.open('','_blank','width=900,height=700,scrollbars=yes');
  if (!w) { alert('Pop-up blocked! Please allow pop-ups for this site.'); return; }
  w.document.write(html);
  w.document.close();
}

function downloadCGLPDF() {
  const filtered = cglData.filter(q => {
    const mc = cglCat === 'all' || q.cat === cglCat;
    const ms = !cglSearch || q.q.toLowerCase().includes(cglSearch) || q.cat.toLowerCase().includes(cglSearch);
    return mc && ms;
  });
  const label = cglCat === 'all' ? '500 Most Expected Questions' : cglCat;
  printAsPDF(filtered, 'Bihar CGL — ' + label, 'BSSC CGL Exam — GK • Science • Math • Reasoning');
}

function downloadPQPDF() {
  const filtered = currentCat === 'all' ? pqData : pqData.filter(q => q.cat === currentCat);
  const label = currentCat === 'all' ? '500 Practice Questions' : currentCat;
  printAsPDF(filtered, 'BPSC AEDO Practice — ' + label, 'General Studies • Bihar GK • Environment • Polity');
}

function downloadEQPDF() {
  const activeType = document.querySelector('.type-btn.on')?.dataset.type || 'All';
  let filtered = eqData;
  if (eqCat !== 'all') filtered = filtered.filter(q => q.cat === eqCat);
  if (activeType !== 'All') filtered = filtered.filter(q => getEQTypeTag(q) === activeType);
  if (eqSearch) filtered = filtered.filter(q => (q.q||'').toLowerCase().includes(eqSearch) || (q.cat||'').toLowerCase().includes(eqSearch));
  const label = eqCat === 'all' ? '500 Most Expected Questions' : eqCat;
  printAsPDF(filtered, 'BPSC AEDO Most Expected — ' + label, 'Assertion-Reason • Matching • Statement-Based • Current Affairs');
}

function downloadMathPDF() {
  const filtered = mathData.filter(q => {
    const mc = mathCat === 'all' || q.cat === mathCat;
    const ms = !mathSearch || q.q.toLowerCase().includes(mathSearch) || q.cat.toLowerCase().includes(mathSearch);
    return mc && ms;
  });
  const label = mathCat === 'all' ? '300 Questions' : mathCat;
  printAsPDF(filtered, 'Math & Reasoning — ' + label, 'Number System • Percentage • Ratio • Algebra • Mensuration • Reasoning');
}
