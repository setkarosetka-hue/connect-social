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
.sw{width:28px;height:28px;border-radius:50%;background:hsl(var(--h) 80% 55%);flex:none}
.bdg{color:#fff!important;font-size:11px!important;font-weight:700}
.bdg.cr{background:linear-gradient(135deg,#f59e0b,#ef4444)}
.vf{display:inline-grid;place-items:center;width:16px;height:16px;margin-left:5px;border-radius:50%;background:#2b8cff;color:#fff!important;font-size:11px!important;font-weight:800;line-height:1;vertical-align:middle}
#cvm .mb{animation:none;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;position:relative}
#cvm .mb:last-child{animation:rise .25s both}
.mb.sel{outline:2px solid var(--ac);outline-offset:2px}
.mb.sel::after{content:"✓";position:absolute;top:-8px;left:-8px;width:20px;height:20px;border-radius:50%;background:var(--ac);color:#fff;font-size:12px;display:grid;place-items:center}
.mb.me.sel::after{left:auto;right:-8px}
.selbar{display:flex;align-items:center;gap:6px;width:100%}.selbar b{flex:1}.selbar button{padding:6px 10px;border-radius:12px;font-weight:600}.selbar button:hover{background:var(--bg)}.selbar .danger{color:var(--hot)}
.msov{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;justify-content:center}
.msheet{width:100%;max-width:420px;margin:12px 12px calc(12px + env(safe-area-inset-bottom,0px));padding:8px;border-radius:20px;background:var(--cd);border:1px solid var(--bd);box-shadow:var(--sh);animation:rise .2s both}
.msheet button{display:block;width:100%;text-align:left;padding:13px 14px;border-radius:12px;font-weight:600}.msheet button:hover{background:var(--bg)}.msheet .danger{color:var(--hot)}
.fwl{max-height:50vh;overflow-y:auto;margin-top:12px}
.slink{color:var(--ac);font-weight:600;text-decoration:none}.slink:hover{text-decoration:underline}
.mb .who{display:block;font-size:12px;font-weight:700;color:var(--ac);margin-bottom:2px}`;
document.head.appendChild(st);

const X = { contacts: new Set(), blocks: new Set(), clears: {}, phones: {}, shared: new Set(), statuses: [], ai: [], typing: false, sel: new Set(), rows: {}, keepScroll: false, sup: [], supSeen: {}, bans: {}, groups: [], gm: [], gmsg: [], gSeen: {}, gpick: new Set() };
const SUPPORT = 'helpingdev.connect@gmail.com';
const mail = `<a class="slink" href="mailto:${SUPPORT}">${SUPPORT}</a>`;
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
  try { X.supSeen = JSON.parse(localStorage.getItem('connect_sup_' + session.user.id) || '{}'); } catch (e) { X.supSeen = {}; }
  await loadSup();
  const bn = await sb.from('bans').select('user_id,reason');
  X.bans = Object.fromEntries((bn.data || []).map(r => [r.user_id, r.reason || '']));
  try { X.gSeen = JSON.parse(localStorage.getItem('connect_grp_' + session.user.id) || '{}'); } catch (e) { X.gSeen = {}; }
  await loadGroups();
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
  const row = (u, l, n) => `<button class="ci ${u.id === chatWith ? 'on' : ''}" data-act="opench" data-id="${u.id}">${u.id === 'ai' ? '<span class="av" style="--h:265">✦</span>' : u.icon ? '<span class="av" style="--h:200">' + u.icon + '</span>' : av(u)}<div><b>${esc(u.name)}${u.id === 'ai' ? '<span class="bdg">ИИ</span>' : bdg(u)}</b><span>${l ? (l.sender_id === S.me ? 'Вы: ' : '') + esc(l.text) : esc(u.sub || '@' + u.handle)}</span></div>${l ? `<small>${hhmm(l.created_at)}</small>` : ''}${n ? `<i class="dot" style="position:static">${n}</i>` : ''}</button>`;
  if (s) { el.innerHTML = S.users.filter(u => u.id !== S.me && (u.name + ' ' + u.handle).toLowerCase().includes(s)).map(u => row(u)).join('') || '<div class="empty">Никого не найдено</div>'; return; }
  const dl = dialogs(), inD = new Set(dl.map(d => d.uid)), cts = [...X.contacts].filter(id => !inD.has(id)).map(U);
  el.innerHTML = supRows(row) + row({ id: 'ai', name: 'Connect AI', sub: 'Спросите что угодно' }) + groupRows(row) + dl.map(({ uid, last: l }) => row(U(uid), l, unreadFrom(uid))).join('') + (cts.length ? '<div class="sec">Контакты</div>' + cts.map(u => row(u)).join('') : '');
};

renderConv = function () {
  const box = $('#chat'); if (!box) return;
  const h = $('#ch'), body = $('#cvm'), cb = $('#cb');
  if (!chatWith) { X.sel.clear(); box.classList.remove('open'); h.innerHTML = ''; cb.hidden = true; body.innerHTML = '<div class="empty">Выберите чат или найдите человека, чтобы начать общение</div>'; return; }
  const bot = chatWith === 'ai', sup = isSup(chatWith), grp = isGrp(chatWith), staff = sup && isAdmin(), tid = sup ? supThread() : null, g = grp ? gOf(gid()) : null;
  if (grp && !g) { chatWith = null; return renderConv(); }
  box.classList.add('open');
  const u = bot ? { name: 'Connect AI' } : grp ? { name: g.name } : sup ? (staff ? U(tid) : { name: 'Техподдержка' }) : U(chatWith);
  const blocked = !bot && !sup && !grp && X.blocks.has(chatWith), tel = X.phones[chatWith];
  const rows = grp ? gMsgs(g.id).map(m => ({ id: m.id, me: m.sender_id === S.me, text: m.text, t: m.created_at, who: m.sender_id === S.me ? '' : U(m.sender_id).name }))
    : sup ? X.sup.filter(m => m.user_id === tid).map(m => ({ id: m.id, me: staff ? m.sender_id !== m.user_id : m.sender_id === S.me, text: m.text, t: m.created_at }))
    : bot ? X.ai.map((m, i) => ({ id: 'a' + i, me: m.role === 'user', text: m.text, t: m.t }))
    : thread(chatWith).filter(m => shown(m, chatWith)).map(m => ({ id: m.id, me: m.sender_id === S.me, text: m.text, t: m.created_at, read: m.read_at }));
  X.rows = Object.fromEntries(rows.map(r => [r.id, r]));
  [...X.sel].forEach(i => { if (!X.rows[i]) X.sel.delete(i); });
  const avt = bot ? '<span class="av sm" style="--h:265">✦</span>' : grp ? '<span class="av sm" style="--h:200">👥</span>' : sup && !staff ? '<span class="av sm" style="--h:200">🎧</span>' : av(u, 'sm');
  const sub = bot ? 'Помощник' : grp ? gMem(g.id).length + ' участников' : sup ? (staff ? '@' + esc(u.handle) + ' · обращение' : 'Ответим как можно скорее') : tel ? '📞 ' + esc(tel) : '@' + esc(u.handle);
  const tag = bot ? '<span class="bdg">ИИ</span>' : grp || (sup && !staff) ? '' : bdg(u);
    const menu = bot ? '<button class="mbtn" data-act="aiclear" aria-label="Очистить">⟲</button>' : sup ? '' : '<button class="mbtn" data-act="cmenu" aria-label="Меню">⋮</button>';
  h.innerHTML = X.sel.size
    ? `<div class="selbar"><button data-act="selx" aria-label="Отмена">×</button><b>${X.sel.size}</b><button data-act="selcopy">Копировать</button><button data-act="selfwd">Переслать</button><button class="danger" data-act="seldel">Удалить</button></div>`
    : `<button class="back" data-act="backch" aria-label="Назад">‹</button><span class="chu" ${bot || grp || (sup && !staff) ? '' : `data-act="uprofile" data-id="${chatWith}"`}>${avt}<span><b>${esc(u.name)}${tag}</b><small>${sub}</small></span></span>${menu}`;
  cb.hidden = blocked || (sup && !staff) || grp;
  cb.innerHTML = bot ? `<div class="aiinput"><textarea id="cin" rows="1" placeholder="Спросите Connect AI..."></textarea><button class="send" data-act="send" aria-label="Отправить">➤</button></div>`
    : grp ? '' : sup ? '' : blocked ? '<div class="empty">Пользователь заблокирован</div>' : `<div class="inputrow"><button class="emob" data-act="emo" aria-label="Эмодзи">☺</button><textarea id="mi" rows="1" placeholder="Сообщение"></textarea><button class="send" data-act="send" aria-label="Отправить">➤</button></div>`;
  body.innerHTML = rows.map(r => `<div class="mb ${r.me ? 'me' : ''} ${X.sel.has(r.id) ? 'sel' : ''}" data-mid="${r.id}">${r.who ? `<span class="who">${esc(r.who)}</span>` : ''}<div>${esc(r.text)}</div><small>${hhmm(r.t)}${r.me && r.read ? ' ✓✓' : ''}</small></div>`).join('');
  if (!X.keepScroll) body.scrollTop = body.scrollHeight;
  X.keepScroll = false;
};

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
    const { data, error } = await sb.functions.invoke('connect-ai', { body: { messages: hist } });
    if (error) { try { text = (await error.context.json()).error; } catch (e) {} text = text || 'ИИ сейчас недоступен. Проверьте, что функция connect-ai установлена.'; }
    else text = data.error || data.reply;
  } catch (e) { text = 'ИИ сейчас недоступен.'; }
  X.typing = false; X.ai.push({ role: 'assistant', text: String(text || '…'), t: Date.now() }); saveAi();
  if (chatWith === 'ai') renderConv();
}
const _send = sendMsg;
sendMsg = function () {
  if (chatWith === 'ai') return aiSend();
  if (isSup(chatWith)) return supSend();
  if (isGrp(chatWith)) return gSend();
  if (X.blocks.has(chatWith)) return toast('Сначала разблокируйте пользователя');
  return _send();
};

/* ---------- меню, эмодзи, действия ---------- */
function toggleMenu() {
  const old = $('.menu'); if (old) return old.remove();
  const id = chatWith, h = $('#ch');
  if (!id || id === 'ai' || !h) return;
  if (isGrp(id)) return h.insertAdjacentHTML('beforeend', groupMenu());
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
  return true;
};
async function toggleContact(id) {
  return toggleRow(X.contacts, 'contacts', 'user_id', 'contact_id', id, 'Добавлено в контакты', 'Удалено из контактов');
}
async function toggleBlock(id) {
  return toggleRow(X.blocks, 'blocks', 'user_id', 'blocked_id', id, 'Пользователь заблокирован', 'Пользователь разблокирован');
}
async function toggleShare(id) {
  const has = X.shared.has(id);
  const r = has ? await sb.from('phone_shares').delete().match({ viewer_id: id }) : await sb.from('phone_shares').insert({ viewer_id: id });
  if (!ok(r)) return null;
  has ? X.shared.delete(id) : X.shared.add(id);
  toast(has ? 'Номер скрыт' : 'Номер открыт');
  return true;
}
async function clearChat(id) {
  if (!confirm('Удалить чат?')) return;
  const r = await sb.from('chat_clears').upsert({ user_id: S.me, peer_id: id, cleared_at: new Date().toISOString() });
  if (!ok(r)) return;
  X.clears[id] = new Date().toISOString();
  if (chatWith === id) { chatWith = null; renderConv(); }
  renderCList();
}
function clearAi() {
  if (!confirm('Очистить историю Connect AI?')) return;
  X.ai = []; saveAi(); renderConv();
}
function selectMessage(id) {
  if (X.sel.has(id)) X.sel.delete(id); else X.sel.add(id);
  renderConv();
}
async function copySelected() {
  const text = [...X.sel].map(id => X.rows[id]?.text || '').join('\n');
  if (!text) return;
  try { await navigator.clipboard.writeText(text); toast('Скопировано'); }
  catch (e) { prompt('Скопируйте текст:', text); }
}
async function deleteSelected() {
  if (!X.sel.size || !confirm('Удалить выбранные сообщения?')) return;
  const ids = [...X.sel];
  if (chatWith === 'ai') {
    X.ai = X.ai.filter((m, i) => !ids.includes('a' + i));
    saveAi();
  } else if (isGrp(chatWith)) {
    for (const id of ids) await sb.from('group_messages').delete().eq('id', id).eq('sender_id', S.me);
    await loadGroups();
  } else if (isSup(chatWith)) {
    toast('Сообщения поддержки нельзя удалить');
  } else {
    for (const id of ids) await sb.from('messages').delete().eq('id', id).eq('sender_id', S.me);
    await loadAll();
  }
  X.sel.clear(); renderConv(); renderCList();
}
function forwardSelected() {
  if (!X.sel.size) return;
  const text = [...X.sel].map(id => X.rows[id]?.text || '').filter(Boolean).join('\n');
  if (!text) return;
  const targets = S.users.filter(u => u.id !== S.me && u.id !== chatWith);
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'fwdM';
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="fwdclose">×</button><h2>Переслать</h2><div class="fwl">${targets.map(u => `<button class="ci" data-act="fwdto" data-id="${u.id}">${av(u)}<span>${esc(u.name)}</span></button>`).join('')}</div></div>`;
  d.dataset.text = text;
  document.body.appendChild(d);
}
async function forwardTo(id) {
  const d = $('#fwdM'); if (!d) return;
  const text = d.dataset.text;
  const r = await sb.from('messages').insert({ sender_id: S.me, receiver_id: id, text });
  if (!ok(r)) return;
  d.remove(); toast('Переслано');
}
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

/* ---------- лайк без перерисовки, фото и обложка ---------- */
const _setPic = setPic;
setPic = function (f) { if (f) cover = false; _setPic(f); };
async function toggleLike(btn) {
  if (btn.dataset.busy) return;
  const id = btn.closest('.post').dataset.id, p = S.posts.find(x => x.id === id);
  if (!p) return;
  btn.dataset.busy = '1';
  const had = p.likes.includes(S.me);
  const flip = () => {
    const i = p.likes.indexOf(S.me); i < 0 ? p.likes.push(S.me) : p.likes.splice(i, 1);
    const on = p.likes.includes(S.me);
    btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on); btn.innerHTML = ic('heart', on) + p.likes.length;
  };
  flip();
  const r = had ? await sb.from('likes').delete().match({ post_id: id, user_id: S.me }) : await sb.from('likes').insert({ post_id: id, user_id: S.me });
  if (r.error) { flip(); toast('Ошибка: ' + r.error.message); }
  delete btn.dataset.busy;
}
document.addEventListener('click', e => {
  const like = e.target.closest('[data-act="like"]'), cov = e.target.closest('[data-act="cover"]'), ban = e.target.closest('[data-act="aban"]');
  if (ban && ban.dataset.flag === 'true') { e.stopImmediatePropagation(); banModal(ban.dataset.id); }
  else if (like) { e.stopImmediatePropagation(); toggleLike(like); }
  else if (cov && pic) {
    e.stopImmediatePropagation();
    draft = ($('#txt') || {}).value || ''; if (picURL) URL.revokeObjectURL(picURL);
    pic = picURL = null; cover = true; render();
  }
}, true);

/* ---------- переходы между вкладками без двойной анимации ---------- */
const dsig = () => [S.posts.map(p => p.id + ':' + p.likes.length + ':' + p.cm.length).join(), S.users.map(u => [u.id, u.name, u.handle, u.avatar, u.role, u.banned, u.verified].join()).join(), S.follows.length, S.msgs.length, X.statuses.length].join('|');
go = function (name, uid) {
  view = { name, uid: name === 'profile' ? (uid || S.me) : null };
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  const before = dsig();
  loadAll().then(() => {
    if (!S.me) return;
    if (view.name === 'dm') return refreshChat();
    const t = $('#txt');
    if (dsig() !== before && !(t && t.value)) render();
  });
};

/* ---------- админ-панель: выдача галочки ---------- */
const _render = render;
render = function () {
  _render();
  if (S.me && me().banned) {
    const c = $('#main .card');
    if (c && !$('.slink', c)) {
      const why = X.bans[S.me], btn = $('button', c);
      if (why && btn) btn.insertAdjacentHTML('beforebegin', `<p style="margin:0 0 18px"><b>Причина:</b> ${esc(why)}</p>`);
      c.insertAdjacentHTML('beforeend', `<p class="mu" style="margin-top:14px">Если это ошибка, напишите в поддержку: ${mail}</p>`);
    }
    return;
  }
  if (view.name !== 'admin' || !isAdmin()) return;
  document.querySelectorAll('.urow').forEach(row => {
    const ua = $('.ua', row), el = row.querySelector('[data-user]');
    const u = el && S.users.find(x => x.id === el.dataset.user);
    if (u && u.banned && X.bans[u.id]) el.insertAdjacentHTML('beforeend', `<br><small>Причина бана: ${esc(X.bans[u.id])}</small>`);
    if (ua && u) ua.insertAdjacentHTML('afterbegin', `<button class="mini" data-act="averify" data-id="${u.id}" data-flag="${!u.verified}">${u.verified ? 'Снять галочку' : 'Выдать галочку'}</button><button class="mini" data-act="apwd" data-id="${u.id}">Сбросить пароль</button>`);
  });
};

/* ---------- сообщения: выбор, копирование, пересылка, удаление ---------- */
const selIds = () => [...X.sel];
const picked = list => Object.keys(X.rows).filter(i => list.includes(i));
const msgText = i => (X.rows[i] || {}).text || '';
const closeSheet = () => { const d = $('#msov'); if (d) d.remove(); };
function copyText(txt) {
  const done = () => toast('Скопировано');
  const fb = () => { const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать'); } t.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fb); else fb();
}
function toggleSel(i) { X.sel.has(i) ? X.sel.delete(i) : X.sel.add(i); X.keepScroll = true; renderConv(); }
function sheet(i) {
  closeSheet();
  const r = X.rows[i]; if (!r) return;
  const d = document.createElement('div'); d.className = 'msov'; d.id = 'msov';
  d.innerHTML = `<div class="msheet"><button data-act="m-copy" data-id="${i}">Копировать</button><button data-act="m-fwd" data-id="${i}">Переслать</button>${navigator.share ? `<button data-act="m-share" data-id="${i}">Поделиться</button>` : ''}<button data-act="m-sel" data-id="${i}">Выбрать</button>${r.me ? `<button class="danger" data-act="m-del" data-id="${i}">Удалить</button>` : ''}</div>`;
  document.body.appendChild(d);
}
async function delMsgs(list) {
  if (isSup(chatWith)) return toast('Сообщения в поддержке удалять нельзя');
  const own = picked(list).filter(i => X.rows[i].me);
  if (!own.length) return toast('Можно удалить только свои сообщения');
  if (!confirm('Удалить сообщения: ' + own.length + '? Они исчезнут у обоих.')) return;
  if (chatWith === 'ai') { const del = new Set(own.map(i => +i.slice(1))); X.ai = X.ai.filter((_, k) => !del.has(k)); saveAi(); }
  else if (isGrp(chatWith)) { if (!ok(await sb.from('group_messages').delete().in('id', own))) return; X.gmsg = X.gmsg.filter(m => !own.includes(m.id)); }
  else { if (!ok(await sb.from('messages').delete().in('id', own))) return; S.msgs = S.msgs.filter(m => !own.includes(m.id)); }
  X.sel.clear(); refreshChat(); toast('Удалено');
}
function forward(list) {
  const texts = picked(list).map(msgText).filter(Boolean);
  if (!texts.length) return;
  closeSheet(); const old = $('#fwM'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'fwM'; d._texts = texts;
  d.innerHTML = '<div class="sheet card"><button class="x" data-act="fwclose" aria-label="Закрыть">×</button><h2>Переслать</h2><div class="cs" style="padding:0"><input id="fwq" placeholder="Поиск людей" autocomplete="off"></div><div class="fwl" id="fwl"></div></div>';
  document.body.appendChild(d); fwFill();
}
function fwFill() {
  const s = (($('#fwq') || {}).value || '').trim().toLowerCase(), recent = dialogs().map(x => x.uid);
  const us = S.users.filter(u => u.id !== S.me && !X.blocks.has(u.id) && (!s || (u.name + ' ' + u.handle).toLowerCase().includes(s)))
    .sort((a, b) => (recent.includes(b.id) ? 1 : 0) - (recent.includes(a.id) ? 1 : 0));
  $('#fwl').innerHTML = us.map(u => `<button class="ci" data-act="fwto" data-id="${u.id}">${av(u)}<div><b>${esc(u.name)}${bdg(u)}</b><span>@${esc(u.handle)}</span></div></button>`).join('') || '<div class="empty">Никого не найдено</div>';
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, id = t.dataset.id;
  if (a === 'averify') {
    const flag = t.dataset.flag === 'true';
    if (!ok(await sb.rpc('admin_set_verified', { target: id, flag }))) return;
    S.users.find(u => u.id === id).verified = flag; render(); toast(flag ? 'Галочка выдана' : 'Галочка снята');
  }
  else if (a === 'apwd') {
    const u = S.users.find(x => x.id === id);
    if (!confirm('Сбросить пароль пользователя ' + u.name + '? Старый пароль перестанет работать, а все его устройства будут разлогинены.')) return;
    const pw = Array.from(crypto.getRandomValues(new Uint32Array(10)), n => 'abcdefghjkmnpqrstuvwxyz23456789'[n % 31]).join('');
    if (!ok(await sb.rpc('admin_reset_password', { target: id, new_password: pw }))) return;
    copyText(pw);
    prompt('Новый пароль для ' + u.name + ' (уже скопирован). Передайте его человеку, пусть сменит в профиле:', pw);
  }
  else if (a === 'm-copy') { closeSheet(); copyText(msgText(id)); }
  else if (a === 'm-fwd') forward([id]);
  else if (a === 'm-share') { closeSheet(); navigator.share({ text: msgText(id) }).catch(() => {}); }
  else if (a === 'm-sel') { closeSheet(); X.sel.add(id); X.keepScroll = true; renderConv(); }
  else if (a === 'm-del') { closeSheet(); delMsgs([id]); }
  else if (a === 'selx') { X.sel.clear(); X.keepScroll = true; renderConv(); }
  else if (a === 'selcopy') { copyText(picked(selIds()).map(msgText).join('\n')); X.sel.clear(); X.keepScroll = true; renderConv(); }
  else if (a === 'selfwd') forward(selIds());
  else if (a === 'seldel') delMsgs(selIds());
  else if (a === 'fwclose') $('#fwM').remove();
  else if (a === 'gnew') gNew();
  else if (a === 'gpick') { X.gpick.has(id) ? X.gpick.delete(id) : X.gpick.add(id); gFill(); }
  else if (a === 'gclose') $('#gM').remove();
  else if (a === 'gcreate') {
    const name = $('#gName').value.trim();
    if (!name) return toast('Введите название группы');
    if (!X.gpick.size) return toast('Выберите хотя бы одного участника');
``## Часть 3/5

```javascript
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

/* ---------- лайк без перерисовки, фото и обложка ---------- */
const _setPic = setPic;
setPic = function (f) { if (f) cover = false; _setPic(f); };
async function toggleLike(btn) {
  if (btn.dataset.busy) return;
  const id = btn.closest('.post').dataset.id, p = S.posts.find(x => x.id === id);
  if (!p) return;
  btn.dataset.busy = '1';
  const had = p.likes.includes(S.me);
  const flip = () => {
    const i = p.likes.indexOf(S.me); i < 0 ? p.likes.push(S.me) : p.likes.splice(i, 1);
    const on = p.likes.includes(S.me);
    btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on); btn.innerHTML = ic('heart', on) + p.likes.length;
  };
  flip();
  const r = had ? await sb.from('likes').delete().match({ post_id: id, user_id: S.me }) : await sb.from('likes').insert({ post_id: id, user_id: S.me });
  if (r.error) { flip(); toast('Ошибка: ' + r.error.message); }
  delete btn.dataset.busy;
}
document.addEventListener('click', e => {
  const like = e.target.closest('[data-act="like"]'), cov = e.target.closest('[data-act="cover"]'), ban = e.target.closest('[data-act="aban"]');
  if (ban && ban.dataset.flag === 'true') { e.stopImmediatePropagation(); banModal(ban.dataset.id); }
  else if (like) { e.stopImmediatePropagation(); toggleLike(like); }
  else if (cov && pic) {
    e.stopImmediatePropagation();
    draft = ($('#txt') || {}).value || ''; if (picURL) URL.revokeObjectURL(picURL);
    pic = picURL = null; cover = true; render();
  }
}, true);

/* ---------- переходы между вкладками без двойной анимации ---------- */
const dsig = () => [S.posts.map(p => p.id + ':' + p.likes.length + ':' + p.cm.length).join(), S.users.map(u => [u.id, u.name, u.handle, u.avatar, u.role, u.banned, u.verified].join()).join(), S.follows.length, S.msgs.length, X.statuses.length].join('|');
go = function (name, uid) {
  view = { name, uid: name === 'profile' ? (uid || S.me) : null };
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  const before = dsig();
  loadAll().then(() => {
    if (!S.me) return;
    if (view.name === 'dm') return refreshChat();
    const t = $('#txt');
    if (dsig() !== before && !(t && t.value)) render();
  });
};

/* ---------- админ-панель: выдача галочки ---------- */
const _render = render;
render = function () {
  _render();
  if (S.me && me().banned) {
    const c = $('#main .card');
    if (c && !$('.slink', c)) {
      const why = X.bans[S.me], btn = $('button', c);
      if (why && btn) btn.insertAdjacentHTML('beforebegin', `<p style="margin:0 0 18px"><b>Причина:</b> ${esc(why)}</p>`);
      c.insertAdjacentHTML('beforeend', `<p class="mu" style="margin-top:14px">Если это ошибка, напишите в поддержку: ${mail}</p>`);
    }
    return;
  }
  if (view.name !== 'admin' || !isAdmin()) return;
  document.querySelectorAll('.urow').forEach(row => {
    const ua = $('.ua', row), el = row.querySelector('[data-user]');
    const u = el && S.users.find(x => x.id === el.dataset.user);
    if (u && u.banned && X.bans[u.id]) el.insertAdjacentHTML('beforeend', `<br><small>Причина бана: ${esc(X.bans[u.id])}</small>`);
    if (ua && u) ua.insertAdjacentHTML('afterbegin', `<button class="mini" data-act="averify" data-id="${u.id}" data-flag="${!u.verified}">${u.verified ? 'Снять галочку' : 'Выдать галочку'}</button><button class="mini" data-act="apwd" data-id="${u.id}">Сбросить пароль</button>`);
  });
};

/* ---------- сообщения: выбор, копирование, пересылка, удаление ---------- */
const selIds = () => [...X.sel];
const picked = list => Object.keys(X.rows).filter(i => list.includes(i));
const msgText = i => (X.rows[i] || {}).text || '';
const closeSheet = () => { const d = $('#msov'); if (d) d.remove(); };
function copyText(txt) {
  const done = () => toast('Скопировано');
  const fb = () => { const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать'); } t.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fb); else fb();
}
function toggleSel(i) { X.sel.has(i) ? X.sel.delete(i) : X.sel.add(i); X.keepScroll = true; renderConv(); }
function sheet(i) {
  closeSheet();
  const r = X.rows[i]; if (!r) return;
  const d = document.createElement('div'); d.className = 'msov'; d.id = 'msov';
  d.innerHTML = `<div class="msheet"><button data-act="m-copy" data-id="${i}">Копировать</button><button data-act="m-fwd" data-id="${i}">Переслать</button>${navigator.share ? `<button data-act="m-share" data-id="${i}">Поделиться</button>` : ''}<button data-act="m-sel" data-id="${i}">Выбрать</button>${r.me ? `<button class="danger" data-act="m-del" data-id="${i}">Удалить</button>` : ''}</div>`;
  document.body.appendChild(d);
}
async function delMsgs(list) {
  if (isSup(chatWith)) return toast('Сообщения в поддержке удалять нельзя');
  const own = picked(list).filter(i => X.rows[i].me);
  if (!own.length) return toast('Можно удалить только свои сообщения');
  if (!confirm('Удалить сообщения: ' + own.length + '? Они исчезнут у обоих.')) return;
  if (chatWith === 'ai') { const del = new Set(own.map(i => +i.slice(1))); X.ai = X.ai.filter((_, k) => !del.has(k)); saveAi(); }
  else if (isGrp(chatWith)) { if (!ok(await sb.from('group_messages').delete().in('id', own))) return; X.gmsg = X.gmsg.filter(m => !own.includes(m.id)); }
  else { if (!ok(await sb.from('messages').delete().in('id', own))) return; S.msgs = S.msgs.filter(m => !own.includes(m.id)); }
  X.sel.clear(); refreshChat(); toast('Удалено');
}
function forward(list) {
  const texts = picked(list).map(msgText).filter(Boolean);
  if (!texts.length) return;
  closeSheet(); const old = $('#fwM'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'fwM'; d._texts = texts;
  d.innerHTML = '<div class="sheet card"><button class="x" data-act="fwclose" aria-label="Закрыть">×</button><h2>Переслать</h2><div class="cs" style="padding:0"><input id="fwq" placeholder="Поиск людей" autocomplete="off"></div><div class="fwl" id="fwl"></div></div>';
  document.body.appendChild(d); fwFill();
}
function fwFill() {
  const s = (($('#fwq') || {}).value || '').trim().toLowerCase(), recent = dialogs().map(x => x.uid);
  const us = S.users.filter(u => u.id !== S.me && !X.blocks.has(u.id) && (!s || (u.name + ' ' + u.handle).toLowerCase().includes(s)))
    .sort((a, b) => (recent.includes(b.id) ? 1 : 0) - (recent.includes(a.id) ? 1 : 0));
  $('#fwl').innerHTML = us.map(u => `<button class="ci" data-act="fwto" data-id="${u.id}">${av(u)}<div><b>${esc(u.name)}${bdg(u)}</b><span>@${esc(u.handle)}</span></div></button>`).join('') || '<div class="empty">Никого не найдено</div>';
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, id = t.dataset.id;
  if (a === 'averify') {
    const flag = t.dataset.flag === 'true';
    if (!ok(await sb.rpc('admin_set_verified', { target: id, flag }))) return;
    S.users.find(u => u.id === id).verified = flag; render(); toast(flag ? 'Галочка выдана' : 'Галочка снята');
  }
  else if (a === 'apwd') {
    const u = S.users.find(x => x.id === id);
    if (!confirm('Сбросить пароль пользователя ' + u.name + '? Старый пароль перестанет работать, а все его устройства будут разлогинены.')) return;
    const pw = Array.from(crypto.getRandomValues(new Uint32Array(10)), n => 'abcdefghjkmnpqrstuvwxyz23456789'[n % 31]).join('');
    if (!ok(await sb.rpc('admin_reset_password', { target: id, new_password: pw }))) return;
    copyText(pw);
    prompt('Новый пароль для ' + u.name + ' (уже скопирован). Передайте его человеку, пусть сменит в профиле:', pw);
  }
  else if (a === 'm-copy') { closeSheet(); copyText(msgText(id)); }
  else if (a === 'm-fwd') forward([id]);
  else if (a === 'm-share') { closeSheet(); navigator.share({ text: msgText(id) }).catch(() => {}); }
  else if (a === 'm-sel') { closeSheet(); X.sel.add(id); X.keepScroll = true; renderConv(); }
  else if (a === 'm-del') { closeSheet(); delMsgs([id]); }
  else if (a === 'selx') { X.sel.clear(); X.keepScroll = true; renderConv(); }
  else if (a === 'selcopy') { copyText(picked(selIds()).map(msgText).join('\n')); X.sel.clear(); X.keepScroll = true; renderConv(); }
  else if (a === 'selfwd') forward(selIds());
  else if (a === 'seldel') delMsgs(selIds());
  else if (a === 'fwclose') $('#fwM').remove();
  else if (a === 'gnew') gNew();
  else if (a === 'gpick') { X.gpick.has(id) ? X.gpick.delete(id) : X.gpick.add(id); gFill(); }
  else if (a === 'gclose') $('#gM').remove();
  else if (a === 'gcreate') {
    const name = $('#gName').value.trim();
    if (!name) return toast('Введите название группы');
    if (!X.gpick.size) return toast('Выберите хотя бы одного участника');
        const r = del ? await sb.from('groups').delete().eq('id', g.id) : await sb.from('group_members').delete().match({ group_id: g.id, user_id: S.me });
    if (!ok(r)) return;
    X.groups = X.groups.filter(x => x.id !== g.id); X.gm = X.gm.filter(m => m.group_id !== g.id); X.gmsg = X.gmsg.filter(m => m.group_id !== g.id);
    chatWith = null; refreshChat(); toast(del ? 'Группа удалена' : 'Вы покинули группу');
  }
  else if (a === 'breason') $('#bnR').value = t.dataset.t;
  else if (a === 'bnclose') $('#bnM').remove();
  else if (a === 'bnok') {
    const bid = $('#bnM').dataset.id, why = $('#bnR').value.trim();
    t.disabled = true;
    const r = await sb.rpc('admin_set_banned', { target: bid, flag: true, why });
    t.disabled = false;
    if (!ok(r)) return;
    S.users.find(x => x.id === bid).banned = true; X.bans[bid] = why; $('#bnM').remove(); render(); toast('Пользователь заблокирован');
  }
  else if (a === 'pwd') pwdModal();
  else if (a === 'pwclose') $('#pwM').remove();
  else if (a === 'pwsave') {
    const p1 = $('#pw1').value, p2 = $('#pw2').value, err = $('#pwE');
    if (p1.length < 6) return err.textContent = 'Пароль должен содержать минимум 6 символов';
    if (p1 !== p2) return err.textContent = 'Пароли не совпадают';
    t.disabled = true;
    const { error } = await sb.auth.updateUser({ password: p1 });
    t.disabled = false;
    if (error) return err.textContent = /same|different/i.test(error.message) ? 'Новый пароль должен отличаться от текущего' : 'Ошибка: ' + error.message;
    $('#pwM').remove(); toast('Пароль изменён');
  }
  else if (a === 'fwto') {
    const texts = $('#fwM')._texts;
    for (const x of texts) {
      const r = await sb.from('messages').insert({ sender_id: S.me, receiver_id: id, text: ('↪ ' + x).slice(0, 2000) }).select().single();
      if (r.error) return toast('Не удалось переслать');
      if (!S.msgs.some(m => m.id === r.data.id)) S.msgs.push(r.data);
    }
    $('#fwM').remove(); X.sel.clear(); refreshChat(); toast('Переслано');
  }
});
document.addEventListener('input', e => { if (e.target.id === 'fwq') fwFill(); });

let lp = 0, lpT = null, sx = 0, sy = 0;
const mbOf = e => e.target.closest && e.target.closest('.mb[data-mid]');
document.addEventListener('pointerdown', e => {
  const m = mbOf(e); if (!m) return;
  lp = 0; sx = e.clientX; sy = e.clientY; clearTimeout(lpT);
  lpT = setTimeout(() => { lp = 1; if (navigator.vibrate) navigator.vibrate(15); X.sel.add(m.dataset.mid); X.keepScroll = true; renderConv(); }, 450);
});
document.addEventListener('pointermove', e => { if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 10) clearTimeout(lpT); });
['pointerup', 'pointercancel'].forEach(n => document.addEventListener(n, () => clearTimeout(lpT)));
document.addEventListener('scroll', () => clearTimeout(lpT), true);
document.addEventListener('contextmenu', e => { if (mbOf(e)) e.preventDefault(); });
document.addEventListener('click', e => {
  if (e.target.id === 'msov') return closeSheet();
  const m = mbOf(e); if (!m) return;
  if (lp) { lp = 0; return; }
  X.sel.size ? toggleSel(m.dataset.mid) : sheet(m.dataset.mid);
});

/* ---------- смена пароля и поддержка ---------- */
function pwdModal() {
  const old = $('#pwM'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'pwM';
  d.innerHTML = '<div class="sheet card"><button class="x" data-act="pwclose" aria-label="Закрыть">×</button><h2>Сменить пароль</h2><div class="ef"><input id="pw1" type="password" placeholder="Новый пароль (от 6 символов)" autocomplete="new-password"><input id="pw2" type="password" placeholder="Повторите пароль" autocomplete="new-password"><p class="err" id="pwE"></p><button class="btn lg" data-act="pwsave">Сохранить пароль</button></div></div>';
  document.body.appendChild(d); $('#pw1').focus();
}
const _edit = openEdit;
openEdit = function () {
  _edit();
  const b = $('#eBio'), e = $('#eErr');
  if (b) b.insertAdjacentHTML('afterend', '<button class="chip" type="button" data-act="pwd" style="align-self:flex-start">Сменить пароль</button>');
  if (e) e.insertAdjacentHTML('afterend', `<p class="mu" style="font-size:13px">Поддержка: ${mail}</p>`);
};
const _chrome = chrome;
chrome = function () {
  _chrome();
  const r = $('#rail');
  if (r) r.insertAdjacentHTML('beforeend', `<div class="card"><h4>Поддержка</h4><small class="mu">Вопросы и проблемы:<br>${mail}</small></div>`);
  let n = isAdmin() ? [...new Set(X.sup.map(m => m.user_id))].reduce((c, t) => c + supUnread(t), 0) : supUnread(S.me);
  n += gUnreadAll();
  if (n) document.querySelectorAll('[data-go="dm"]').forEach(b => { if (!$('.dot', b)) b.insertAdjacentHTML('beforeend', `<i class="dot">${n}</i>`); });
};
const foot = $('.foot');
if (foot) foot.insertAdjacentHTML('beforeend', `<span class="mu">Поддержка: ${mail}</span>`);
document.addEventListener('click', e => { if (['pwM', 'bnM', 'gM', 'gmM'].includes(e.target.id)) e.target.remove(); });

/* ---------- причина блокировки ---------- */
function banModal(id) {
  const u = S.users.find(x => x.id === id), old = $('#bnM'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'bnM'; d.dataset.id = id;
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="bnclose" aria-label="Закрыть">×</button><h2>Заблокировать</h2><p class="mu" style="margin-bottom:12px">${esc(u.name)} увидит причину на экране блокировки.</p><div class="ef"><div class="row" style="flex-wrap:wrap">${['Спам', 'Оскорбления', 'Мошенничество', 'Нарушение правил'].map(t => `<button class="chip" type="button" data-act="breason" data-t="${t}">${t}</button>`).join('')}</div><textarea id="bnR" rows="3" maxlength="300" placeholder="Причина (необязательно)"></textarea><button class="btn lg" data-act="bnok">Заблокировать</button></div></div>`;
  document.body.appendChild(d); $('#bnR').focus();
}

/* ---------- чат техподдержки ---------- */
const isSup = id => typeof id === 'string' && (id === 'support' || id.startsWith('support:'));
const supThread = () => chatWith === 'support' ? S.me : chatWith.slice(8);
const supIn = m => isAdmin() ? (m.sender_id === m.user_id && m.user_id !== S.me) : m.sender_id !== S.me;
const supUnread = tid => X.sup.filter(m => m.user_id === tid && supIn(m) && new Date(m.created_at).getTime() > (X.supSeen[tid] || 0)).length;
async function loadSup() {
  const r = await sb.from('support_messages').select('*').order('created_at').limit(1000);
  if (!r.error) X.sup = r.data || [];
}
function supSeen() {
  if (!isSup(chatWith)) return;
  const tid = supThread(), l = last(X.sup.filter(m => m.user_id === tid));
  X.supSeen[tid] = l ? new Date(l.created_at).getTime() : Date.now();
  try { localStorage.setItem('connect_sup_' + S.me, JSON.stringify(X.supSeen)); } catch (e) {}
}
function supRows(row) {
  if (isAdmin()) {
    const by = {};
    X.sup.forEach(m => { by[m.user_id] = m; });
    const ids = Object.keys(by).sort((a, b) => by[b].created_at.localeCompare(by[a].created_at));
    return ids.length ? '<div class="sec">Обращения в поддержку</div>' + ids.map(id => row({ ...U(id), id: 'support:' + id }, by[id], supUnread(id))).join('') : '';
  }
  function gSeen() {
  if (!isGrp(chatWith)) return;
  const l = last(gMsgs(gid()));
  X.gSeen[gid()] = l ? new Date(l.created_at).getTime() : Date.now();
  try { localStorage.setItem('connect_grp_' + S.me, JSON.stringify(X.gSeen)); } catch (e) {}
}
function groupRows(row) {
  const key = g => { const l = last(gMsgs(g.id)); return l ? l.created_at : g.created_at; };
  const gs = [...X.groups].sort((a, b) => key(b).localeCompare(key(a)));
  return '<div class="sec">Группы</div><button class="ci" data-act="gnew"><span class="av" style="--h:150">＋</span><div><b>Новая группа</b><span>Создать общий чат</span></div></button>'
    + gs.map(g => { const l = last(gMsgs(g.id)); return row({ id: 'g:' + g.id, name: g.name, sub: gMem(g.id).length + ' участников', icon: '👥' }, l && { ...l, text: (l.sender_id === S.me ? '' : U(l.sender_id).name.split(' ')[0] + ': ') + l.text }, gUnread(g.id)); }).join('');
}
function groupMenu() {
  const g = gOf(gid()), own = g && g.owner_id === S.me;
  return `<div class="menu"><button data-act="g-members">${own ? 'Участники и добавление' : 'Участники'}</button>${own ? '<button data-act="g-rename">Переименовать</button><button class="danger" data-act="g-del">Удалить группу</button>' : '<button class="danger" data-act="g-leave">Покинуть группу</button>'}</div>`;
}
async function gSend() {
  const el = $('#cin'), v = el.value.trim();
  if (!v) return;
  el.value = ''; el.style.height = 'auto';
  const r = await sb.from('group_messages').insert({ group_id: gid(), sender_id: S.me, text: v }).select().single();
  if (r.error) { el.value = v; return toast('Не отправлено: ' + r.error.message); }
  X.gmsg.push(r.data); refreshChat();
}
function gNew() {
  X.gpick = new Set();
  const old = $('#gM'); if (old) old.remove();
  const d = document.createElement('div'); d.className = 'modal'; d.id = 'gM';
  d.innerHTML = '<div class="sheet card"><button class="x" data-act="gclose" aria-label="Закрыть">×</button><h2>Новая группа</h2><div class="ef"><input id="gName" maxlength="40" placeholder="Название группы"><input id="gq" placeholder="Поиск участников" autocomplete="off"><div class="fwl" id="gl"></div><button class="btn lg" data-act="gcreate">Создать группу</button></div></div>';
  document.body.appendChild(d); gFill(); $('#gName').focus();
}
function gFill() {
  const s = (($('#gq') || {}).value || '').trim().toLowerCase();
  $('#gl').innerHTML = S.users.filter(u => u.id !== S.me && (!s || (u.name + ' ' + u.handle).toLowerCase().includes(s))).map(u => `<button class="ci ${X.gpick.has(u.id) ? 'on' : ''}" data-act="gpick" data-id="${u.id}">${av(u)}<div><b>${esc(u.name)}</b><span>@${esc(u.handle)}</span></div><b>${X.gpick.has(u.id) ? '✓' : ''}</b></button>`).join('') || '<div class="empty">Никого не найдено</div>';
}
function gMemModal() {
  const g = gOf(gid()); if (!g) return;
  const own = g.owner_id === S.me;
  let d = $('#gmM'); if (!d) { d = document.createElement('div'); d.className = 'modal'; d.id = 'gmM'; document.body.appendChild(d); }
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="gmclose" aria-label="Закрыть">×</button><h2>${esc(g.name)}</h2><div class="fwl">${gMem(g.id).map(m => { const u = U(m.user_id); return `<div class="sg">${av(u, 'sm')}<div><b>${esc(u.name)}</b>${u.id === g.owner_id ? '<br><small>владелец</small>' : ''}</div>${own && u.id !== S.me ? `<button class="mini danger" data-act="gkick" data-id="${u.id}">Убрать</button>` : ''}</div>`; }).join('')}</div>${own ? '<h4 style="margin:14px 0 8px">Добавить участников</h4><div class="cs" style="padding:0"><input id="gaq" placeholder="Поиск людей" autocomplete="off"></div><div class="fwl" id="gal"></div>' : ''}</div>`;
  if (own) gaFill();
}
function gaFill() {
  const g = gOf(gid()), s = (($('#gaq') || {}).value || '').trim().toLowerCase(), inG = new Set(gMem(g.id).map(m => m.user_id));
  $('#gal').innerHTML = S.users.filter(u => !inG.has(u.id) && (!s || (u.name + ' ' + u.handle).toLowerCase().includes(s))).map(u => `<button class="ci" data-act="gadd" data-id="${u.id}">${av(u)}<div><b>${esc(u.name)}</b><span>@${esc(u.handle)}</span></div><b>＋</b></button>`).join('') || '<div class="empty">Больше некого добавить</div>';
}
document.addEventListener('input', e => { if (e.target.id === 'gq') gFill(); if (e.target.id === 'gaq') gaFill(); });
setInterval(async () => {
  if (!S.me || document.hidden) return;
  const sig = () => X.groups.length + ':' + X.gm.length + ':' + X.gmsg.length, inc = () => X.gmsg.filter(m => m.sender_id !== S.me).length;
  const before = sig(), n = inc();
  await loadGroups();
  if (sig() === before) return;
  if (inc() > n) toast('Новое сообщение в группе');
  chrome();
  if (view.name === 'dm') { renderCList(); if (isGrp(chatWith)) renderConv(); }
}, 12000);

if (S.me) loadMore().then(() => render());
})();
