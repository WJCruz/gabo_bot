import env from '../config/env.js';

export function requireApiKey(req, res, next) {
  if (!env.apiKey) {
    next();
    return;
  }

  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (token !== env.apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

export function requireTelegramSecret(req, res, next) {
  if (!env.telegramWebhookSecret) {
    next();
    return;
  }

  if (req.get('x-telegram-bot-api-secret-token') !== env.telegramWebhookSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
