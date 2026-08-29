/**
 * 数据库层 - SQLite
 * 负责数据库连接、表结构创建、初始数据导入
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'data', 'database.db');

// 确保 data 目录存在
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用 WAL 模式提升性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * 初始化数据库表结构
 */
function initDatabase() {
  console.log('正在初始化数据库...');

  // 1. 周度复盘表
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_number INTEGER NOT NULL,
      year INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      gold_pool TEXT DEFAULT '[]',
      black_pool TEXT DEFAULT '[]',
      zhongjun TEXT DEFAULT '[]',
      timeline TEXT DEFAULT '[]',
      conclusion TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(year, week_number)
    );
  `);

  // 2. 每日复盘表
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      weekday TEXT NOT NULL,
      week_id INTEGER,
      market_index TEXT DEFAULT '',
      market_volume TEXT DEFAULT '',
      market_sentiment TEXT DEFAULT '中性',
      gold_pool_summary TEXT DEFAULT '',
      zhongjun_summary TEXT DEFAULT '',
      limit_up_count INTEGER DEFAULT 0,
      limit_down_count INTEGER DEFAULT 0,
      daily_verify TEXT DEFAULT '[]',
      challengers TEXT DEFAULT '[]',
      daily_avoid TEXT DEFAULT '[]',
      conclusion TEXT DEFAULT '',
      actions TEXT DEFAULT '[]',
      risk_note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (week_id) REFERENCES weekly_reviews(id) ON DELETE SET NULL
    );
  `);

  // 3. 板块跟踪表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sector_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_name TEXT NOT NULL,
      industry TEXT DEFAULT '',
      date TEXT NOT NULL,
      change REAL DEFAULT 0,
      change_20d REAL DEFAULT 0,
      limit_up INTEGER DEFAULT 0,
      volume REAL DEFAULT 0,
      zj_change REAL DEFAULT 0,
      rank INTEGER DEFAULT 0,
      status TEXT DEFAULT 'watch',
      trend TEXT DEFAULT 'flat',
      score INTEGER DEFAULT 0,
      recommendation TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(sector_name, date)
    );
  `);

  // 4. 龙头股表
  db.exec(`
    CREATE TABLE IF NOT EXISTS leader_stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector TEXT NOT NULL,
      rank INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT DEFAULT '中军',
      market_cap TEXT DEFAULT '',
      day_change TEXT DEFAULT '',
      is_limit_up INTEGER DEFAULT 0,
      board_count INTEGER DEFAULT 0,
      volume TEXT DEFAULT '',
      week_change TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      logic TEXT DEFAULT '',
      catalysts TEXT DEFAULT '[]',
      risk TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(sector, rank, date)
    );
  `);

  // 5. 个股选择表
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_picks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      sector TEXT DEFAULT '',
      boards TEXT DEFAULT '',
      auction TEXT DEFAULT '',
      support TEXT DEFAULT '',
      emotion TEXT DEFAULT '',
      week_align TEXT DEFAULT '',
      pullback TEXT DEFAULT '',
      ma_status TEXT DEFAULT '',
      volume_ratio TEXT DEFAULT '',
      position TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(type, code, date)
    );
  `);

  // 6. 执行清单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      time TEXT DEFAULT '',
      desc TEXT DEFAULT '',
      checked INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, title)
    );
  `);

  // 7. 应用配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version TEXT DEFAULT 'v1.0.0',
      version_date TEXT DEFAULT '',
      current_week INTEGER DEFAULT 0,
      current_year INTEGER DEFAULT 0,
      settings TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 初始化应用配置
  const configExists = db.prepare('SELECT id FROM app_config WHERE id = 1').get();
  if (!configExists) {
    db.prepare(`
      INSERT INTO app_config (id, version, version_date, current_week, current_year, settings)
      VALUES (1, 'v1.0.0', date('now'), 35, 2026, '{}')
    `).run();
  }

  console.log('数据库初始化完成！');
  console.log(`数据库文件: ${DB_PATH}`);
}

/**
 * 导入初始示例数据
 */
function importSampleData() {
  console.log('正在导入初始示例数据...');

  // 检查是否已有数据
  const dailyCount = db.prepare('SELECT COUNT(*) as count FROM daily_reviews').get().count;
  if (dailyCount > 0) {
    console.log('数据库已有数据，跳过初始数据导入。');
    return;
  }

  // 导入周度复盘
  const insertWeekly = db.prepare(`
    INSERT OR IGNORE INTO weekly_reviews 
    (week_number, year, start_date, end_date, gold_pool, black_pool, zhongjun, timeline, conclusion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertWeekly.run(
    35, 2026, '2026-08-24', '2026-08-28',
    JSON.stringify([
      { id: 'ai', name: 'AI算力', weekChange: '+8.3%', weekVolume: '1,280', pattern: '周线放量突破', status: 'keep', zhongjun: '寒武纪', reason: '上周周涨幅第2 + 周成交额第1 + 周线放量突破前高' },
      { id: 'robot', name: '机器人', weekChange: '+6.7%', weekVolume: '860', pattern: '周线连阳', status: 'keep', zhongjun: '埃斯顿', reason: '上周周涨幅第4 + 政策催化持续 + 周线MACD金叉' },
      { id: 'fintech', name: '金融科技', weekChange: '+2.1%', weekVolume: '520', pattern: '周线企稳', status: 'watch', zhongjun: '恒生电子', reason: '上周周涨幅第8 + 低位缩量企稳 + 等待方向选择' }
    ]),
    JSON.stringify([
      { name: '房地产', weekChange: '-5.2%', lineStatus: '跌破20周线', volume: '缩量阴跌', reason: '政策利好出尽，龙头跌停，周线破位' },
      { name: '白酒', weekChange: '-3.8%', lineStatus: '周线破位', volume: '缩量', reason: '消费复苏不及预期，机构持续减仓' },
      { name: '煤炭', weekChange: '-2.5%', lineStatus: '周线走弱', volume: '放量下跌', reason: '大宗商品价格回落，周期股退潮' }
    ]),
    JSON.stringify([
      { name: '寒武纪', code: '688256', sector: 'AI算力', price: '285.60', dayChange: '+3.2%', weekTrend: '周线多头排列，放量创新高', ma5: 'above', ma10: 'above', ma20: 'above', health: 'good' },
      { name: '埃斯顿', code: '002747', sector: '机器人', price: '32.45', dayChange: '+1.5%', weekTrend: '周线连阳，趋势稳健', ma5: 'above', ma10: 'above', ma20: 'above', health: 'good' },
      { name: '恒生电子', code: '600570', sector: '金融科技', price: '38.20', dayChange: '-0.8%', weekTrend: '周线企稳，但日线破5日线需警惕', ma5: 'below', ma10: 'above', ma20: 'above', health: 'warn' }
    ]),
    JSON.stringify([
      { date: '08-24', type: 'info', content: '周初确认金池方向：AI算力 + 机器人 + 金融科技' },
      { date: '08-25', type: 'info', content: 'AI算力领涨，寒武纪创新高，确认主攻方向' },
      { date: '08-26', type: 'info', content: '数据要素政策刺激爆发，纳入替补观察' },
      { date: '08-27', type: 'warn', content: '金融科技连续走弱，恒生电子破5日线，降级观察' },
      { date: '08-28', type: 'info', content: '周度复盘：AI算力+12.5%领涨，机器人+7.8%，金融科技-1.2%' }
    ]),
    '本周AI算力和机器人表现强劲，金融科技走弱降级观察。数据要素连续走强纳入替补。下周重点关注AI算力持续性和数据要素能否升级为新金池。'
  );

  // 导入每日复盘（10天示例数据）
  const insertDaily = db.prepare(`
    INSERT OR IGNORE INTO daily_reviews
    (date, weekday, week_id, market_index, market_volume, market_sentiment, gold_pool_summary, zhongjun_summary, limit_up_count, limit_down_count, conclusion, actions, risk_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const dailyData = [
    ['2026-08-28', '周四', 1, '+0.8%', '8500亿', '偏暖', 'AI算力+2.8%领涨，机器人+1.9%，金融科技-0.5%', '寒武纪+3.2%创新高，埃斯顿+1.5%，恒生电子-0.8%破5日线', 12, 3, 'AI算力续强维持高优先级，金融科技降级观察，数据要素连续走强纳入替补', JSON.stringify(['加仓AI算力至20%', '金融科技减仓至5%', '数据要素小仓试仓3%']), '无重大风险'],
    ['2026-08-27', '周三', 1, '+0.3%', '7800亿', '中性偏暖', '数据要素+3.5%爆发，AI算力+1.8%，机器人+1.5%', '寒武纪+1.5%，埃斯顿+1.2%回踩10日线获支撑，恒生电子-0.5%', 9, 5, '数据要素政策刺激爆发纳入替补观察，金池三板块整体健康', JSON.stringify(['数据要素纳入替补观察', '机器人持仓不动']), '金融科技连续走弱需警惕'],
    ['2026-08-26', '周二', 1, '+1.2%', '9200亿', '偏暖', 'AI算力+3.1%领涨两市，机器人+2.1%，金融科技+1.5%', '寒武纪+2.8%，埃斯顿+1.8%，恒生电子+1.1%', 15, 2, '金池三板块全线飘红，AI算力涨停梯队6只完整，确认本周主攻方向', JSON.stringify(['AI算力加仓至15%', '机器人加仓至10%']), '房地产龙头跌停确认避雷'],
    ['2026-08-25', '周一', 1, '+0.5%', '7500亿', '中性', 'AI算力+2.5%，机器人+1.2%，金融科技-0.3%', '寒武纪+2.1%，埃斯顿+0.9%，恒生电子-0.2%', 8, 4, '周初确认金池方向，AI算力和机器人开局良好，金融科技偏弱观察', JSON.stringify(['建立AI算力底仓10%', '建立机器人底仓8%']), '白酒板块竞价核按钮全周规避'],
    ['2026-08-22', '周五', null, '-0.3%', '7200亿', '中性偏冷', 'AI算力+1.2%，机器人+0.5%，金融科技+0.8%', '寒武纪+0.8%，埃斯顿+0.3%，恒生电子+0.5%', 6, 6, '周五强制清零复盘，AI算力和机器人入选下周金池，金融科技低位企稳入选观察', JSON.stringify(['清仓上周旧金池', '制定下周作战计划']), '存储芯片连续走弱剔除金池'],
    ['2026-08-21', '周四', null, '+0.6%', '7800亿', '偏暖', 'AI算力+1.8%，存储芯片-1.2%走弱，机器人+1.2%', '寒武纪+1.5%，兆易创新-1.8%，埃斯顿+1.0%', 10, 4, 'AI算力连续走强确认主攻，存储芯片走弱开始降级，机器人稳步上行', JSON.stringify(['存储芯片减仓至5%', 'AI算力加仓至12%']), '存储芯片中军破位需警惕'],
    ['2026-08-20', '周三', null, '+0.9%', '8000亿', '偏暖', 'AI算力+2.2%，存储芯片+0.8%，机器人+1.5%', '寒武纪+1.8%，兆易创新+0.5%，埃斯顿+1.2%', 11, 3, 'AI算力和机器人双轮驱动，存储芯片涨势放缓开始观察', JSON.stringify(['机器人加仓至8%']), '无重大风险'],
    ['2026-08-19', '周二', null, '+0.4%', '7300亿', '中性', 'AI算力+0.8%，存储芯片+1.2%，机器人+0.5%', '寒武纪+0.6%，兆易创新+0.8%，埃斯顿+0.3%', 7, 5, '周初金池三板块均收红，存储芯片开局最强，AI算力稳步上行', JSON.stringify(['建立存储芯片底仓8%', '建立AI算力底仓8%']), '无重大风险'],
    ['2026-08-18', '周一', null, '+1.1%', '8600亿', '偏暖', '存储芯片+3.2%领涨，AI算力+2.5%，机器人+1.8%', '兆易创新+2.8%，寒武纪+2.1%，埃斯顿+1.5%', 14, 2, '存储芯片周初爆发领涨，AI算力和机器人同步走强，确认本周三方向', JSON.stringify(['建立存储芯片底仓10%', '建立AI算力底仓8%', '建立机器人底仓5%']), '房地产和白酒确认进入黑池'],
    ['2026-08-15', '周五', null, '-0.2%', '6800亿', '中性偏冷', '存储芯片+2.1%领涨，AI算力+0.5%，机器人+0.2%', '兆易创新+1.5%，寒武纪+0.3%，埃斯顿+0.1%', 8, 5, '周五清零复盘，存储芯片周涨幅第一入选下周金池，AI算力和机器人同步入选', JSON.stringify(['清仓旧金池', '制定下周计划：存储芯片+AI算力+机器人']), '房地产和白酒确认进入黑池']
  ];

  const insertWeeklyTx = db.transaction(() => {
    dailyData.forEach(row => insertDaily.run(...row));
  });
  insertWeeklyTx();

  console.log(`已导入 ${dailyData.length} 条每日复盘记录`);
  console.log('初始示例数据导入完成！');
}

// 导出数据库实例和初始化函数
module.exports = {
  db,
  initDatabase,
  importSampleData,
  DB_PATH
};

// 如果直接运行此文件，则初始化数据库并导入示例数据
if (require.main === module) {
  initDatabase();
  importSampleData();
  console.log('\n数据库初始化和数据导入全部完成！');
  console.log('运行 npm start 启动应用');
}
