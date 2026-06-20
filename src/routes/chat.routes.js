import { Router } from 'express';

import agentService from '../services/agent.service.js';
import { requireApiKey } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/ask', requireApiKey, async (req, res, next) => {
  try {
    const result = await agentService.ask({
      workflow: req.body.workflow,
      question: req.body.question,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
