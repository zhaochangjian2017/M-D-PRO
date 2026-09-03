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
      version TEXT DEFAULT 'v2.1.0',
      version_date TEXT DEFAULT '',
      current_week INTEGER DEFAULT 0,
      current_year INTEGER DEFAULT 0,
      settings TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 8. 全球重大事件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS global_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT '其他',
      impact TEXT DEFAULT '中性',
      description TEXT DEFAULT '',
      market_impact TEXT DEFAULT '',
      related_sectors TEXT DEFAULT '[]',
      source TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, title)
    );
  `);

  // 9. 外围市场数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS global_markets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      region TEXT NOT NULL,
      index_name TEXT NOT NULL,
      index_value REAL DEFAULT 0,
      change_pct REAL DEFAULT 0,
      change_abs REAL DEFAULT 0,
      volume TEXT DEFAULT '',
      description TEXT DEFAULT '',
      impact_on_a_share TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, region, index_name)
    );
  `);

  // 10. 资金监控表
  db.exec(`
    CREATE TABLE IF NOT EXISTS capital_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      flow_type TEXT NOT NULL,
      name TEXT NOT NULL,
      net_inflow REAL DEFAULT 0,
      inflow REAL DEFAULT 0,
      outflow REAL DEFAULT 0,
      change_pct REAL DEFAULT 0,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, flow_type, name)
    );
  `);

  // 11. 连板梯队表
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_ladder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      board_count INTEGER NOT NULL,
      stock_name TEXT NOT NULL,
      stock_code TEXT DEFAULT '',
      concept TEXT DEFAULT '',
      change_pct REAL DEFAULT 0,
      volume TEXT DEFAULT '',
      turnover_rate TEXT DEFAULT '',
      is_20cm INTEGER DEFAULT 0,
      is_new_high INTEGER DEFAULT 0,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, stock_code)
    );
  `);

  // 12. 分时回顾表
  db.exec(`
    CREATE TABLE IF NOT EXISTS intraday_review (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time_period TEXT NOT NULL,
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      sh_index REAL DEFAULT 0,
      sz_index REAL DEFAULT 0,
      chinext_index REAL DEFAULT 0,
      leading_sectors TEXT DEFAULT '[]',
      lagging_sectors TEXT DEFAULT '[]',
      key_events TEXT DEFAULT '',
      volume TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, time_period)
    );
  `);

  // 13. 预期管理表
  db.exec(`
    CREATE TABLE IF NOT EXISTS expectation_management (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      phase TEXT NOT NULL,
      us_market TEXT DEFAULT '',
      asia_market TEXT DEFAULT '',
      hk_market TEXT DEFAULT '',
      a_share_expected TEXT DEFAULT '',
      a_share_actual TEXT DEFAULT '',
      key_events TEXT DEFAULT '[]',
      sentiment_level INTEGER DEFAULT 50,
      conclusion TEXT DEFAULT '',
      verification TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, phase)
    );
  `);

  // 14. 持仓管理表
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_management (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      stock_name TEXT NOT NULL,
      stock_code TEXT DEFAULT '',
      market TEXT DEFAULT 'A股',
      position_type TEXT DEFAULT '核心持仓',
      shares INTEGER DEFAULT 0,
      cost_price REAL DEFAULT 0,
      current_price REAL DEFAULT 0,
      market_value REAL DEFAULT 0,
      profit_loss REAL DEFAULT 0,
      profit_loss_pct REAL DEFAULT 0,
      position_ratio REAL DEFAULT 0,
      sector TEXT DEFAULT '',
      recommendation TEXT DEFAULT '持有',
      risk_note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(date, stock_code, market)
    );
  `);

  // 初始化应用配置
  const configExists = db.prepare('SELECT id FROM app_config WHERE id = 1').get();
  if (!configExists) {
    db.prepare(`
      INSERT INTO app_config (id, version, version_date, current_week, current_year, settings)
      VALUES (1, 'v2.4.0', date('now'), 36, 2026, '{}')
    `).run();
  } else {
    // 更新版本号
    db.prepare("UPDATE app_config SET version = 'v2.4.0', version_date = date('now') WHERE id = 1").run();
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
    ['2026-08-31', '周一', 2, '+0.86%', '10143亿', '偏暖', JSON.stringify([{name:'传媒',change:'+3.7%'},{name:'AI算力',change:'+2.5%'},{name:'计算机',change:'+2.19%'},{name:'电子',change:'+1.8%'},{name:'机器人',change:'+1.2%'}]), JSON.stringify([{name:'浪潮信息',change:'+10%',status:'涨停突破'},{name:'寒武纪',change:'+7.09%',status:'AI芯片龙头'},{name:'中文在线',change:'+20%',status:'20cm涨停'},{name:'埃斯顿',change:'+2.68%',status:'趋势稳健'},{name:'恒生电子',change:'-3.43%',status:'跌破5日线，减仓观察'}]), 91, 13, '三大指数集体收涨，TMT成为主线，传媒大涨3.70%掀起涨停潮，计算机、电子分别上涨2.19%和1.80%。煤炭、银行等权重板块同步走强。涨停91只，跌停13只，赚钱效应明显偏暖。', JSON.stringify(['传媒板块加仓至15%', '计算机板块维持10%', '恒生电子减仓观察', '贵金属继续避雷']), '无重大风险'],
    ['2026-08-28', '周五', 1, '-0.11%', '9704亿', '中性', JSON.stringify([{name:'AI算力',change:'+1.2%'},{name:'机器人',change:'+0.5%'},{name:'金融科技',change:'-0.8%'}]), JSON.stringify([{name:'寒武纪',change:'+0.8%',status:'趋势稳健'},{name:'埃斯顿',change:'+0.3%',status:'回踩10日线'},{name:'恒生电子',change:'-0.5%',status:'弱势整理'}]), 8, 6, '周五震荡收跌，AI算力和机器人小幅收红，金融科技走弱。涨停8只，跌停6只，赚钱效应中性。周末复盘制定下周计划。', JSON.stringify(['周末复盘，制定下周计划']), '金融科技连续走弱需警惕'],
    ['2026-08-27', '周四', 1, '+0.35%', '8950亿', '中性偏暖', JSON.stringify([{name:'数据要素',change:'+3.5%'},{name:'AI算力',change:'+1.8%'},{name:'机器人',change:'+1.5%'}]), JSON.stringify([{name:'寒武纪',change:'+1.5%',status:'稳步上行'},{name:'埃斯顿',change:'+1.2%',status:'回踩10日线获支撑'},{name:'恒生电子',change:'-0.5%',status:'弱势整理'}]), 9, 5, '数据要素政策刺激爆发纳入替补观察，金池三板块整体健康。沪指+0.35%收涨，成交8950亿。', JSON.stringify(['数据要素纳入替补观察', '机器人持仓不动']), '金融科技连续走弱需警惕'],
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

  // ===== 导入高级模块示例数据 =====
  const sampleDate = '2026-08-28';

  // 全球事件
  const globalEvents = [
    [sampleDate, '美联储主席沃什鹰派讲话', '货币政策', '偏空', '沃什在杰克逊霍尔会议上发表鹰派讲话，暗示降息节奏可能放缓', '压制A股风险偏好，科技成长股承压', '["科技","成长股"]', '美联储官网'],
    [sampleDate, '美委达成石油协议', '大宗商品', '偏空', '美国与委内瑞拉达成石油协议，委原油将重返国际市场', '国际油价承压，石油板块利空', '["石油","石化"]', '路透社'],
    [sampleDate, '霍尔木兹海峡封锁半年', '地缘政治', '偏多', '霍尔木兹海峡封锁持续半年，全球能源供应链紧张', '利好新能源、军工、航运板块', '["新能源","军工","航运"]', '新华社'],
    [sampleDate, '英伟达Q2财报超预期', '科技', '偏多', '英伟达Q2营收和利润均超市场预期，AI芯片需求持续强劲', '利好AI算力、半导体板块，但需警惕利好兑现', '["AI算力","半导体"]', '英伟达财报'],
    [sampleDate, '国内PTFE材料突破', '新材料', '偏多', '国内企业在PTFE材料领域取得技术突破，有望替代进口', '利好氟化工、新材料板块', '["氟化工","新材料"]', '行业媒体']
  ];
  const insertGlobalEvent = db.prepare(`INSERT OR IGNORE INTO global_events (date, title, category, impact, description, market_impact, related_sectors, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => globalEvents.forEach(r => insertGlobalEvent.run(...r)))();
  console.log(`已导入 ${globalEvents.length} 条全球事件记录`);

  // 外围市场
  const globalMarkets = [
    [sampleDate, '美股', '道琼斯', 46247.29, 0.65, 299.97, '380亿', '鹰派讲话后反弹', '中性偏多'],
    [sampleDate, '美股', '纳斯达克', 22484.07, 0.44, 98.5, '520亿', '科技股反弹', '中性'],
    [sampleDate, '美股', '标普500', 6643.70, 0.59, 39.2, '410亿', '整体上涨', '中性偏多'],
    [sampleDate, '亚太', '日经225', 44946.64, -0.90, -408.5, '2.8万亿日元', '日元升值压制出口', '中性'],
    [sampleDate, '亚太', '韩国KOSPI', 2785.60, -0.65, -18.2, '12万亿韩元', '科技股拖累', '利空半导体'],
    [sampleDate, '港股', '恒生指数', 25584.79, 0.07, 19.05, '980亿港元', '震荡收涨', '中性'],
    [sampleDate, '港股', '恒生科技', 4605.15, -0.33, -15.14, '320亿港元', '科技股承压', '利空科技'],
    [sampleDate, '港股', '恒生国企', 8490.39, 0.00, 0.08, '280亿港元', '平收', '中性'],
    [sampleDate, '大宗商品', 'WTI原油', 83.47, 0.04, 0.03, '高', '震荡整理', '中性'],
    [sampleDate, '大宗商品', '布伦特原油', 88.33, 0.06, 0.05, '高', '小幅上涨', '中性'],
    [sampleDate, '大宗商品', 'COMEX黄金', 4503.37, -0.01, -0.45, '高', '高位震荡', '中性'],
    [sampleDate, '大宗商品', 'COMEX白银', 72.85, 0.52, 0.38, '中', '跟随黄金', '中性'],
    [sampleDate, '大宗商品', 'LME铜', 9850.00, -0.60, -59.4, '中', '需求预期走弱', '利空有色']
  ];
  const insertGlobalMarket = db.prepare(`INSERT OR IGNORE INTO global_markets (date, region, index_name, index_value, change_pct, change_abs, volume, description, impact_on_a_share) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => globalMarkets.forEach(r => insertGlobalMarket.run(...r)))();
  console.log(`已导入 ${globalMarkets.length} 条外围市场记录`);

  // 资金监控
  const capitalFlow = [
    [sampleDate, '两融', '两融余额', 18520, 9850, 8670, 0.85, '融资余额连续3日增加'],
    [sampleDate, '两融', '融资买入额', 1250, 1250, 0, 5.20, '今日融资买入活跃'],
    [sampleDate, '两融', '融券余量', 85, 0, 85, -2.10, '融券余量减少'],
    [sampleDate, '北向资金', '沪股通', -35.2, 120.5, 155.7, -15.30, '北向资金净流出'],
    [sampleDate, '北向资金', '深股通', -28.6, 98.3, 126.9, -12.50, '深股通净流出'],
    [sampleDate, '北向资金', '合计', -63.8, 218.8, 282.6, -14.20, '北向资金大幅净流出'],
    [sampleDate, '主力资金', 'AI算力', -48.5, 152.3, 200.8, -18.50, '科技主线退潮，主力大幅流出'],
    [sampleDate, '主力资金', '半导体设备', -32.1, 85.6, 117.7, -22.30, '英伟达利好兑现'],
    [sampleDate, '主力资金', '氟化工', 28.5, 65.3, 36.8, 45.20, '新题材爆发，主力流入'],
    [sampleDate, '主力资金', '黄金', 18.2, 52.6, 34.4, 32.50, '避险资金流入'],
    [sampleDate, '个股', '寒武纪', -8.5, 25.3, 33.8, -25.20, '中军回调'],
    [sampleDate, '个股', '深中华A', 5.2, 18.6, 13.4, 38.80, '连板龙头资金流入']
  ];
  const insertCapitalFlow = db.prepare(`INSERT OR IGNORE INTO capital_flow (date, flow_type, name, net_inflow, inflow, outflow, change_pct, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => capitalFlow.forEach(r => insertCapitalFlow.run(...r)))();
  console.log(`已导入 ${capitalFlow.length} 条资金监控记录`);

  // 连板梯队
  const boardLadder = [
    [sampleDate, 7, '深中华A', '000017', '黄金/有色', 10.05, '18.5亿', '32.5%', 0, 1, '市场最高板，黄金龙头'],
    [sampleDate, 5, '中润资源', '000506', '黄金', 10.02, '12.3亿', '28.6%', 0, 0, '黄金板块龙二'],
    [sampleDate, 4, '巨化股份', '600160', 'PTFE/氟化工', 10.01, '25.6亿', '15.2%', 0, 1, 'PTFE题材龙头'],
    [sampleDate, 4, '三美股份', '603379', '氟化工', 10.00, '15.8亿', '18.5%', 0, 0, '氟化工龙二'],
    [sampleDate, 3, '鸿博股份', '002229', 'AI算力', 10.03, '22.1亿', '25.3%', 0, 0, 'AI连板先锋'],
    [sampleDate, 3, '中大力德', '002896', '机器人', 10.01, '8.5亿', '22.8%', 0, 0, '机器人连板'],
    [sampleDate, 2, '铜牛信息', '300895', 'AI算力', 20.00, '15.2亿', '35.6%', 1, 0, '20cm涨停，AI弹性标的'],
    [sampleDate, 2, '云从科技', '688327', 'AI应用', 20.00, '18.6亿', '28.5%', 1, 0, '20cm涨停，AI应用'],
    [sampleDate, 1, '新时达', '002527', '机器人', 10.02, '6.8亿', '12.5%', 0, 0, '低位首板，补涨'],
    [sampleDate, 1, '浪潮信息', '000977', 'AI算力', 10.01, '35.2亿', '8.5%', 0, 0, '中军首板，放量突破']
  ];
  const insertBoardLadder = db.prepare(`INSERT OR IGNORE INTO board_ladder (date, board_count, stock_name, stock_code, concept, change_pct, volume, turnover_rate, is_20cm, is_new_high, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => boardLadder.forEach(r => insertBoardLadder.run(...r)))();
  console.log(`已导入 ${boardLadder.length} 条连板梯队记录`);

  // 分时回顾
  const intradayReview = [
    [sampleDate, '集合竞价', '09:15', '09:25', 3955.20, 13980.50, 3435.20, '["氟化工","黄金"]', '["半导体","AI算力"]', 'PTFE题材竞价爆发，科技股低开', '竞价成交350亿', '氟化工多股一字涨停，AI算力竞价走弱'],
    [sampleDate, '早盘开盘', '09:30', '10:00', 3948.50, 13920.30, 3410.50, '["氟化工","黄金","农业"]', '["半导体设备","AI算力","消费电子"]', '科技股继续下挫，黄金避险走强', '成交4200亿', '半导体设备领跌，英伟达利好兑现'],
    [sampleDate, '早盘中段', '10:00', '11:00', 3942.80, 13890.20, 3395.80, '["氟化工","网络安全","军工"]', '["半导体","AI","新能源"]', '网络安全板块异动，军工拉升', '成交3800亿', '网络安全受政策刺激拉升'],
    [sampleDate, '午盘收盘', '11:00', '11:30', 3945.20, 13905.60, 3402.30, '["氟化工","黄金","农业"]', '["半导体","AI算力"]', '指数小幅回升，氟化工持续强势', '成交2100亿', '氟化工板块涨停潮'],
    [sampleDate, '午后开盘', '13:00', '14:00', 3950.80, 13935.20, 3415.60, '["氟化工","黄金","军工"]', '["半导体","消费电子"]', '军工板块午后拉升，指数翻红', '成交3500亿', '军工受地缘政治刺激拉升'],
    [sampleDate, '尾盘', '14:00', '15:00', 3952.18, 13953.07, 3424.00, '["氟化工","黄金","农业"]', '["半导体设备","AI算力","科创50"]', '尾盘指数小幅回落，科技股持续弱势', '成交2900亿', '科创50跌近2%，科技主线退潮确认']
  ];
  const insertIntraday = db.prepare(`INSERT OR IGNORE INTO intraday_review (date, time_period, start_time, end_time, sh_index, sz_index, chinext_index, leading_sectors, lagging_sectors, key_events, volume, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => intradayReview.forEach(r => insertIntraday.run(...r)))();
  console.log(`已导入 ${intradayReview.length} 条分时回顾记录`);

  // 预期管理
  const expectationManagement = [
    [sampleDate, '早盘预判', '道指-0.52%，纳指-0.85%', '日经-1.20%，韩股-0.65%', '恒指-0.35%，恒生科技-1.10%', '预计低开0.3-0.5%，科技股承压，关注氟化工新题材', '', '["沃什鹰派讲话","英伟达财报","美委石油协议"]', 45, '市场情绪偏谨慎，科技主线可能退潮，新题材有望接力', ''],
    [sampleDate, '收盘验证', '道指-0.52%，纳指-0.85%', '日经-1.20%，韩股-0.65%', '恒指-0.35%，恒生科技-1.10%', '预计低开0.3-0.5%', '实际低开0.42%，全天震荡，上证-0.11%，创业板-1.41%', '["PTFE题材爆发","科技主线退潮","黄金避险走强"]', 42, '预判基本准确，科技股如期回调，氟化工新题材超预期爆发', '早盘预判低开幅度准确，科技退潮判断正确，但氟化工爆发强度超预期，新题材识别需要加强']
  ];
  const insertExpectation = db.prepare(`INSERT OR IGNORE INTO expectation_management (date, phase, us_market, asia_market, hk_market, a_share_expected, a_share_actual, key_events, sentiment_level, conclusion, verification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => expectationManagement.forEach(r => insertExpectation.run(...r)))();
  console.log(`已导入 ${expectationManagement.length} 条预期管理记录`);

  // 持仓管理
  const portfolioManagement = [
    [sampleDate, '寒武纪', '688256', 'A股', '核心持仓', 500, 235.00, 248.50, 12.43, 0.68, 5.74, 25.0, 'AI算力', '持有', '中军趋势未坏，5日线上方运行，可继续持有'],
    [sampleDate, '埃斯顿', '002747', 'A股', '核心持仓', 3000, 17.80, 18.62, 5.59, 0.25, 4.61, 12.0, '机器人', '持有', '周线连阳，趋势良好，回踩20日线可加仓'],
    [sampleDate, '恒生电子', '600570', 'A股', '核心持仓', 2000, 33.50, 32.15, 6.43, -0.27, -4.03, 13.0, '金融科技', '减仓', '跌破5日线，短期走弱，建议减仓至10%以下'],
    [sampleDate, '深中华A', '000017', 'A股', '短线持仓', 1000, 8.50, 12.85, 1.29, 0.44, 51.18, 3.0, '黄金/有色', '持有', '7连板市场最高标，情绪龙头，不破5日线持有'],
    [sampleDate, '巨化股份', '600160', 'A股', '短线持仓', 1500, 18.20, 22.15, 3.32, 0.59, 21.70, 7.0, 'PTFE/氟化工', '持有', '新题材龙头，4连板，放量突破，可继续持有'],
    [sampleDate, '贵州茅台', '600519', 'A股', '观察持仓', 100, 1680.00, 1625.00, 16.25, -0.55, -3.27, 35.0, '白酒', '减仓', '周黑池板块，趋势走弱，建议清仓回避'],
    [sampleDate, '腾讯控股', '00700', '港股', '核心持仓', 200, 380.00, 395.20, 7.90, 0.30, 4.00, 15.0, '互联网', '持有', '港股科技龙头，估值合理，可长期持有'],
    [sampleDate, '英伟达', 'NVDA', '美股', '观察持仓', 50, 115.00, 128.50, 6.43, 0.68, 11.74, 10.0, 'AI芯片', '持有', '财报超预期，但短期利好兑现，可继续持有观察']
  ];
  const insertPortfolio = db.prepare(`INSERT OR IGNORE INTO portfolio_management (date, stock_name, stock_code, market, position_type, shares, cost_price, current_price, market_value, profit_loss, profit_loss_pct, position_ratio, sector, recommendation, risk_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => portfolioManagement.forEach(r => insertPortfolio.run(...r)))();
  console.log(`已导入 ${portfolioManagement.length} 条持仓管理记录`);

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
