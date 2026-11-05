'use strict';
const $ = (s, r = document) => r.querySelector(s);
const P = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
  moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>'
};
const ic = (n, f) => `<svg class="i" viewBox="0 0 24 24" fill="${f ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'connect_v1';
let mem = null;
const T = Date.now(), H = 36e5;
const seed = () => ({
  me: null, theme: null,
  users: [
    { id: 'u1', name: 'Алиса Морозова', handle: 'alisa', bio: 'Продуктовый дизайнер. Люблю минимализм, кофе и долгие прогулки.', hue: 265, following: [] },
    { id: 'u2', name: 'Тимур Каримов', handle: 'timur', bio: 'Фронтенд-разработчик. Открытый код, мотоциклы и хороший звук.', hue: 200, following: [] },
    { id: 'u3', name: 'Мария Левина', handle: 'maria', bio: 'Фотограф. Ловлю свет в большом городе.', hue: 340, following: [] },
    { id: 'u4', name: 'Дмитрий Орлов', handle: 'dima', bio: 'Основатель стартапа. Пишу о продуктах и росте.', hue: 25, following: [] },
    { id: 'u5', name: 'Соня Белова', handle: 'sonya', bio: 'Путешествую, готовлю, учу языки.', hue: 150, following: [] }
  ],
  posts: [
    { id: 'p1', uid: 'u1', t: T - .2 * H, text: 'Закончила редизайн мобильного приложения. Меньше элементов — больше воздуха. #дизайн #минимализм', cover: 265, likes: ['u2', 'u3', 'u4'], cm: [{ uid: 'u2', t: T - .1 * H, text: 'Выглядит потрясающе! Особенно типографика.' }] },
    { id: 'p2', uid: 'u2', t: T - 1.5 * H, text: 'Выложил свой первый open-source проект. Буду рад звёздочкам и честным замечаниям. #код #opensource', cover: null, likes: ['u1', 'u5'], cm: [] },
    { id: 'p3', uid: 'u3', t: T - 4 * H, text: 'Утро над городом. Иногда достаточно просто выйти раньше всех. #фото', cover: 340, likes: ['u1', 'u2', 'u4', 'u5'], cm: [{ uid: 'u5', t: T - 3 * H, text: 'Хочу такой же вид из окна!' }] },
    { id: 'p4', uid: 'u4', t: T - 9 * H, text: 'Главный урок года: продукт растёт не от новых функций, а от того, что вы убрали лишнее. #стартап', cover: null, likes: ['u1'], cm: [] },
    { id: 'p5', uid: 'u5', t: T - 26 * H, text: 'Неделя в Стамбуле: чай, закаты на Босфоре и самые вкусные симиты. #путешествия', cover: 150, likes: ['u3', 'u4'], cm: [] }
  ]
});
const load = () => { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {} return mem; };
const save = () => { mem = S; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
let S = load() || seed();
let view = { name: 'home', uid: null }, cover = false, q = '', open = new Set(), mode = 'login';
const U = id => S.users.find(u => u.id === id);
const me = () => U(S.me);
const ago = t => { const m = Math.max(1, Math.round((Date.now() - t) / 6e4)); return m < 60 ? m + ' мин' : m < 1440 ? Math.round(m / 60) + ' ч' : Math.round(m / 1440) + ' дн'; };
const av = (u, c = '') => `<span class="av ${c}" style="--h:${u.hue}">${esc(u.name[0].toUpperCase())}</span>`;
const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 2200); };
const rich = s => esc(s).replace(/#([\p{L}\d_]+)/gu, '<span class="tag">#$1</span>');

function post(p) {
  const u = U(p.uid), liked = p.likes.includes(S.me);
  return `<article class="card post" data-id="${p.id}">
    <header data-user="${u.id}">${av(u)}<div><b>${esc(u.name)}</b><span>@${esc(u.handle)} · ${ago(p.t)}</span></div></header>
    <p>${rich(p.text)}</p>${p.cover != null ? `<div class="cover" style="--h:${p.cover}"></div>` : ''}
    <footer><button class="act like ${liked ? 'on' : ''}" data-act="like" aria-pressed="${liked}">${ic('heart', liked)}${p.likes.length}</button>
    <button class="act" data-act="cmt">${ic('chat')}${p.cm.length}</button></footer>
    <div class="cm ${open.has(p.id) ? 'open' : ''}">${p.cm.map(c => { const a = U(c.uid); return `<div class="c">${av(a, 'sm')}<div><b>${esc(a.name)}</b><small>${ago(c.t)}</small><br>${esc(c.text)}</div></div>`; }).join('')}
    <div class="cf"><input placeholder="Напишите комментарий" maxlength="300"><button class="btn" data-act="send">Отправить</button></div></div></article>`;
}
const feed = list => list.length ? list.map(post).join('') : '<div class="card empty">Здесь пока пусто. Напишите первую публикацию!</div>';
const match = p => !q || (p.text + U(p.uid).name).toLowerCase().includes(q);

function main() {
  const m = me(), all = [...S.posts].filter(match);
  if (view.name === 'home') {
    return `<div class="stories">${S.users.map(u => `<div class="st" data-user="${u.id}">${av(u)}${esc(u.name.split(' ')[0])}</div>`).join('')}</div>
    <div class="card comp">${av(m)}<div style="flex:1"><textarea id="txt" maxlength="500" placeholder="Что нового, ${esc(m.name.split(' ')[0])}?"></textarea>
    <div class="bar"><button class="chip ${cover ? 'on' : ''}" data-act="cover">С обложкой</button><button class="btn" data-act="publish">Опубликовать</button></div></div></div>
    ${feed(all.sort((a, b) => b.t - a.t))}`;
  }
  if (view.name === 'explore') return `<h2 class="t">Популярное</h2>${feed(all.sort((a, b) => b.likes.length + b.cm.length - a.likes.length - a.cm.length))}`;
  const u = U(view.uid), mine = u.id === S.me, fl = m.following.includes(u.id);
  const fc = S.users.filter(x => x.following.includes(u.id)).length;
  return `<div class="card"><div class="pcover" style="--h:${u.hue}"></div><div class="phead"><div class="rw">${av(u, 'lg')}
    ${mine ? '<button class="btn ghost" data-act="logout">Выйти</button>' : `<button class="btn ${fl ? 'ghost' : ''}" data-act="follow" data-id="${u.id}">${fl ? 'Вы подписаны' : 'Подписаться'}</button>`}</div>
    <h2>${esc(u.name)}</h2><span class="mu">@${esc(u.handle)}</span><p style="margin-top:8px">${esc(u.bio)}</p>
    <div class="nums"><div><b>${S.posts.filter(p => p.uid === u.id).length}</b><span>постов</span></div><div><b>${fc}</b><span>подписчиков</span></div><div><b>${u.following.length}</b><span>подписок</span></div></div></div></div>
    ${feed(S.posts.filter(p => p.uid === u.id).sort((a, b) => b.t - a.t))}`;
}
function chrome() {
  const m = me(), items = [['home', 'Главная'], ['explore', 'Популярное'], ['profile', 'Профиль']];
  const nv = lbl => items.map(([k, l]) => `<button class="nv ${view.name === k && (k !== 'profile' || view.uid === S.me) ? 'on' : ''}" data-go="${k}" aria-label="${l}">${ic(k)}${lbl ? `<span>${l}</span>` : ''}</button>`).join('');
  $('#side').innerHTML = nv(1) + `<button class="btn" data-act="compose">Новая публикация</button>`;
  $('#bottom').innerHTML = nv(0);
  $('#meBtn').innerHTML = av(m);
  $('#themeBtn').innerHTML = ic('moon');
  const sug = S.users.filter(u => u.id !== S.me).slice(0, 4);
  $('#rail').innerHTML = `<div class="card"><h4>Кого читать</h4>${sug.map(u => `<div class="sg">${av(u, 'sm')}<div data-user="${u.id}"><b>${esc(u.name)}</b><br><small>@${esc(u.handle)}</small></div><button class="fol ${m.following.includes(u.id) ? 'on' : ''}" data-act="follow" data-id="${u.id}">${m.following.includes(u.id) ? 'Читаю' : 'Читать'}</button></div>`).join('')}</div>
  <div class="card"><h4>Сейчас обсуждают</h4>${[['#дизайн', 124], ['#стартап', 98], ['#фото', 76], ['#путешествия', 51]].map(([t, n]) => `<a class="tg"><b>${t}</b>${n} публикаций</a>`).join('')}</div>`;
}
function render(keepMain) {
  const on = !!(S.me && me());
  $('#landing').hidden = on; $('#app').hidden = !on;
  if (!on) return;
  chrome();
  if (!keepMain) $('#main').innerHTML = main();
}
function go(name, uid) {
  view = { name, uid: name === 'profile' ? (uid || S.me) : null };
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setMode(m) {
  mode = m;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('#fName').hidden = m === 'login'; $('#err').textContent = '';
  $('#authT').textContent = m === 'login' ? 'С возвращением' : 'Создайте аккаунт';
  $('#authBtn').textContent = m === 'login' ? 'Войти' : 'Зарегистрироваться';
}
const login = id => { S.me = id; save(); $('#auth').hidden = true; view = { name: 'home', uid: null }; render(); toast('Добро пожаловать в Connect'); };
function submit() {
  const name = $('#fName').value.trim(), mail = $('#fMail').value.trim().toLowerCase(), pass = $('#fPass').value, err = $('#err');
  if (!/^\S+@\S+\.\S+$/.test(mail)) return err.textContent = 'Введите корректную почту, например name@mail.com';
  if (pass.length < 6) return err.textContent = 'Пароль должен содержать минимум 6 символов';
  const ex = S.users.find(u => u.email === mail);
  if (mode === 'login') return ex && ex.pass === pass ? login(ex.id) : err.textContent = 'Неверная почта или пароль. Проверьте данные или зарегистрируйтесь.';
  if (ex) return err.textContent = 'Эта почта уже занята. Попробуйте войти.';
  if (name.length < 2) return err.textContent = 'Укажите имя — минимум 2 символа';
  const u = { id: 'u' + Date.now(), name, email: mail, pass, handle: mail.split('@')[0].replace(/\W/g, ''), bio: 'Новый участник Connect', hue: Math.floor(Math.random() * 360), following: [] };
  S.users.push(u); login(u.id);
}
function refresh(id) {
  const el = $(`[data-id="${id}"]`), p = S.posts.find(x => x.id === id);
  if (el && p) { const d = document.createElement('div'); d.innerHTML = post(p); el.replaceWith(d.firstElementChild); }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act],[data-go],[data-user],[data-fake]');
  if (!t) return (e.target.id === 'auth') && ($('#auth').hidden = true);
  if (t.dataset.fake !== undefined) { const on = t.classList.toggle('on'), n = parseInt(t.textContent.replace(/\D/g, '')) + (on ? 1 : -1); t.textContent = '♥ ' + n; return; }
  if (t.dataset.go) return go(t.dataset.go);
  const act = t.dataset.act;
  if (!act) return go('profile', t.dataset.user);
  const card = t.closest('.post'), id = card && card.dataset.id, p = id && S.posts.find(x => x.id === id);
  if (act === 'auth') { setMode(t.dataset.mode); $('#auth').hidden = false; $('#fMail').focus(); }
  else if (act === 'mode') setMode(t.dataset.mode);
  else if (act === 'close') $('#auth').hidden = true;
  else if (act === 'submit') submit();
  else if (act === 'demo') {
    let d = S.users.find(u => u.email === 'demo@connect.app');
    if (!d) { d = { id: 'demo', name: 'Гость Connect', email: 'demo@connect.app', pass: 'demo123', handle: 'guest', bio: 'Смотрю, как устроен Connect.', hue: 290, following: ['u1'] }; S.users.push(d); }
    login(d.id);
  }
  else if (act === 'theme') { const dark = getComputedStyle(document.body).colorScheme.includes('dark'); S.theme = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; save(); }
  else if (act === 'logout') { S.me = null; save(); render(); toast('Вы вышли из аккаунта'); }
  else if (act === 'like') { const i = p.likes.indexOf(S.me); i < 0 ? p.likes.push(S.me) : p.likes.splice(i, 1); save(); refresh(id); }
  else if (act === 'cmt') { open.has(id) ? open.delete(id) : open.add(id); card.querySelector('.cm').classList.toggle('open'); }
  else if (act === 'send') {
    const inp = card.querySelector('input'), v = inp.value.trim();
    if (!v) return toast('Напишите текст комментария');
    p.cm.push({ uid: S.me, t: Date.now(), text: v }); open.add(id); save(); refresh(id);
  }
  else if (act === 'follow') {
    const m = me(), f = m.following, i =
