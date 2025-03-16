const jwt = require('jsonwebtoken')
const config = require('../config/index')
const appError = require('./appError')

// 產生 JWT token
const generateJWT = (payload)=> {
  return jwt.sign(
    payload, 
    config.get('secret.jwtSecret'),
    {
      expiresIn: config.get('secret.jwtExpiresDay')
    }
  );
}

// 驗證 token
const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.get('secret.jwtSecret'), (err, decoded) => {
      if (err) {
        switch (err.name) {
          case 'TokenExpiredError':
            reject(appError(401, 'Token 已過期'))
            break
          default:
            reject(appError(401, '無效的 token'))
            break
        }
      } else {
        resolve(decoded)
      }
    })
  })
}

module.exports = { 
  generateJWT,
  verifyJWT
};
