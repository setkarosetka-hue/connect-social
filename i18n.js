'use strict';
/* Connect — мультиязычность (RU / EN / DE / UK).
   Русский текст в коде остаётся ключом: этот файл сам переводит текст, подсказки и
   сообщения на странице и следит за изменениями (MutationObserver), так что app.js править не нужно.
   Чего не хватает в словаре — остаётся по-русски; добавить можно так:
   connectI18n.add([['русский', 'English', 'Deutsch', 'Українська']]); */
(function () {
  var IDX = { ru: 0, en: 1, de: 2, uk: 3 };
  var NAMES = { ru: 'RU', en: 'EN', de: 'DE', uk: 'UK' };

  var D = [
    ['Connect — общайтесь так, будто вы рядом!', 'Connect — chat as if you were together!', 'Connect — kommuniziert, als wärt ihr zusammen!', 'Connect — спілкуйтеся так, ніби ви поруч!'],
    ['Войти', 'Log in', 'Anmelden', 'Увійти'],
    ['Создать аккаунт', 'Create account', 'Konto erstellen', 'Створити акаунт'],
    ['Присоединиться', 'Join', 'Beitreten', 'Приєднатися'],
    ['Общайтесь так, будто вы рядом', 'Chat as if you were right there', 'Kommuniziert, als wärt ihr zusammen', 'Спілкуйтеся так, ніби ви поруч'],
    ['Connect — тихая социальная сеть без шума: только люди, которые вам интересны, и истории, которые стоит прочитать.', 'Connect is a quiet social network without the noise: only people you care about and stories worth reading.', 'Connect ist ein ruhiges soziales Netzwerk ohne Lärm: nur Menschen, die dich interessieren, und Geschichten, die es wert sind, gelesen zu werden.', 'Connect — тиха соціальна мережа без шуму: лише люди, які вам цікаві, та історії, які варто прочитати.'],
    ['Лента без хаоса', 'A feed without chaos', 'Ein Feed ohne Chaos', 'Стрічка без хаосу'],
    ['Публикации людей, на которых вы подписаны, и никакой лишней рекламы.', 'Posts from people you follow and no extra ads.', 'Beiträge von Menschen, denen du folgst – und keine überflüssige Werbung.', 'Публікації людей, на яких ви підписані, і жодної зайвої реклами.'],
    ['Живое общение', 'Live conversation', 'Echte Unterhaltung', 'Живе спілкування'],
    ['Лайки и комментарии появляются мгновенно, а разговор остаётся в одном месте.', 'Likes and comments appear instantly, and the conversation stays in one place.', 'Likes und Kommentare erscheinen sofort, und das Gespräch bleibt an einem Ort.', 'Лайки та коментарі з’являються миттєво, а розмова залишається в одному місці.'],
    ['Ваш профиль', 'Your profile', 'Dein Profil', 'Ваш профіль'],
    ['Расскажите о себе, собирайте подписчиков и показывайте лучшее.', 'Tell people about yourself, gather followers and show your best.', 'Erzähl von dir, sammle Follower und zeige das Beste.', 'Розкажіть про себе, збирайте підписників і показуйте найкраще.'],
    ['© 2026 Connect. Сделано с заботой о людях. ·', '© 2026 Connect. Made with care for people. ·', '© 2026 Connect. Mit Sorgfalt für Menschen gemacht. ·', '© 2026 Connect. Зроблено з турботою про людей. ·'],
    ['Политика конфиденциальности', 'Privacy policy', 'Datenschutzerklärung', 'Політика конфіденційності'],
    ['политикой конфиденциальности', 'privacy policy', 'Datenschutzerklärung', 'політикою конфіденційності'],
    ['Продолжая, вы соглашаетесь с', 'By continuing, you agree to the', 'Mit dem Fortfahren stimmst du der', 'Продовжуючи, ви погоджуєтесь з'],
    ['Закончила редизайн приложения. Меньше элементов — больше воздуха.', 'Finished redesigning the app. Fewer elements, more air.', 'Redesign der App abgeschlossen. Weniger Elemente, mehr Luft.', 'Закінчила редизайн застосунку. Менше елементів — більше повітря.'],
    ['Выложил свой первый open-source проект. Заходите в гости!', 'Published my first open-source project. Come take a look!', 'Mein erstes Open-Source-Projekt veröffentlicht. Schaut vorbei!', 'Виклав свій перший open-source проєкт. Заходьте в гості!'],
    ['Поиск людей и публикаций', 'Search people and posts', 'Personen und Beiträge suchen', 'Пошук людей і публікацій'],
    ['Сменить тему', 'Switch theme', 'Design wechseln', 'Змінити тему'],
    ['Мой профиль', 'My profile', 'Mein Profil', 'Мій профіль'],
    ['Закрыть', 'Close', 'Schließen', 'Закрити'],
    ['Добро пожаловать', 'Welcome', 'Willkommen', 'Ласкаво просимо'],
    ['Вход', 'Log in', 'Anmeldung', 'Вхід'],
    ['Регистрация', 'Sign up', 'Registrierung', 'Реєстрація'],
    ['Ваше имя', 'Your name', 'Dein Name', 'Ваше ім’я'],
    ['Номер телефона, например +7 900 123-45-67', 'Phone number, e.g. +7 900 123-45-67', 'Telefonnummer, z. B. +7 900 123-45-67', 'Номер телефону, наприклад +7 900 123-45-67'],
    ['Пароль (от 6 символов)', 'Password (6+ characters)', 'Passwort (mind. 6 Zeichen)', 'Пароль (від 6 символів)'],
    ['Продолжить', 'Continue', 'Weiter', 'Продовжити'],
    ['С возвращением', 'Welcome back', 'Willkommen zurück', 'З поверненням'],
    ['Создайте аккаунт', 'Create an account', 'Erstelle ein Konto', 'Створіть акаунт'],
    ['Зарегистрироваться', 'Sign up', 'Registrieren', 'Зареєструватися'],
    ['Создатель', 'Creator', 'Ersteller', 'Творець'],
    ['Администратор', 'Administrator', 'Administrator', 'Адміністратор'],
    ['Админ', 'Admin', 'Admin', 'Адмін'],
    ['Верифицирован', 'Verified', 'Verifiziert', 'Верифіковано'],
    ['Не удалось обработать фото', 'Could not process the photo', 'Foto konnte nicht verarbeitet werden', 'Не вдалося обробити фото'],
    ['Не удалось прочитать фото', 'Could not read the photo', 'Foto konnte nicht gelesen werden', 'Не вдалося прочитати фото'],
    ['Не удалось прочитать видео', 'Could not read the video', 'Video konnte nicht gelesen werden', 'Не вдалося прочитати відео'],
    ['Выберите фото, GIF или короткое видео', 'Choose a photo, GIF or short video', 'Wähle ein Foto, GIF oder kurzes Video', 'Виберіть фото, GIF або коротке відео'],
    ['Видео: только MP4 или WebM', 'Video: MP4 or WebM only', 'Video: nur MP4 oder WebM', 'Відео: лише MP4 або WebM'],
    ['Анимация должна быть не больше 6 МБ', 'Animation must be 6 MB or less', 'Die Animation darf höchstens 6 MB groß sein', 'Анімація має бути не більше 6 МБ'],
    ['Фото должно быть не больше 15 МБ', 'Photo must be 15 MB or less', 'Das Foto darf höchstens 15 MB groß sein', 'Фото має бути не більше 15 МБ'],
    ['Анимация должна быть не длиннее 5 секунд', 'Animation must be 5 seconds or shorter', 'Die Animation darf höchstens 5 Sekunden lang sein', 'Анімація має бути не довша за 5 секунд'],
    ['Не удалось загрузить данные. Проверьте настройки Supabase.', 'Could not load data. Check your Supabase settings.', 'Daten konnten nicht geladen werden. Prüfe die Supabase-Einstellungen.', 'Не вдалося завантажити дані. Перевірте налаштування Supabase.'],
    ['Никого не найдено', 'No one found', 'Niemand gefunden', 'Нікого не знайдено'],
    ['Пока нет чатов. Найдите человека через поиск выше.', 'No chats yet. Find someone using the search above.', 'Noch keine Chats. Finde Personen über die Suche oben.', 'Чатів поки немає. Знайдіть людину через пошук вище.'],
    ['Выберите чат или найдите человека, чтобы начать общение', 'Pick a chat or find someone to start talking', 'Wähle einen Chat oder suche jemanden, um zu schreiben', 'Виберіть чат або знайдіть людину, щоб почати спілкування'],
    ['Сообщений пока нет. Напишите первым!', 'No messages yet. Write first!', 'Noch keine Nachrichten. Schreib als Erster!', 'Повідомлень поки немає. Напишіть першим!'],
    ['Назад', 'Back', 'Zurück', 'Назад'],
    ['Удалить публикацию', 'Delete post', 'Beitrag löschen', 'Видалити публікацію'],
    ['Удалить комментарий', 'Delete comment', 'Kommentar löschen', 'Видалити коментар'],
    ['Напишите комментарий', 'Write a comment', 'Kommentar schreiben', 'Напишіть коментар'],
    ['Отправить', 'Send', 'Senden', 'Надіслати'],
    ['Здесь пока пусто. Напишите первую публикацию!', 'Nothing here yet. Write the first post!', 'Hier ist noch nichts. Schreib den ersten Beitrag!', 'Тут поки порожньо. Напишіть першу публікацію!'],
    ['Убрать фото', 'Remove photo', 'Foto entfernen', 'Прибрати фото'],
    ['Фото', 'Photo', 'Foto', 'Фото'],
    ['С обложкой', 'With cover', 'Mit Cover', 'З обкладинкою'],
    ['Опубликовать', 'Publish', 'Veröffentlichen', 'Опублікувати'],
    ['Популярное', 'Popular', 'Beliebt', 'Популярне'],
    ['Главная', 'Home', 'Start', 'Головна'],
    ['Чаты', 'Chats', 'Chats', 'Чати'],
    ['Профиль', 'Profile', 'Profil', 'Профіль'],
    ['Поиск людей', 'Search people', 'Personen suchen', 'Пошук людей'],
    ['Сообщение', 'Message', 'Nachricht', 'Повідомлення'],
    ['Нет доступа', 'No access', 'Kein Zugriff', 'Немає доступу'],
    ['Админ-панель', 'Admin panel', 'Admin-Bereich', 'Адмін-панель'],
    ['Пользователи', 'Users', 'Nutzer', 'Користувачі'],
    ['Публикации', 'Posts', 'Beiträge', 'Публікації'],
    ['Комментарии', 'Comments', 'Kommentare', 'Коментарі'],
    ['Лайки', 'Likes', 'Likes', 'Лайки'],
    ['Бан', 'Banned', 'Gesperrt', 'Бан'],
    ['Снять админа', 'Remove admin', 'Admin entziehen', 'Зняти адміна'],
    ['Сделать админом', 'Make admin', 'Zum Admin machen', 'Зробити адміном'],
    ['Разблокировать', 'Unblock', 'Entsperren', 'Розблокувати'],
    ['Заблокировать', 'Block', 'Sperren', 'Заблокувати'],
    ['Удалить', 'Delete', 'Löschen', 'Видалити'],
    ['Модерация', 'Moderation', 'Moderation', 'Модерація'],
    ['Редактировать', 'Edit', 'Bearbeiten', 'Редагувати'],
    ['Выйти', 'Log out', 'Abmelden', 'Вийти'],
    ['Написать', 'Message', 'Schreiben', 'Написати'],
    ['Вы подписаны', 'Following', 'Gefolgt', 'Ви підписані'],
    ['Подписаться', 'Follow', 'Folgen', 'Підписатися'],
    ['постов', 'posts', 'Beiträge', 'дописів'],
    ['подписчиков', 'followers', 'Follower', 'підписників'],
    ['подписок', 'following', 'Folge ich', 'підписок'],
    ['Пока нет тегов. Добавьте #тег в публикацию.', 'No tags yet. Add a #tag to a post.', 'Noch keine Tags. Füge einem Beitrag einen #Tag hinzu.', 'Тегів поки немає. Додайте #тег до публікації.'],
    ['Кого читать', 'Who to follow', 'Wem folgen', 'Кого читати'],
    ['Читаю', 'Following', 'Folge ich', 'Читаю'],
    ['Читать', 'Follow', 'Folgen', 'Читати'],
    ['Пока здесь только вы. Пригласите друзей!', 'Only you are here so far. Invite your friends!', 'Bisher bist nur du hier. Lade Freunde ein!', 'Поки що тут лише ви. Запросіть друзів!'],
    ['Сейчас обсуждают', 'Trending now', 'Gerade im Gespräch', 'Зараз обговорюють'],
    ['Новая публикация', 'New post', 'Neuer Beitrag', 'Нова публікація'],
    ['Аккаунт заблокирован', 'Account blocked', 'Konto gesperrt', 'Акаунт заблоковано'],
    ['Администратор ограничил доступ к вашему аккаунту.', 'An administrator has restricted access to your account.', 'Ein Administrator hat den Zugriff auf dein Konto eingeschränkt.', 'Адміністратор обмежив доступ до вашого акаунта.'],
    ['Введите номер телефона, например +7 900 123-45-67', 'Enter a phone number, e.g. +7 900 123-45-67', 'Gib eine Telefonnummer ein, z. B. +7 900 123-45-67', 'Введіть номер телефону, наприклад +7 900 123-45-67'],
    ['Пароль должен содержать минимум 6 символов', 'Password must be at least 6 characters', 'Das Passwort muss mindestens 6 Zeichen enthalten', 'Пароль має містити щонайменше 6 символів'],
    ['Укажите имя — минимум 2 символа', 'Enter your name — at least 2 characters', 'Gib deinen Namen an – mindestens 2 Zeichen', 'Вкажіть ім’я — щонайменше 2 символи'],
    ['Неверный номер или пароль. Проверьте данные или зарегистрируйтесь.', 'Wrong number or password. Check your details or sign up.', 'Falsche Nummer oder falsches Passwort. Prüfe deine Eingaben oder registriere dich.', 'Невірний номер або пароль. Перевірте дані або зареєструйтеся.'],
    ['Этот номер уже зарегистрирован. Попробуйте войти.', 'This number is already registered. Try logging in.', 'Diese Nummer ist bereits registriert. Versuche dich anzumelden.', 'Цей номер уже зареєстровано. Спробуйте увійти.'],
    ['Аккаунт создан, но в Supabase включено подтверждение почты. Выключите Confirm email в настройках и войдите.', 'Account created, but email confirmation is enabled in Supabase. Turn off Confirm email in the settings and log in.', 'Konto erstellt, aber in Supabase ist die E-Mail-Bestätigung aktiviert. Deaktiviere „Confirm email“ in den Einstellungen und melde dich an.', 'Акаунт створено, але в Supabase увімкнено підтвердження пошти. Вимкніть Confirm email у налаштуваннях і увійдіть.'],
    ['Добро пожаловать в Connect', 'Welcome to Connect', 'Willkommen bei Connect', 'Ласкаво просимо до Connect'],
    ['Вы вышли из аккаунта', 'You have logged out', 'Du hast dich abgemeldet', 'Ви вийшли з акаунта'],
    ['Редактировать профиль', 'Edit profile', 'Profil bearbeiten', 'Редагувати профіль'],
    ['Сменить фото профиля', 'Change profile photo', 'Profilfoto ändern', 'Змінити фото профілю'],
    ['Баннер: фото или анимация до 5 сек', 'Banner: photo or animation up to 5 sec', 'Banner: Foto oder Animation bis 5 Sek.', 'Банер: фото або анімація до 5 с'],
    ['Убрать баннер', 'Remove banner', 'Banner entfernen', 'Прибрати банер'],
    ['Баннер будет удалён после сохранения', 'Banner will be removed after saving', 'Der Banner wird nach dem Speichern entfernt', 'Банер буде видалено після збереження'],
    ['Имя', 'Name', 'Name', 'Ім’я'],
    ['ник', 'username', 'Nutzername', 'нікнейм'],
    ['О себе', 'About you', 'Über dich', 'Про себе'],
    ['Сохранить', 'Save', 'Speichern', 'Зберегти'],
    ['Имя должно содержать минимум 2 символа', 'Name must be at least 2 characters', 'Der Name muss mindestens 2 Zeichen enthalten', 'Ім’я має містити щонайменше 2 символи'],
    ['Ник: 3–20 символов, только латинские буквы, цифры и _', 'Username: 3–20 characters, Latin letters, digits and _ only', 'Nutzername: 3–20 Zeichen, nur lateinische Buchstaben, Ziffern und _', 'Нікнейм: 3–20 символів, лише латинські літери, цифри та _'],
    ['Этот ник зарезервирован', 'This username is reserved', 'Dieser Nutzername ist reserviert', 'Цей нікнейм зарезервовано'],
    ['Этот ник уже занят', 'This username is already taken', 'Dieser Nutzername ist bereits vergeben', 'Цей нікнейм уже зайнято'],
    ['Профиль сохранён', 'Profile saved', 'Profil gespeichert', 'Профіль збережено'],
    ['Выберите файл с изображением', 'Choose an image file', 'Wähle eine Bilddatei', 'Виберіть файл із зображенням'],
    ['Заблокировать этого пользователя?', 'Block this user?', 'Diesen Nutzer sperren?', 'Заблокувати цього користувача?'],
    ['Удалить пользователя вместе со всеми его публикациями, комментариями и сообщениями? Это нельзя отменить.', 'Delete this user along with all their posts, comments and messages? This cannot be undone.', 'Diesen Nutzer samt allen Beiträgen, Kommentaren und Nachrichten löschen? Das kann nicht rückgängig gemacht werden.', 'Видалити користувача разом з усіма його публікаціями, коментарями та повідомленнями? Це не можна скасувати.'],
    ['Удалить эту публикацию? Это нельзя отменить.', 'Delete this post? This cannot be undone.', 'Diesen Beitrag löschen? Das kann nicht rückgängig gemacht werden.', 'Видалити цю публікацію? Це не можна скасувати.'],
    ['Удалить комментарий?', 'Delete this comment?', 'Diesen Kommentar löschen?', 'Видалити коментар?'],
    ['Пользователь заблокирован', 'User blocked', 'Nutzer gesperrt', 'Користувача заблоковано'],
    ['Пользователь разблокирован', 'User unblocked', 'Nutzer entsperrt', 'Користувача розблоковано'],
    ['Пользователь удалён', 'User deleted', 'Nutzer gelöscht', 'Користувача видалено'],
    ['Роль обновлена', 'Role updated', 'Rolle aktualisiert', 'Роль оновлено'],
    ['Публикация удалена', 'Post deleted', 'Beitrag gelöscht', 'Публікацію видалено'],
    ['Вы подписались', 'You followed', 'Du folgst jetzt', 'Ви підписалися'],
    ['Напишите текст комментария', 'Write the comment text', 'Schreibe einen Kommentartext', 'Напишіть текст коментаря'],
    ['Добавьте подпись к фото', 'Add a caption to the photo', 'Füge dem Foto eine Beschreibung hinzu', 'Додайте підпис до фото'],
    ['Напишите что-нибудь, чтобы опубликовать', 'Write something to publish', 'Schreibe etwas, um zu veröffentlichen', 'Напишіть щось, щоб опублікувати'],
    ['Опубликовано', 'Published', 'Veröffentlicht', 'Опубліковано'],
    ['Ошибка', 'Error', 'Fehler', 'Помилка'],
    ['Новое обращение', 'New ticket', 'Neue Anfrage', 'Нове звернення']
  ];
  var MAP = {};
  function add(rows) { rows.forEach(function (r) { MAP[r[0]] = r; }); }
  add(D);

  /* префиксы: после перевода префикса остальной текст остаётся как есть */
  var PREFIX = [
    ['Ошибка загрузки: ', ['Upload error: ', 'Upload-Fehler: ', 'Помилка завантаження: ']],
    ['Ошибка: ', ['Error: ', 'Fehler: ', 'Помилка: ']],
    ['Не отправлено: ', ['Not sent: ', 'Nicht gesendet: ', 'Не надіслано: ']],
    ['Выбрано: ', ['Selected: ', 'Ausgewählt: ', 'Вибрано: ']],
    ['Сообщение от ', ['Message from ', 'Nachricht von ', 'Повідомлення від ']],
    ['Вы: ', ['You: ', 'Sie: ', 'Ви: ']]
  ];
  var NEWS = ["What's new, %s?", "Was gibt's Neues, %s?", 'Що нового, %s?'];
  var UNITS = { 'мин': ['min', 'Min.', 'хв'], 'ч': ['h', 'Std.', 'год'], 'дн': ['d', 'T.', 'дн'] };

  function postWord(n, L) {
    if (L === 0) return n === 1 ? 'post' : 'posts';
    if (L === 1) return n === 1 ? 'Beitrag' : 'Beiträge';
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? 'допис' : (a >= 2 && a <= 4 && (b < 10 || b >= 20)) ? 'дописи' : 'дописів';
  }

  var lang = 'ru';
  try {
    var saved = localStorage.getItem('connect_lang');
    if (saved && IDX[saved] !== undefined) lang = saved;
    else { var nl = (navigator.language || 'ru').slice(0, 2).toLowerCase(); if (IDX[nl] !== undefined) lang = nl; }
  } catch (x) {}

  /* тексты пользователей (посты, комментарии, сообщения, имена, био) не переводим */
  function isUser(p) {
    if (!p || p.closest('.hero-v')) return false;
    if (p.closest('textarea')) return true;
    if (p.matches('.post > p, .c > div, .mb p, .phead p')) return true;
    if (p.matches('b, h2') && p.closest('[data-user], .c, .ci, .sg, .chu, .phead, .post > header')) return true;
    return false;
  }

  function rules(core, el) {
    var L = IDX[lang] - 1, m, i;
    for (i = 0; i < PREFIX.length; i++) if (core.indexOf(PREFIX[i][0]) === 0) return PREFIX[i][1][L] + core.slice(PREFIX[i][0].length);
    if ((m = core.match(/^Что нового, ([\s\S]*)\?$/))) return NEWS[L].split('%s').join(m[1]);
    if ((m = core.match(/^(\d+) (публикация|публикации|публикаций)$/))) return m[1] + ' ' + postWord(+m[1], L);
    if (el && (el.tagName === 'SPAN' || el.tagName === 'SMALL')) {
      var r = core.replace(/(\d+) постов · с /, function (_, n) { return n + ' ' + ['posts', 'Beiträge', 'дописів'][L] + ' · ' + ['since', 'seit', 'з'][L] + ' '; })
        .replace(/(^|· )(\d+) (мин|ч|дн)$/, function (_, a, n, u) { return a + n + ' ' + UNITS[u][L]; });
      if (r !== core) return r;
    }
    return undefined;
  }

  function tr(s, el, isAttr) {
    s = String(s);
    var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
    if (!core || lang === 'ru') return s;
    if (!isAttr && isUser(el)) return s;
    var row = MAP[core], out = row ? row[IDX[lang]] : rules(core, el);
    return out === undefined ? s : m[1] + out + m[3];
  }

  function text(n) {
    var p = n.parentElement;
    if (!p || /^(SCRIPT|STYLE)$/.test(p.tagName)) return;
    var cur = n.nodeValue, ru = (n.__tr !== undefined && cur === n.__tr) ? n.__ru : cur;
    n.__ru = ru;
    var out = lang === 'ru' ? ru : tr(ru, p);
    n.__tr = out;
    if (out !== cur) n.nodeValue = out;
  }
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  function attr(el, name) {
    var cur = el.getAttribute(name);
    if (cur == null) return;
    var st = el.__a || (el.__a = {}), s = st[name], ru = (s && cur === s.tr) ? s.ru : cur;
    var out = lang === 'ru' ? ru : tr(ru, el, true);
    st[name] = { ru: ru, tr: out };
    if (out !== cur) el.setAttribute(name, out);
  }
  function scan(node) {
    if (node.nodeType === 3) return text(node);
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(node.tagName)) return;
    var els = [node].concat([].slice.call(node.querySelectorAll('[placeholder],[title],[aria-label]')));
    els.forEach(function (e) { ATTRS.forEach(function (a) { attr(e, a); }); });
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) text(n);
  }

  var obs = new MutationObserver(function (recs) {
    obs.disconnect();
    recs.forEach(function (r) {
      if (r.type === 'characterData') text(r.target);
      else if (r.type === 'attributes') attr(r.target, r.attributeName);
      else [].forEach.call(r.addedNodes, scan);
    });
    start();
  });
  function start() {
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  var selects = [];
  function makeSelect() {
    var s = document.createElement('select');
    s.className = 'lang'; s.setAttribute('aria-label', 'Language');
    Object.keys(NAMES).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = NAMES[k]; s.appendChild(o); });
    s.value = lang;
    s.addEventListener('change', function () { setLang(s.value); });
    selects.push(s);
    return s;
  }

  function setLang(l) {
    if (IDX[l] === undefined) return;
    lang = l;
    try { localStorage.setItem('connect_lang', l); } catch (x) {}
    document.documentElement.lang = l;
    obs.disconnect();
    scan(document.documentElement);
    start();
    selects.forEach(function (s) { s.value = l; });
  }

  var oc = window.confirm;
  window.confirm = function (m) { return oc.call(window, tr(m)); };

  var st = document.createElement('style');
  st.textContent = '.lang{background:transparent;color:inherit;border:1px solid rgba(128,128,128,.45);border-radius:10px;padding:6px 8px;font:inherit;font-size:13px;cursor:pointer}.lang option{color:#111;background:#fff}';
  document.head.appendChild(st);
  [document.querySelector('#landing .nav .row'), document.querySelector('.top .row')].forEach(function (r) {
    if (r) r.insertBefore(makeSelect(), r.firstChild);
  });

  window.connectI18n = { set: setLang, get: function () { return lang; }, t: tr, add: add };
  document.documentElement.lang = lang;
  scan(document.documentElement);
  start();
})();
