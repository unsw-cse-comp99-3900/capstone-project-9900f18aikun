const { createProxyMiddleware } = require('http-proxy-middleware');
import config from './config';

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: config.backendUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix
      },
    })
  );
};
