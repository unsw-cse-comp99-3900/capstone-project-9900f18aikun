const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://3.26.67.188:5001/',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix
      },
    })
  );
};
