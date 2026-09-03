const { db } = require('./database');
db.prepare("UPDATE app_config SET version='v2.4.0', version_date=date('now'), current_week=36, current_year=2026 WHERE id=1").run();
const c = db.prepare('SELECT * FROM app_config WHERE id=1').get();
console.log('app_config已更新:', JSON.stringify(c, null, 2));
