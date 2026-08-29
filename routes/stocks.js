/**
 * 个股选择 API 路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 获取个股选择数据（支持按类型、日期筛选）
router.get('/', (req, res) => {
  try {
    const { type, date, latest } = req.query;
    let sql = 'SELECT * FROM stock_picks WHERE 1=1';
    const params = [];

    if (latest) {
      const maxDate = db.prepare('SELECT MAX(date) as d FROM stock_picks').get().d;
      sql += ' AND date = ?';
      params.push(maxDate);
    } else if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY date DESC, type, sort_order';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 批量保存个股选择数据
router.post('/batch', (req, res) => {
  try {
    const { date, stocks } = req.body;
    if (!date || !Array.isArray(stocks)) {
      return res.status(400).json({ error: '缺少必要字段: date, stocks(数组)' });
    }
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO stock_picks 
      (type, name, code, sector, boards, auction, support, emotion, week_align, pullback, ma_status, volume_ratio, position, reason, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction(() => {
      stocks.forEach(s => {
        stmt.run(
          s.type, s.name, s.code, s.sector || '',
          s.boards || '', s.auction || '', s.support || '',
          s.emotion || '', s.week_align || s.weekAlign || '',
          s.pullback || '', s.ma_status || s.maStatus || '',
          s.volume_ratio || s.volumeRatio || '', s.position || '',
          s.reason || '', date
        );
      });
    });
    tx();
    res.json({ message: `成功保存 ${stocks.length} 只个股数据`, date });
  } catch (err) {
    res.status(500).json({ error: '保存失败', detail: err.message });
  }
});

// 删除指定日期的个股数据
router.delete('/:date', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM stock_picks WHERE date = ?').run(req.params.date);
    res.json({ message: `删除 ${result.changes} 条记录` });
  } catch (err) {
    res.status(500).json({ error: '删除失败', detail: err.message });
  }
});

module.exports = router;
