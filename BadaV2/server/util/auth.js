const jwt = require('jsonwebtoken');
const Config = require('../configuration/config.json');

const isLoggedIn = (token) => {
  let status = { success : false, message: "fail", admin: false};

  jwt.verify(token, Config.jwt.secret, (err, decoded) => {
    if(err) {
      return status;
    };

    if(decoded.email === Config.server.admin.id) {
      status.admin = true;
    }
    status.message = 'success';
    status.success = true;
  })

  return status;
};

const getUserId = (token) => {
  let status = 'Invalid token.';

  jwt.verify(token, Config.jwt.secret, (err, decoded) => {
    if(err) {
      return status;
    };

    status = decoded.email;
  });

  return status;
};


exports.isLoggedIn = isLoggedIn;
exports.getUserId = getUserId;