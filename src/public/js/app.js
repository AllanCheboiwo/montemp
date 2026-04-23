/* ================================================================
   TimeLog — app.js  (dashboard page)
   Tags, modals, duration calculator, FullCalendar init
   ================================================================ */

const COLORS = [
  '#7C3AED','#6D28D9','#2563EB','#0891B2',
  '#059669','#65A30D','#CA8A04','#EA580C',
  '#DC2626','#DB2777','#4F46E5','#0F172A',
];

let tags     = [];
let selColor = COLORS[0];
let calendar;

const sid = id => document.getElementById(id);

/* ── Helpers ─────────────────────────────────────────────────── */

function toLocalISO(date) {
  const d = new Date(date);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function calcDuration() {
  const s = sid('logStart').value;
  const e = sid('logEnd').value;
  const badge = sid('durationBadge');
  if (!s || !e) { badge.textContent = ''; return; }
  const diff = new Date(e) - new Date(s);
  if (diff <= 0) {
    badge.textContent = 'End must be after start';
    badge.style.color = 'var(--danger)';
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  badge.textContent = (h ? `${h}h ` : '') + (m ? `${m}m` : h ? '' : '<1m');
  badge.style.color = 'var(--success)';
}

/* ── Tags ────────────────────────────────────────────────────── */

async function fetchTags() {
  try { tags = await fetch('/tags').then(r => r.json()); } catch { tags = []; }
  renderTagList();
  renderTagSelect();
}

function renderTagList() {
  sid('tagList').innerHTML = tags.map(t => `
    <div class="tag-item">
      <span class="tag-swatch" style="background:${t.color}"></span>
      <span class="tag-name">${t.name}</span>
      <button class="tag-del" onclick="deleteTag(${t.id})" title="Delete">×</button>
    </div>
  `).join('');
}

function renderTagSelect() {
  const cur = sid('logTag').value;
  sid('logTag').innerHTML = '<option value="">No tag</option>' +
    tags.map(t => `<option value="${t.id}"${cur == t.id ? ' selected' : ''}>${t.name}</option>`).join('');
}

async function deleteTag(id) {
  if (!confirm('Delete this tag?')) return;
  await fetch(`/tags/${id}`, { method: 'DELETE' });
  await fetchTags();
  calendar.refetchEvents();
}

/* ── Tag modal ───────────────────────────────────────────────── */

function renderSwatches() {
  sid('swatches').innerHTML = COLORS.map(c => `
    <span class="swatch${c === selColor ? ' sel' : ''}" style="background:${c}"
      onclick="pickColor('${c}')"></span>
  `).join('');
}

function pickColor(c) { selColor = c; renderSwatches(); }

function openTagModal() {
  sid('tagName').value = '';
  selColor = COLORS[0];
  renderSwatches();
  sid('tagOverlay').classList.add('open');
  setTimeout(() => sid('tagName').focus(), 60);
}

function closeTagModal() { sid('tagOverlay').classList.remove('open'); }

async function submitTag() {
  const name = sid('tagName').value.trim();
  if (!name) return;
  await fetch('/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color: selColor }),
  });
  closeTagModal();
  await fetchTags();
}

/* ── Log modal ───────────────────────────────────────────────── */

function openLogModal(info = {}) {
  const isEdit = !!info.id;
  sid('logTitle').textContent      = isEdit ? 'Edit entry' : 'New entry';
  sid('logId').value               = info.id     || '';
  sid('entryTitle').value          = info.title  || '';
  sid('logStart').value            = info.start  ? toLocalISO(info.start) : '';
  sid('logEnd').value              = info.end    ? toLocalISO(info.end)   : '';
  sid('logTag').value              = info.tag_id || '';
  sid('logNotes').value            = info.notes  || '';
  sid('logDelBtn').style.display   = isEdit ? 'block' : 'none';
  sid('logSaveBtn').textContent    = isEdit ? 'Update entry' : 'Save entry';
  sid('durationBadge').textContent = '';
  calcDuration();
  sid('logOverlay').classList.add('open');
  setTimeout(() => sid('entryTitle').focus(), 60);
}

function closeLogModal() { sid('logOverlay').classList.remove('open'); }

async function deleteLog() {
  const id = sid('logId').value;
  if (!id || !confirm('Delete this entry?')) return;
  await fetch(`/logs/${id}`, { method: 'DELETE' });
  closeLogModal();
  calendar.refetchEvents();
}

async function submitLog() {
  const id = sid('logId').value;
  const body = {
    title:      sid('entryTitle').value,
    start_time: sid('logStart').value,
    end_time:   sid('logEnd').value,
    tag_id:     sid('logTag').value || null,
    notes:      sid('logNotes').value,
  };
  await fetch(id ? `/logs/${id}` : '/logs', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  closeLogModal();
  calendar.refetchEvents();
}

/* ── Init ────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  // User avatar initials
  const name = sid('userName').textContent.trim();
  sid('userAvatar').textContent = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  await fetchTags();

  // Keyboard shortcut: N = new entry
  document.addEventListener('keydown', e => {
    if (e.key === 'n' && !e.target.matches('input,textarea,select')) openLogModal();
  });

  // Close overlays on backdrop click
  ['logOverlay', 'tagOverlay'].forEach(id => {
    sid(id).addEventListener('click', e => {
      if (e.target === sid(id)) sid(id).classList.remove('open');
    });
  });

  // FullCalendar
  calendar = new FullCalendar.Calendar(sid('calendar'), {
    initialView: 'timeGridWeek',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,timeGridDay',
    },
    height:        '100%',
    nowIndicator:  true,
    selectable:    true,
    editable:      true,
    allDaySlot:    false,
    slotMinTime:   '06:00:00',
    slotDuration:  '00:30:00',
    snapDuration:  '00:15:00',

    datesSet: info => {
      sid('topbarDate').textContent = info.view.title;
    },

    events: async (info, ok, fail) => {
      try {
        const logs = await fetch(`/logs?start=${info.startStr}&end=${info.endStr}`).then(r => r.json());
        ok(logs.map(l => ({
          id:    l.id,
          title: l.title,
          start: l.start_time,
          end:   l.end_time,
          color: l.tag_color || '#7C3AED',
          extendedProps: { tag_id: l.tag_id, notes: l.notes },
        })));
      } catch (e) { fail(e); }
    },

    select: info => {
      openLogModal({ start: info.start, end: info.end });
      calendar.unselect();
    },

    eventClick: info => {
      const ev = info.event;
      openLogModal({
        id:     ev.id,
        title:  ev.title,
        start:  ev.start,
        end:    ev.end,
        tag_id: ev.extendedProps.tag_id,
        notes:  ev.extendedProps.notes,
      });
    },

    eventDrop: async info => {
      await fetch(`/logs/${info.event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: info.event.start, end_time: info.event.end }),
      });
    },

    eventResize: async info => {
      await fetch(`/logs/${info.event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: info.event.start, end_time: info.event.end }),
      });
    },
  });

  calendar.render();
});
