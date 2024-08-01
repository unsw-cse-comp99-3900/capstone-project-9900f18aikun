// const { createProxyMiddleware } = require("http-proxy-middleware");

// module.exports = function (app) {
//   app.use(
//     "/api",
//     createProxyMiddleware({
//       target: "http://localhost:5001/",
//       // target: "http://3.26.67.188:5001/",
//       // target: "http://s2.gnip.vip:37895/",
//       changeOrigin: true,
//       pathRewrite: {
//         "^/api": "", // Remove /api prefix
//       },
//     })
//   );
// };

const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/socket.io", // Ensure this matches your WebSocket endpoint
    createProxyMiddleware({
      target: "ws://localhost:5001",
      changeOrigin: true,
      ws: true,
    })
  );
};
