import { Router } from 'express';

import workflowService from '../services/workflow.service.js';
import { requireApiKey } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/workflows', requireApiKey, async (req, res, next) => {
  try {
    res.json({ workflows: await workflowService.listWorkflows() });
  } catch (error) {
    next(error);
  }
});

export default router;
