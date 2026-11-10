const I18N = {
  ru: { newTicket: 'Новое обращение', send: 'Отправить', error: 'Ошибка' },
  en: { newTicket: 'New ticket', send: 'Send', error: 'Error' },
  de: { newTicket: 'Neue Anfrage', send: 'Senden', error: 'Fehler' },
  uk: { newTicket: 'Нове звернення', send: 'Надіслати', error: 'Помилка' },
};

let lang = localStorage.getItem('lang') ||
  (['ru','en','de','uk'].includes(navigator.language.slice(0,2)) ? navigator.language.slice(0,2) : 'ru');

function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.ru[key] || key; }

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
}

function setLang(l) { lang = l; localStorage.setItem('lang', l); applyI18n(); }
document.addEventListener('DOMContentLoaded', applyI18n);
