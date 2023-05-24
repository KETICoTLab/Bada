const os = require('os');
const config = require('./config.json');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = {
  server: {
    HOST: os.hostname(),
    PORT: config.server.port
  }
}