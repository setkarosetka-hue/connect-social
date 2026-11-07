'use strict';
const sb = window.connectSupabase;

/* стили баннера профиля: подключены прямо из JS, чтобы не зависеть от style.css */
(() => {
  const st = document.createElement('style');
  st.textContent = '.pcover{position:relative;overflow:hidden;z-index:0}.pcover img,.pcover video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.phead{position:relative;z-index:2}';
  document.head.appendChild(st);
})();

const $ = (s, r = document) => r.querySelector(s);
const P = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  admin: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  dm: '<path d="M22 3L11 14M22 3l-7 19-4-8-8-4z"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
  moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
};
const ic = (n, f) => `<svg class="i" viewBox="0 0 24 24" fill="${f ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let S = { me: null, users: [], posts: [], follows: [], msgs: [], totalPosts: 0, totalLikes: 0, totalComments: 0 };
let view = { name: 'home', uid: null }, cover = false, q = '', open = new Set(), mode = 'login';
let pic = null, picURL = null, draft = '', avFile = null, bnFile = null, bnRemove = false, chatWith = null, ch = null, pollT = null;

const U = id => S.users.find(u => u.id === id) || { id, name: '?', handle: 'user', bio: '', hue: 0 };
const me = () => U(S.me);
const rank = u => u.role === 'creator' ? 3 : u.role === 'admin' ? 2 : 1;
const isAdmin = () => !!S.me && rank(me()) >= 2;
const isCreator = () => !!S.me && me().role === 'creator';
const canManage = t => t.id !== S.me && (isCreator() ? rank(t) < 3 : isAdmin() && rank(t) === 1);
const bdg = u => (u.role === 'creator' ? '<span class="bdg cr" title="Создатель">Создатель</span>' : u.role === 'admin' ? '<span class="bdg" title="Администратор">Админ</span>' : '') + (u.verified ? '<span class="vf" title="Верифицирован">✓</span>' : '');
const isF = id => S.follows.some(f => f.follower_id === S.me && f.following_id === id);
const ago = t => { const m = Math.max(1, Math.round((Date.now() - t) / 6e4)); return m < 60 ? m + ' мин' : m < 1440 ? Math.round(m / 60) + ' ч' : Math.round(m / 1440) + ' дн'; };
const hhmm = t => new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const av = (u, c = '') => `<span class="av ${c}" style="--h:${u.hue}">${u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : esc((u.name[0] || '?').toUpperCase())}</span>`;
const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 2400); };
const rich = s => esc(s).replace(/#([\p{L}\d_]+)/gu, '<span class="tag">#$1</span>');
const ok = r => { if (r.error) { toast('Ошибка: ' + r.error.message); return false; } return true; };

const shrink = (file, max) => new Promise((res, rej) => {
  const im = new Image();
  im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(im.src);
    c.toBlob(b => b ? res(b) : rej(new Error('Не удалось обработать фото')), 'image/jpeg', .82);
  };
  im.onerror = () => rej(new Error('Не удалось прочитать фото'));
  im.src = URL.createObjectURL(file);
});
async function upload(file, max) {
  try {
    const b = await shrink(file, max), path = `${S.me}/${Date.now()}.jpg`;
    const { error } = await sb.storage.from('media').upload(path, b, { contentType: 'image/jpeg' });
    if (error) { toast('Ошибка загрузки: ' + error.message); return null; }
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  } catch (e) { toast(e.message); return null; }
}

/* ---------- баннеры профиля: фото или анимация до 5 секунд ---------- */
const BN_MAX_SEC = 5.3;
async function uploadRaw(file, name) {
  try {
    const ext = ((file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin').slice(0, 5);
    const path = `${S.me}/${name}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('media').upload(path, file, { contentType: file.type });
    if (error) { toast('Ошибка загрузки: ' + error.message); return null; }
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  } catch (e) { toast(e.message); return null; }
}
const videoSeconds = f => new Promise((res, rej) => {
  const v = document.createElement('video');
  v.preload = 'metadata';
  v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); res(v.duration); };
  v.onerror = () => rej(new Error('Не удалось прочитать видео'));
  v.src = URL.createObjectURL(f);
});
const gifSeconds = async f => {
  const b = new Uint8Array(await f.arrayBuffer());
  let cs = 0;
  for (let i = 0; i < b.length - 7; i++) if (b[i] === 0x21 && b[i + 1] === 0xF9 && b[i + 2] === 4) cs += (b[i + 4] | (b[i + 5] << 8));
  return cs / 100;
};
async function pickBanner(f) {
  const isV = f.type.startsWith('video/'), isG = f.type === 'image/gif';
  if (!isV && !f.type.startsWith('image/')) return toast('Выберите фото, GIF или короткое видео');
  if (isV && !/^video\/(mp4|webm)$/.test(f.type)) return toast('Видео: только MP4 или WebM');
  if (f.size > (isV || isG ? 6 : 15) * 1048576) return toast(isV || isG ? 'Анимация должна быть не больше 6 МБ' : 'Фото должно быть не больше 15 МБ');
  try {
    if (isV && (await videoSeconds(f)) > BN_MAX_SEC) return toast('Анимация должна быть не длиннее 5 секунд');
    if (isG && (await gifSeconds(f)) > BN_MAX_SEC) return toast('Анимация должна быть не длиннее 5 секунд');
  } catch (e) { return toast(e.message); }
  bnFile = f; bnRemove = false;
  const l = $('#eBnL'); if (l) l.firstChild.textContent = 'Выбрано: ' + f.name.slice(0, 24);
}
const bannerHTML = u => u.banner
  ? (u.banner_type === 'video'
    ? `<video src="${esc(u.banner)}" autoplay muted loop playsinline></video>`
    : `<img src="${esc(u.banner)}" alt="">`)
  : '';

async function loadAll() {
  const [u, p, l, c, f, n, m] = await Promise.all([
    sb.from('profiles').select('*'),
    sb.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('likes').select('post_id,user_id'),
    sb.from('comments').select('*').order('created_at'),
    sb.from('follows').select('*'),
    sb.from('posts').select('id', { count: 'exact', head: true }),
    sb.from('messages').select('*').order('created_at', { ascending: false }).limit(500)
  ]);
  if (u.error || p.error) return toast('Не удалось загрузить данные. Проверьте настройки Supabase.');
  const likes = l.data || [], cms = c.data || [];
  S.users = u.data || [];
  S.follows = f.data || [];
  S.msgs = (m.data || []).reverse();
  S.totalPosts = n.count || (p.data || []).length;
  S.totalLikes = likes.length; S.totalComments = cms.length;
  S.posts = (p.data || []).map(x => ({
    id: x.id, uid: x.user_id, t: new Date(x.created_at).getTime(), text: x.text, cover: x.cover, image: x.image,
    likes: likes.filter(k => k.post_id === x.id).map(k => k.user_id),
    cm: cms.filter(k => k.post_id === x.id).map(k => ({ id: k.id, uid: k.user_id, t: new Date(k.created_at).getTime(), text: k.text }))
  }));
}

/* ---------- чаты ---------- */
const thread = id => S.msgs.filter(m => (m.sender_id === S.me && m.receiver_id === id) || (m.sender_id === id && m.receiver_id === S.me));
const unreadFrom = id => S.msgs.filter(m => m.sender_id === id && m.receiver_id === S.me && !m.read_at).length;
const unreadAll = () => S.msgs.filter(m => m.receiver_id === S.me && !m.read_at).length;
const sig = () => S.msgs.length + ':' + (S.msgs.length ? S.msgs[S.msgs.length - 1].id : '') + ':' + unreadAll();
function dialogs() {
  const map = {};
  S.msgs.forEach(m => { const o = m.sender_id === S.me ? m.receiver_id : m.sender_id; if (!map[o] || m.created_at > map[o].created_at) map[o] = m; });
  return Object.entries(map).map(([uid, last]) => ({ uid, last })).sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
}
function renderCList() {
  const el = $('#cl'); if (!el) return;
  const s = (($('#cs') || {}).value || '').trim().toLowerCase();
  const rows = s ? S.users.filter(u => u.id !== S.me && (u.name + ' ' + u.handle).toLowerCase().includes(s)).map(u => ({ uid: u.id, last: null })) : dialogs();
  el.innerHTML = rows.length ? rows.map(({ uid, last }) => {
    const u = U(uid), n = unreadFrom(uid);
    return `<button class="ci ${uid === chatWith ? 'on' : ''}" data-act="opench" data-id="${uid}">${av(u)}<div><b>${esc(u.name)}${bdg(u)}</b><span>${last ? (last.sender_id === S.me ? 'Вы: ' : '') + esc(last.text) : '@' + esc(u.handle)}</span></div>${last ? `<small>${hhmm(last.created_at)}</small>` : ''}${n ? `<i class="dot" style="position:static">${n}</i>` : ''}</button>`;
  }).join('') : `<div class="empty">${s ? 'Никого не найдено' : 'Пока нет чатов. Найдите человека через поиск выше.'}</div>`;
}
function renderConv() {
  const box = $('#chat'); if (!box) return;
  const h = $('#ch'), body = $('#cvm'), cb = $('#cb');
  if (!chatWith) { box.classList.remove('open'); h.innerHTML = ''; cb.hidden = true; body.innerHTML = '<div class="empty">Выберите чат или найдите человека, чтобы начать общение</div>'; return; }
  const u = U(chatWith), th = thread(chatWith);
  box.classList.add('open'); cb.hidden = false;
  h.innerHTML = `<button class="back" data-act="backch" aria-label="Назад">‹</button><span class="chu" data-user="${u.id}">${av(u, 'sm')}<div><b>${esc(u.name)}${bdg(u)}</b><small>@${esc(u.handle)}</small></div></span>`;
  body.innerHTML = th.length ? th.map(m => `<div class="mb ${m.sender_id === S.me ? 'me' : ''}"><p>${esc(m.text)}</p><small>${hhmm(m.created_at)}${m.sender_id === S.me ? (m.read_at ? ' ✓✓' : ' ✓') : ''}</small></div>`).join('') : '<div class="empty">Сообщений пока нет. Напишите первым!</div>';
  body.scrollTop = body.scrollHeight;
}
function markRead() {
  if (!chatWith) return;
  const un = S.msgs.filter(m => m.sender_id === chatWith && m.receiver_id === S.me && !m.read_at);
  if (!un.length) return;
  const now = new Date().toISOString();
  un.forEach(m => { m.read_at = now; });
  chrome(); renderCList();
  sb.from('messages').update({ read_at: now }).eq('sender_id', chatWith).eq('receiver_id', S.me).is('read_at', null).then(() => {});
}
function refreshChat() {
  chrome();
  if (view.name === 'dm') { renderCList(); renderConv(); markRead(); }
}
function openChat(id) {
  chatWith = id;
  if (view.name !== 'dm') return go('dm');
  renderCList(); renderConv(); markRead();
  setTimeout(() => $('#cin') && $('#cin').focus(), 50);
}
async function sendMsg() {
  const el = $('#cin'), v = el.value.trim();
  if (!v || !chatWith) return;
  el.value = ''; el.style.height = 'auto';
  const r = await sb.from('messages').insert({ sender_id: S.me, receiver_id: chatWith, text: v }).select().single();
  if (r.error) { el.value = v; return toast('Не отправлено: ' + r.error.message); }
  if (!S.msgs.some(x => x.id === r.data.id)) S.msgs.push(r.data);
  refreshChat();
}
function onMsg(pl) {
  const m = pl.new && pl.new.id ? pl.new : null;
  if (pl.eventType === 'INSERT' && m && (m.sender_id === S.me || m.receiver_id === S.me) && !S.msgs.some(x => x.id === m.id)) {
    S.msgs.push(m);
    if (m.receiver_id === S.me && !(view.name === 'dm' && chatWith === m.sender_id)) toast('Сообщение от ' + U(m.sender_id).name);
  }
  if (pl.eventType === 'UPDATE' && m) { const i = S.msgs.findIndex(x => x.id === m.id); if (i >= 0) S.msgs[i] = m; }
  if (pl.eventType === 'DELETE' && pl.old) S.msgs = S.msgs.filter(x => x.id !== pl.old.id);
  refreshChat();
}
async function pollMsgs() {
  if (!S.me || document.hidden) return;
  const before = sig();
  const m = await sb.from('messages').select('*').order('created_at', { ascending: false }).limit(500);
  if (m.error) return;
  S.msgs = (m.data || []).reverse();
  if (sig() !== before) refreshChat();
}
function startLive() {
  stopLive();
  ch = sb.channel('dm-' + S.me).on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onMsg).subscribe();
  pollT = setInterval(pollMsgs, 15000);
}
function stopLive() { if (ch) { sb.removeChannel(ch); ch = null; } clearInterval(pollT); }

/* ---------- лента ---------- */
function post(p) {
  const u = U(p.uid), liked = p.likes.includes(S.me), canDel = p.uid === S.me || isAdmin();
  const media = p.image ? `<img class="pimg" src="${esc(p.image)}" alt="" loading="lazy">` : p.cover != null ? `<div class="cover" style="--h:${p.cover}"></div>` : '';
  return `<article class="card post" data-id="${p.id}">
    <header data-user="${u.id}">${av(u)}<div><b>${esc(u.name)}${bdg(u)}</b><span>@${esc(u.handle)} · ${ago(p.t)}</span></div></header>
    <p>${rich(p.text)}</p>${media}
    <footer><button class="act like ${liked ? 'on' : ''}" data-act="like" aria-pressed="${liked}">${ic('heart', liked)}${p.likes.length}</button>
    <button class="act" data-act="cmt">${ic('chat')}${p.cm.length}</button>
    ${canDel ? `<button class="act del" data-act="del" aria-label="Удалить публикацию">${ic('trash')}</button>` : ''}</footer>
    <div class="cm ${open.has(p.id) ? 'open' : ''}">${p.cm.map(c => { const a = U(c.uid); return `<div class="c">${av(a, 'sm')}<div><b>${esc(a.name)}</b>${bdg(a)}<small>${ago(c.t)}</small><br>${esc(c.text)}</div>${c.id && (c.uid === S.me || isAdmin()) ? `<button class="cx" data-act="delc" data-cid="${c.id}" aria-label="Удалить комментарий">×</button>` : ''}</div>`; }).join('')}
    <div class="cf"><input placeholder="Напишите комментарий" maxlength="300"><button class="btn" data-act="send">Отправить</button></div></div></article>`;
}
const feed = list => list.length ? list.map(post).join('') : '<div class="card empty">Здесь пока пусто. Напишите первую публикацию!</div>';
const match = p => !q || (p.text + U(p.uid).name).toLowerCase().includes(q);

function main() {
  const m = me(), all = [...S.posts].filter(match);
  if (view.name === 'home') {
    return `<div class="stories">${S.users.map(u => `<div class="st" data-user="${u.id}">${av(u)}${esc(u.name.split(' ')[0])}</div>`).join('')}</div>
    <div class="card comp">${av(m)}<div style="flex:1"><textarea id="txt" maxlength="500" placeholder="Что нового, ${esc(m.name.split(' ')[0])}?">${esc(draft)}</textarea>
    ${picURL ? `<div class="prev"><img src="${picURL}" alt=""><button data-act="unpic" aria-label="Убрать фото">×</button></div>` : ''}
    <div class="bar"><div class="chips"><button class="chip ${picURL ? 'on' : ''}" data-act="pick">Фото</button><button class="chip ${cover ? 'on' : ''}" data-act="cover">С обложкой</button></div><button class="btn" data-act="publish">Опубликовать</button></div>
    <input type="file" id="pic" accept="image/*" hidden></div></div>
    ${feed(all.sort((a, b) => b.t - a.t))}`;
  }
  if (view.name === 'explore') return `<h2 class="t">Популярное</h2>${feed(all.sort((a, b) => b.likes.length + b.cm.length - a.likes.length - a.cm.length))}`;
  if (view.name === 'dm') {
    return `<div class="card chat" id="chat"><aside class="cside"><div class="cs"><input id="cs" placeholder="Поиск людей" autocomplete="off"></div><div id="cl"></div></aside>
    <section class="cpane"><div class="ch" id="ch"></div><div id="cvm"></div><div class="cb" id="cb" hidden><textarea id="cin" rows="1" maxlength="2000" placeholder="Сообщение"></textarea><button class="btn" data-act="dsend" aria-label="Отправить">${ic('dm')}</button></div></section></div>`;
  }
  if (view.name === 'admin') {
    if (!isAdmin()) return '<div class="card empty">Нет доступа</div>';
    const stats = [['Пользователи', S.users.length], ['Публикации', S.totalPosts], ['Комментарии', S.totalComments], ['Лайки', S.totalLikes]];
    const users = [...S.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return `<h2 class="t">Админ-панель</h2>
    <div class="stat">${stats.map(([l, n]) => `<div class="card"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
    <div class="card ulist"><h4>Пользователи</h4>${users.map(u => `<div class="sg urow">${av(u, 'sm')}<div data-user="${u.id}"><b>${esc(u.name)}</b>${bdg(u)}${u.banned ? '<span class="bdg ban">Бан</span>' : ''}<br><small>@${esc(u.handle)} · ${S.posts.filter(p => p.uid === u.id).length} постов · с ${new Date(u.created_at).toLocaleDateString('ru-RU')}</small></div>
      ${canManage(u) ? `<div class="ua">${isCreator() ? `<button class="mini" data-act="arole" data-id="${u.id}" data-role="${u.role === 'admin' ? 'user' : 'admin'}">${u.role === 'admin' ? 'Снять админа' : 'Сделать админом'}</button>` : ''}<button class="mini" data-act="aban" data-id="${u.id}" data-flag="${!u.banned}">${u.banned ? 'Разблокировать' : 'Заблокировать'}</button><button class="mini danger" data-act="adel" data-id="${u.id}">Удалить</button></div>` : ''}</div>`).join('')}</div>
    <h2 class="t sub">Модерация</h2>${feed(all.sort((a, b) => b.t - a.t))}`;
  }
  const u = U(view.uid), mine = u.id === S.me, fl = isF(u.id);
  const fc = S.follows.filter(f => f.following_id === u.id).length;
  const fg = S.follows.filter(f => f.follower_id === u.id).length;
  return `<div class="card"><div class="pcover" style="--h:${u.hue}">${bannerHTML(u)}</div><div class="phead"><div class="rw">${av(u, 'lg')}
    ${mine ? '<div class="row"><button class="btn ghost" data-act="edit">Редактировать</button><button class="btn ghost" data-act="logout">Выйти</button></div>' : `<div class="row"><button class="btn ghost" data-act="dm" data-id="${u.id}">Написать</button><button class="btn ${fl ? 'ghost' : ''}" data-act="follow" data-id="${u.id}">${fl ? 'Вы подписаны' : 'Подписаться'}</button></div>`}</div>
    <h2>${esc(u.name)}${bdg(u)}</h2><span class="mu">@${esc(u.handle)}</span><p style="margin-top:8px">${esc(u.bio || '')}</p>
    <div class="nums"><div><b>${S.posts.filter(p => p.uid === u.id).length}</b><span>постов</span></div><div><b>${fc}</b><span>подписчиков</span></div><div><b>${fg}</b><span>подписок</span></div></div></div></div>
    ${feed(S.posts.filter(p => p.uid === u.id).sort((a, b) => b.t - a.t))}`;
}

/* ---------- «Сейчас обсуждают»: реальные теги из публикаций ---------- */
const plural = n => { const m = n % 100, d = n % 10; return m > 10 && m < 20 ? 'публикаций' : d === 1 ? 'публикация' : d >= 2 && d <= 4 ? 'публикации' : 'публикаций'; };
function trending() {
  const map = {};
  S.posts.filter(p => (p.status || 'approved') === 'approved').forEach(p => {
    new Set((p.text.toLowerCase().match(/#[\p{L}\d_]+/gu) || [])).forEach(tg => {
      const e = map[tg] || (map[tg] = { tag: tg, n: 0, t: 0 });
      e.n++; e.t = Math.max(e.t, p.t);
    });
  });
  const list = Object.values(map).sort((a, b) => b.n - a.n || b.t - a.t).slice(0, 4);
  return list.length
    ? list.map(e => `<a class="tg" data-act="tag" data-tag="${esc(e.tag)}" style="cursor:pointer"><b>${esc(e.tag)}</b>${e.n} ${plural(e.n)}</a>`).join('')
    : '<small class="mu">Пока нет тегов. Добавьте #тег в публикацию.</small>';
}

function chrome() {
  const m = me(), items = [['home', 'Главная'], ['explore', 'Популярное'], ['dm', 'Чаты'], ['profile', 'Профиль']];
  if (isAdmin()) items.push(['admin', 'Админ']);
  const un = unreadAll();
  const nv = lbl => items.map(([k, l]) => `<button class="nv ${view.name === k && (k !== 'profile' || view.uid === S.me) ? 'on' : ''}" data-go="${k}" aria-label="${l}">${ic(k)}${lbl ? `<span>${l}</span>` : ''}${k === 'dm' && un ? `<i class="dot">${un}</i>` : ''}</button>`).join('');
  $('#side').innerHTML = nv(1) + `<button class="btn" data-act="compose">Новая публикация</button>`;
  $('#bottom').innerHTML = nv(0);
  $('#meBtn').innerHTML = av(m);
  $('#themeBtn').innerHTML = ic('moon');
  const sug = S.users.filter(u => u.id !== S.me).slice(0, 4);
  $('#rail').innerHTML = `<div class="card"><h4>Кого читать</h4>${sug.length ? sug.map(u => `<div class="sg">${av(u, 'sm')}<div data-user="${u.id}"><b>${esc(u.name)}</b>${bdg(u)}<br><small>@${esc(u.handle)}</small></div><button class="fol ${isF(u.id) ? 'on' : ''}" data-act="follow" data-id="${u.id}">${isF(u.id) ? 'Читаю' : 'Читать'}</button></div>`).join('') : '<small class="mu">Пока здесь только вы. Пригласите друзей!</small>'}</div>
  <div class="card"><h4>Сейчас обсуждают</h4>${trending()}</div>`;
}
function render() {
  const on = !!S.me;
  $('#landing').hidden = on; $('#app').hidden = !on;
  if (!on) return;
  if (me().banned) {
    $('#side').innerHTML = ''; $('#bottom').innerHTML = ''; $('#rail').innerHTML = '';
    $('#main').innerHTML = '<div class="card empty"><h2 class="t">Аккаунт заблокирован</h2><p style="margin:10px 0 18px">Администратор ограничил доступ к вашему аккаунту.</p><button class="btn" data-act="logout">Выйти</button></div>';
    return;
  }
  if (view.name === 'admin' && !isAdmin()) view = { name: 'home', uid: null };
  chrome();
  $('.layout').classList.toggle('wide', view.name === 'dm');
  $('#main').innerHTML = main();
  if (view.name === 'dm') { renderCList(); renderConv(); markRead(); }
}
function go(name, uid) {
  view = { name, uid: name === 'profile' ? (uid || S.me) : null };
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  loadAll().then(() => {
    if (!S.me) return;
    if (view.name === 'dm') return refreshChat();
    const t = $('#txt'); if (!(t && t.value)) render();
  });
}
function setMode(m) {
  mode = m;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('#fName').hidden = m === 'login'; $('#err').textContent = '';
  $('#authT').textContent = m === 'login' ? 'С возвращением' : 'Создайте аккаунт';
  $('#authBtn').textContent = m === 'login' ? 'Войти' : 'Зарегистрироваться';
}
async function enter(uid) {
  await loadAll(); S.me = uid; view = { name: 'home', uid: null }; chatWith = null; render(); startLive();
}
const toLogin = v => {
  v = v.trim();
  if (v.includes('@')) return v.toLowerCase();
  let d = v.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  return d.length >= 10 && d.length <= 15 ? d + '@phone.connect.app' : null;
};
async function submit() {
  const name = $('#fName').value.trim(), ident = toLogin($('#fMail').value), pass = $('#fPass').value, err = $('#err'), btn = $('#authBtn');
  err.textContent = '';
  if (!ident) return err.textContent = 'Введите номер телефона, например +7 900 123-45-67';
  if (pass.length < 6) return err.textContent = 'Пароль должен содержать минимум 6 символов';
  if (mode === 'register' && name.length < 2) return err.textContent = 'Укажите имя — минимум 2 символа';
  btn.disabled = true;
  try {
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email: ident, password: pass });
      if (error) throw new Error('Неверный номер или пароль. Проверьте данные или зарегистрируйтесь.');
    } else {
      const { data, error } = await sb.auth.signUp({ email: ident, password: pass, options: { data: { name, hue: Math.floor(Math.random() * 360) } } });
      if (error) throw new Error(/registered/i.test(error.message) ? 'Этот номер уже зарегистрирован. Попробуйте войти.' : error.message);
      if (!data.session) { err.textContent = 'Аккаунт создан, но в Supabase включено подтверждение почты. Выключите Confirm email в настройках и войдите.'; btn.disabled = false; return; }
    }
    const { data: { session } } = await sb.auth.getSession();
    await enter(session.user.id);
    $('#auth').hidden = true; toast('Добро пожаловать в Connect');
  } catch (e) { err.textContent = e.message; }
  btn.disabled = false;
}
function refresh(id) {
  const el = $(`[data-id="${id}"]`), p = S.posts.find(x => x.id === id);
  if (el && p) { const d = document.createElement('div'); d.innerHTML = post(p); el.replaceWith(d.firstElementChild); }
}
const closeEdit = () => { const e = $('#editM'); if (e) e.remove(); avFile = null; bnFile = null; bnRemove = false; };
function openEdit() {
  const m = me(); closeEdit();
  const d = document.createElement('div');
  d.className = 'modal'; d.id = 'editM';
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="closeedit" aria-label="Закрыть">×</button><h2>Редактировать профиль</h2>
    <div class="ef"><div class="row">${av(m)}<label class="chip" id="eAvL">Сменить фото профиля<input id="eAv" type="file" accept="image/*" hidden></label></div>
    <div class="row" style="flex-wrap:wrap;gap:8px"><label class="chip" id="eBnL">Баннер: фото или анимация до 5 сек<input id="eBn" type="file" accept="image/*,video/mp4,video/webm" hidden></label>${m.banner ? '<button type="button" class="chip" data-act="bnrm">Убрать баннер</button>' : ''}</div>
    <input id="eName" maxlength="40" placeholder="Имя" value="${esc(m.name)}">
    <div class="at"><span>@</span><input id="eHandle" maxlength="20" placeholder="ник" autocapitalize="none" autocomplete="off" value="${esc(m.handle)}"></div>
    <textarea id="eBio" rows="4" maxlength="160" placeholder="О себе">${esc(m.bio || '')}</textarea>
    <p class="err" id="eErr"></p><button class="btn lg" data-act="saveprofile">Сохранить</button></div></div>`;
  document.body.appendChild(d);
  $('#eName').focus();
}
function setPic(file) {
  draft = ($('#txt') || {}).value || '';
  if (picURL) URL.revokeObjectURL(picURL);
  pic = file; picURL = file ? URL.createObjectURL(file) : null;
  render();
}
document.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (e.target.id === 'eBn') return pickBanner(f);
  if (!f.type.startsWith('image/')) return toast('Выберите файл с изображением');
  if (e.target.id === 'pic') setPic(f);
  if (e.target.id === 'eAv') { avFile = f; $('#eAvL').firstChild.textContent = 'Выбрано: ' + f.name.slice(0, 24); }
});
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act],[data-go],[data-user],[data-fake]');
  if (!t) {
    if (e.target.id === 'auth') $('#auth').hidden = true;
    if (e.target.id === 'editM') closeEdit();
    return;
  }
  if (t.dataset.fake !== undefined) { const on = t.classList.toggle('on'), n = parseInt(t.textContent.replace(/\D/g, '')) + (on ? 1 : -1); t.textContent = '♥ ' + n; return; }
  if (t.dataset.go) return go(t.dataset.go);
  const act = t.dataset.act;
  if (!act) return go('profile', t.dataset.user);
  const card = t.closest('.post'), id = card && card.dataset.id, p = id && S.posts.find(x => x.id === id);
  if (act === 'auth') { setMode(t.dataset.mode); $('#auth').hidden = false; $('#fMail').focus(); }
  else if (act === 'mode') setMode(t.dataset.mode);
  else if (act === 'close') $('#auth').hidden = true;
  else if (act === 'submit') submit();
  else if (act === 'theme') { const dark = getComputedStyle(document.body).colorScheme.includes('dark'), th = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = th; try { localStorage.setItem('connect_theme', th); } catch (x) {} }
  else if (act === 'logout') { stopLive(); await sb.auth.signOut(); S.me = null; S.msgs = []; chatWith = null; render(); toast('Вы вышли из аккаунта'); }
  else if (act === 'edit') openEdit();
  else if (act === 'closeedit') closeEdit();
  else if (act === 'bnrm') { bnRemove = true; bnFile = null; t.textContent = 'Баннер будет удалён после сохранения'; t.disabled = true; }
  else if (act === 'saveprofile') {
    const name = $('#eName').value.trim(), bio = $('#eBio').value.trim(), eErr = $('#eErr');
    const handle = $('#eHandle').value.trim().toLowerCase().replace(/^@/, '');
    if (name.length < 2) return eErr.textContent = 'Имя должно содержать минимум 2 символа';
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) return eErr.textContent = 'Ник: 3–20 символов, только латинские буквы, цифры и _';
    if (!isAdmin() && /admin|support|moderator|creator|админ|создатель/.test(handle)) return eErr.textContent = 'Этот ник зарезервирован';
    t.disabled = true;
    let avatar = me().avatar || null;
    if (avFile) { const url = await upload(avFile, 400); if (!url) { t.disabled = false; return; } avatar = url; }
    const upd = { name, handle, bio, avatar };
    if (bnFile) {
      const isV = bnFile.type.startsWith('video/'), isG = bnFile.type === 'image/gif';
      const url = isV || isG ? await uploadRaw(bnFile, 'banner') : await upload(bnFile, 1600);
      if (!url) { t.disabled = false; return; }
      upd.banner = url; upd.banner_type = isV ? 'video' : 'image';
    } else if (bnRemove) { upd.banner = null; upd.banner_type = null; }
    const r = await sb.from('profiles').update(upd).eq('id', S.me);
    if (r.error) { eErr.textContent = r.error.code === '23505' ? 'Этот ник уже занят' : 'Ошибка: ' + r.error.message; t.disabled = false; return; }
    Object.assign(me(), upd); closeEdit(); render(); toast('Профиль сохранён');
  }
  else if (act === 'pick') $('#pic').click();
  else if (act === 'unpic') setPic(null);
  else if (act === 'dm' || act === 'opench') openChat(t.dataset.id);
  else if (act === 'backch') { chatWith = null; renderConv(); renderCList(); }
  else if (act === 'dsend') sendMsg();
  else if (act === 'aban') {
    const flag = t.dataset.flag === 'true';
    if (flag && !confirm('Заблокировать этого пользователя?')) return;
    const r = await sb.rpc('admin_set_banned', { target: t.dataset.id, flag });
    if (!ok(r)) return;
    U(t.dataset.id).banned = flag; render(); toast(flag ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
  }
  else if (act === 'adel') {
    if (!confirm('Удалить пользователя вместе со всеми его публикациями, комментариями и сообщениями? Это нельзя отменить.')) return;
    const r = await sb.rpc('admin_delete_user', { target: t.dataset.id });
    if (!ok(r)) return;
    await loadAll(); render(); toast('Пользователь удалён');
  }
  else if (act === 'arole') {
    const r = await sb.rpc('admin_set_role', { target: t.dataset.id, new_role: t.dataset.role });
    if (!ok(r)) return;
    U(t.dataset.id).role = t.dataset.role; render(); toast('Роль обновлена');
  }
  else if (act === 'tag') {
    q = t.dataset.tag; $('#q').value = q;
    if (!['home', 'explore'].includes(view.name)) view = { name: 'home', uid: null };
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  else if (act === 'del') {
    if (!confirm('Удалить эту публикацию? Это нельзя отменить.')) return;
    const r = await sb.from('posts').delete().match({ id });
    if (!ok(r)) return;
    S.posts = S.posts.filter(x => x.id !== id); S.totalPosts = Math.max(0, S.totalPosts - 1); render(); toast('Публикация удалена');
  }
  else if (act === 'delc') {
    if (!confirm('Удалить комментарий?')) return;
    const r = await sb.from('comments').delete().eq('id', t.dataset.cid);
    if (!ok(r)) return;
    p.cm = p.cm.filter(c => c.id !== t.dataset.cid); refresh(id);
  }
  else if (act === 'like') {
    const i = p.likes.indexOf(S.me), had = i >= 0;
    had ? p.likes.splice(i, 1) : p.likes.push(S.me); refresh(id);
    const r = had ? await sb.from('likes').delete().match({ post_id: id, user_id: S.me }) : await sb.from('likes').insert({ post_id: id, user_id: S.me });
    if (!ok(r)) { await loadAll(); refresh(id); }
  }
  else if (act === 'cmt') { open.has(id) ? open.delete(id) : open.add(id); card.querySelector('.cm').classList.toggle('open'); }
  else if (act === 'send') {
    const v = card.querySelector('input').value.trim();
    if (!v) return toast('Напишите текст комментария');
    const r = await sb.from('comments').insert({ post_id: id, user_id: S.me, text: v }).select().single();
    if (!ok(r)) return;
    p.cm.push({ id: r.data.id, uid: S.me, t: Date.now(), text: v }); open.add(id); refresh(id);
  }
  else if (act === 'follow') {
    const fid = t.dataset.id, had = isF(fid);
    const r = had ? await sb.from('follows').delete().match({ follower_id: S.me, following_id: fid }) : await sb.from('follows').insert({ follower_id: S.me, following_id: fid });
    if (!ok(r)) return;
    S.follows = had ? S.follows.filter(f => !(f.follower_id === S.me && f.following_id === fid)) : [...S.follows, { follower_id: S.me, following_id: fid }];
    if (!had) toast('Вы подписались'); render();
  }
  else if (act === 'cover') { cover = !cover; t.classList.toggle('on', cover); }
  else if (act === 'compose') { go('home'); setTimeout(() => $('#txt') && $('#txt').focus(), 300); }
  else if (act === 'publish') {
    const v = $('#txt').value.trim();
    if (!v) return toast(pic ? 'Добавьте подпись к фото' : 'Напишите что-нибудь, чтобы опубликовать');
    t.disabled = true;
    let image = null;
    if (pic) { image = await upload(pic, 1280); if (!image) { t.disabled = false; return; } }
    const r = await sb.from('posts').insert({ user_id: S.me, text: v, cover: !pic && cover ? me().hue : null, image }).select().single();
    if (!ok(r)) { t.disabled = false; return; }
    S.posts.unshift({ id: r.data.id, uid: S.me, t: new Date(r.data.created_at).getTime(), text: v, cover: r.data.cover, image: r.data.image, likes: [], cm: [] });
    S.totalPosts++; cover = false; draft = ''; if (picURL) URL.revokeObjectURL(picURL); pic = picURL = null;
    render(); toast('Опубликовано');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('#auth').hidden = true; closeEdit(); }
  if (e.key === 'Enter' && e.target.closest('.cf')) e.target.nextElementSibling.click();
  if (e.key === 'Enter' && e.target.closest('.fields')) submit();
  if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'cin') { e.preventDefault(); sendMsg(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'cin') { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }
  if (e.target.id === 'cs') renderCList();
});
$('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); if (['profile', 'admin', 'dm'].includes(view.name)) view = { name: 'home', uid: null }; render(); });

try { const th = localStorage.getItem('connect_theme'); if (th) document.documentElement.dataset.theme = th; } catch (x) {}
setMode('login');
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) await enter(session.user.id); else render();
})();
