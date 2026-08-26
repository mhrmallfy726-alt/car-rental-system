const jwt = require('jsonwebtoken');

const generateToken = (id, claims = {}) => {
  return jwt.sign(
    { id, ...claims },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sendTokenResponse = (account, statusCode, res, claims = {}) => {
  const accountType = claims.account_type || 'user';
  const token = generateToken(account.id, {
    account_type: accountType,
    ...claims,
  });

  const safeAccount = { ...account };
  delete safeAccount.password;
  delete safeAccount.password_digest;

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      ...safeAccount,
      account_type: accountType,
    },
  });
};

module.exports = { generateToken, sendTokenResponse };
