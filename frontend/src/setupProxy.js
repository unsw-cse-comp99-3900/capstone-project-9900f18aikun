const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://www.huoyingzhe.com/backend/',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix
      },
    })
  );
};