import env from '../config/env.js';

export function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Telegram-Bot-Api-Secret-Token');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
