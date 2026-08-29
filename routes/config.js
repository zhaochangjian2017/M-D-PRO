/**
 * 应用配置 API 路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../database');

// 获取应用配置
router.get('/', (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM app_config WHERE id = 1').get();
    if (!config) {
      return res.status(404).json({ error: '配置不存在' });
    }
    config.settings = JSON.parse(config.settings || '{}');
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: '获取配置失败', detail: err.message });
  }
});

// 更新应用配置
router.put('/', (req, res) => {
  try {
    const { version, version_date, current_week, current_year, settings } = req.body;
    const updates = [];
    const params = [];

    if (version !== undefined) { updates.push('version = ?'); params.push(version); }
    if (version_date !== undefined) { updates.push('version_date = ?'); params.push(version_date); }
    if (current_week !== undefined) { updates.push('current_week = ?'); params.push(current_week); }
    if (current_year !== undefined) { updates.push('current_year = ?'); params.push(current_year); }
    if (settings !== undefined) { updates.push('settings = ?'); params.push(JSON.stringify(settings)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    updates.push("updated_at = datetime('now', 'localtime')");
    params.push(1);

    const result = db.prepare(`UPDATE app_config SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    if (result.changes === 0) {
      // 如果不存在则创建
      db.prepare(`
        INSERT INTO app_config (id, version, version_date, current_week, current_year, settings)
        VALUES (1, ?, ?, ?, ?, ?)
      `).run(version || 'v1.0.0', version_date || new Date().toISOString().split('T')[0], current_week || 0, current_year || 2026, JSON.stringify(settings || {}));
    }
    res.json({ message: '配置更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新配置失败', detail: err.message });
  }
});

// 获取数据库统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = {
      weekly_reviews: db.prepare('SELECT COUNT(*) as count FROM weekly_reviews').get().count,
      daily_reviews: db.prepare('SELECT COUNT(*) as count FROM daily_reviews').get().count,
      sector_tracking: db.prepare('SELECT COUNT(*) as count FROM sector_tracking').get().count,
      leader_stocks: db.prepare('SELECT COUNT(*) as count FROM leader_stocks').get().count,
      stock_picks: db.prepare('SELECT COUNT(*) as count FROM stock_picks').get().count,
      checklist_items: db.prepare('SELECT COUNT(*) as count FROM checklist_items').get().count,
      latest_daily_date: db.prepare('SELECT MAX(date) as date FROM daily_reviews').get().date,
      earliest_daily_date: db.prepare('SELECT MIN(date) as date FROM daily_reviews').get().date
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '获取统计失败', detail: err.message });
  }
});

module.exports = router;
