'use strict';
/* Connect — фото и видео в личных чатах.
   Подключается ПОСЛЕ messenger.js и расширяет его, не меняя. */
(() => {
const st = document.createElement('style');
st.textContent = `
.attb{font-size:22px;padding:4px 8px;border-radius:50%}.attb:hover{background:var(--bg)}.attb[hidden]{display:none}
.mbm{display:block;max-width:100%;max-height:320px;border-radius:12px;margin-bottom:4px;background:#000}
img.mbm{cursor:zoom-in}.mb video.mbm{width:100%}
.lbx{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:16px;cursor:zoom-out}
.lbx img{max-width:100%;max-height:100%;border-radius:8px}`;
document.head.appendChild(st);

const LABELS = ['📷 Фото', '🎬 Видео'];
const MAX_VIDEO = 25, MAX_IMAGE = 15; // МБ

async function chatRaw(f) {
  try {
    const ext = ((f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin').slice(0, 5);
    const path = `${S.me}/chat-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('media').upload(path, f, { contentType: f.type });
    if (error) { toast('Ошибка загрузки: ' + error.message); return null; }
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  } catch (e) { toast(e.message); return null; }
}

async function sendMedia(f) {
  const id = chatWith;
  if (!id || id === 'ai' || String(id).startsWith('support')) return;
  const isV = f.type.startsWith('video/'), isG = f.type === 'image/gif';
  if (!isV && !f.type.startsWith('image/')) return toast('Можно отправить фото или видео');
  if (isV && !/^video\/(mp4|webm|quicktime)$/.test(f.type)) return toast('Видео: MP4, WebM или MOV');
  if (f.size > (isV ? MAX_VIDEO : MAX_IMAGE) * 1048576) return toast(`Файл слишком большой (максимум ${isV ? MAX_VIDEO : MAX_IMAGE} МБ)`);
  const el = $('#cin'), cap = el ? el.value.trim() : '';
  toast('Отправка…');
  const url = isV || isG ? await chatRaw(f) : await upload(f, 1600);
  if (!url) return;
  const payload = { text: (cap || (isV ? LABELS[1] : LABELS[0])).slice(0, 2000), media_url: url, media_type: isV ? 'video' : 'image' };
  if (window.CX && CX.sendPayload) {
    if (await CX.sendPayload(payload) && el) { el.value = ''; el.style.height = 'auto'; }
    return;
  }
  const r = await sb.from('messages').insert({
    sender_id: S.me, receiver_id: id,
    text: (cap || (isV ? LABELS[1] : LABELS[0])).slice(0, 2000),
    media_url: url, media_type: isV ? 'video' : 'image'
  }).select().single();
  if (r.error) return toast('Не отправлено: ' + r.error.message);
  if (el) { el.value = ''; el.style.height = 'auto'; }
  if (!S.msgs.some(x => x.id === r.data.id)) S.msgs.push(r.data);
  refreshChat();
}

const mediaHTML = m => m.media_type === 'video'
  ? `<video class="mbm" src="${esc(m.media_url)}" controls preload="metadata" playsinline></video>`
  : `<img class="mbm" src="${esc(m.media_url)}" alt="" loading="lazy">`;

function decorate(body) {
  const stick = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
  let added = false;
  body.querySelectorAll('.mb[data-mid]').forEach(el => {
    if (el.querySelector('.mbm')) return;
    const m = S.msgs.find(x => String(x.id) === el.dataset.mid);
    if (!m || !m.media_url) return;
    const p = el.querySelector('p');
    el.insertAdjacentHTML('afterbegin', mediaHTML(m));
    if (p && LABELS.includes((m.text || '').replace(/^↪ /, ''))) p.remove();
    const node = el.querySelector('.mbm');
    const down = () => { if (stick) body.scrollTop = body.scrollHeight; };
    node.addEventListener(node.tagName === 'IMG' ? 'load' : 'loadedmetadata', down, { once: true });
    added = true;
  });
  if (added && stick) body.scrollTop = body.scrollHeight;
}

const _rc = renderConv;
renderConv = function () {
  _rc();
  const cb = $('#cb'), body = $('#cvm');
  if (!cb || !body) return;
  if (!$('.attb', cb)) cb.insertAdjacentHTML('afterbegin', '<button class="attb" type="button" data-act="attach" aria-label="Фото или видео">📎</button><input type="file" id="cfile" accept="image/*,video/mp4,video/webm,video/quicktime" hidden>');
  $('.attb', cb).hidden = !chatWith || chatWith === 'ai' || String(chatWith).startsWith('support');
  decorate(body);
};

/* выбор файла: перехватываем раньше app.js, который принимает только изображения */
document.addEventListener('change', e => {
  if (e.target.id !== 'cfile') return;
  e.stopImmediatePropagation();
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (f) sendMedia(f);
}, true);

document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-act="attach"]');
  if (t) { const i = $('#cfile'); if (i) i.click(); }
});

/* тап по фото: открыть на весь экран; по видео: не открывать меню сообщения */
document.addEventListener('click', e => {
  const box = e.target.closest && e.target.closest('.lbx');
  if (box) return box.remove();
  const m = e.target.closest && e.target.closest('#cvm .mbm');
  if (!m || document.querySelector('#cvm .mb.sel')) return;
  e.stopImmediatePropagation();
  if (m.tagName === 'IMG') {
    const d = document.createElement('div'); d.className = 'lbx';
    d.innerHTML = `<img src="${esc(m.src)}" alt="">`;
    document.body.appendChild(d);
  }
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const d = $('.lbx'); if (d) d.remove(); } });
})();
