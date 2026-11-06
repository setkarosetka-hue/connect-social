'use strict';
const sb = window.connectSupabase;

const $ = (s, r = document) => r.querySelector(s);
const P = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  admin: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
  moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
};
const ic = (n, f) => `<svg class="i" viewBox="0 0 24 24" fill="${f ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let S = { me: null, users: [], posts: [], follows: [], totalPosts: 0 };
let view = { name: 'home', uid: null }, cover = false, q = '', open = new Set(), mode = 'login';
let pic = null, picURL = null, draft = '', avFile = null;

const U = id => S.users.find(u => u.id === id) || { id, name: '?', handle: 'user', bio: '', hue: 0 };
const me = () => U(S.me);
const isAdmin = () => !!S.me && me().role === 'admin';
const bdg = u => u.role === 'admin' ? '<span class="bdg" title="Администратор">Админ</span>' : '';
const isF = id => S.follows.some(f => f.follower_id === S.me && f.following_id === id);
const ago = t => { const m = Math.max(1, Math.round((Date.now() - t) / 6e4)); return m < 60 ? m + ' мин' : m < 1440 ? Math.round(m / 60) + ' ч' : Math.round(m / 1440) + ' дн'; };
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

async function loadAll() {
  const [u, p, l, c, f, n] = await Promise.all([
    sb.from('profiles').select('*'),
    sb.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('likes').select('post_id,user_id'),
    sb.from('comments').select('*').order('created_at'),
    sb.from('follows').select('*'),
    sb.from('posts').select('id', { count: 'exact', head: true })
  ]);
  if (u.error || p.error) return toast('Не удалось загрузить данные. Проверьте настройки Supabase.');
  const likes = l.data || [], cms = c.data || [];
  S.users = u.data || [];
  S.follows = f.data || [];
  S.totalPosts = n.count || (p.data || []).length;
  S.totalLikes = likes.length; S.totalComments = cms.length;
  S.posts = (p.data || []).map(x => ({
    id: x.id, uid: x.user_id, t: new Date(x.created_at).getTime(), text: x.text, cover: x.cover, image: x.image,
    likes: likes.filter(k => k.post_id === x.id).map(k => k.user_id),
    cm: cms.filter(k => k.post_id === x.id).map(k => ({ id: k.id, uid: k.user_id, t: new Date(k.created_at).getTime(), text: k.text }))
  }));
}

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
  if (view.name === 'admin') {
    if (!isAdmin()) return '<div class="card empty">Нет доступа</div>';
    const stats = [['Пользователи', S.users.length], ['Публикации', S.totalPosts], ['Комментарии', S.totalComments || 0], ['Лайки', S.totalLikes || 0]];
    const users = [...S.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return `<h2 class="t">Админ-панель</h2>
    <div class="stat">${stats.map(([l, n]) => `<div class="card"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
    <div class="card ulist"><h4>Пользователи</h4>${users.map(u => `<div class="sg">${av(u, 'sm')}<div data-user="${u.id}"><b>${esc(u.name)}</b>${bdg(u)}<br><small>@${esc(u.handle)} · ${S.posts.filter(p => p.uid === u.id).length} постов · с ${new Date(u.created_at).toLocaleDateString('ru-RU')}</small></div></div>`).join('')}</div>
    <h2 class="t sub">Модерация</h2>${feed(all.sort((a, b) => b.t - a.t))}`;
  }
  const u = U(view.uid), mine = u.id === S.me, fl = isF(u.id);
  const fc = S.follows.filter(f => f.following_id === u.id).length;
  const fg = S.follows.filter(f => f.follower_id === u.id).length;
  return `<div class="card"><div class="pcover" style="--h:${u.hue}"></div><div class="phead"><div class="rw">${av(u, 'lg')}
    ${mine ? '<div class="row"><button class="btn ghost" data-act="edit">Редактировать</button><button class="btn ghost" data-act="logout">Выйти</button></div>' : `<button class="btn ${fl ? 'ghost' : ''}" data-act="follow" data-id="${u.id}">${fl ? 'Вы подписаны' : 'Подписаться'}</button>`}</div>
    <h2>${esc(u.name)}${bdg(u)}</h2><span class="mu">@${esc(u.handle)}</span><p style="margin-top:8px">${esc(u.bio || '')}</p>
    <div class="nums"><div><b>${S.posts.filter(p => p.uid === u.id).length}</b><span>постов</span></div><div><b>${fc}</b><span>подписчиков</span></div><div><b>${fg}</b><span>подписок</span></div></div></div></div>
    ${feed(S.posts.filter(p => p.uid === u.id).sort((a, b) => b.t - a.t))}`;
}
function chrome() {
  const m = me(), items = [['home', 'Главная'], ['explore', 'Популярное'], ['profile', 'Профиль']];
  if (isAdmin()) items.push(['admin', 'Админ']);
  const nv = lbl => items.map(([k, l]) => `<button class="nv ${view.name === k && (k !== 'profile' || view.uid === S.me) ? 'on' : ''}" data-go="${k}" aria-label="${l}">${ic(k)}${lbl ? `<span>${l}</span>` : ''}</button>`).join('');
  $('#side').innerHTML = nv(1) + `<button class="btn" data-act="compose">Новая публикация</button>`;
  $('#bottom').innerHTML = nv(0);
  $('#meBtn').innerHTML = av(m);
  $('#themeBtn').innerHTML = ic('moon');
  const sug = S.users.filter(u => u.id !== S.me).slice(0, 4);
  $('#rail').innerHTML = `<div class="card"><h4>Кого читать</h4>${sug.length ? sug.map(u => `<div class="sg">${av(u, 'sm')}<div data-user="${u.id}"><b>${esc(u.name)}</b>${bdg(u)}<br><small>@${esc(u.handle)}</small></div><button class="fol ${isF(u.id) ? 'on' : ''}" data-act="follow" data-id="${u.id}">${isF(u.id) ? 'Читаю' : 'Читать'}</button></div>`).join('') : '<small class="mu">Пока здесь только вы. Пригласите друзей!</small>'}</div>
  <div class="card"><h4>Сейчас обсуждают</h4>${[['#дизайн', 124], ['#стартап', 98], ['#фото', 76], ['#путешествия', 51]].map(([t, n]) => `<a class="tg"><b>${t}</b>${n} публикаций</a>`).join('')}</div>`;
}
function render() {
  const on = !!S.me;
  $('#landing').hidden = on; $('#app').hidden = !on;
  if (!on) return;
  if (view.name === 'admin' && !isAdmin()) view = { name: 'home', uid: null };
  chrome();
  $('#main').innerHTML = main();
}
function go(name, uid) {
  view = { name, uid: name === 'profile' ? (uid || S.me) : null };
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  loadAll().then(() => { const t = $('#txt'); if (S.me && !(t && t.value)) render(); });
}
function setMode(m) {
  mode = m;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('#fName').hidden = m === 'login'; $('#err').textContent = '';
  $('#authT').textContent = m === 'login' ? 'С возвращением' : 'Создайте аккаунт';
  $('#authBtn').textContent = m === 'login' ? 'Войти' : 'Зарегистрироваться';
}
async function enter(uid) {
  await loadAll(); S.me = uid; view = { name: 'home', uid: null }; render();
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
const closeEdit = () => { const e = $('#editM'); if (e) e.remove(); avFile = null; };
function openEdit() {
  const m = me(); closeEdit();
  const d = document.createElement('div');
  d.className = 'modal'; d.id = 'editM';
  d.innerHTML = `<div class="sheet card"><button class="x" data-act="closeedit" aria-label="Закрыть">×</button><h2>Редактировать профиль</h2>
    <div class="ef"><div class="row">${av(m)}<label class="chip" id="eAvL">Сменить фото профиля<input id="eAv" type="file" accept="image/*" hidden></label></div>
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
  else if (act === 'logout') { await sb.auth.signOut(); S.me = null; render(); toast('Вы вышли из аккаунта'); }
  else if (act === 'edit') openEdit();
  else if (act === 'closeedit') closeEdit();
  else if (act === 'saveprofile') {
    const name = $('#eName').value.trim(), bio = $('#eBio').value.trim(), eErr = $('#eErr');
    const handle = $('#eHandle').value.trim().toLowerCase().replace(/^@/, '');
    if (name.length < 2) return eErr.textContent = 'Имя должно содержать минимум 2 символа';
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) return eErr.textContent = 'Ник: 3–20 символов, только латинские буквы, цифры и _';
    if (!isAdmin() && /admin|support|moderator|админ/.test(handle)) return eErr.textContent = 'Этот ник зарезервирован';
    t.disabled = true;
    let avatar = me().avatar || null;
    if (avFile) { const url = await upload(avFile, 400); if (!url) { t.disabled = false; return; } avatar = url; }
    const r = await sb.from('profiles').update({ name, handle, bio, avatar }).eq('id', S.me);
    if (r.error) { eErr.textContent = r.error.code === '23505' ? 'Этот ник уже занят' : 'Ошибка: ' + r.error.message; t.disabled = false; return; }
    Object.assign(me(), { name, handle, bio, avatar }); closeEdit(); render(); toast('Профиль сохранён');
  }
  else if (act === 'pick') $('#pic').click();
  else if (act === 'unpic') setPic(null);
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
});
$('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); if (view.name === 'profile' || view.name === 'admin') view = { name: 'home', uid: null }; render(); });

try { const th = localStorage.getItem('connect_theme'); if (th) document.documentElement.dataset.theme = th; } catch (x) {}
setMode('login');
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) await enter(session.user.id); else render();
})();
