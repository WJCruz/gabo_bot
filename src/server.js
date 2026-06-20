import express from 'express';

import env, { validateEnv } from './config/env.js';
import chatRoutes from './routes/chat.routes.js';
import telegramRoutes from './routes/telegram.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import { cors } from './middleware/cors.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

validateEnv();

const app = express();

app.use(cors);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use(workflowRoutes);
app.use(chatRoutes);
app.use(telegramRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, env.host, () => {
  console.log(`GABO Agent API listening on http://${env.host}:${env.port}`);
});

export default app;
