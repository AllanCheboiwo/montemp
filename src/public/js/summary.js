/* ================================================================
   TimeLog — summary.js  (summary page)
   Period picker, animated counters, tag breakdown loader
   ================================================================ */

let currentPeriod = 'week';

const sid = id => document.getElementById(id);

/* ── Helpers ─────────────────────────────────────────────────── */

function toISO(date) { return date.toISOString().split('T')[0]; }

function fmtHours(secs) {
  const h = secs / 3600;
  return h.toFixed(1);
}

function animateNum(el, target, decimals = 0) {
  const duration = 700;
  const start    = performance.now();
  const from     = parseFloat(el.textContent) || 0;
  (function step(now) {
    const t    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = (from + (target - from) * ease).toFixed(decimals);
    if (t < 1) requestAnimationFrame(step);
  })(start);
}

/* ── Period picker ───────────────────────────────────────────── */

function setPeriod(period, btn) {
  currentPeriod = period;
  sid('periodTabs').querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  sid('customRow').classList.toggle('visible', period === 'custom');
  if (period !== 'custom') loadSummary();
}

function getRange() {
  const now = new Date();
  if (currentPeriod === 'custom') {
    return { start: sid('customStart').value, end: sid('customEnd').value };
  }
  let start;
  if (currentPeriod === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
  } else if (currentPeriod === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }
  return { start: toISO(start), end: toISO(now) };
}

/* ── Summary loader ──────────────────────────────────────────── */

async function loadSummary() {
  const { start, end } = getRange();
  if (!start || !end) return;

  // Reset stats
  ['statHours', 'statEntries', 'statTopTag'].forEach(id => { sid(id).textContent = '—'; });
  ['statHoursSub', 'statEntriesSub', 'statTopSub'].forEach(id => { sid(id).textContent = 'Loading…'; });

  // Skeleton rows
  sid('breakdown').innerHTML = `
    <div style="padding:24px 20px;display:flex;flex-direction:column;gap:16px">
      ${[1,2,3].map(() => `
        <div style="display:grid;grid-template-columns:28px 1fr 3fr 72px 48px;gap:12px;align-items:center">
          <div class="skeleton" style="width:10px;height:10px;border-radius:50%;justify-self:center"></div>
          <div class="skeleton" style="height:14px;border-radius:4px"></div>
          <div class="skeleton" style="height:6px;border-radius:99px"></div>
          <div class="skeleton" style="height:14px;border-radius:4px;justify-self:end;width:48px"></div>
          <div class="skeleton" style="height:12px;border-radius:4px;justify-self:end;width:32px"></div>
        </div>
      `).join('')}
    </div>`;

  try {
    const data = await fetch(`/summary?start=${start}&end=${end}`).then(r => r.json());

    const totalSecs    = data.reduce((s, r) => s + Number(r.total_seconds), 0);
    const totalEntries = data.reduce((s, r) => s + Number(r.count), 0);
    const tagged       = data.filter(r => r.tag_name);
    const top          = tagged[0];

    animateNum(sid('statHours'),   parseFloat(fmtHours(totalSecs)), 1);
    animateNum(sid('statEntries'), totalEntries, 0);

    sid('statHoursSub').textContent   = `${start} → ${end}`;
    sid('statEntriesSub').textContent = `${tagged.length} tag${tagged.length !== 1 ? 's' : ''} tracked`;

    if (top) {
      sid('statTopTag').textContent = top.tag_name;
      sid('statTopSub').textContent = `${fmtHours(Number(top.total_seconds))}h · ${Math.round(top.total_seconds / totalSecs * 100)}% of total`;
    } else {
      sid('statTopTag').textContent = 'None';
      sid('statTopSub').textContent = 'No tagged entries';
    }

    if (!data.length) {
      sid('breakdown').innerHTML = `
        <div class="empty">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No entries for this period</div>
          <div class="empty-sub"><a href="/dashboard">Log some time →</a></div>
        </div>`;
      sid('breakdownMeta').textContent = '';
      return;
    }

    sid('breakdownMeta').textContent = `${data.length} tag${data.length !== 1 ? 's' : ''}`;

    sid('breakdown').innerHTML = data.map(row => {
      const h     = fmtHours(Number(row.total_seconds));
      const pct   = totalSecs > 0 ? Math.round(row.total_seconds / totalSecs * 100) : 0;
      const color = row.tag_color || '#9299A6';
      const name  = row.tag_name  || 'Untagged';
      return `
        <div class="breakdown-row">
          <span class="row-dot" style="background:${color}"></span>
          <div>
            <div class="row-name">${name}</div>
            <div class="row-tag">${row.count} entr${row.count !== 1 ? 'ies' : 'y'}</div>
          </div>
          <div class="bar-track">
            <div class="bar-fill" data-pct="${pct}"
              style="width:0%;background:linear-gradient(90deg,${color}cc,${color})"></div>
          </div>
          <div class="row-hours">${h}h</div>
          <div class="row-pct">${pct}%</div>
        </div>`;
    }).join('');

    // Animate bars after paint
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill').forEach(el => {
        el.style.width = el.dataset.pct + '%';
      });
    });

  } catch {
    sid('breakdown').innerHTML = `
      <div class="empty">
        <div class="empty-title">Failed to load</div>
        <div class="empty-sub">Check your connection and try again.</div>
      </div>`;
  }
}

/* ── Init ────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // User avatar initials
  const name = sid('userName').textContent.trim();
  sid('userAvatar').textContent = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Default custom date range
  const now = new Date();
  sid('customEnd').value   = toISO(now);
  now.setDate(1);
  sid('customStart').value = toISO(now);

  loadSummary();
});
