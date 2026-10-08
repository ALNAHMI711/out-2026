const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password || !/^\d{10}$/.test(password)) {
  console.error('Usage: node scripts/hash-lock.js 1234567890');
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 12));