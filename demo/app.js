/**
 * app.js
 *
 * DOM wiring and animation for the case-file demo. All of the actual
 * logic (SHA-256 chaining, Shamir's Secret Sharing, Jaccard similarity)
 * lives in ../src/*.js and is loaded before this file as plain scripts,
 * attaching to window.CustodyChain, window.Shamir, and window.Similarity.
 * This file only talks to those APIs and updates the page; it does not
 * reimplement any of the cryptography or math itself.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progressFill = document.getElementById('progressFill');
  function updateProgress() {
    const h = document.documentElement;
    const scrolled = h.scrollTop || document.body.scrollTop;
    const height = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    progressFill.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ============================= EXHIBIT A: TIMELINE (narrative) ============================= */
  const stages = [
    { day: 'T-30', title: 'Insider access', desc: 'Someone with legitimate access to the question bank writes the paper out by hand. No system logs a "leak" yet, because on paper, nothing has left the building.', spread: 2 },
    { day: 'T-24', title: 'First scan', desc: 'The handwritten copy is scanned into a PDF, roughly 400 questions, and starts moving as a digital file for the first time.', spread: 10 },
    { day: 'T-19', title: 'Coaching circles', desc: 'The PDF begins circulating through coaching networks across several states, marketed as a "guess paper" rather than the real thing.', spread: 24 },
    { day: 'T-5', title: 'Wider forwarding', desc: 'Forwards multiply through private groups. Investigators later recover payment records tied to this stretch.', spread: 42 },
    { day: 'T-0', title: 'Exam day', desc: '22.7 lakh students sit the exam. Almost none of them know a version of it has already been circulating for weeks.', spread: 60 },
    { day: 'T+1', title: 'Caught, by hand', desc: 'A chemistry teacher in Sikar compares the guess paper against the real one at 1:30am. 120 of roughly 400 questions match.', spread: 60 },
  ];
  const tlSlider = document.getElementById('tlSlider');
  const tlDay = document.getElementById('tlDay');
  const tlTitle = document.getElementById('tlTitle');
  const tlDesc = document.getElementById('tlDesc');
  const tlCount = document.getElementById('tlCount');
  const tlSwarm = document.getElementById('tlSwarm');
  const tlPlay = document.getElementById('tlPlay');
  const SWARM_TOTAL = 60;
  for (let i = 0; i < SWARM_TOTAL; i++) tlSwarm.appendChild(document.createElement('i'));
  const swarmDots = tlSwarm.querySelectorAll('i');

  function renderStage(idx) {
    const s = stages[idx];
    tlDay.textContent = s.day;
    tlTitle.textContent = s.title;
    tlDesc.textContent = s.desc;
    tlSlider.setAttribute('aria-valuetext', 'Day ' + s.day + ', ' + s.title);
    const approxCopies = idx === 0 ? 1 : Math.round(Math.pow(s.spread, 2.1));
    tlCount.textContent = approxCopies.toLocaleString('en-IN');
    swarmDots.forEach((dot, i) => dot.classList.toggle('lit', i < s.spread));
  }
  tlSlider.addEventListener('input', (e) => renderStage(parseInt(e.target.value, 10)));
  renderStage(0);

  let tlTimer = null;
  tlPlay.addEventListener('click', () => {
    if (tlTimer) {
      clearInterval(tlTimer);
      tlTimer = null;
      tlPlay.textContent = '▶ Replay timeline';
      return;
    }
    let i = 0;
    tlSlider.value = 0;
    renderStage(0);
    tlPlay.textContent = '⏸ Playing…';
    tlTimer = setInterval(() => {
      i++;
      if (i > stages.length - 1) {
        clearInterval(tlTimer);
        tlTimer = null;
        tlPlay.textContent = '▶ Replay timeline';
        return;
      }
      tlSlider.value = i;
      renderStage(i);
    }, reduceMotion ? 1 : 1300);
  });

  /* ============================= EXHIBIT B: SHA-256 CUSTODY CHAIN (real, via CustodyChain) ============================= */
  const custodyRoles = ['Question Setter', 'Print Vendor', 'Transport Custodian', 'District Coordinator', 'Centre Proctor', 'Records Clerk'];
  const defaultNotes = [
    'Finalised question set for Version A.',
    'Received sealed print run, 5400 centre packets.',
    'Collected packets for regional dispatch.',
    'Verified seal integrity on centre arrival.',
    'Opened sealed packet at exam start.',
    'Logged answer sheets post-exam.',
  ];
  const BREACH_INDEX = 2;
  let genesisHash = null;
  let sealedBlocks = [];
  let currentNotes = defaultNotes.slice();

  function formatTime(ms) {
    return new Date(ms).toISOString().slice(11, 19) + ' UTC';
  }

  async function buildRealChain() {
    currentNotes = defaultNotes.slice();
    if (!window.CustodyChain) return;
    const baseTime = Date.now();
    const entries = custodyRoles.map((role, i) => ({
      role,
      note: defaultNotes[i],
      time: baseTime - (custodyRoles.length - i) * 3600 * 1000,
    }));
    const result = await window.CustodyChain.buildChain(entries, 'exam-custody-demo');
    genesisHash = result.genesisHash;
    sealedBlocks = result.blocks;
  }

  function nodeHTML_diffused(i) {
    const role = custodyRoles[i];
    const breach = i === BREACH_INDEX;
    return (
      '<div class="node">' +
      '<div class="role">' + role + '</div>' +
      '<div class="field-note">' + escapeHtml(defaultNotes[i]) + '</div>' +
      '<div class="field">Identity<b>Unrecorded</b></div>' +
      '<div class="field">Timestamp<b>Not logged</b></div>' +
      '<span class="status">' + (breach ? 'Breach — origin unknown' : 'Unverified') + '</span>' +
      '</div>'
    );
  }
  function nodeHTML_pinned(i) {
    const role = custodyRoles[i];
    const b = sealedBlocks[i];
    const noteField =
      i === BREACH_INDEX
        ? '<input class="tamper-input" id="tamperInput" value="' + escapeHtml(currentNotes[i]) + '" aria-label="Edit Transport Custodian note">'
        : '<div class="field-note">' + escapeHtml(currentNotes[i]) + '</div>';
    return (
      '<div class="node pinned" id="node-' + i + '">' +
      '<div class="role">' + role + '</div>' +
      noteField +
      '<div class="field">Signature<b title="' + b.sealedHash + '">' + b.sealedHash.slice(0, 14) + '…</b></div>' +
      '<div class="field">Time<b>' + formatTime(b.time) + '</b></div>' +
      '<span class="status" id="status-' + i + '">Verified</span>' +
      '</div>'
    );
  }

  const chainEl = document.getElementById('chain');
  const btnDiffused = document.getElementById('btnDiffused');
  const btnPinned = document.getElementById('btnPinned');
  const custodyCaption = document.getElementById('custodyCaption');
  const pinnedControls = document.getElementById('pinnedControls');
  const btnVerifyChain = document.getElementById('btnVerifyChain');
  const btnResetChain = document.getElementById('btnResetChain');

  function renderDiffused() {
    chainEl.innerHTML = custodyRoles.map((r, i) => nodeHTML_diffused(i)).join('');
  }
  async function renderPinned() {
    if (sealedBlocks.length === 0) await buildRealChain();
    chainEl.innerHTML = custodyRoles.map((r, i) => nodeHTML_pinned(i)).join('');
    const input = document.getElementById('tamperInput');
    if (input) input.addEventListener('input', (e) => { currentNotes[BREACH_INDEX] = e.target.value; });
  }

  function setCustodyMode(mode) {
    if (mode === 'pinned') {
      btnPinned.classList.add('active'); btnPinned.setAttribute('aria-pressed', 'true');
      btnDiffused.classList.remove('active'); btnDiffused.setAttribute('aria-pressed', 'false');
      custodyCaption.textContent = 'Same six people. Every access now carries a live-computed SHA-256 signature, chained to the one before it.';
      pinnedControls.style.display = 'block';
      renderPinned();
    } else {
      btnDiffused.classList.add('active'); btnDiffused.setAttribute('aria-pressed', 'true');
      btnPinned.classList.remove('active'); btnPinned.setAttribute('aria-pressed', 'false');
      custodyCaption.textContent = 'Six people touch this paper. In this model, none of them are individually traceable.';
      pinnedControls.style.display = 'none';
      renderDiffused();
    }
  }
  btnDiffused.addEventListener('click', () => setCustodyMode('diffused'));
  btnPinned.addEventListener('click', () => setCustodyMode('pinned'));
  setCustodyMode('diffused');

  function showRecomputedField(nodeEl, hash) {
    let f = nodeEl.querySelector('.recomputed-field');
    if (!f) {
      f = document.createElement('div');
      f.className = 'field recomputed-field';
      nodeEl.insertBefore(f, nodeEl.querySelector('.status'));
    }
    f.innerHTML = 'Recomputed<b title="' + hash + '">' + hash.slice(0, 14) + '… ≠ sealed</b>';
  }
  function removeRecomputedField(nodeEl) {
    const f = nodeEl.querySelector('.recomputed-field');
    if (f) f.remove();
  }

  async function verifyChain() {
    if (!window.CustodyChain) return;
    const results = await window.CustodyChain.verifyChain(genesisHash, sealedBlocks, currentNotes);
    results.forEach((r, i) => {
      const statusEl = document.getElementById('status-' + i);
      const nodeEl = document.getElementById('node-' + i);
      if (!statusEl || !nodeEl) return;
      if (r.ok) {
        statusEl.textContent = 'Verified';
        nodeEl.classList.remove('breach'); nodeEl.classList.add('pinned');
        removeRecomputedField(nodeEl);
      } else {
        statusEl.textContent = i === BREACH_INDEX ? 'TAMPERED — hash mismatch' : 'INVALID — broken upstream';
        nodeEl.classList.remove('pinned'); nodeEl.classList.add('breach');
        showRecomputedField(nodeEl, r.recomputedHash);
      }
    });
  }
  btnVerifyChain.addEventListener('click', verifyChain);
  btnResetChain.addEventListener('click', async () => {
    sealedBlocks = [];
    await renderPinned();
  });

  /* ============================= EXHIBIT C: SHAMIR'S SECRET SHARING (real, via Shamir) ============================= */
  const SECRET_TEXT = 'ALPHA-SEAL-9F2C';
  const K = 4, N = 6;
  let shareTable = [];
  if (window.Shamir) {
    shareTable = window.Shamir.splitSecret(SECRET_TEXT, K, N);
  }
  const trueSecretEl = document.getElementById('trueSecret');
  if (trueSecretEl) trueSecretEl.textContent = SECRET_TEXT;

  const chipRow = document.getElementById('chipRow');
  const fragCenter = document.getElementById('fragCenter');
  const fragStage = document.getElementById('fragStage');
  const shareCountEl = document.getElementById('shareCount');
  const secretBox = document.getElementById('secretBox');
  const secretVal = document.getElementById('secretVal');

  let selected = new Set([1, 2]);
  const fragEls = [];
  const RADIUS = 118;
  for (let x = 1; x <= N; x++) {
    const chip = document.createElement('button');
    chip.className = 'chip' + (selected.has(x) ? ' active' : '');
    chip.textContent = 'Custodian ' + x;
    chip.setAttribute('aria-pressed', selected.has(x) ? 'true' : 'false');
    chip.addEventListener('click', () => {
      if (selected.has(x)) selected.delete(x); else selected.add(x);
      chip.classList.toggle('active');
      chip.setAttribute('aria-pressed', selected.has(x) ? 'true' : 'false');
      update();
    });
    chipRow.appendChild(chip);

    const frag = document.createElement('div');
    frag.className = 'frag' + (selected.has(x) ? ' active' : '');
    const angle = ((x - 1) / N) * Math.PI * 2;
    frag.dataset.x = (Math.cos(angle) * RADIUS).toFixed(1);
    frag.dataset.y = (Math.sin(angle) * RADIUS).toFixed(1);
    frag.textContent = String(x);
    fragStage.appendChild(frag);
    fragEls.push(frag);
  }

  function update() {
    const arr = Array.from(selected).sort((a, b) => a - b);
    const enough = arr.length >= K;
    shareCountEl.textContent = arr.length + ' of ' + N + ' cooperating (need ≥ ' + K + ')';
    shareCountEl.className = 'caption ' + (enough ? 'ok' : 'warn');

    fragEls.forEach((el, idx) => {
      const x = idx + 1;
      const active = selected.has(x);
      el.classList.toggle('active', active);
      const x0 = parseFloat(el.dataset.x), y0 = parseFloat(el.dataset.y);
      const progress = active ? 1 : 0;
      el.style.transform = 'translate(calc(-50% + ' + x0 * (1 - progress) + 'px), calc(-50% + ' + y0 * (1 - progress) + 'px))';
    });
    fragCenter.textContent = enough ? '✓' : arr.length + '/' + K;
    fragCenter.classList.toggle('assembled', enough);

    if (arr.length === 0) {
      secretVal.textContent = '—';
      secretBox.className = 'secret-box';
      return;
    }
    const result = window.Shamir ? window.Shamir.reconstructSecret(shareTable, arr) : '(Shamir module not loaded)';
    secretVal.textContent = result;
    secretBox.className = 'secret-box ' + (result === SECRET_TEXT ? 'match' : 'mismatch');
  }
  update();

  /* ============================= EXHIBIT D: SIMILARITY (real, via Similarity) ============================= */
  const textA = document.getElementById('textA');
  const textB = document.getElementById('textB');
  const meterFill = document.getElementById('meterFill');
  const meterVal = document.getElementById('meterVal');
  const flagBanner = document.getElementById('flagBanner');

  function updateSimilarity() {
    if (!window.Similarity) return;
    const score = window.Similarity.similarityScore(textA.value, textB.value, 4);
    meterFill.style.width = score + '%';
    meterVal.textContent = score + '%';
    const flagged = score >= 35;
    flagBanner.classList.toggle('show', flagged);
    if (flagged) flagBanner.textContent = 'FLAGGED — ' + score + '% shingle overlap, above threshold';
  }
  textA.addEventListener('input', debounce(updateSimilarity, 120));
  textB.addEventListener('input', debounce(updateSimilarity, 120));
  updateSimilarity();
})();
