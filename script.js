document.addEventListener('DOMContentLoaded', () => {
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  const navToggle = qs('#navToggle');
  const navList = qs('#navList');
  navToggle?.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navList.style.display = expanded ? 'none' : 'flex';
  });

  qs('#year').textContent = new Date().getFullYear();

  const waterGroup = qs('#waterGroup');
  const runBtn = qs('#runSimBtn');
  const resetBtn = qs('#resetSimBtn');

  function createWaterMolecules(n=8) {
    waterGroup.innerHTML = '';
    const spacing = 40;
    for (let i=0;i<n;i++){
      const x = (i%6)*spacing - 100;
      const y = (Math.floor(i/6))*spacing - 10;
      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('transform', `translate(${x},${y})`);
      g.setAttribute('class','waterMol');

      const o = document.createElementNS('http://www.w3.org/2000/svg','circle');
      o.setAttribute('cx', '0');
      o.setAttribute('cy', '0');
      o.setAttribute('r', '8');
      o.setAttribute('fill','#60a5fa');

      const h1 = document.createElementNS('http://www.w3.org/2000/svg','circle');
      h1.setAttribute('cx', '-14');
      h1.setAttribute('cy', '-8');
      h1.setAttribute('r', '5');
      h1.setAttribute('fill','#cbe7ff');

      const h2 = document.createElementNS('http://www.w3.org/2000/svg','circle');
      h2.setAttribute('cx', '14');
      h2.setAttribute('cy', '-8');
      h2.setAttribute('r', '5');
      h2.setAttribute('fill','#cbe7ff');

      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x','0'); t.setAttribute('y','20'); t.setAttribute('font-size','10'); t.setAttribute('text-anchor','middle'); t.setAttribute('fill','#03396c');
      t.textContent = 'H2O';

      g.appendChild(o); g.appendChild(h1); g.appendChild(h2); g.appendChild(t);
      waterGroup.appendChild(g);
    }
  }
  createWaterMolecules(8);

  function runSimulation() {
    const waters = qsa('.waterMol');
    const summary = document.createElement('div');
    summary.className = 'sim-summary';
    summary.style.marginTop = '8px';
    summary.textContent = 'Conceptual: two H atoms from each H2O pair to form H2; oxygen atoms combine to O2 (2:1 H2:O2 by molecule count).';
    qs('#diagram').appendChild(summary);

    waters.forEach((w, i) => {
      w.style.transition = 'transform 1s ease, opacity 1s';
      w.style.opacity = '0.15';
      w.style.transform = `translate(${200 + (i%3)*6}px,${-60 - Math.floor(i/3)*6}px)`;
    });

    for (let i=0;i<4;i++){
      const el = document.createElementNS('http://www.w3.org/2000/svg','circle');
      el.setAttribute('cx','0'); el.setAttribute('cy','0'); el.setAttribute('r','8'); el.setAttribute('fill','#60A5FA'); el.setAttribute('opacity','0.9');
      el.setAttribute('transform', `translate(360, -40)`);
      qs('#h2Group').appendChild(el);
      setTimeout(()=> el.setAttribute('transform','translate(0,0)'), 20);
      setTimeout(()=> el.remove(), 1600 + i*120);
    }
    for (let i=0;i<2;i++){
      const el = document.createElementNS('http://www.w3.org/2000/svg','circle');
      el.setAttribute('cx','0'); el.setAttribute('cy','0'); el.setAttribute('r','8'); el.setAttribute('fill','#A78BFA'); el.setAttribute('opacity','0.9');
      el.setAttribute('transform', `translate(360,60)`);
      qs('#o2Group').appendChild(el);
      setTimeout(()=> el.setAttribute('transform','translate(0,0)'), 20);
      setTimeout(()=> el.remove(), 1600 + i*140);
    }

    setTimeout(() => {
      if (summary && summary.parentNode) summary.remove();
    }, 4000);
  }

  runBtn?.addEventListener('click', runSimulation);
  resetBtn?.addEventListener('click', () => {
    createWaterMolecules(8);
    const sums = qsa('.sim-summary');
    sums.forEach(s=>s.remove());
  });

  const journalForm = qs('#journalForm');
  const journalList = qs('#journalList');
  const exportJournalBtn = qs('#exportJournalBtn');
  const JOURNAL_KEY = 'hho_journal_v1';

  function loadJournal() {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch(e){ return []; }
  }
  function saveJournal(entries) { localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries)); renderJournal(); }
  function renderJournal() {
    const entries = loadJournal();
    journalList.innerHTML = '';
    if (entries.length===0) { journalList.innerHTML = '<li class="small">No entries yet.</li>'; return; }
    entries.slice().reverse().forEach((e, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHtml(e.title)}</strong> <span class="small">(${escapeHtml(e.date)})</span><div>${escapeHtml(e.notes)}</div>
        <div style="margin-top:6px"><button data-index="${entries.length-1-idx}" class="deleteEntry secondary-btn">Delete</button></div>`;
      journalList.appendChild(li);
    });
  }
  journalForm?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const title = qs('#entryTitle').value.trim();
    const date = qs('#entryDate').value;
    const notes = qs('#entryNotes').value.trim();
    if (!title || !date || !notes) return;
    const entries = loadJournal();
    entries.push({title, date, notes});
    saveJournal(entries);
    journalForm.reset();
  });
  journalList?.addEventListener('click', (ev) => {
    if (ev.target.matches('.deleteEntry')) {
      const idx = Number(ev.target.getAttribute('data-index'));
      const entries = loadJournal();
      entries.splice(idx,1);
      saveJournal(entries);
    }
  });
  exportJournalBtn?.addEventListener('click', () => {
    const entries = loadJournal();
    if (entries.length===0) return alert('No journal entries to export.');
    const csv = toCSV(entries, ['title','date','notes']);
    downloadData(csv, 'journal.csv','text/csv');
  });
  renderJournal();

  const gasCtx = qs('#gasChart').getContext('2d');
  const ratioCtx = qs('#ratioChart').getContext('2d');
  let gasChart, ratioChart;
  function initCharts() {
    gasChart = new Chart(gasCtx, {
      type:'line',
      data:{
        labels:[],
        datasets:[
          {label:'H2 volume (simulated mL)', data:[], borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.08)', tension:0.3},
          {label:'O2 volume (simulated mL)', data:[], borderColor:'#7c3aed', backgroundColor:'rgba(124,58,237,0.08)', tension:0.3}
        ]
      },
      options:{responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true}}}
    });

    ratioChart = new Chart(ratioCtx, {
      type:'doughnut',
      data:{
        labels:['H2 (molecules)','O2 (molecules)'],
        datasets:[{data:[2,1], backgroundColor:['#2563eb','#7c3aed']}]
      },
      options:{responsive:true, maintainAspectRatio:false}
    });
  }
  initCharts();

  const sampleSimulated = {
    rows:[
      {time:'2026-10-01 09:00', h2:0, o2:0},
      {time:'2026-10-01 09:10', h2:4.1, o2:2.0},
      {time:'2026-10-01 09:20', h2:8.2, o2:4.1},
      {time:'2026-10-01 09:30', h2:12.3, o2:6.1},
      {time:'2026-10-01 09:40', h2:16.0, o2:8.0}
    ]
  };

  qs('#loadSampleBtn')?.addEventListener('click', () => {
    const rows = sampleSimulated.rows;
    gasChart.data.labels = rows.map(r=>r.time);
    gasChart.data.datasets[0].data = rows.map(r=>r.h2);
    gasChart.data.datasets[1].data = rows.map(r=>r.o2);
    gasChart.update();
    ratioChart.data.datasets[0].data = [2,1];
    ratioChart.update();
    alert('Sample simulated data loaded. Data is simulated and shown for educational purposes only.');
  });

  qs('#clearResultsBtn')?.addEventListener('click', () => {
    gasChart.data.labels = [];
    gasChart.data.datasets.forEach(ds=>ds.data=[]);
    gasChart.update();
    ratioChart.data.datasets[0].data = [0,0];
    ratioChart.update();
  });

  qs('#exportResultsBtn')?.addEventListener('click', () => {
    const labels = gasChart.data.labels;
    if (!labels || labels.length===0) return alert('No results to export.');
    const rows = labels.map((l,i) => ({time:l, h2:gasChart.data.datasets[0].data[i], o2:gasChart.data.datasets[1].data[i]}));
    const csv = toCSV(rows, ['time','h2','o2']);
    downloadData(csv,'results_simulated.csv','text/csv');
  });

  const budgetForm = qs('#budgetForm');
  const budgetTableBody = qs('#budgetTable tbody');
  const budgetTotalEl = qs('#budgetTotal');
  const BUDGET_KEY = 'hho_budget_v1';

  function loadBudget() {
    try { return JSON.parse(localStorage.getItem(BUDGET_KEY) || '[]'); } catch { return []; }
  }
  function saveBudget(items) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(items)); renderBudget();
  }
  function renderBudget() {
    const items = loadBudget();
    budgetTableBody.innerHTML = '';
    let total = 0;
    items.forEach((it, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(it.name)}</td><td>KES ${Number(it.cost).toLocaleString()}</td><td><button data-idx="${idx}" class="deleteBudget secondary-btn">Delete</button></td>`;
      budgetTableBody.appendChild(tr);
      total += Number(it.cost);
    });
    budgetTotalEl.textContent = `KES ${total.toLocaleString()}`;
  }

  budgetForm?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = qs('#itemName').value.trim();
    const cost = Number(qs('#itemCost').value);
    if (!name || isNaN(cost)) return;
    const items = loadBudget();
    items.push({name,cost});
    saveBudget(items);
    budgetForm.reset();
  });

  budgetTableBody?.addEventListener('click', (ev) => {
    if (ev.target.matches('.deleteBudget')) {
      const idx = Number(ev.target.getAttribute('data-idx'));
      const items = loadBudget();
      items.splice(idx,1);
      saveBudget(items);
    }
  });

  qs('#exportBudgetBtn')?.addEventListener('click', () => {
    const items = loadBudget();
    if (items.length===0) return alert('No budget items to export.');
    const csv = toCSV(items, ['name','cost']);
    downloadData(csv,'budget_kes.csv','text/csv');
  });

  renderBudget();

  const slides = qsa('.slide');
  let slideIndex = 0;
  function showSlide(i) {
    slides.forEach((s,idx)=> s.classList.toggle('active', idx===i));
  }
  qs('#nextSlide')?.addEventListener('click', ()=> {
    slideIndex = Math.min(slideIndex+1, slides.length-1);
    showSlide(slideIndex);
  });
  qs('#prevSlide')?.addEventListener('click', ()=> {
    slideIndex = Math.max(slideIndex-1, 0);
    showSlide(slideIndex);
  });
  showSlide(slideIndex);

  function toCSV(arr, keys) {
    const header = keys.join(',');
    const lines = arr.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','));
    return header + '\n' + lines.join('\n');
  }
  function downloadData(text, filename, type='text/plain') {
    const blob = new Blob([text], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
  }
});
