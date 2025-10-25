require('dotenv').config();
const { sequelize } = require('../src/config/database');

(async () => {
  try {
    console.log('Starting CCCD fix: prefixing leading zeros for 11-digit values...');

    // Update CCCD 11-digit to 12-digit by prefixing '0'
    const [result1] = await sequelize.query(`
      UPDATE customers
      SET cccd = CONCAT('0', cccd)
      WHERE CHAR_LENGTH(cccd) = 11;
    `);
    console.log('Updated CCCD rows:', result1?.affectedRows ?? result1);

    // If carNumber is WALK-IN-<old_cccd>, update to WALK-IN-0<old_cccd>
    const [result2] = await sequelize.query(`
      UPDATE customers
      SET carNumber = CONCAT('WALK-IN-0', SUBSTRING(carNumber, 9))
      WHERE carNumber LIKE 'WALK-IN-%' AND CHAR_LENGTH(SUBSTRING(carNumber, 9)) = 11;
    `);
    console.log('Updated WALK-IN carNumber rows:', result2?.affectedRows ?? result2);

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  }
})();

