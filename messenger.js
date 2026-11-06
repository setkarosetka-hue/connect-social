'use strict';
/* Connect — мессенджер: контакты, блокировки, номер телефона, статусы, эмодзи, ИИ-помощник.
   Подключается после app.js и расширяет его, не меняя. */
(() => {
const st = document.createElement('style');
st.textContent = `
.av.add{background:var(--cd);color:var(--ac);font-size:26px;border:2px dashed var(--ac);box-shadow:none!important}
.sec{padding:10px 14px 4px;font-size:12px;font-weight:700;color:var(--mu)}
.ch{position:relative}.mbtn{margin-left:auto;font-size:22px;line-height:1;padding:6px 10px;border-radius:50%;color:var(--mu)}.mbtn:hover{background:var(--bg)}
.menu{position:absolute;right:10px;top:50px;z-index:20;min-width:210px;padding:6px;border-radius:16px;background:var(--cd);border:1px solid var(--bd);box-shadow:var(--sh);animation:rise .2s both}
.menu button{display:block;width:100%;text-align:left;padding:10px 12px;border-radius:10px;font-weight:600}.menu button:hover{background:var(--bg)}.menu .danger{color:var(--hot)}
.emob{font-size:22px;padding:4px 8px;border-radius:50%}.emob:hover{background:var(--bg)}
.emo{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));max-height:150px;overflow-y:auto;padding:8px;border-top:1px solid var(--bd);background:var(--cd)}
.emo button{font-size:22px;padding:4px;border-radius:10px}.emo button:hover{background:var(--bg)}
.sv{position:fixed;inset:0;z-index:150;display:flex;flex-direction:column;justify-content:center;padding:20px;color:#fff;background:linear-gradient(135deg,hsl(var(--h) 80% 55%),hsl(calc(var(--h) + 60) 85% 40%));animation:fade .25s}
.sbars{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));left:14px;right:14px;display:flex;gap:4px}
.sbars i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);position:relative;overflow:hidden}
.sbars i.full{background:#fff}.sbars i.run::after{content:"";position:absolute;inset:0;background:#fff;animation:sbar 5s linear forwards}
@keyframes sbar{from{transform:translateX(-100%)}}
.shead{position:absolute;top:calc(28px + env(safe-area-inset-top,0px));left:14px;right:14px;display:flex;align-items:center;gap:10px;z-index:2}
.shead div{flex:1;display:flex;flex-direction:column;line-height:1.2}.shead small{opacity:.85}.shead button{font-size:22px;color:#fff;padding:4px 8px}
.stext{font-size:clamp(22px,5vw,34px);font-weight:700;text-align:center;max-width:620px;margin:0 auto;white-space:pre-wrap;word-break:break-word}
.sprev,.snext{position:absolute;top:90px;bottom:0}.sprev{left:0;width:35%}.snext{right:0;width:65%}
.spre{border-radius:18px;padding:16px;background:linear-gradient(135deg,hsl(var(--h) 80% 55%),hsl(calc(var(--h) + 60) 85% 40%))}
.spre textarea{background:none!important;border:0!important;color:#fff;text-align:center;font-size:20px;font-weight:600}
.spre textarea::placeholder{color:rgba(255,255,255,.75)}
.sw{width:28px;height:28px;border-radius:50%;background:hsl(var(--h) 80% 55%);flex:none}`;
document.head.appendChild(st);

const X = { contacts: new Set(), blocks: new Set(), clears: {}, phones: {}, shared: new Set(), statuses: [], ai: [], typing: false };
const EMO = '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😜 🤪 😎 🤩 🥳 😏 😒 😔 😢 😭 😤 😡 🤯 😱 🤔 🤗 🙄 😴 🤒 🥶 🥵 👍 👎 👏 🙌 🙏 💪 👋 ✌️ 🤞 👌 🤝 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 🔥 ✨ 🎉 🎁 ⭐ 💯 ✅ ❌ 🌹 ☀️ 🌙 ☕ 🍕 🍔 🎵 📷 🚀 💡 🎮 ⚽ 🐱 🐶'.split(' ');
const last = a => a[a.length - 1];
const aiKey = () => 'connect_ai_' + S.me;
const saveAi = () => { try { localStorage.setItem(aiKey(), JSON.stringify(X.ai.slice(-40))); } catch (e) {} };

/* ---------- данные ---------- */
async function loadPhones() {
  const [p, h] = await Promise.all([sb.from('phones').select('*'), sb.from('phone_shares').select('viewer_id')]);
  X.phones = Object.fromEntries((p.data || []).map(r => [r.user_id, r.phone]));
  X.shared = new Set((h.data || []).map(r => r.viewer_id));
}
async function loadMore() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  const day = new Date(Date.now() - 864e5).toISOString();
  const [c, b, k, s] = await Promise.all([
    sb.from('contacts').select('contact_id'),
    sb.from('blocks').select('blocked_id'),
    sb.from('chat_clears').select('peer_id,cleared_at'),
    sb.from('statuses').select('*').gte('created_at', day).order('created_at'),
    loadPhones()
  ]);
  X.contacts = new Set((c.data || []).map(r => r.contact_id));
  X.blocks = new Set((b.data || []).map(r => r.blocked_id));
  X.clears = Object.fromEntries((k.data || []).map(r => [r.peer_id, r.cleared_at]));
  X.statuses = s.data || [];
  try { X.ai = JSON.parse(localStorage.getItem('connect_ai_' + session.user.id) || '[]'); } catch (e) { X.ai = []; }
}
const _load = loadAll;
loadAll = async () => { await _load(); await loadMore(); };

/* ---------- статусы на главной ---------- */
const stories = () => {
  const by = {};
  X.statuses.forEach(s => (by[s.user_id] = by[s.user_id] || []).push(s));
  const ids = Object.keys(by).sort((a, b) => a === S.me ? -1 : b === S.me ? 1 : last(by[b]).created_at.localeCompare(last(by[a]).created_at));
  return `<div class="stories"><div class="st" data-act="snew"><span class="av add">+</span>Статус</div>${ids.map(id => `<div class="st" data-act="sopen" data-id="${id}">${av(U(id))}${esc(id === S.me ? 'Вы' : U(id).name.split(' ')[0])}</div>`).join('')}</div>`;
};
const _main = main;
main = () => {
  const h = _main();
  return view.name === 'home' ? h.replace(/<div class="stories">[\s\S]*?(?=<div class="card comp">)/, stories()) : h;
};

let sv = null;
function closeStatus() { if (sv) clearTimeout(sv.t); sv = null; const d = $('#sv'); if (d) d.remove(); }
function showStatus() {
  const d = $('#sv'); if (!d || !sv) return;
  clearTimeout(sv.t);
  const s = sv.list[sv.i], u = U(s.user_id);
  d.style.setProperty('--h', s.hue);
  d.innerHTML = `<div class="sbars">${sv.list.map((_, k) => `<i class="${k < sv.i ? 'full' : k === sv.i ? 'run' : ''}"></i>`).join('')}</div>
    <div class="shead">${av(u, 'sm')}<div><b>${esc(u.name)}</b><small>${ago(new Date(s.created_at).getTime())} назад</small></div>${s.user_id === S.me || isAdmin() ? '<button data-act="sdel" aria-label="Удалить">🗑</button>' : ''}<button data-act="sclose" aria-label="Закрыть">×</button></div>
    <p class="stext">${esc(s.text)}</p><button class="sprev" data-act="sprev" aria-label="Назад"></button><button class="snext" data-act="snext" aria-label="Вперёд"></button>`;
  sv.t = setTimeout(nextStatus, 5000);
}
function nextStatus() { if (!sv) return; if (sv.i + 1 >= sv.list.length) return closeStatus(); sv.i++; showStatus(); }
function openStatus(uid) {
  const list = X.statuses.filter(s => s.user_id === uid);
  if (!list.length) return;
  closeStatus(); sv = { list, i: 0 };
  const d = document.createElement('div'); d.id = 'sv'; d.className = 'sv'; document.body.appendChild(d);
  showStatus();
}
function newStatus() {
  const old = $('#stM'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'stM';
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="stclose" aria-label="Закрыть">×</button><h2>Новый статус</h2><div class="ef">
    <div class="spre" id="sPre" style="--h:265"><textarea id="sIn" maxlength="200" rows="4" placeholder="Что у вас нового?"></textarea></div>
    <div class="row"><button class="emob" data-act="semo" aria-label="Эмодзи">☺</button>${[265, 200, 340, 25, 150, 45, 300].map(h => `<button class="sw" data-act="shue" data-h="${h}" style="--h:${h}" aria-label="Цвет"></button>`).join('')}</div>
    <p class="mu">Статус виден всем 24 часа.</p><button class="btn lg" data-act="spost">Опубликовать</button></div></div>`;
  document.body.appendChild(d); $('#sIn').focus();
}

/* ---------- чаты ---------- */
const clearedAt = id => X.clears[id] ? new Date(X.clears[id]) : null;
const shown = (m, id) => !clearedAt(id) || new Date(m.created_at) > clearedAt(id);
const _dialogs = dialogs;
dialogs = () => _dialogs().filter(({ uid, last: l }) => shown(l, uid));

renderCList = function () {
  const el = $('#cl'); if (!el) return;
  const s = (($('#cs') || {}).value || '').trim().toLowerCase();
  const row = (u, l, n) => `<button class="ci ${u.id === chatWith ? 'on' : ''}" data-act="opench" data-id="${u.id}">${u.id === 'ai' ? '<span class="av" style="--h:265">✦</span>' : av(u)}<div><b>${esc(u.name)}${u.id === 'ai' ? '<span class="bdg">ИИ</span>' : bdg(u)}</b><span>${l ? (l.sender_id === S.me ? 'Вы: ' : '') + esc(l.text) : esc(u.sub || '@' + u.handle)}</span></div>${l ? `<small>${hhmm(l.created_at)}</small>` : ''}${n ? `<i class="dot" style="position:static">${n}</i>` : ''}</button>`;
  if (s) { el.innerHTML = S.users.filter(u => u.id !== S.me && (u.name + ' ' + u.handle).toLowerCase().includes(s)).map(u => row(u)).join('') || '<div class="empty">Никого не найдено</div>'; return; }
  const dl = dialogs(), inD = new Set(dl.map(d => d.uid)), cts = [...X.contacts].filter(id => !inD.has(id)).map(U);
  el.innerHTML = row({ id: 'ai', name: 'Connect AI', sub: 'Спросите что угодно' }) + dl.map(({ uid, last: l }) => row(U(uid), l, unreadFrom(uid))).join('') + (cts.length ? '<div class="sec">Контакты</div>' + cts.map(u => row(u)).join('') : '');
};

renderConv = function () {
  const box = $('#chat'); if (!box) return;
  const h = $('#ch'), body = $('#cvm'), cb = $('#cb');
  if (!chatWith) { box.classList.remove('open'); h.innerHTML = ''; cb.hidden = true; body.innerHTML = '<div class="empty">Выберите чат или найдите человека, чтобы начать общение</div>'; return; }
  box.classList.add('open');
  const ai = chatWith === 'ai', u = ai ? { name: 'Connect AI' } : U(chatWith), blocked = X.blocks.has(chatWith), tel = X.phones[chatWith];
  h.innerHTML = `<button class="back" data-act="backch" aria-label="Назад">‹</button><span class="chu" ${ai ? '' : `data-user="${u.id}"`}>${ai ? '<span class="av sm" style="--h:265">✦</span>' : av(u, 'sm')}<div><b>${esc(u.name)}${ai ? '<span class="bdg">ИИ</span>' : bdg(u)}</b><small>${ai ? 'Помощник' : tel ? '📞 ' + esc(tel) : '@' + esc(u.handle)}</small></div></span>${ai ? '<button class="mbtn" data-act="aiclear" aria-label="Очистить">⟲</button>' : '<button class="mbtn" data-act="cmenu" aria-label="Меню">⋮</button>'}`;
  const rows = ai ? X.ai.map(m => ({ me: m.role === 'user', text: m.text, t: m.t })) : thread(chatWith).filter(m => shown(m, chatWith)).map(m => ({ me: m.sender_id === S.me, text: m.text, t: m.created_at, read: m.read_at }));
  body.innerHTML = (rows.length ? rows.map(r => `<div class="mb ${r.me ? 'me' : ''}"><p>${esc(r.text)}</p><small>${hhmm(r.t)}${r.me && !ai ? (r.read ? ' ✓✓' : ' ✓') : ''}</small></div>`).join('') : '<div class="empty">Сообщений пока нет. Напишите первым!</div>')
    + (X.typing && ai ? '<div class="mb"><p>печатает…</p></div>' : '') + (blocked ? '<div class="empty">Вы заблокировали этого пользователя</div>' : '');
  cb.hidden = blocked;
  if (!$('.emob', cb)) cb.insertAdjacentHTML('afterbegin', '<button class="emob" data-act="emoji" aria-label="Эмодзи">☺</button>');
  body.scrollTop = body.scrollHeight;
};
const _open = openChat;
openChat = function (id) { _open(id); if (id !== 'ai') loadPhones().then(() => { if (chatWith === id) renderConv(); }); };

/* ---------- отправка и ИИ ---------- */
async function aiSend() {
  const el = $('#cin'), v = el.value.trim();
  if (!v || X.typing) return;
  el.value = ''; el.style.height = 'auto';
  X.ai.push({ role: 'user', text: v, t: Date.now() }); X.typing = true; saveAi(); renderConv();
  const hist = X.ai.slice(-12).map(({ role, text }) => ({ role, text }));
  while (hist.length && hist[0].role !== 'user') hist.shift();
  let text = '';
  try {
    const { data, error } = await sb.functions.invoke('ai-chat', { body: { messages: hist } });
    if (error) { try { text = (await error.context.json()).error; } catch (e) {} text = text || 'ИИ сейчас недоступен. Проверьте, что функция ai-chat установлена.'; }
    else text = data.error || data.text;
  } catch (e) { text = 'ИИ сейчас недоступен.'; }
  X.typing = false; X.ai.push({ role: 'assistant', text: String(text || '…'), t: Date.now() }); saveAi();
  if (chatWith === 'ai') renderConv();
}
const _send = sendMsg;
sendMsg = function () {
  if (chatWith === 'ai') return aiSend();
  if (X.blocks.has(chatWith)) return toast('Сначала разблокируйте пользователя');
  return _send();
};

/* ---------- меню, эмодзи, действия ---------- */
function toggleMenu() {
  const old = $('.menu'); if (old) return old.remove();
  const id = chatWith, h = $('#ch');
  if (!id || id === 'ai' || !h) return;
  h.insertAdjacentHTML('beforeend', `<div class="menu"><button data-act="cm-contact">${X.contacts.has(id) ? 'Удалить из контактов' : 'Добавить в контакты'}</button><button data-act="cm-share">${X.shared.has(id) ? 'Скрыть мой номер' : 'Показать мой номер'}</button><button data-act="cm-block">${X.blocks.has(id) ? 'Разблокировать' : 'Заблокировать'}</button><button class="danger" data-act="cm-clear">Удалить чат</button></div>`);
}
function emoji(input, before) {
  const old = $('.emo'); if (old) return old.remove();
  const d = document.createElement('div'); d.className = 'emo'; d._in = input;
  d.innerHTML = EMO.map(e => `<button type="button" data-act="eput">${e}</button>`).join('');
  before.parentNode.insertBefore(d, before);
}
async function myPhone() {
  if (X.phones[S.me]) return X.phones[S.me];
  const { data: { session } } = await sb.auth.getSession(), em = session.user.email || '';
  const ph = /@phone\.connect\.app$/.test(em) ? '+' + em.split('@')[0] : (prompt('Введите ваш номер телефона, например +7 900 123-45-67') || '').trim();
  if (!/^\+?[\d\s()-]{10,20}$/.test(ph)) { toast('Номер не указан'); return null; }
  if (!ok(await sb.from('phones').upsert({ user_id: S.me, phone: ph }))) return null;
  return X.phones[S.me] = ph;
}
const toggleRow = async (set, table, mine, theirs, id, add, remove) => {
  const has = set.has(id);
  const r = has ? await sb.from(table).delete().match({ [mine]: S.me, [theirs]: id }) : await sb.from(table).insert({ [mine]: S.me, [theirs]: id });
  if (!ok(r)) return null;
  has ? set.delete(id) : set.add(id);
  toast(has ? remove : add);
  return !has;
};

document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]'), m = $('.menu');
  if (m && !(t && t.dataset.act === 'cmenu')) m.remove();
  if (!t) return;
  const a = t.dataset.act, id = chatWith;
  if (a === 'cmenu') toggleMenu();
  else if (a === 'cm-contact') { await toggleRow(X.contacts, 'contacts', 'owner_id', 'contact_id', id, 'Добавлен в контакты', 'Удалён из контактов'); renderCList(); }
  else if (a === 'cm-share') {
    if (!X.shared.has(id) && !(await myPhone())) return;
    await toggleRow(X.shared, 'phone_shares', 'owner_id', 'viewer_id', id, 'Собеседник видит ваш номер', 'Номер скрыт');
  }
  else if (a === 'cm-block') {
    if (!X.blocks.has(id) && !confirm('Заблокировать пользователя? Он не сможет вам писать.')) return;
    await toggleRow(X.blocks, 'blocks', 'blocker_id', 'blocked_id', id, 'Пользователь заблокирован', 'Пользователь разблокирован');
    renderConv(); renderCList();
  }
  else if (a === 'cm-clear') {
    if (!confirm('Удалить чат? Сообщения исчезнут только у вас.')) return;
    const l = last(thread(id)), at = l ? l.created_at : new Date().toISOString();
    if (!ok(await sb.from('chat_clears').upsert({ owner_id: S.me, peer_id: id, cleared_at: at }))) return;
    X.clears[id] = at; chatWith = null; renderConv(); renderCList(); toast('Чат удалён');
  }
  else if (a === 'aiclear') { if (confirm('Очистить переписку с ИИ?')) { X.ai = []; saveAi(); renderConv(); } }
  else if (a === 'emoji') emoji($('#cin'), $('#cb'));
  else if (a === 'semo') emoji($('#sIn'), $('#sPre'));
  else if (a === 'eput') { const i = $('.emo')._in; i.setRangeText(t.textContent, i.selectionStart, i.selectionEnd, 'end'); i.focus(); i.dispatchEvent(new Event('input', { bubbles: true })); }
  else if (a === 'snew') newStatus();
  else if (a === 'sopen') openStatus(t.dataset.id);
  else if (a === 'sclose') closeStatus();
  else if (a === 'snext') nextStatus();
  else if (a === 'sprev') { if (sv && sv.i > 0) { sv.i--; showStatus(); } }
  else if (a === 'sdel') {
    if (!confirm('Удалить статус?')) return;
    const s = sv.list[sv.i];
    if (!ok(await sb.from('statuses').delete().eq('id', s.id))) return;
    X.statuses = X.statuses.filter(x => x.id !== s.id); closeStatus(); render();
  }
  else if (a === 'stclose') $('#stM').remove();
  else if (a === 'shue') $('#sPre').style.setProperty('--h', t.dataset.h);
  else if (a === 'spost') {
    const text = $('#sIn').value.trim(), hue = +getComputedStyle($('#sPre')).getPropertyValue('--h') || 265;
    if (!text) return toast('Напишите текст статуса');
    t.disabled = true;
    const r = await sb.from('statuses').insert({ user_id: S.me, text, hue }).select().single();
    if (!ok(r)) { t.disabled = false; return; }
    X.statuses.push(r.data); $('#stM').remove(); render(); toast('Статус опубликован');
  }
});

if (S.me) loadMore().then(() => render());
})();
