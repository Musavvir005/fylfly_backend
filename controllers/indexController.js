// controllers/indexController.js
// Handles the root-level routes (health check, server info)

/**
 * GET /
 * Simple health-check so you can confirm the server is alive.
 */
const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    app: process.env.APP_NAME || 'FylShare',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { healthCheck };
