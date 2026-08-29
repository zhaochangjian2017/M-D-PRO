/**
 * 每日复盘 API 路由
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 获取所有每日复盘（支持筛选）
router.get('/', (req, res) => {
  try {
    const { start_date, end_date, week_id, limit, sentiment } = req.query;
    let sql = 'SELECT * FROM daily_reviews WHERE 1=1';
    const params = [];

    if (start_date) {
      sql += ' AND date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date <= ?';
      params.push(end_date);
    }
    if (week_id) {
      sql += ' AND week_id = ?';
      params.push(parseInt(week_id));
    }
    if (sentiment) {
      sql += ' AND market_sentiment LIKE ?';
      params.push(`%${sentiment}%`);
    }

    sql += ' ORDER BY date DESC';
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const rows = db.prepare(sql).all(...params);
    // 解析 JSON 字段
    rows.forEach(row => {
      row.daily_verify = JSON.parse(row.daily_verify || '[]');
      row.challengers = JSON.parse(row.challengers || '[]');
      row.daily_avoid = JSON.parse(row.daily_avoid || '[]');
      row.actions = JSON.parse(row.actions || '[]');
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 获取单条每日复盘
router.get('/:date', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM daily_reviews WHERE date = ?').get(req.params.date);
    if (!row) {
      return res.status(404).json({ error: '该日期复盘不存在' });
    }
    row.daily_verify = JSON.parse(row.daily_verify || '[]');
    row.challengers = JSON.parse(row.challengers || '[]');
    row.daily_avoid = JSON.parse(row.daily_avoid || '[]');
    row.actions = JSON.parse(row.actions || '[]');
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 创建每日复盘
router.post('/', (req, res) => {
  try {
    const { date, weekday, week_id, market_index, market_volume, market_sentiment,
      gold_pool_summary, zhongjun_summary, limit_up_count, limit_down_count,
      daily_verify, challengers, daily_avoid, conclusion, actions, risk_note } = req.body;

    if (!date || !weekday) {
      return res.status(400).json({ error: '缺少必要字段: date, weekday' });
    }

    const result = db.prepare(`
      INSERT INTO daily_reviews 
      (date, weekday, week_id, market_index, market_volume, market_sentiment,
       gold_pool_summary, zhongjun_summary, limit_up_count, limit_down_count,
       daily_verify, challengers, daily_avoid, conclusion, actions, risk_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      date, weekday, week_id || null,
      market_index || '', market_volume || '', market_sentiment || '中性',
      gold_pool_summary || '', zhongjun_summary || '',
      limit_up_count || 0, limit_down_count || 0,
      JSON.stringify(daily_verify || []),
      JSON.stringify(challengers || []),
      JSON.stringify(daily_avoid || []),
      conclusion || '',
      JSON.stringify(actions || []),
      risk_note || ''
    );
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '该日期复盘已存在' });
    }
    res.status(500).json({ error: '创建失败', detail: err.message });
  }
});

// 更新每日复盘
router.put('/:date', (req, res) => {
  try {
    const fields = ['weekday', 'week_id', 'market_index', 'market_volume', 'market_sentiment',
      'gold_pool_summary', 'zhongjun_summary', 'limit_up_count', 'limit_down_count',
      'conclusion', 'risk_note'];
    const jsonFields = ['daily_verify', 'challengers', 'daily_avoid', 'actions'];

    const updates = [];
    const params = [];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    });
    jsonFields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(JSON.stringify(req.body[f]));
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    updates.push("updated_at = datetime('now', 'localtime')");
    params.push(req.params.date);

    const result = db.prepare(`UPDATE daily_reviews SET ${updates.join(', ')} WHERE date = ?`).run(...params);
    if (result.changes === 0) {
      return res.status(404).json({ error: '该日期复盘不存在' });
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新失败', detail: err.message });
  }
});

// 删除每日复盘
router.delete('/:date', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM daily_reviews WHERE date = ?').run(req.params.date);
    if (result.changes === 0) {
      return res.status(404).json({ error: '该日期复盘不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除失败', detail: err.message });
  }
});

module.exports = router;
