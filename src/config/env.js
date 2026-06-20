import 'dotenv/config';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  geminiApiKey: process.env.GEMINI_API_KEY,
  defaultWorkflow: process.env.DEFAULT_WORKFLOW || 'theology',
  apiKey: process.env.API_KEY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export function validateEnv() {
  const missing = [];

  if (!env.geminiApiKey) {
    missing.push('GEMINI_API_KEY');
  }

  if (!Number.isInteger(env.port) || env.port <= 0) {
    throw new Error('PORT must be a positive number');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default env;
