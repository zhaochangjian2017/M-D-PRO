/**
 * 龙头股 API 路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 获取龙头股数据（支持按日期、板块筛选）
router.get('/', (req, res) => {
  try {
    const { date, sector, latest } = req.query;
    let sql = 'SELECT * FROM leader_stocks WHERE 1=1';
    const params = [];

    if (latest) {
      const maxDate = db.prepare('SELECT MAX(date) as d FROM leader_stocks').get().d;
      sql += ' AND date = ?';
      params.push(maxDate);
    } else if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    if (sector) {
      sql += ' AND sector = ?';
      params.push(sector);
    }
    sql += ' ORDER BY date DESC, sector, rank';
    const rows = db.prepare(sql).all(...params);
    // 解析 JSON 字段（增加容错处理）
    rows.forEach(row => {
      try {
        row.catalysts = JSON.parse(row.catalysts || '[]');
      } catch(e) {
        // 如果不是JSON格式，按中文逗号分割转为数组
        row.catalysts = (row.catalysts || '').split(/[、,，]/).filter(s => s.trim());
      }
      row.is_limit_up = !!row.is_limit_up;
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 批量保存龙头股数据
router.post('/batch', (req, res) => {
  try {
    const { date, leaders } = req.body;
    if (!date || !Array.isArray(leaders)) {
      return res.status(400).json({ error: '缺少必要字段: date, leaders(数组)' });
    }
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO leader_stocks 
      (sector, rank, name, code, type, market_cap, day_change, is_limit_up, board_count, volume, week_change, reason, logic, catalysts, risk, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction(() => {
      leaders.forEach(l => {
        stmt.run(
          l.sector, l.rank, l.name, l.code,
          l.type || '中军', l.market_cap || '', l.day_change || '',
          l.is_limit_up ? 1 : 0, l.board_count || 0,
          l.volume || '', l.week_change || '',
          l.reason || '', l.logic || '',
          JSON.stringify(l.catalysts || []),
          l.risk || '', date
        );
      });
    });
    tx();
    res.json({ message: `成功保存 ${leaders.length} 只龙头股数据`, date });
  } catch (err) {
    res.status(500).json({ error: '保存失败', detail: err.message });
  }
});

// 删除指定日期的龙头股数据
router.delete('/:date', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM leader_stocks WHERE date = ?').run(req.params.date);
    res.json({ message: `删除 ${result.changes} 条记录` });
  } catch (err) {
    res.status(500).json({ error: '删除失败', detail: err.message });
  }
});

module.exports = router;
