const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://s2.gnip.vip:37895',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // 移除 /api 前缀
      },
    })
  );
};