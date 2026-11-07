'use strict';
/* Connect — ответы на сообщения и группы.
   Подключается ПОСЛЕ media-chat.js и расширяет чаты, не меняя их. */
(() => {
const st = document.createElement('style');
st.textContent = `
.rq{border-left:3px solid var(--ac);padding:4px 8px;margin-bottom:4px;border-radius:6px;background:rgba(127,127,127,.14);cursor:pointer;font-size:13px;line-height:1.3}
.rq b{display:block;color:var(--ac);font-size:12px}
.rq span{display:block;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px}
.mb.flash{animation:gflash 1.3s}@keyframes gflash{0%,60%{outline:2px solid var(--ac)}100%{outline:2px solid transparent}}
.rplbar{display:flex;align-items:center;gap:10px;padding:8px 14px;border-top:1px solid var(--bd);background:var(--cd)}
.rplbar div{flex:1;min-width:0;border-left:3px solid var(--ac);padding-left:8px;font-size:13px}
.rplbar b{display:block;color:var(--ac)}.rplbar span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mu)}
.rplbar button{font-size:20px;padding:4px 10px;border-radius:50%}.rplbar button:hover{background:var(--bg)}
.mb .gsn{display:block;font-weight:700;font-size:12px;color:var(--ac);margin-bottom:2px}
.gpick{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:12px;cursor:pointer}
.gpick:hover{background:var(--bg)}.gpick input[type=checkbox]{width:18px;height:18px;flex:none}
/* админ-панель: строки пользователей не сжимаются */
.urow{flex-wrap:wrap}.urow>[data-user]{flex:1 1 180px;min-width:0}
.urow .ua{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:6px;padding-left:46px}`;
document.head.appendChild(st);

const last = a => a[a.length - 1];
const t0 = x => new Date(x).getTime();
const isGroup = id => typeof id === 'string' && id.startsWith('group:');
const hue = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const gav = (g, c = '') => `<span class="av ${c}" style="--h:${hue(g.name)}">👥</span>`;
const people = n => { const m = n % 100, d = n % 10; return m > 10 && m < 20 ? 'участников' : d === 1 ? 'участник' : d >= 2 && d <= 4 ? 'участника' : 'участников'; };
const LABELS = ['📷 Фото', '🎬 Видео'];

const G = { groups: [], members: {}, msgs: {}, seen: {}, known: null, sig: '', fresh: false, pick: new Set(), pickOpts: null };
const CX = window.CX = { reply: null, sendPayload };

/* ---------- данные групп ---------- */
const lastT = g => { const l = last(G.msgs[g.id] || []); return l ? t0(l.created_at) : t0(g.created_at); };
const unreadG = id => (G.msgs[id] || []).filter(m => m.sender_id !== S.me && t0(m.created_at) > (G.seen[id] || 0)).length;
function markSeen(id) {
  const l = last(G.msgs[id] || []), v = l ? t0(l.created_at) : Date.now();
  if (G.seen[id] === v) return false;
  G.seen[id] = v;
  try { localStorage.setItem('connect_gseen_' + S.me, JSON.stringify(G.seen)); } catch (e) {}
  return true;
}
async function loadGroups() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { G.groups = []; G.members = {}; G.msgs = {}; G.sig = ''; G.known = null; return false; }
  const uid = session.user.id;
  const [g, m, x] = await Promise.all([
    sb.from('chat_groups').select('*'),
    sb.from('chat_group_members').select('*'),
    sb.from('chat_group_messages').select('*').order('created_at', { ascending: false }).limit(800)
  ]);
  if (g.error || m.error || x.error) return false; // таблицы ещё не созданы
  try { G.seen = JSON.parse(localStorage.getItem('connect_gseen_' + uid) || '{}'); } catch (e) { G.seen = {}; }
  G.members = {}; (m.data || []).forEach(r => (G.members[r.group_id] = G.members[r.group_id] || []).push(r));
  G.msgs = {}; (x.data || []).slice().reverse().forEach(r => (G.msgs[r.group_id] = G.msgs[r.group_id] || []).push(r));
  G.groups = (g.data || []).slice().sort((a, b) => lastT(b) - lastT(a));
  G.groups.forEach(gr => {
    if (G.seen[gr.id] == null) { const mine = (G.members[gr.id] || []).find(r => r.user_id === uid); G.seen[gr.id] = mine ? t0(mine.joined_at) : Date.now(); }
  });
  const ids = new Set(); Object.values(G.msgs).forEach(a => a.forEach(r => ids.add(r.id)));
  if (G.known) {
    const fresh = [...ids].filter(i => !G.known.has(i));
    for (const gr of G.groups) {
      const n = (G.msgs[gr.id] || []).find(r => fresh.includes(r.id) && r.sender_id !== uid);
      if (n && !(chatWith === 'group:' + gr.id && !document.hidden)) { toast('Новое сообщение в группе «' + gr.name + '»'); break; }
    }
  }
  G.known = ids;
  const sig = G.groups.map(gr => gr.id + ':' + (G.msgs[gr.id] || []).length + ':' + (last(G.msgs[gr.id] || []) || {}).id + ':' + (G.members[gr.id] || []).length + ':' + gr.name).join('|');
  const changed = sig !== G.sig; G.sig = sig;
  return changed;
}
const _la = loadAll;
loadAll = async () => { await _la(); await loadGroups(); };

/* ---------- отправка (ЛС и группы), ответы ---------- */
async function sendPayload(p) {
  const id = chatWith;
  if (!id) return false;
  const rp = CX.reply && CX.reply.scope === id ? { reply_id: CX.reply.id, reply_text: CX.reply.text, reply_name: CX.reply.name } : {};
  if (isGroup(id)) {
    const gid = id.slice(6);
    const r = await sb.from('chat_group_messages').insert({ group_id: gid, sender_id: S.me, ...p, ...rp }).select().single();
    if (r.error) { toast('Не отправлено: ' + r.error.message); return false; }
    (G.msgs[gid] = G.msgs[gid] || []).push(r.data);
    G.known && G.known.add(r.data.id);
    G.fresh = true;
  } else {
    const r = await sb.from('messages').insert({ sender_id: S.me, receiver_id: id, ...p, ...rp }).select().single();
    if (r.error) { toast('Не отправлено: ' + r.error.message); return false; }
    if (!S.msgs.some(x => x.id === r.data.id)) S.msgs.push(r.data);
  }
  CX.reply = null;
  refreshChat();
  return true;
}
async function textSend() {
  const el = $('#cin'), v = el.value.trim();
  if (!v) return;
  el.value = ''; el.style.height = 'auto';
  if (!(await sendPayload({ text: v.slice(0, 2000) }))) el.value = v;
}
const _sm = sendMsg;
sendMsg = function () {
  if (isGroup(chatWith) || (CX.reply && CX.reply.scope === chatWith)) return textSend();
  return _sm();
};

function setReply(r) {
  CX.reply = { ...r, scope: chatWith };
  updateRplBar();
  const i = $('#cin'); if (i) i.focus();
}
function updateRplBar() {
  const cb = $('#cb'); let bar = $('#rplbar');
  const r = CX.reply && CX.reply.scope === chatWith ? CX.reply : null;
  if (!r || !cb) { if (bar) bar.remove(); return; }
  if (!bar) { cb.insertAdjacentHTML('beforebegin', '<div class="rplbar" id="rplbar"></div>'); bar = $('#rplbar'); }
  bar.innerHTML = `<div><b>Ответ: ${esc(r.name)}</b><span>${esc(r.text)}</span></div><button data-act="rplx" aria-label="Отменить ответ">×</button>`;
}
const quoteHTML = m => `<div class="rq" data-rid="${esc(m.reply_id || '')}"><b>${esc(m.reply_name || '')}</b><span>${esc(m.reply_text)}</span></div>`;
function decorateReplies(body) {
  body.querySelectorAll('.mb[data-mid]').forEach(el => {
    if (el.querySelector('.rq')) return;
    const m = S.msgs.find(x => String(x.id) === el.dataset.mid);
    if (m && m.reply_text) el.insertAdjacentHTML('afterbegin', quoteHTML(m));
  });
}
function jumpTo(rid) {
  const body = $('#cvm'); if (!body || !rid) return;
  const el = [...body.querySelectorAll('.mb[data-mid]')].find(x => x.dataset.mid === rid || x.dataset.mid === 'g:' + rid);
  if (!el) return toast('Исходное сообщение не найдено');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1300);
}
const replyFromDm = id => {
  const m = S.msgs.find(x => String(x.id) === id);
  return m ? { id: String(m.id), name: U(m.sender_id).name, text: (m.text || '').slice(0, 120) } : null;
};
/* кнопка «Ответить» в меню сообщения из messenger.js */
new MutationObserver(list => list.forEach(ms => ms.addedNodes.forEach(n => {
  if (n.id !== 'msov') return;
  const first = n.querySelector('[data-act="m-copy"]');
  if (!first || isGroup(chatWith) || chatWith === 'ai' || String(chatWith).startsWith('support')) return;
  if (!replyFromDm(first.dataset.id)) return;
  first.insertAdjacentHTML('beforebegin', `<button data-act="m-reply" data-id="${first.dataset.id}">Ответить</button>`);
}))).observe(document.body, { childList: true });

/* ---------- отрисовка чата ---------- */
const gmsgHTML = m => {
  const mine = m.sender_id === S.me, u = U(m.sender_id);
  const base = (m.text || '').replace(/^↪ /, '');
  const media = m.media_url ? (m.media_type === 'video'
    ? `<video class="mbm" src="${esc(m.media_url)}" controls preload="metadata" playsinline></video>`
    : `<img class="mbm" src="${esc(m.media_url)}" alt="" loading="lazy">`) : '';
  const caption = m.media_url && LABELS.includes(base) ? '' : `<p>${esc(m.text)}</p>`;
  return `<div class="mb ${mine ? 'me' : ''}" data-mid="g:${m.id}" data-gid="${m.id}">${mine ? '' : `<small class="gsn">${esc(u.name)}</small>`}${m.reply_text ? quoteHTML(m) : ''}${media}${caption}<small>${hhmm(m.created_at)}</small></div>`;
};
function renderGroup(body, h, cb, prevTop, stick) {
  const gid = chatWith.slice(6), g = G.groups.find(x => x.id === gid);
  const back = '<button class="back" data-act="backch" aria-label="Назад">‹</button>';
  if (!g) { h.innerHTML = back; body.innerHTML = '<div class="empty">Группа недоступна или удалена</div>'; if (cb) cb.hidden = true; return; }
  const ms = G.msgs[gid] || [], n = (G.members[gid] || []).length;
  h.innerHTML = `${back}<span class="chu">${gav(g, 'sm')}<div><b>${esc(g.name)}</b><small>${n} ${people(n)}</small></div></span><button class="mbtn" data-act="gmenu" aria-label="Участники и настройки">⋮</button>`;
  body.innerHTML = ms.length ? ms.map(gmsgHTML).join('') : '<div class="empty">Сообщений пока нет. Напишите первым!</div>';
  const bottom = G.fresh || stick; G.fresh = false;
  body.scrollTop = bottom ? body.scrollHeight : prevTop;
  if (bottom) body.querySelectorAll('.mbm').forEach(el => el.addEventListener(el.tagName === 'IMG' ? 'load' : 'loadedmetadata', () => { body.scrollTop = body.scrollHeight; }, { once: true }));
  if (markSeen(gid)) renderCList();
}
const _rc = renderConv;
renderConv = function () {
  const b0 = $('#cvm');
  const prevTop = b0 ? b0.scrollTop : 0, stick = b0 ? b0.scrollHeight - b0.scrollTop - b0.clientHeight < 80 : true;
  _rc();
  const body = $('#cvm'), h = $('#ch'), cb = $('#cb');
  if (!body || !h) return;
  if (isGroup(chatWith)) renderGroup(body, h, cb, prevTop, stick); else decorateReplies(body);
  updateRplBar();
};

/* ---------- список чатов ---------- */
const grow = g => {
  const l = last(G.msgs[g.id] || []), n = unreadG(g.id), cnt = (G.members[g.id] || []).length;
  const sub = l ? (l.sender_id === S.me ? 'Вы: ' : esc(U(l.sender_id).name.split(' ')[0]) + ': ') + esc(l.text) : 'Группа · ' + cnt + ' ' + people(cnt);
  return `<button class="ci ${chatWith === 'group:' + g.id ? 'on' : ''}" data-act="opengrp" data-id="${g.id}">${gav(g)}<div><b>${esc(g.name)}</b><span>${sub}</span></div>${l ? `<small>${hhmm(l.created_at)}</small>` : ''}${n ? `<i class="dot" style="position:static">${n}</i>` : ''}</button>`;
};
const _rl = renderCList;
renderCList = function () {
  _rl();
  const el = $('#cl'); if (!el) return;
  const s = (($('#cs') || {}).value || '').trim().toLowerCase();
  if (s) { el.insertAdjacentHTML('afterbegin', G.groups.filter(g => g.name.toLowerCase().includes(s)).map(grow).join('')); return; }
  el.insertAdjacentHTML('afterbegin', '<button class="ci" data-act="gnew"><span class="av add">+</span><div><b>Новая группа</b><span>Чат для нескольких людей</span></div></button>' + G.groups.map(grow).join(''));
};

/* ---------- окна: выбор людей, участники ---------- */
const closeModal = id => { const d = document.getElementById(id); if (d) d.remove(); };
function fillPicker() {
  const s = (($('#gnQ') || {}).value || '').trim().toLowerCase(), ex = G.pickOpts.exclude;
  const us = S.users.filter(u => u.id !== S.me && !ex.has(u.id) && !u.banned && (!s || (u.name + ' ' + u.handle).toLowerCase().includes(s)));
  $('#gnList').innerHTML = us.map(u => `<label class="gpick">${av(u, 'sm')}<div style="flex:1;min-width:0"><b>${esc(u.name)}</b>${bdg(u)}<br><small class="mu">@${esc(u.handle)}</small></div><input type="checkbox" data-pid="${u.id}" ${G.pick.has(u.id) ? 'checked' : ''}></label>`).join('') || '<div class="empty">Никого не найдено</div>';
}
function pickerModal(o) {
  closeModal('gnM'); G.pick = new Set(); G.pickOpts = o;
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'gnM';
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="gnclose" aria-label="Закрыть">×</button><h2>${o.title}</h2><div class="ef">${o.withName ? '<input id="gnName" maxlength="60" placeholder="Название группы" autocomplete="off">' : ''}<input id="gnQ" placeholder="Поиск людей" autocomplete="off"><div class="fwl" id="gnList"></div><p class="err" id="gnE"></p><button class="btn lg" data-act="gnok">${o.okText}</button></div></div>`;
  document.body.appendChild(d); fillPicker();
  (o.withName ? $('#gnName') : $('#gnQ')).focus();
}
const myGid = () => chatWith.slice(6);
const isOwner = gid => (G.members[gid] || []).some(r => r.user_id === S.me && r.role === 'owner');
function groupMenu() {
  const gid = myGid(), g = G.groups.find(x => x.id === gid); if (!g) return;
  const mem = G.members[gid] || [], owner = isOwner(gid);
  closeModal('gmM');
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'gmM';
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="gmclose" aria-label="Закрыть">×</button><h2>${esc(g.name)}</h2><p class="mu" style="margin-bottom:8px">${mem.length} ${people(mem.length)}</p>
    <div class="fwl">${mem.map(r => { const u = U(r.user_id); return `<div class="gpick" style="cursor:default">${av(u, 'sm')}<div style="flex:1;min-width:0"><b>${esc(u.name)}</b>${r.role === 'owner' ? ' <span class="bdg">Владелец</span>' : ''}<br><small class="mu">@${esc(u.handle)}</small></div>${owner && r.user_id !== S.me ? `<button class="mini danger" data-act="gkick" data-id="${r.user_id}">Убрать</button>` : ''}</div>`; }).join('')}</div>
    <div class="ef" style="margin-top:12px">${owner ? '<button class="btn ghost" data-act="gadd">Добавить участников</button>' : ''}<button class="btn ghost" data-act="gleave">Покинуть группу</button>${owner ? '<button class="btn ghost" data-act="gdel" style="color:var(--hot)">Удалить группу</button>' : ''}</div></div>`;
  document.body.appendChild(d);
}
async function afterGroupChange() { await loadGroups(); renderCList(); renderConv(); }
function gsheet(mid) {
  const m = (G.msgs[myGid()] || []).find(x => String(x.id) === mid); if (!m) return;
  closeModal('msov');
  const d = document.createElement('div'); d.className = 'msov'; d.id = 'msov';
  d.innerHTML = `<div class="msheet"><button data-act="g-reply" data-id="${esc(mid)}">Ответить</button><button data-act="g-copy" data-id="${esc(mid)}">Копировать</button>${m.sender_id === S.me ? `<button class="danger" data-act="g-del" data-id="${esc(mid)}">Удалить</button>` : ''}</div>`;
  document.body.appendChild(d);
}
function copy(txt) {
  const done = () => toast('Скопировано');
  const fb = () => { const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать'); } t.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fb); else fb();
}

/* ---------- обработчики ---------- */
document.addEventListener('click', async e => {
  const t = e.target.closest && e.target.closest('[data-act]');
  if (!t) { if (e.target.id === 'gnM' || e.target.id === 'gmM') e.target.remove(); return; }
  const a = t.dataset.act, id = t.dataset.id;
  if (a === 'gnew') pickerModal({
    title: 'Новая группа', withName: true, okText: 'Создать группу', exclude: new Set(),
    onOk: async (ids, name) => {
      const r = await sb.rpc('create_group', { group_name: name, member_ids: ids });
      if (!ok(r)) return false;
      await loadGroups(); G.fresh = true; openChat('group:' + r.data); toast('Группа создана'); return true;
    }
  });
  else if (a === 'gnclose') closeModal('gnM');
  else if (a === 'gmclose') closeModal('gmM');
  else if (a === 'gnok') {
    const o = G.pickOpts, ids = [...G.pick], err = $('#gnE');
    const name = o.withName ? $('#gnName').value.trim() : '';
    if (o.withName && !name) return err.textContent = 'Введите название группы';
    if (!ids.length) return err.textContent = 'Выберите хотя бы одного человека';
    t.disabled = true;
    const done = await o.onOk(ids, name);
    t.disabled = false;
    if (done) closeModal('gnM');
  }
  else if (a === 'opengrp') { G.fresh = true; openChat('group:' + id); }
  else if (a === 'gmenu') groupMenu();
  else if (a === 'gadd') {
    const gid = myGid(); closeModal('gmM');
    pickerModal({
      title: 'Добавить участников', okText: 'Добавить', exclude: new Set((G.members[gid] || []).map(r => r.user_id)),
      onOk: async ids => { if (!ok(await sb.rpc('group_add_members', { gid, member_ids: ids }))) return false; await afterGroupChange(); toast('Участники добавлены'); return true; }
    });
  }
  else if (a === 'gkick') {
    if (!confirm('Убрать этого человека из группы?')) return;
    if (!ok(await sb.rpc('group_remove_member', { gid: myGid(), target: id }))) return;
    await afterGroupChange(); groupMenu(); toast('Участник удалён');
  }
  else if (a === 'gleave') {
    if (!confirm('Покинуть группу?')) return;
    if (!ok(await sb.rpc('group_leave', { gid: myGid() }))) return;
    closeModal('gmM'); chatWith = null; await loadGroups(); renderCList(); renderConv(); toast('Вы вышли из группы');
  }
  else if (a === 'gdel') {
    if (!confirm('Удалить группу для всех участников? Это нельзя отменить.')) return;
    if (!ok(await sb.rpc('group_delete', { gid: myGid() }))) return;
    closeModal('gmM'); chatWith = null; await loadGroups(); renderCList(); renderConv(); toast('Группа удалена');
  }
  else if (a === 'g-reply') {
    const m = (G.msgs[myGid()] || []).find(x => String(x.id) === id); closeModal('msov');
    if (m) setReply({ id: String(m.id), name: U(m.sender_id).name, text: (m.text || '').slice(0, 120) });
  }
  else if (a === 'g-copy') { const m = (G.msgs[myGid()] || []).find(x => String(x.id) === id); closeModal('msov'); if (m) copy(m.text); }
  else if (a === 'g-del') {
    closeModal('msov');
    if (!confirm('Удалить сообщение у всех?')) return;
    if (!ok(await sb.from('chat_group_messages').delete().eq('id', id))) return;
    const gid = myGid(); G.msgs[gid] = (G.msgs[gid] || []).filter(x => String(x.id) !== id); renderCList(); renderConv();
  }
  else if (a === 'm-reply') { const r = replyFromDm(id); closeModal('msov'); if (r) setReply(r); }
  else if (a === 'rplx') { CX.reply = null; updateRplBar(); }
});
document.addEventListener('change', e => {
  const pid = e.target.dataset && e.target.dataset.pid;
  if (pid) e.target.checked ? G.pick.add(pid) : G.pick.delete(pid);
});
document.addEventListener('input', e => { if (e.target.id === 'gnQ') fillPicker(); });

/* сообщения группы: свой обработчик нажатия вместо меню из messenger.js */
document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.mb[data-gid]')) e.stopImmediatePropagation(); }, true);
document.addEventListener('click', e => {
  const q = e.target.closest && e.target.closest('#cvm .rq');
  if (q) { e.stopImmediatePropagation(); return jumpTo(q.dataset.rid); }
  const b = e.target.closest && e.target.closest('#cvm .mb[data-gid]');
  if (b && !e.target.closest('.mbm')) { e.stopImmediatePropagation(); gsheet(b.dataset.gid); }
}, true);

setInterval(async () => {
  if (!S.me || document.hidden) return;
  if (await loadGroups() && view.name === 'dm') { renderCList(); if (isGroup(chatWith)) renderConv(); }
}, 10000);

if (S.me) loadGroups().then(() => { if (view.name === 'dm') renderCList(); });
})();
