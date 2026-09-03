/**
 * M-D Pro 后端服务器
 * 周+日滚动复盘体系 - 全栈应用
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase, importSampleData, db } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务 - 前端应用
app.use(express.static(path.join(__dirname, 'public')));

// 初始化数据库
initDatabase();
importSampleData();

// ===== API 路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v2.4.0',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// 周度复盘 API
app.use('/api/weekly', require('./routes/weekly'));

// 每日复盘 API
app.use('/api/daily', require('./routes/daily'));

// 板块跟踪 API
app.use('/api/sectors', require('./routes/sectors'));

// 龙头股 API
app.use('/api/leaders', require('./routes/leaders'));

// 个股选择 API
app.use('/api/stocks', require('./routes/stocks'));

// 执行清单 API
app.use('/api/checklist', require('./routes/checklist'));

// 应用配置 API
app.use('/api/config', require('./routes/config'));

// 高级模块 API（全球事件、外围市场、资金监控、连板梯队、分时回顾、预期管理、持仓管理）
app.use('/api/advanced', require('./routes/advanced'));

// 实时行情 API（新浪财经数据源）
app.use('/api/market', require('./routes/market'));

// 数据导出 API
app.get('/api/export', (req, res) => {
  try {
    const data = {
      exportTime: new Date().toISOString(),
      version: 'v2.4.0',
      weekly_reviews: db.prepare('SELECT * FROM weekly_reviews ORDER BY year DESC, week_number DESC').all(),
      daily_reviews: db.prepare('SELECT * FROM daily_reviews ORDER BY date DESC').all(),
      sector_tracking: db.prepare('SELECT * FROM sector_tracking ORDER BY date DESC, sector_name').all(),
      leader_stocks: db.prepare('SELECT * FROM leader_stocks ORDER BY date DESC, sector, rank').all(),
      stock_picks: db.prepare('SELECT * FROM stock_picks ORDER BY date DESC, type').all(),
      checklist_items: db.prepare('SELECT * FROM checklist_items ORDER BY date DESC, sort_order').all(),
      app_config: db.prepare('SELECT * FROM app_config WHERE id = 1').get()
    };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '导出失败', detail: err.message });
  }
});

// 数据导入 API
app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    let imported = 0;

    // 导入周度复盘
    if (data.weekly_reviews && Array.isArray(data.weekly_reviews)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO weekly_reviews 
        (id, week_number, year, start_date, end_date, gold_pool, black_pool, zhongjun, timeline, conclusion, created_at, updated_at)
        VALUES (@id, @week_number, @year, @start_date, @end_date, @gold_pool, @black_pool, @zhongjun, @timeline, @conclusion, @created_at, datetime('now', 'localtime'))
      `);
      const tx = db.transaction(() => {
        data.weekly_reviews.forEach(row => stmt.run(row));
      });
      tx();
      imported += data.weekly_reviews.length;
    }

    // 导入每日复盘
    if (data.daily_reviews && Array.isArray(data.daily_reviews)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO daily_reviews 
        (id, date, weekday, week_id, market_index, market_volume, market_sentiment, gold_pool_summary, zhongjun_summary, limit_up_count, limit_down_count, daily_verify, challengers, daily_avoid, conclusion, actions, risk_note, created_at, updated_at)
        VALUES (@id, @date, @weekday, @week_id, @market_index, @market_volume, @market_sentiment, @gold_pool_summary, @zhongjun_summary, @limit_up_count, @limit_down_count, @daily_verify, @challengers, @daily_avoid, @conclusion, @actions, @risk_note, @created_at, datetime('now', 'localtime'))
      `);
      const tx = db.transaction(() => {
        data.daily_reviews.forEach(row => stmt.run(row));
      });
      tx();
      imported += data.daily_reviews.length;
    }

    res.json({ success: true, imported, message: `成功导入 ${imported} 条记录` });
  } catch (err) {
    res.status(500).json({ error: '导入失败', detail: err.message });
  }
});

// 统计概览 API
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      weeklyCount: db.prepare('SELECT COUNT(*) as count FROM weekly_reviews').get().count,
      dailyCount: db.prepare('SELECT COUNT(*) as count FROM daily_reviews').get().count,
      sectorCount: db.prepare('SELECT COUNT(DISTINCT sector_name) as count FROM sector_tracking').get().count,
      leaderCount: db.prepare('SELECT COUNT(*) as count FROM leader_stocks WHERE date = (SELECT MAX(date) FROM leader_stocks)').get().count,
      stockCount: db.prepare('SELECT COUNT(*) as count FROM stock_picks WHERE date = (SELECT MAX(date) FROM stock_picks)').get().count,
      latestDate: db.prepare('SELECT MAX(date) as date FROM daily_reviews').get().date,
      databaseSize: null
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '获取统计失败', detail: err.message });
  }
});

// 根路径 - 返回前端应用
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 处理
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API 端点不存在', path: req.path });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', detail: err.message });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  M-D Pro 复盘系统已启动');
  console.log('========================================');
  console.log(`  本地访问: http://localhost:${PORT}`);
  console.log(`  API 文档: http://localhost:${PORT}/api/health`);
  console.log(`  数据导出: http://localhost:${PORT}/api/export`);
  console.log('========================================');
  console.log('  按 Ctrl+C 停止服务器');
  console.log('========================================');
});

module.exports = app;
