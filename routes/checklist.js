/**
 * 执行清单 API 路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 获取执行清单（支持按日期筛选）
router.get('/', (req, res) => {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM checklist_items';
    const params = [];
    if (date) {
      sql += ' WHERE date = ?';
      params.push(date);
    }
    sql += ' ORDER BY date DESC, sort_order';
    const rows = db.prepare(sql).all(...params);
    // 转换 checked 为布尔值
    rows.forEach(row => {
      row.checked = !!row.checked;
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
});

// 创建清单项
router.post('/', (req, res) => {
  try {
    const { date, title, time, desc, sort_order } = req.body;
    if (!date || !title) {
      return res.status(400).json({ error: '缺少必要字段: date, title' });
    }
    const result = db.prepare(`
      INSERT INTO checklist_items (date, title, time, desc, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(date, title, time || '', desc || '', sort_order || 0);
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '该日期已存在相同标题的清单项' });
    }
    res.status(500).json({ error: '创建失败', detail: err.message });
  }
});

// 更新清单项状态
router.put('/:id', (req, res) => {
  try {
    const { title, time, desc, checked, sort_order } = req.body;
    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (time !== undefined) { updates.push('time = ?'); params.push(time); }
    if (desc !== undefined) { updates.push('desc = ?'); params.push(desc); }
    if (checked !== undefined) { updates.push('checked = ?'); params.push(checked ? 1 : 0); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }
    params.push(req.params.id);
    const result = db.prepare(`UPDATE checklist_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    if (result.changes === 0) {
      return res.status(404).json({ error: '清单项不存在' });
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新失败', detail: err.message });
  }
});

// 切换清单项完成状态（快捷接口）
router.post('/:id/toggle', (req, res) => {
  try {
    const item = db.prepare('SELECT checked FROM checklist_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: '清单项不存在' });
    }
    const newChecked = item.checked ? 0 : 1;
    db.prepare('UPDATE checklist_items SET checked = ? WHERE id = ?').run(newChecked, req.params.id);
    res.json({ checked: !!newChecked, message: '状态已切换' });
  } catch (err) {
    res.status(500).json({ error: '切换失败', detail: err.message });
  }
});

// 删除清单项
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '清单项不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除失败', detail: err.message });
  }
});

module.exports = router;
