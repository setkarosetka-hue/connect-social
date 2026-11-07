async function aiSend() {
  const el = $('#cin');
  const v = el.value.trim();

  if (!v || X.typing) return;

  el.value = '';
  el.style.height = 'auto';

  X.ai.push({
    role: 'user',
    text: v,
    t: Date.now()
  });

  X.typing = true;
  saveAi();
  renderConv();

  // Подготавливаем историю для Edge Function connect-ai
  const hist = X.ai.slice(-12).map(({ role, text }) => ({
    role,
    content: text
  }));

  // Запрос должен начинаться с сообщения пользователя
  while (hist.length && hist[0].role !== 'user') {
    hist.shift();
  }

  let reply = '';

  try {
    const { data, error } = await sb.functions.invoke('connect-ai', {
      body: {
        messages: hist
      }
    });

    if (error) {
      let errorText = '';

      try {
        errorText = (await error.context.json()).error || '';
      } catch (e) {}

      reply = errorText ||
        'Connect AI недоступен. Проверьте Edge Function connect-ai.';
    } else if (data && data.reply) {
      reply = data.reply;
    } else {
      reply = (data && data.error) ||
        'DeepSeek не вернул ответ.';
    }
  } catch (e) {
    console.error('Connect AI error:', e);
    reply = 'Ошибка соединения с Connect AI.';
  }

  X.typing = false;

  X.ai.push({
    role: 'assistant',
    text: String(reply || 'Пустой ответ от ИИ'),
    t: Date.now()
  });

  saveAi();

  if (chatWith === 'ai') {
    renderConv();
  }
}
