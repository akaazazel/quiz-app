const authMiddleware = (req, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    // If no password set, warn but allow? Or deny? Safer to deny or require setup.
    // For MVP, if no env var set, maybe open access? Or log error?
    // Let's deny to force setup.
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured on server' });
  }

  const token = req.headers['x-admin-password'];
  if (token !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

export default authMiddleware;
