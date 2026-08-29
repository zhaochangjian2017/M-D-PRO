/**
 * 周度复盘 API 路由
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 获取所有周度复盘
router.get('/', (req, res) => {
  try {
    const { year, limit } = req.query;
    let sql = 'SELECT * FROM weekly_reviews';
    const params = [];
    if (year) {
      sql += ' WHERE year = ?';
      params.push(parseInt(year));
    }
    sql += ' ORDER BY year DESC, week_number DESC';
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    const rows = db.prepare(sql).all(...params);
    // 解析 JSON 字段
    rows.forEach(row => {
      row.gold_pool = JSON.parse(row.gold_pool || '[]');
      row.black_pool = JSON.parse(row.black_pool || '[]');
      row.zhongjun = JSON.parse(row.zhongjun || '[]');
      row.timeline = JSON.parse(row.timeline || '[]');
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 获取单条周度复盘
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM weekly_reviews WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: '周度复盘不存在' });
    }
    row.gold_pool = JSON.parse(row.gold_pool || '[]');
    row.black_pool = JSON.parse(row.black_pool || '[]');
    row.zhongjun = JSON.parse(row.zhongjun || '[]');
    row.timeline = JSON.parse(row.timeline || '[]');
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 创建周度复盘
router.post('/', (req, res) => {
  try {
    const { week_number, year, start_date, end_date, gold_pool, black_pool, zhongjun, timeline, conclusion } = req.body;
    if (!week_number || !year || !start_date || !end_date) {
      return res.status(400).json({ error: '缺少必要字段: week_number, year, start_date, end_date' });
    }
    const result = db.prepare(`
      INSERT INTO weekly_reviews 
      (week_number, year, start_date, end_date, gold_pool, black_pool, zhongjun, timeline, conclusion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      week_number, year, start_date, end_date,
      JSON.stringify(gold_pool || []),
      JSON.stringify(black_pool || []),
      JSON.stringify(zhongjun || []),
      JSON.stringify(timeline || []),
      conclusion || ''
    );
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '该年度周次已存在' });
    }
    res.status(500).json({ error: '创建失败', detail: err.message });
  }
});

// 更新周度复盘
router.put('/:id', (req, res) => {
  try {
    const { gold_pool, black_pool, zhongjun, timeline, conclusion } = req.body;
    const result = db.prepare(`
      UPDATE weekly_reviews SET 
        gold_pool = COALESCE(?, gold_pool),
        black_pool = COALESCE(?, black_pool),
        zhongjun = COALESCE(?, zhongjun),
        timeline = COALESCE(?, timeline),
        conclusion = COALESCE(?, conclusion),
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      gold_pool ? JSON.stringify(gold_pool) : null,
      black_pool ? JSON.stringify(black_pool) : null,
      zhongjun ? JSON.stringify(zhongjun) : null,
      timeline ? JSON.stringify(timeline) : null,
      conclusion !== undefined ? conclusion : null,
      req.params.id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: '周度复盘不存在' });
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新失败', detail: err.message });
  }
});

// 删除周度复盘
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM weekly_reviews WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '周度复盘不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除失败', detail: err.message });
  }
});

module.exports = router;
