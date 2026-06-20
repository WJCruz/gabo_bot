import { Router } from 'express';

import telegramService from '../services/telegram.service.js';
import { requireTelegramSecret } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/telegram/webhook', requireTelegramSecret, async (req, res, next) => {
  try {
    const result = await telegramService.handleWebhook(req.body);

    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
