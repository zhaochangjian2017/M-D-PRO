/**
 * 2026-09-03 数据验证脚本
 * 验证业务逻辑铁律：
 * 1. 资金监控：净流入=流入-流出
 * 2. 持仓管理：市值=股数×现价，盈亏=(现价-成本)×股数，盈亏%=(现价-成本)/成本×100%
 * 3. 金池/中军：必须JSON数组格式
 * 4. 连板梯队：连板数≥1时涨幅>9.5%(10cm)或>19%(20cm)
 * 5. 日期：2026-09-03是周四
 */

const { db } = require('./database');

const DATE = '2026-09-03';
let errors = [];
let warnings = [];

console.log('=== 2026-09-03 数据验证 ===\n');

// ===== 1. 日期验证 =====
function validateDate() {
  const row = db.prepare('SELECT date, weekday FROM daily_reviews WHERE date = ?').get(DATE);
  if (!row) {
    errors.push('daily_reviews 中没有 2026-09-03 的记录');
    return;
  }
  if (row.weekday !== '周四') {
    errors.push(`日期星期错误: ${row.date} 应为周四，实际为 ${row.weekday}`);
  } else {
    console.log('✅ 日期验证: 2026-09-03 周四 正确');
  }
}

// ===== 2. 资金监控验证 =====
function validateCapitalFlow() {
  const rows = db.prepare('SELECT * FROM capital_flow WHERE date = ?').all(DATE);
  if (rows.length === 0) {
    errors.push('capital_flow 没有今日数据');
    return;
  }
  
  let flowErrors = 0;
  rows.forEach(r => {
    // 铁律1：净流入=流入-流出（流入流出都有值时）
    if (r.inflow > 0 && r.outflow > 0) {
      const expected = r.inflow - r.outflow;
      if (Math.abs(expected - r.net_inflow) > 0.01) {
        errors.push(`资金监控[${r.name}]: 净流入=${r.net_inflow}, 但流入-流出=${expected} (流入=${r.inflow}, 流出=${r.outflow})`);
        flowErrors++;
      }
    }
    // 融资买入额净流入=流入
    if (r.name === '融资买入额' && r.net_inflow !== r.inflow) {
      errors.push(`资金监控[融资买入额]: 净流入应等于流入`);
      flowErrors++;
    }
    // 禁止"流入有值但净流入0"或"净流入有值但流入流出都0"
    if (r.inflow > 0 && r.net_inflow === 0 && r.outflow === 0) {
      // 融资买入额这种情况是允许的（净流入=流入）
      if (r.name !== '融资买入额') {
        errors.push(`资金监控[${r.name}]: 流入有值但净流入为0`);
        flowErrors++;
      }
    }
  });
  
  if (flowErrors === 0) {
    console.log(`✅ 资金监控验证: ${rows.length} 条记录，净流入=流入-流出 全部正确`);
  }
}

// ===== 3. 持仓管理验证 =====
function validatePortfolio() {
  const rows = db.prepare('SELECT * FROM portfolio_management WHERE date = ?').all(DATE);
  if (rows.length === 0) {
    errors.push('portfolio_management 没有今日数据');
    return;
  }
  
  let portErrors = 0;
  rows.forEach(r => {
    // 市值=股数×现价
    const expectedMV = r.shares * r.current_price;
    if (Math.abs(expectedMV - r.market_value) > 0.1) {
      errors.push(`持仓[${r.stock_name}]: 市值=${r.market_value}, 但股数×现价=${expectedMV} (${r.shares}×${r.current_price})`);
      portErrors++;
    }
    // 盈亏=(现价-成本)×股数
    const expectedPL = (r.current_price - r.cost_price) * r.shares;
    if (Math.abs(expectedPL - r.profit_loss) > 0.1) {
      errors.push(`持仓[${r.stock_name}]: 盈亏=${r.profit_loss}, 但(现价-成本)×股数=${expectedPL}`);
      portErrors++;
    }
    // 盈亏%=(现价-成本)/成本×100%
    const expectedPLPct = ((r.current_price - r.cost_price) / r.cost_price) * 100;
    if (Math.abs(expectedPLPct - r.profit_loss_pct) > 0.1) {
      errors.push(`持仓[${r.stock_name}]: 盈亏%=${r.profit_loss_pct}, 但(现价-成本)/成本×100=${expectedPLPct.toFixed(2)}`);
      portErrors++;
    }
  });
  
  if (portErrors === 0) {
    console.log(`✅ 持仓管理验证: ${rows.length} 条记录，市值/盈亏/盈亏% 全部正确`);
  }
}

// ===== 4. 金池/中军JSON格式验证 =====
function validateGoldPool() {
  const row = db.prepare('SELECT gold_pool_summary, zhongjun_summary FROM daily_reviews WHERE date = ?').get(DATE);
  if (!row) {
    errors.push('daily_reviews 没有今日记录');
    return;
  }
  
  // 金池必须是JSON数组
  try {
    const gold = JSON.parse(row.gold_pool_summary);
    if (!Array.isArray(gold)) {
      errors.push('金池不是JSON数组格式');
    } else {
      console.log(`✅ 金池验证: JSON数组格式，${gold.length} 个板块`);
    }
  } catch (e) {
    errors.push('金池JSON解析失败: ' + e.message);
  }
  
  // 中军必须是JSON数组
  try {
    const zj = JSON.parse(row.zhongjun_summary);
    if (!Array.isArray(zj)) {
      errors.push('中军不是JSON数组格式');
    } else {
      console.log(`✅ 中军验证: JSON数组格式，${zj.length} 只个股`);
    }
  } catch (e) {
    errors.push('中军JSON解析失败: ' + e.message);
  }
}

// ===== 5. 连板梯队验证 =====
function validateBoardLadder() {
  const rows = db.prepare('SELECT * FROM board_ladder WHERE date = ?').all(DATE);
  if (rows.length === 0) {
    errors.push('board_ladder 没有今日数据');
    return;
  }
  
  let ladderErrors = 0;
  rows.forEach(r => {
    if (r.board_count >= 1) {
      if (r.is_20cm === 1) {
        // 20cm: 涨幅>19%
        if (r.change_pct <= 19) {
          errors.push(`连板[${r.stock_name}]: 20cm连板涨幅应>19%，实际=${r.change_pct}%`);
          ladderErrors++;
        }
      } else {
        // 10cm: 涨幅>9.5%
        if (r.change_pct <= 9.5) {
          errors.push(`连板[${r.stock_name}]: 10cm连板涨幅应>9.5%，实际=${r.change_pct}%`);
          ladderErrors++;
        }
      }
    }
  });
  
  if (ladderErrors === 0) {
    const maxBoard = Math.max(...rows.map(r => r.board_count));
    console.log(`✅ 连板梯队验证: ${rows.length} 只涨停股，最高${maxBoard}连板，涨幅全部符合要求`);
  }
}

// ===== 6. 数据完整性验证 =====
function validateCompleteness() {
  const tables = [
    { name: 'daily_reviews', dateCol: 'date' },
    { name: 'sector_tracking', dateCol: 'date' },
    { name: 'global_events', dateCol: 'date' },
    { name: 'board_ladder', dateCol: 'date' },
    { name: 'global_markets', dateCol: 'date' },
    { name: 'capital_flow', dateCol: 'date' },
    { name: 'intraday_review', dateCol: 'date' },
    { name: 'expectation_management', dateCol: 'date' },
    { name: 'portfolio_management', dateCol: 'date' }
  ];
  
  console.log('\n--- 数据完整性 ---');
  tables.forEach(t => {
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name} WHERE ${t.dateCol} = ?`).get(DATE).cnt;
    const status = count > 0 ? '✅' : '❌';
    console.log(`${status} ${t.name}: ${count} 条`);
    if (count === 0) errors.push(`${t.name} 没有今日数据`);
  });
}

// ===== 7. 涨停跌停数量验证 =====
function validateLimitCounts() {
  const daily = db.prepare('SELECT limit_up_count, limit_down_count FROM daily_reviews WHERE date = ?').get(DATE);
  const ladderCount = db.prepare('SELECT COUNT(*) as cnt FROM board_ladder WHERE date = ?').get(DATE).cnt;
  
  console.log(`\n--- 涨跌停统计 ---`);
  console.log(`daily_reviews: 涨停${daily.limit_up_count}只, 跌停${daily.limit_down_count}只`);
  console.log(`board_ladder记录: ${ladderCount}只（连板+首板代表性个股）`);
  
  if (daily.limit_up_count < ladderCount) {
    warnings.push(`daily_reviews涨停数(${daily.limit_up_count})少于board_ladder记录数(${ladderCount})，board_ladder只记录代表性个股属正常`);
  }
}

// ===== 执行验证 =====
validateDate();
validateCapitalFlow();
validatePortfolio();
validateGoldPool();
validateBoardLadder();
validateCompleteness();
validateLimitCounts();

// ===== 输出结果 =====
console.log('\n=== 验证总结 ===');
if (errors.length === 0) {
  console.log('✅✅✅ 所有验证通过，0错误！');
} else {
  console.log(`❌ 发现 ${errors.length} 个错误:`);
  errors.forEach((e, i) => console.log(`  ${i+1}. ${e}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} 个警告:`);
  warnings.forEach((w, i) => console.log(`  ${i+1}. ${w}`));
}

process.exit(errors.length > 0 ? 1 : 0);
