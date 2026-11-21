// Usage: npm run hash-password -- 'new-password'   -> prints a value for ADMIN_PASSWORD_HASH
const bcrypt = require('bcryptjs');

const password = (process.argv[2] || '').trim();
if (!password || password.length < 10) {
  console.error('Give a password of at least 10 characters.');
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 12));
