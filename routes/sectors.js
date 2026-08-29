/**
 * 板块跟踪 API 路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 获取板块跟踪数据（支持按板块、日期范围筛选）
router.get('/', (req, res) => {
  try {
    const { sector, start_date, end_date, limit } = req.query;
    let sql = 'SELECT * FROM sector_tracking WHERE 1=1';
    const params = [];
    if (sector) {
      sql += ' AND sector_name = ?';
      params.push(sector);
    }
    if (start_date) {
      sql += ' AND date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date <= ?';
      params.push(end_date);
    }
    sql += ' ORDER BY date DESC, sector_name';
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 获取单个板块的历史跟踪数据
router.get('/:sector/history', (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const rows = db.prepare(`
      SELECT * FROM sector_tracking 
      WHERE sector_name = ? 
      ORDER BY date DESC 
      LIMIT ?
    `).all(req.params.sector, parseInt(limit));
    res.json(rows.reverse()); // 按日期正序返回，便于图表展示
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 批量保存板块跟踪数据
router.post('/batch', (req, res) => {
  try {
    const { date, sectors } = req.body;
    if (!date || !Array.isArray(sectors)) {
      return res.status(400).json({ error: '缺少必要字段: date, sectors(数组)' });
    }
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sector_tracking 
      (sector_name, industry, date, change, change_20d, limit_up, volume, zj_change, rank, status, trend, score, recommendation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction(() => {
      sectors.forEach(s => {
        stmt.run(
          s.sector_name || s.name,
          s.industry || '',
          date,
          s.change || 0,
          s.change_20d || s.change20d || 0,
          s.limit_up || s.limitUp || 0,
          s.volume || 0,
          s.zj_change || s.zjChange || 0,
          s.rank || 0,
          s.status || 'watch',
          s.trend || 'flat',
          s.score || 0,
          s.recommendation || ''
        );
      });
    });
    tx();
    res.json({ message: `成功保存 ${sectors.length} 个板块跟踪数据`, date });
  } catch (err) {
    res.status(500).json({ error: '保存失败', detail: err.message });
  }
});

// 删除指定日期的板块跟踪数据
router.delete('/:date', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM sector_tracking WHERE date = ?').run(req.params.date);
    res.json({ message: `删除 ${result.changes} 条记录` });
  } catch (err) {
    res.status(500).json({ error: '删除失败', detail: err.message });
  }
});

module.exports = router;
