import env from '../config/env.js';
import agentService from './agent.service.js';
import workflowService from './workflow.service.js';

function splitTelegramMessage(text) {
  const chunks = [];
  const maxLength = 3900;

  for (let index = 0; index < text.length; index += maxLength) {
    chunks.push(text.slice(index, index + maxLength));
  }

  return chunks;
}

async function sendTelegramMessage(chatId, text) {
  if (!env.telegramBotToken) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN');
  }

  for (const chunk of splitTelegramMessage(text)) {
    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
    }
  }
}

function parseTelegramText(text, workflows) {
  const trimmed = text.trim();

  if (trimmed === '/start' || trimmed === '/help') {
    return {
      command: 'help',
      response:
        `Enviame una pregunta y respondere con el workflow "${env.defaultWorkflow}".\n\n` +
        `Tambien puedes usar:\n` +
        `/ask <workflow> <pregunta>\n` +
        `/${workflows[0] || env.defaultWorkflow} <pregunta>\n\n` +
        `Workflows disponibles: ${workflows.join(', ')}`,
    };
  }

  if (trimmed === '/workflows') {
    return {
      command: 'workflows',
      response: `Workflows disponibles: ${workflows.join(', ')}`,
    };
  }

  const [firstToken, secondToken, ...rest] = trimmed.split(/\s+/);

  if (firstToken === '/ask') {
    return {
      command: 'ask',
      workflow: secondToken,
      question: rest.join(' '),
    };
  }

  const commandWorkflow = firstToken?.startsWith('/') ? firstToken.slice(1) : '';

  if (workflows.includes(commandWorkflow)) {
    return {
      command: 'ask',
      workflow: commandWorkflow,
      question: [secondToken, ...rest].filter(Boolean).join(' '),
    };
  }

  return {
    command: 'ask',
    workflow: env.defaultWorkflow,
    question: trimmed,
  };
}

export async function handleWebhook(update) {
  const message = update.message;
  const chatId = message?.chat?.id;
  const text = message?.text;

  if (!chatId || !text) {
    return { ignored: true };
  }

  const workflows = await workflowService.listWorkflows();
  const parsed = parseTelegramText(text, workflows);

  if (parsed.command !== 'ask') {
    await sendTelegramMessage(chatId, parsed.response);

    return { ok: true };
  }

  if (!String(parsed.question || '').trim()) {
    await sendTelegramMessage(chatId, 'Mandame una pregunta despues del comando.');

    return { ok: true };
  }

  await sendTelegramMessage(chatId, 'Pensando...');

  const result = await agentService.ask({
    workflow: parsed.workflow,
    question: parsed.question,
  });

  await sendTelegramMessage(chatId, result.answer);

  return { ok: true };
}

export default {
  handleWebhook,
};
