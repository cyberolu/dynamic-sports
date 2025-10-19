// main.js
(function () {
  // Footer year
  const YEAR = document.getElementById('year');
  if (YEAR) YEAR.textContent = new Date().getFullYear();

  // ---- Helpers ----
  const el = (s) => document.querySelector(s);
  const uuid = () =>
    (crypto && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

  const fmtDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? '' : dt.toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
  };

  async function fetchJSON(path, fallback) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch ${path}:`, e);
      return fallback;
    }
  }

  // ---- Data loaders (from Git-managed JSON) ----
  async function loadNews() {
    const data = await fetchJSON('data/news.json', { items: [] });
    const items = Array.isArray(data.items) ? data.items : [];
    // ensure ids
    return items.map(n => ({ id: n.id || uuid(), ...n }))
      .sort((a,b)=> new Date(b.date) - new Date(a.date));
  }

  async function loadComps() {
    const data = await fetchJSON('data/comps.json', { items: [] });
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(c => ({ id: c.id || uuid(), ...c }))
      .sort((a,b)=> String(a.date).localeCompare(String(b.date)));
  }

  // ---- Templates ----
  const newsCard = (n) => `
    <article class="card news-card">
      <div class="thumb">${n.image ? `<img src="${n.image}" alt="">` : '<span class="muted small">No image</span>'}</div>
      <h3>${n.title}</h3>
      <div class="meta">${fmtDate(n.date)}</div>
      <p class="muted small">${(n.body || '').length > 120 ? (n.body || '').slice(0,120)+'…' : (n.body || '')}</p>
    </article>
  `;

  const compCard = (c) => `
    <article class="card">
      <h3>${c.name}</h3>
      <p class="meta"><span class="comp-badge">📅 ${fmtDate(c.date)} • 📍 ${c.venue}</span></p>
      <p class="muted small">${c.desc || ''}</p>
      ${Array.isArray(c.events)&&c.events.length ? `<p class="small"><strong>Events:</strong> ${c.events.join(' • ')}</p>` : ''}
      <p><a class="btn" href="competitions.html#register?c=${encodeURIComponent(c.name)}">Register</a></p>
    </article>
  `;

  // ---- Render all ----
  (async function render() {
    const [news, comps] = await Promise.all([loadNews(), loadComps()]);

    // Home
    const latestNews = el('#latestNews');
    if (latestNews) latestNews.innerHTML = news.slice(0,3).map(newsCard).join('');

    const upcomingComps = el('#upcomingComps');
    if (upcomingComps) upcomingComps.innerHTML = comps.slice(0,3).map(compCard).join('');

    // News page
    const newsList = el('#newsList');
    if (newsList) newsList.innerHTML = news.map(newsCard).join('');

    // Competitions list
    const compList = el('#compList');
    if (compList) compList.innerHTML = comps.map(compCard).join('');

    // Registration form logic (depends on comps)
    const compSelect = el('#compSelect');
    const eventSelect = el('#eventSelect');
    const eventLabel  = el('#eventLabel');

    if (compSelect && eventSelect && eventLabel) {
      compSelect.innerHTML = `<option value="">Select…</option>` +
        comps.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

      const refreshEvents = (compId) => {
        const comp = comps.find(c => c.id === compId);
        const hasEvents = comp && Array.isArray(comp.events) && comp.events.length;
        if (hasEvents) {
          eventSelect.innerHTML = `<option value="">Select…</option>` +
            comp.events.map(e => `<option value="${e}">${e}</option>`).join('');
          eventSelect.disabled = false;
          eventLabel.style.display = '';
          eventSelect.required = true;
        } else {
          eventSelect.innerHTML = `<option value="">No events available</option>`;
          eventSelect.disabled = true;
          eventLabel.style.display = 'none';
          eventSelect.required = false;
        }
      };

      compSelect.addEventListener('change', (e) => refreshEvents(e.target.value));

      // Deep-link: #register?c=Name&e=Event
      (function preselectFromURL(){
        const hash = window.location.hash || '';
        const query = hash.includes('?') ? hash.split('?')[1] : window.location.search.replace(/^\?/, '');
        const params = new URLSearchParams(query);
        const byName = params.get('c');
        if (byName) {
          const match = comps.find(c => c.name === byName);
          if (match) {
            compSelect.value = match.id;
            refreshEvents(match.id);
            const ev = params.get('e');
            if (ev && !eventSelect.disabled) {
              const opt = Array.from(eventSelect.options).find(o => o.value === ev || o.text === ev);
              if (opt) eventSelect.value = opt.value;
            }
          }
        }
        if (hash.startsWith('#register')) {
          const target = el('#register');
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      })();
    }
  })();

  // ---- Toast helper (optional) ----
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
  }

  // Netlify Forms toast example
  const regForm = document.querySelector('form[name="competition-signup"]');
  if (regForm) {
    regForm.addEventListener('submit', () => {
      showToast('Registration submitted!', 'success');
    });
  }
})();
