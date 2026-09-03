/**
 * 2026-09-03 今日复盘数据更新脚本
 * 更新9张核心表：daily_reviews, sector_tracking, global_events, board_ladder,
 * global_markets, capital_flow, intraday_review, expectation_management, portfolio_management
 * 
 * 数据来源：东方财富、同花顺、新浪财经、证券时报、新华社等公开数据
 */

const { db } = require('./database');

const DATE = '2026-09-03';
const WEEKDAY = '周四';

console.log('=== 开始更新 2026-09-03 复盘数据 ===\n');

// ===== 1. daily_reviews 每日复盘 =====
function updateDailyReview() {
  const goldPool = JSON.stringify([
    { name: '非银金融', change: '+1.33%' },
    { name: '有色金属', change: '+1.24%' },
    { name: '交通运输', change: '+1.16%' },
    { name: '机械设备', change: '+0.68%' },
    { name: '液冷服务器', change: '概念活跃' }
  ]);

  const zhongjun = JSON.stringify([
    { name: '寒武纪', change: '-0.72%', status: 'AI算力中军回调，缩量整理' },
    { name: '埃斯顿', change: '+1.32%', status: '机器人中军稳健，5日线上方' },
    { name: '恒生电子', change: '-0.92%', status: '金融科技走弱，持续观察' },
    { name: '中国太保', change: '+3.2%', status: '保险中军领涨，负债端稳健' },
    { name: '中远海能', change: '+10%', status: '航运中军涨停，油价催化' }
  ]);

  const actions = JSON.stringify([
    '关注非银金融持续性，证券板块异动',
    '液冷服务器概念反复活跃，可小仓位参与',
    '寒武纪缩量回调，持有观察不破10日线',
    '恒生电子持续走弱，考虑减仓',
    '缩量震荡期控制仓位，避免追高'
  ]);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO daily_reviews 
    (date, weekday, week_id, market_index, market_volume, market_sentiment,
     gold_pool_summary, zhongjun_summary, limit_up_count, limit_down_count,
     conclusion, actions, risk_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    DATE, WEEKDAY, 2,
    '沪指+0.02%报3942.09，深成指+0.10%报13625.12，创业板指+0.01%报3312.54，科创50-0.40%',
    '17589亿',
    '中性偏冷',
    goldPool, zhongjun,
    46, 16,
    '三大指数冲高回落微涨，指数红个股绿格局明显，全市场1846涨3570跌，涨跌中位数-0.68%。两市成交1.76万亿，缩量323亿。非银金融、有色金属、交通运输领涨，液冷服务器、航运、贵金属概念活跃，农业、教育、半导体走弱。国芳集团5连板成市场最高标，集泰股份4连板。主力资金净流出42亿，连续3日净流出。',
    actions,
    '缩量震荡+个股普跌，市场情绪偏冷，需警惕高位股补跌风险；北向资金动向需持续关注'
  );
  console.log('✅ daily_reviews 已更新');
}

// ===== 2. sector_tracking 板块跟踪 =====
function updateSectorTracking() {
  const sectors = [
    // 领涨板块
    { sector_name: '非银金融', industry: '金融', change: 1.33, change_20d: 2.5, limit_up: 2, rank: 1, status: 'active', trend: 'up', score: 82, recommendation: '关注证券板块持续性' },
    { sector_name: '有色金属', industry: '周期', change: 1.24, change_20d: 5.8, limit_up: 3, rank: 2, status: 'active', trend: 'up', score: 78, recommendation: '贵金属强势，关注黄金股' },
    { sector_name: '交通运输', industry: '周期', change: 1.16, change_20d: 3.2, limit_up: 4, rank: 3, status: 'active', trend: 'up', score: 85, recommendation: '航运港口今日最强，可参与' },
    { sector_name: '综合', industry: '综合', change: 0.76, change_20d: 1.1, limit_up: 0, rank: 4, status: 'watch', trend: 'flat', score: 55, recommendation: '观察' },
    { sector_name: '机械设备', industry: '制造', change: 0.68, change_20d: 2.8, limit_up: 5, rank: 5, status: 'active', trend: 'up', score: 72, recommendation: '通用设备涨停潮，关注机器人' },
    // 概念板块
    { sector_name: '液冷服务器', industry: '科技', change: 3.5, change_20d: 8.5, limit_up: 6, rank: 1, status: 'hot', trend: 'up', score: 88, recommendation: '概念反复活跃，龙头集泰股份4连板' },
    { sector_name: '航运港口', industry: '周期', change: 2.8, change_20d: 4.2, limit_up: 4, rank: 2, status: 'hot', trend: 'up', score: 86, recommendation: '油价催化+运价上涨，持续性关注' },
    { sector_name: '贵金属', industry: '周期', change: 2.1, change_20d: 6.5, limit_up: 2, rank: 3, status: 'hot', trend: 'up', score: 80, recommendation: '国际金价创新高，趋势向好' },
    { sector_name: '培育钻石', industry: '消费', change: 1.8, change_20d: 3.5, limit_up: 1, rank: 4, status: 'watch', trend: 'up', score: 65, recommendation: '黄河旋风涨停，观察持续性' },
    // 领跌板块
    { sector_name: '社会服务', industry: '消费', change: -0.89, change_20d: -1.5, limit_up: 0, rank: 28, status: 'avoid', trend: 'down', score: 35, recommendation: '走弱回避' },
    { sector_name: '美容护理', industry: '消费', change: -0.85, change_20d: -2.1, limit_up: 0, rank: 29, status: 'avoid', trend: 'down', score: 32, recommendation: '消费复苏不及预期' },
    { sector_name: '农林牧渔', industry: '周期', change: -0.80, change_20d: -1.2, limit_up: 0, rank: 30, status: 'avoid', trend: 'down', score: 38, recommendation: '厄尔尼诺预期下短期承压' },
    { sector_name: '半导体', industry: '科技', change: -0.65, change_20d: 1.8, limit_up: 0, rank: 25, status: 'watch', trend: 'down', score: 45, recommendation: '主力净流出50亿，短期回避' },
    { sector_name: '通信设备', industry: '科技', change: -0.55, change_20d: 0.8, limit_up: 0, rank: 24, status: 'watch', trend: 'down', score: 42, recommendation: '主力净流出41亿，观望' }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO sector_tracking 
    (sector_name, industry, date, change, change_20d, limit_up, rank, status, trend, score, recommendation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    sectors.forEach(s => stmt.run(s.sector_name, s.industry, DATE, s.change, s.change_20d, s.limit_up, s.rank, s.status, s.trend, s.score, s.recommendation));
  });
  tx();
  console.log(`✅ sector_tracking 已更新 ${sectors.length} 条`);
}

// ===== 3. global_events 全球事件 =====
function updateGlobalEvents() {
  const events = [
    {
      title: '商务部等7部门印发《关于推动商品消费扩容升级的实施意见》',
      category: '政策',
      impact: '偏多',
      description: '《意见》围绕供需协同、因品施策、重点群体等方面提出20条举措，提出到2030年社会消费品零售总额达60万亿元左右',
      market_impact: '利好大消费、零售、免税板块，国芳集团5连板受此催化',
      related_sectors: JSON.stringify(['零售', '免税', '大消费']),
      source: '商务部新闻发布会'
    },
    {
      title: '世界气象组织确认厄尔尼诺现象已形成并将持续增强',
      category: '自然灾害',
      impact: '中性偏空',
      description: '世界气象组织9月3日发布最新通报，确认厄尔尼诺现象已形成并将持续增强，预计将发展为超强级别事件',
      market_impact: '利空农业种植、水产养殖，利好农药、化工板块',
      related_sectors: JSON.stringify(['农业', '农药', '化工']),
      source: '世界气象组织'
    },
    {
      title: '英伟达涨超3%市值站上5.4万亿美元，黄仁勋呼吁G20加快AI应用',
      category: '科技',
      impact: '偏多',
      description: '英伟达9月2日收盘涨3.21%，成交343.91亿美元。CEO黄仁勋在北卡罗来纳州科技活动上呼吁G20成员加快人工智能应用',
      market_impact: '利好AI算力、半导体板块，但A股科技股今日反而走弱，存在背离',
      related_sectors: JSON.stringify(['AI算力', '半导体']),
      source: '新浪财经'
    },
    {
      title: '美伊冲突威胁中东能源出口，国际油价创5周新高',
      category: '地缘政治',
      impact: '偏多',
      description: 'WTI原油涨至92.88美元/桶，布伦特原油涨至97.38美元/桶，均创7月24日以来新高。 renewed U.S.-Iran conflict威胁中东能源出口',
      market_impact: '利好石油石化、航运、煤炭板块，利空航空、物流',
      related_sectors: JSON.stringify(['石油', '航运', '煤炭']),
      source: '财联社'
    },
    {
      title: '日本加息预期升温，日经225大跌2.85%',
      category: '货币政策',
      impact: '偏空',
      description: '日本大幅加息预期升温，日经225指数9月3日大跌2.85%，盘中最低63911点，美元/日元维持158-159区间',
      market_impact: '亚太市场波动加剧，日韩股市午后跳水，对A股科技成长股形成一定压制',
      related_sectors: JSON.stringify(['科技', '出口']),
      source: '东方财富'
    }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO global_events 
    (date, title, category, impact, description, market_impact, related_sectors, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    events.forEach(e => stmt.run(DATE, e.title, e.category, e.impact, e.description, e.market_impact, e.related_sectors, e.source));
  });
  tx();
  console.log(`✅ global_events 已更新 ${events.length} 条`);
}

// ===== 4. board_ladder 连板梯队 =====
function updateBoardLadder() {
  const ladders = [
    // 高标连板
    { board_count: 5, stock_name: '国芳集团', stock_code: '601086', concept: '零售消费/参股券商', change_pct: 10.00, volume: '8.5亿', turnover_rate: '18.2%', is_20cm: 0, is_new_high: 1, note: '市场最高板，消费扩容政策催化，放量T字板' },
    { board_count: 4, stock_name: '集泰股份', stock_code: '002909', concept: '液冷硅油/PCB三防漆', change_pct: 10.01, volume: '6.2亿', turnover_rate: '15.8%', is_20cm: 0, is_new_high: 1, note: '液冷方向龙头，09:25最早封板' },
    { board_count: 2, stock_name: '金帝股份', stock_code: '603270', concept: '液冷+机器人', change_pct: 10.02, volume: '5.8亿', turnover_rate: '12.5%', is_20cm: 0, is_new_high: 0, note: '4天3板，液冷+机器人双概念' },
    // 首板
    { board_count: 1, stock_name: '海通发展', stock_code: '603162', concept: '航运港口', change_pct: 10.01, volume: '4.2亿', turnover_rate: '8.5%', is_20cm: 0, is_new_high: 0, note: '航运板块龙头，油价催化' },
    { board_count: 1, stock_name: '国盛证券', stock_code: '002670', concept: '证券/非银金融', change_pct: 10.03, volume: '12.8亿', turnover_rate: '6.2%', is_20cm: 0, is_new_high: 0, note: '证券板块异动龙头' },
    { board_count: 1, stock_name: '白银有色', stock_code: '601212', concept: '有色金属/贵金属', change_pct: 10.06, volume: '15.6亿', turnover_rate: '9.8%', is_20cm: 0, is_new_high: 0, note: '贵金属板块龙头，国际金价创新高' },
    { board_count: 1, stock_name: '鸣志电器', stock_code: '603728', concept: '人形机器人', change_pct: 10.01, volume: '7.8亿', turnover_rate: '11.2%', is_20cm: 0, is_new_high: 0, note: '机器人概念龙头之一' },
    { board_count: 1, stock_name: '千金药业', stock_code: '600479', concept: '医药/中药', change_pct: 10.03, volume: '16.3亿', turnover_rate: '29.7%', is_20cm: 0, is_new_high: 0, note: '医药股异动，主力净流入1.67亿' },
    { board_count: 1, stock_name: '黄河旋风', stock_code: '600172', concept: '培育钻石', change_pct: 10.04, volume: '5.2亿', turnover_rate: '7.5%', is_20cm: 0, is_new_high: 0, note: '培育钻石概念走高' },
    { board_count: 1, stock_name: '思泉新材', stock_code: '301489', concept: '液冷服务器', change_pct: 20.00, volume: '8.2亿', turnover_rate: '22.5%', is_20cm: 1, is_new_high: 0, note: '20cm涨停，液冷散热材料' },
    { board_count: 1, stock_name: '华源控股', stock_code: '002787', concept: '包装印刷/液冷', change_pct: 10.02, volume: '3.5亿', turnover_rate: '10.5%', is_20cm: 0, is_new_high: 0, note: '午后包装印刷板块走强' },
    { board_count: 1, stock_name: '巨轮智能', stock_code: '002031', concept: '机器人', change_pct: 10.01, volume: '6.8亿', turnover_rate: '8.8%', is_20cm: 0, is_new_high: 0, note: '机器人概念震荡走强' }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO board_ladder 
    (date, board_count, stock_name, stock_code, concept, change_pct, volume, turnover_rate, is_20cm, is_new_high, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    ladders.forEach(l => stmt.run(DATE, l.board_count, l.stock_name, l.stock_code, l.concept, l.change_pct, l.volume, l.turnover_rate, l.is_20cm, l.is_new_high, l.note));
  });
  tx();
  console.log(`✅ board_ladder 已更新 ${ladders.length} 条`);
}

// ===== 5. global_markets 外围市场 =====
function updateGlobalMarkets() {
  const markets = [
    // 美股（9月2日收盘，北京时间9月3日凌晨）
    { region: '美股', index_name: '道琼斯', index_value: 53061.95, change_pct: 0.56, change_abs: 295.07, volume: '4.15亿股', description: '鹰派担忧缓解，尾盘拉升收涨', impact_on_a_share: '中性偏多' },
    { region: '美股', index_name: '纳斯达克', index_value: 26217.83, change_pct: 0.45, change_abs: 118.05, volume: '58.16亿股', description: '科技股反弹，英伟达涨超3%', impact_on_a_share: '中性' },
    { region: '美股', index_name: '标普500', index_value: 7666.60, change_pct: 0.46, change_abs: 35.13, volume: '正常', description: '11个板块中10个收涨，材料和通信服务领涨', impact_on_a_share: '中性偏多' },
    // 亚太（9月3日）
    { region: '亚太', index_name: '日经225', index_value: 64325.64, change_pct: -2.85, change_abs: -1885.5, volume: '高', description: '日本加息预期升温，大幅收跌，盘中最低63911点', impact_on_a_share: '偏空' },
    { region: '亚太', index_name: '韩国KOSPI', index_value: 6579.48, change_pct: 0.26, change_abs: 17.1, volume: '中', description: '高开后午后跳水，尾盘回升收涨，SK海力士跌超2%', impact_on_a_share: '中性' },
    // 港股（9月3日）
    { region: '港股', index_name: '恒生指数', index_value: 25213.31, change_pct: -0.39, change_abs: -97.90, volume: '1993.82亿港元', description: '科网股普跌，内房股逆势活跃', impact_on_a_share: '中性偏空' },
    { region: '港股', index_name: '恒生科技', index_value: 4468.48, change_pct: -1.08, change_abs: -48.68, volume: '320亿港元', description: '科技资产受全球利率与风险偏好双重牵制', impact_on_a_share: '偏空科技' },
    { region: '港股', index_name: '恒生国企', index_value: 8385.24, change_pct: -0.77, change_abs: -64.86, volume: '280亿港元', description: '国企指数跟随下跌', impact_on_a_share: '中性' },
    // 大宗商品（9月2日收盘）
    { region: '大宗商品', index_name: 'WTI原油', index_value: 90.63, change_pct: 0.45, change_abs: 0.41, volume: '高', description: '美伊冲突威胁中东能源出口，9月3日盘中涨至92.88美元创5周新高', impact_on_a_share: '利好石油石化' },
    { region: '大宗商品', index_name: '布伦特原油', index_value: 95.32, change_pct: 0.71, change_abs: 0.67, volume: '高', description: '9月3日盘中触及97美元，创7月24日以来新高', impact_on_a_share: '利好航运、煤炭' },
    { region: '大宗商品', index_name: 'COMEX黄金', index_value: 4434.30, change_pct: 0.86, change_abs: 37.8, volume: '高', description: '美元走弱+避险需求，伦敦金现9月3日涨至4483美元', impact_on_a_share: '利好贵金属' },
    { region: '大宗商品', index_name: 'COMEX白银', index_value: 65.93, change_pct: 0.86, change_abs: 0.56, volume: '中', description: '跟随黄金上涨', impact_on_a_share: '利好白银股' },
    { region: '大宗商品', index_name: 'LME铜', index_value: 9780.00, change_pct: -0.45, change_abs: -44.2, volume: '中', description: '需求预期走弱，高位震荡', impact_on_a_share: '利空有色铜' }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO global_markets 
    (date, region, index_name, index_value, change_pct, change_abs, volume, description, impact_on_a_share)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    markets.forEach(m => stmt.run(DATE, m.region, m.index_name, m.index_value, m.change_pct, m.change_abs, m.volume, m.description, m.impact_on_a_share));
  });
  tx();
  console.log(`✅ global_markets 已更新 ${markets.length} 条`);
}

// ===== 6. capital_flow 资金监控 =====
function updateCapitalFlow() {
  const flows = [
    // 两融（截至9月2日数据）
    { flow_type: '两融', name: '两融余额', net_inflow: -55.32, inflow: 0, outflow: 55.32, change_pct: -0.21, description: '截至9月2日余额26609.90亿，较前日减少55.32亿' },
    { flow_type: '两融', name: '融资余额', net_inflow: -53.54, inflow: 0, outflow: 53.54, change_pct: -0.20, description: '融资余额26315.61亿，结束连续5日净流入' },
    { flow_type: '两融', name: '融资买入额', net_inflow: 1499, inflow: 1499, outflow: 0, change_pct: -14.6, description: '9月2日融资买入1499亿，较前日1755亿减少' },
    { flow_type: '两融', name: '融券余额', net_inflow: -1.78, inflow: 0, outflow: 1.78, change_pct: -0.60, description: '融券余额294.29亿，小幅减少' },
    // 北向资金（9月3日估算，基于早盘数据+全天成交）
    { flow_type: '北向资金', name: '沪股通', net_inflow: -5.0, inflow: 665.0, outflow: 670.0, change_pct: -0.75, description: '早盘净流出29.12亿，午后回流，全天小幅净流出' },
    { flow_type: '北向资金', name: '深股通', net_inflow: -6.0, inflow: 543.0, outflow: 549.0, change_pct: -1.10, description: '早盘净流出7.27亿，全天净流出6亿' },
    { flow_type: '北向资金', name: '合计', net_inflow: -11.0, inflow: 1208.0, outflow: 1219.0, change_pct: -0.90, description: '全天成交2427.43亿，占两市13.80%，小幅净流出' },
    // 主力资金（9月3日）
    { flow_type: '主力资金', name: '全市场合计', net_inflow: -42.06, inflow: 0, outflow: 42.06, change_pct: 0, description: '连续3个交易日净流出，创业板净流出30.52亿' },
    { flow_type: '主力资金', name: '通用设备', net_inflow: 18.6, inflow: 85.2, outflow: 66.6, change_pct: 28.0, description: '机械板块涨停潮，主力大幅流入' },
    { flow_type: '主力资金', name: '证券', net_inflow: 16.2, inflow: 72.5, outflow: 56.3, change_pct: 28.8, description: '证券板块异动，国盛证券涨停' },
    { flow_type: '主力资金', name: '航运港口', net_inflow: 9.1, inflow: 45.8, outflow: 36.7, change_pct: 24.8, description: '油价催化，航运板块全天强势' },
    { flow_type: '主力资金', name: '保险', net_inflow: 9.0, inflow: 38.5, outflow: 29.5, change_pct: 30.5, description: '保险板块走强，中国太保涨超3%' },
    { flow_type: '主力资金', name: '半导体', net_inflow: -50.3, inflow: 120.5, outflow: 170.8, change_pct: -29.4, description: '科技主线退潮，主力大幅流出' },
    { flow_type: '主力资金', name: '通信设备', net_inflow: -41.0, inflow: 85.6, outflow: 126.6, change_pct: -32.4, description: '通信板块持续走弱' },
    // 个股资金
    { flow_type: '个股', name: '寒武纪', net_inflow: -3.5, inflow: 25.3, outflow: 28.8, change_pct: -12.1, description: 'AI中军缩量回调，资金小幅流出' },
    { flow_type: '个股', name: '贵州茅台', net_inflow: 0.89, inflow: 12.5, outflow: 11.61, change_pct: 7.7, description: '白酒龙头主力净流入8944万，逆势走强' },
    { flow_type: '个股', name: '国芳集团', net_inflow: 2.8, inflow: 6.5, outflow: 3.7, change_pct: 75.7, description: '5连板市场最高标，资金持续流入' },
    { flow_type: '个股', name: '千金药业', net_inflow: 1.67, inflow: 9.8, outflow: 8.13, change_pct: 20.5, description: '医药异动股，主力净流入1.67亿占总成交10.2%' }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO capital_flow 
    (date, flow_type, name, net_inflow, inflow, outflow, change_pct, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    flows.forEach(f => stmt.run(DATE, f.flow_type, f.name, f.net_inflow, f.inflow, f.outflow, f.change_pct, f.description));
  });
  tx();
  console.log(`✅ capital_flow 已更新 ${flows.length} 条`);
}

// ===== 7. intraday_review 分时回顾 =====
function updateIntradayReview() {
  const reviews = [
    {
      time_period: '集合竞价', start_time: '09:15', end_time: '09:25',
      sh_index: 3950.50, sz_index: 13650.20, chinext_index: 3320.50,
      leading_sectors: JSON.stringify(['航运港口', '贵金属', '保险']),
      lagging_sectors: JSON.stringify(['半导体', '农业', '教育']),
      key_events: '三大指数高开，航运港口竞价强势，消费股受政策刺激高开',
      volume: '竞价成交420亿',
      description: '沪指高开0.23%，航运、保险板块竞价领涨，国芳集团竞价涨停封5板'
    },
    {
      time_period: '早盘开盘', start_time: '09:30', end_time: '10:00',
      sh_index: 3958.19, sz_index: 13664.14, chinext_index: 3326.42,
      leading_sectors: JSON.stringify(['保险', '航运港口', '贵金属', '培育钻石']),
      lagging_sectors: JSON.stringify(['半导体', '农林牧渔', '教育']),
      key_events: '保险股集体拉升，中国太保涨超3%；培育钻石概念飙升',
      volume: '成交4800亿',
      description: '早盘指数冲高，沪指涨0.43%，保险、航运、贵金属领涨，半导体走弱'
    },
    {
      time_period: '早盘中段', start_time: '10:00', end_time: '11:00',
      sh_index: 3952.30, sz_index: 13640.50, chinext_index: 3318.20,
      leading_sectors: JSON.stringify(['液冷服务器', '航运', '有色金属']),
      lagging_sectors: JSON.stringify(['半导体', '通信设备', '消费电子']),
      key_events: '液冷服务器概念拉升，集泰股份4连板，金帝股份涨停；日韩股市跳水',
      volume: '成交4200亿',
      description: '指数冲高回落，液冷概念反复活跃，日韩股市午后跳水引发避险情绪'
    },
    {
      time_period: '午盘收盘', start_time: '11:00', end_time: '11:30',
      sh_index: 3948.60, sz_index: 13630.80, chinext_index: 3315.50,
      leading_sectors: JSON.stringify(['航运', '有色金属', '液冷服务器']),
      lagging_sectors: JSON.stringify(['半导体', '农业', '社会服务']),
      key_events: '指数维持窄幅震荡，上涨个股不足2000只',
      volume: '成交2300亿',
      description: '午盘沪指涨0.18%，个股跌多涨少，涨跌中位数约-0.5%'
    },
    {
      time_period: '午后开盘', start_time: '13:00', end_time: '14:00',
      sh_index: 3940.20, sz_index: 13615.30, chinext_index: 3308.80,
      leading_sectors: JSON.stringify(['包装印刷', '液冷服务器', '证券']),
      lagging_sectors: JSON.stringify(['半导体', '科创50', '通信设备']),
      key_events: '三大指数全部翻绿，科创50跌超1%；包装印刷板块午后走强',
      volume: '成交3500亿',
      description: '午后指数跳水翻绿，科创50跌幅扩大，证券板块异动拉升护盘'
    },
    {
      time_period: '尾盘', start_time: '14:00', end_time: '15:00',
      sh_index: 3942.09, sz_index: 13625.12, chinext_index: 3312.54,
      leading_sectors: JSON.stringify(['非银金融', '有色金属', '航运']),
      lagging_sectors: JSON.stringify(['半导体', '农业', '教育']),
      key_events: '尾盘指数回升翻红，沪指微涨0.02%，全市场3570只个股下跌',
      volume: '成交2800亿',
      description: '尾盘指数小幅回升收红，但个股普跌格局未改，缩量十字星'
    }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO intraday_review 
    (date, time_period, start_time, end_time, sh_index, sz_index, chinext_index, leading_sectors, lagging_sectors, key_events, volume, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    reviews.forEach(r => stmt.run(DATE, r.time_period, r.start_time, r.end_time, r.sh_index, r.sz_index, r.chinext_index, r.leading_sectors, r.lagging_sectors, r.key_events, r.volume, r.description));
  });
  tx();
  console.log(`✅ intraday_review 已更新 ${reviews.length} 条`);
}

// ===== 8. expectation_management 预期管理 =====
function updateExpectationManagement() {
  const expectations = [
    {
      phase: '早盘预判',
      us_market: '道指+0.56%，纳指+0.45%，标普+0.46%，英伟达涨超3%',
      asia_market: '日经高开0.62%，韩股高开1.33%',
      hk_market: '恒指预计高开，恒生科技或跟随美股',
      a_share_expected: '预计高开0.2-0.4%，关注消费政策催化和液冷概念持续性，科技股或有反弹',
      a_share_actual: '',
      key_events: JSON.stringify(['商务部消费扩容政策', '英伟达财报后上涨', '美伊冲突油价上涨']),
      sentiment_level: 55,
      conclusion: '外围市场偏暖，消费政策利好，预计市场情绪中性偏暖，关注高位股分歧',
      verification: ''
    },
    {
      phase: '收盘验证',
      us_market: '道指+0.56%，纳指+0.45%，标普+0.46%',
      asia_market: '日经-2.85%（加息预期大跌），韩股+0.26%（午后跳水后回升）',
      hk_market: '恒指-0.39%，恒生科技-1.08%，科网股普跌',
      a_share_expected: '预计高开0.2-0.4%，科技股或有反弹',
      a_share_actual: '实际高开0.23%，全天冲高回落，沪指+0.02%，创业板+0.01%，科创50-0.40%，科技股未反弹反而走弱',
      key_events: JSON.stringify(['日经大跌2.85%超预期', '液冷概念反复活跃', '航运港口全天强势', '消费政策催化国芳5连板']),
      sentiment_level: 42,
      conclusion: '预判方向基本正确（高开），但科技股反弹判断错误，日经大跌超预期压制亚太情绪。指数红个股绿，市场实际情绪偏冷',
      verification: '高开幅度预判准确；科技股反弹预判错误，半导体主力净流出50亿；液冷和航运超预期强势；日经大跌2.85%是最大意外因素'
    }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO expectation_management 
    (date, phase, us_market, asia_market, hk_market, a_share_expected, a_share_actual, key_events, sentiment_level, conclusion, verification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    expectations.forEach(e => stmt.run(DATE, e.phase, e.us_market, e.asia_market, e.hk_market, e.a_share_expected, e.a_share_actual, e.key_events, e.sentiment_level, e.conclusion, e.verification));
  });
  tx();
  console.log(`✅ expectation_management 已更新 ${expectations.length} 条`);
}

// ===== 9. portfolio_management 持仓管理 =====
function updatePortfolioManagement() {
  // 计算持仓数据：市值=股数×现价，盈亏=(现价-成本)×股数，盈亏%=(现价-成本)/成本×100%
  const positions = [
    {
      stock_name: '寒武纪', stock_code: '688256', market: 'A股', position_type: '核心持仓',
      shares: 500, cost_price: 235.00, current_price: 1099.99,
      sector: 'AI算力', recommendation: '持有', risk_note: '缩量回调，10日线上方运行，趋势未坏可继续持有；科技板块整体走弱需警惕'
    },
    {
      stock_name: '埃斯顿', stock_code: '002747', market: 'A股', position_type: '核心持仓',
      shares: 3000, cost_price: 17.80, current_price: 30.81,
      sector: '机器人', recommendation: '持有', risk_note: '机器人概念今日活跃，+1.32%稳健收涨，5日线上方，趋势良好'
    },
    {
      stock_name: '恒生电子', stock_code: '600570', market: 'A股', position_type: '核心持仓',
      shares: 2000, cost_price: 33.50, current_price: 21.50,
      sector: '金融科技', recommendation: '减仓', risk_note: '持续走弱-0.92%，跌破多条均线，建议减仓至5%以下'
    },
    {
      stock_name: '深中华A', stock_code: '000017', market: 'A股', position_type: '短线持仓',
      shares: 1000, cost_price: 8.50, current_price: 12.10,
      sector: '黄金/有色', recommendation: '减仓', risk_note: '前期7连板后断板回调，今日黄金板块强势但个股未跟涨，建议止盈减仓'
    },
    {
      stock_name: '巨化股份', stock_code: '600160', market: 'A股', position_type: '短线持仓',
      shares: 1500, cost_price: 18.20, current_price: 22.50,
      sector: 'PTFE/氟化工', recommendation: '持有', risk_note: '液冷概念活跃，氟化工相关，小幅收涨，可继续持有观察'
    },
    {
      stock_name: '贵州茅台', stock_code: '600519', market: 'A股', position_type: '观察持仓',
      shares: 100, cost_price: 1680.00, current_price: 1298.88,
      sector: '白酒', recommendation: '持有', risk_note: '逆势收涨+0.11%，主力净流入8944万，消费政策利好，可持有观察'
    },
    {
      stock_name: '腾讯控股', stock_code: '00700', market: '港股', position_type: '核心持仓',
      shares: 200, cost_price: 380.00, current_price: 434.00,
      sector: '互联网', recommendation: '持有', risk_note: '港股科技股普跌，腾讯小幅走弱，长期估值合理可持有'
    },
    {
      stock_name: '英伟达', stock_code: 'NVDA', market: '美股', position_type: '观察持仓',
      shares: 50, cost_price: 115.00, current_price: 132.62,
      sector: 'AI芯片', recommendation: '持有', risk_note: '9月2日涨3.21%，市值5.4万亿，黄仁勋喊话AI，趋势向好可持有'
    }
  ];

  // 计算总市值（统一折算为人民币：港元×0.92，美元×7.1）
  const totalValue = positions.reduce((sum, p) => {
    let mv = p.shares * p.current_price;
    if (p.market === '港股') mv *= 0.92;
    if (p.market === '美股') mv *= 7.1;
    return sum + mv;
  }, 0);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO portfolio_management 
    (date, stock_name, stock_code, market, position_type, shares, cost_price, current_price,
     market_value, profit_loss, profit_loss_pct, position_ratio, sector, recommendation, risk_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    positions.forEach(p => {
      const market_value = p.shares * p.current_price;
      const profit_loss = (p.current_price - p.cost_price) * p.shares;
      const profit_loss_pct = ((p.current_price - p.cost_price) / p.cost_price) * 100;
      
      // 计算仓位比例（折算后）
      let mv_cny = market_value;
      if (p.market === '港股') mv_cny *= 0.92;
      if (p.market === '美股') mv_cny *= 7.1;
      const position_ratio = parseFloat(((mv_cny / totalValue) * 100).toFixed(2));

      stmt.run(DATE, p.stock_name, p.stock_code, p.market, p.position_type, p.shares, p.cost_price, p.current_price,
        parseFloat(market_value.toFixed(2)), parseFloat(profit_loss.toFixed(2)), parseFloat(profit_loss_pct.toFixed(2)),
        position_ratio, p.sector, p.recommendation, p.risk_note);
    });
  });
  tx();
  console.log(`✅ portfolio_management 已更新 ${positions.length} 条，总市值约 ${(totalValue/10000).toFixed(2)} 万`);
}

// ===== 执行所有更新 =====
try {
  updateDailyReview();
  updateSectorTracking();
  updateGlobalEvents();
  updateBoardLadder();
  updateGlobalMarkets();
  updateCapitalFlow();
  updateIntradayReview();
  updateExpectationManagement();
  updatePortfolioManagement();
  
  console.log('\n=== 所有数据更新完成！===');
  console.log(`日期: ${DATE} (${WEEKDAY})`);
} catch (err) {
  console.error('❌ 更新失败:', err.message);
  process.exit(1);
}
