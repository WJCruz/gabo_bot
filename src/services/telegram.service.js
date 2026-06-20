import env from '../config/env.js';
import agentService from './agent.service.js';
import workflowService from './workflow.service.js';

const selectedWorkflowByChatId = new Map();

function splitTelegramMessage(text) {
  const chunks = [];
  const maxLength = 3900;

  for (let index = 0; index < text.length; index += maxLength) {
    chunks.push(text.slice(index, index + maxLength));
  }

  return chunks;
}

function getWorkflowOption(workflowOptions, workflowName) {
  return workflowOptions.find((workflow) => workflow.name === workflowName);
}

function getWorkflowLabel(workflowOptions, workflowName) {
  return getWorkflowOption(workflowOptions, workflowName)?.displayName || workflowName;
}

function buildWorkflowKeyboard(workflowOptions) {
  return {
    inline_keyboard: [
      workflowOptions.map((workflow) => ({
        text: workflow.displayName,
        callback_data: `workflow:${workflow.name}`,
      })),
    ],
  };
}

function buildWorkflowList(workflowOptions) {
  return workflowOptions
    .map((workflow) => `- ${workflow.displayName}: ${workflow.description}`)
    .join('\n');
}

function buildExamples(workflowOptions) {
  return workflowOptions
    .filter((workflow) => workflow.example)
    .map((workflow) => `/${workflow.name} ${workflow.example}`)
    .join('\n');
}

function buildWelcomeMessage(workflowOptions, selectedWorkflow) {
  return (
    `Hola, soy GABO.\n\n` +
    `Puedo ayudarte a estudiar la Biblia con estos modos:\n` +
    `${buildWorkflowList(workflowOptions)}\n\n` +
    `Modo actual: ${getWorkflowLabel(workflowOptions, selectedWorkflow)}.\n\n` +
    `Elige un modo abajo o escribe directamente tu pregunta.\n\n` +
    `Ejemplos:\n` +
    `${buildExamples(workflowOptions)}\n\n` +
    `Workflows disponibles: ${workflowOptions.map((workflow) => workflow.name).join(', ')}`
  );
}

async function sendTelegramMessage(chatId, text, options = {}) {
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
        ...options,
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
    }
  }
}

async function answerCallbackQuery(callbackQueryId, text) {
  if (!env.telegramBotToken) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN');
  }

  const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Telegram answerCallbackQuery failed: ${response.status} ${body}`);
  }
}

function parseTelegramText(text, workflowOptions, selectedWorkflow) {
  const trimmed = text.trim();
  const workflowNames = workflowOptions.map((workflow) => workflow.name);

  if (trimmed === '/start' || trimmed === '/help') {
    return {
      command: 'help',
      response: buildWelcomeMessage(workflowOptions, selectedWorkflow),
      replyMarkup: buildWorkflowKeyboard(workflowOptions),
    };
  }

  if (trimmed === '/workflows') {
    return {
      command: 'workflows',
      response: `Elige el modo que quieres usar. Modo actual: ${getWorkflowLabel(workflowOptions, selectedWorkflow)}.`,
      replyMarkup: buildWorkflowKeyboard(workflowOptions),
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

  if (workflowNames.includes(commandWorkflow)) {
    const question = [secondToken, ...rest].filter(Boolean).join(' ');

    if (!question) {
      return {
        command: 'select-workflow',
        workflow: commandWorkflow,
        response:
          `Listo. Ahora usare ${getWorkflowLabel(workflowOptions, commandWorkflow)} para tus preguntas.\n\n` +
          `Escribe tu pregunta cuando quieras.`,
      };
    }

    return {
      command: 'ask',
      workflow: commandWorkflow,
      question,
    };
  }

  return {
    command: 'ask',
    workflow: selectedWorkflow,
    question: trimmed,
  };
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data || '';

  if (!chatId || !data.startsWith('workflow:')) {
    return { ignored: true };
  }

  const workflow = data.replace('workflow:', '');
  const workflowOptions = await workflowService.listWorkflowOptions();

  await workflowService.ensureWorkflowExists(workflow);

  selectedWorkflowByChatId.set(chatId, workflow);
  await answerCallbackQuery(callbackQuery.id, `${getWorkflowLabel(workflowOptions, workflow)} seleccionado`);
  await sendTelegramMessage(
    chatId,
    `Listo. Ahora usare ${getWorkflowLabel(workflowOptions, workflow)} para tus preguntas.\n\n` +
      `Escribe tu pregunta directamente o usa /help para ver ejemplos.`,
    {
      reply_markup: buildWorkflowKeyboard(workflowOptions),
    }
  );

  return { ok: true };
}

export async function handleWebhook(update) {
  if (update.callback_query) {
    return await handleCallbackQuery(update.callback_query);
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  const text = message?.text;

  if (!chatId || !text) {
    return { ignored: true };
  }

  const workflowOptions = await workflowService.listWorkflowOptions();
  const selectedWorkflow = selectedWorkflowByChatId.get(chatId) || env.defaultWorkflow;
  const parsed = parseTelegramText(text, workflowOptions, selectedWorkflow);

  if (parsed.command === 'select-workflow') {
    selectedWorkflowByChatId.set(chatId, parsed.workflow);
    await sendTelegramMessage(chatId, parsed.response, {
      reply_markup: buildWorkflowKeyboard(workflowOptions),
    });

    return { ok: true };
  }

  if (parsed.command !== 'ask') {
    await sendTelegramMessage(chatId, parsed.response, {
      reply_markup: parsed.replyMarkup,
    });

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
