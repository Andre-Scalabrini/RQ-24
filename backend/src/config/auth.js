require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
};
