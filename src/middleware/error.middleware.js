export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
  });
}
