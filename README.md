# M-D Pro — 周+日滚动复盘体系（全栈版）

> 版本：v1.0.0  
> 一个面向股票交易者的周度 + 每日滚动复盘全栈应用，支持数据持久化存储、查询与回溯。

---

## 项目介绍

M-D Pro（Market-Daily Pro）是一套完整的股票交易复盘系统，将"周度定方向、每日做验证"的复盘方法论落地为可交互的 Web 应用。

相比纯前端版本，本项目升级为**全栈架构**：
- **后端**：Node.js + Express 提供 RESTful API
- **数据库**：SQLite（better-sqlite3）实现数据持久化
- **前端**：单页应用（SPA），通过 API 与后端交互
- **数据回溯**：每周/每日复盘记录可保存、查询、导出和导入

---

## 功能特性

### 八大功能模块

| 模块 | 说明 |
|------|------|
| 📅 **周度复盘** | 记录每周金股池、黑股池、中军、时间线、结论，按年/周归档 |
| 📝 **每日复盘** | 记录每日大盘、成交量、情绪、涨停/跌停、验证、挑战者、回避、结论、行动、风险提示 |
| 📊 **板块跟踪** | 跟踪热点板块的持续性、强度、龙头变化 |
| 🏆 **龙头股** | 记录各板块龙头股及排名变化 |
| 🎯 **个股选择** | 记录自选股、买入/卖出/观察标的 |
| ✅ **执行清单** | 每日交易前/后的检查清单，确保纪律执行 |
| ⚙️ **应用配置** | 个性化配置，如默认板块、提醒设置等 |
| 📤 **数据导入/导出** | 一键导出全部数据为 JSON，支持迁移和备份 |

### 核心能力

- ✅ **数据持久化**：所有复盘记录存入 SQLite 数据库，重启不丢失
- ✅ **历史回溯**：按日期/周次查询任意历史复盘记录
- ✅ **统计概览**：实时统计周度数、日度数、板块数、龙头数等
- ✅ **数据导出**：`GET /api/export` 导出全量 JSON 备份
- ✅ **数据导入**：`POST /api/import` 从 JSON 恢复数据
- ✅ **健康检查**：`GET /api/health` 监控服务状态

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Express ^4.18.2 |
| 数据库 | SQLite（better-sqlite3 ^9.4.3） |
| 跨域 | cors ^2.8.5 |
| 请求解析 | body-parser ^1.20.2 |
| 前端 | 原生 HTML/CSS/JS 单页应用 |
| 运行时 | Node.js >= 16 |

---

## 项目结构

```
M-D-PRO/
├── server.js              # Express 后端服务器入口
├── database.js            # SQLite 数据库层（7张表 + 初始示例数据）
├── package.json           # 项目配置与依赖
├── package-lock.json      # 依赖锁定文件
├── .gitignore             # Git 忽略规则
├── README.md              # 项目说明文档
├── public/
│   └── index.html         # 前端单页应用（含 API 交互层）
├── routes/
│   ├── weekly.js          # 周度复盘 API
│   ├── daily.js           # 每日复盘 API
│   ├── sectors.js         # 板块跟踪 API
│   ├── leaders.js         # 龙头股 API
│   ├── stocks.js          # 个股选择 API
│   ├── checklist.js       # 执行清单 API
│   └── config.js          # 应用配置 API
└── data/
    └── database.db        # SQLite 数据库文件（运行时生成，不提交）
```

---

## 安装与运行

### 环境要求

- Node.js >= 16
- npm >= 8

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/zhaochangjian2017/M-D-PRO.git
cd M-D-PRO

# 2. 安装依赖
npm install

# 3. 启动服务器
npm start
```

启动成功后，终端会显示：

```
========================================
  M-D Pro 复盘系统已启动
========================================
  本地访问: http://localhost:3000
  API 文档: http://localhost:3000/api/health
  数据导出: http://localhost:3000/api/export
========================================
```

### 访问应用

- **前端界面**：http://localhost:3000
- **健康检查**：http://localhost:3000/api/health
- **数据导出**：http://localhost:3000/api/export

### 自定义端口

```bash
# Windows (PowerShell)
$env:PORT=8080; npm start

# Linux / macOS
PORT=8080 npm start
```

### 初始化数据库

数据库会在首次启动时自动创建并写入示例数据。如需手动初始化：

```bash
npm run init-db
```

---

## API 文档

### 基础信息

- Base URL：`http://localhost:3000`
- 数据格式：JSON
- 字符编码：UTF-8

### 通用接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查，返回服务状态和版本 |
| GET | `/api/stats` | 统计概览（周度数、日度数、板块数等） |
| GET | `/api/export` | 导出全量数据为 JSON |
| POST | `/api/import` | 从 JSON 导入数据 |

### 周度复盘 `/api/weekly`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/weekly` | 获取所有周度复盘列表（按年/周倒序） |
| GET | `/api/weekly/:id` | 获取单条周度复盘详情 |
| GET | `/api/weekly/year/:year` | 获取指定年份的所有周度复盘 |
| POST | `/api/weekly` | 创建新的周度复盘 |
| PUT | `/api/weekly/:id` | 更新周度复盘 |
| DELETE | `/api/weekly/:id` | 删除周度复盘 |

**字段说明**：`week_number`（周次）、`year`（年份）、`start_date`（开始日期）、`end_date`（结束日期）、`gold_pool`（金股池）、`black_pool`（黑股池）、`zhongjun`（中军）、`timeline`（时间线）、`conclusion`（结论）

### 每日复盘 `/api/daily`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/daily` | 获取所有每日复盘列表（按日期倒序） |
| GET | `/api/daily/:id` | 获取单条每日复盘详情 |
| GET | `/api/daily/date/:date` | 获取指定日期的复盘 |
| GET | `/api/daily/week/:weekId` | 获取指定周次的所有每日复盘 |
| POST | `/api/daily` | 创建新的每日复盘 |
| PUT | `/api/daily/:id` | 更新每日复盘 |
| DELETE | `/api/daily/:id` | 删除每日复盘 |

**字段说明**：`date`（日期）、`weekday`（星期）、`week_id`（所属周次）、`market_index`（大盘指数）、`market_volume`（成交量）、`market_sentiment`（市场情绪）、`gold_pool_summary`（金股池总结）、`zhongjun_summary`（中军总结）、`limit_up_count`（涨停数）、`limit_down_count`（跌停数）、`daily_verify`（当日验证）、`challengers`（挑战者）、`daily_avoid`（当日回避）、`conclusion`（结论）、`actions`（行动）、`risk_note`（风险提示）

### 板块跟踪 `/api/sectors`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sectors` | 获取板块跟踪列表 |
| GET | `/api/sectors/:id` | 获取单条板块记录 |
| GET | `/api/sectors/date/:date` | 获取指定日期的板块 |
| POST | `/api/sectors` | 创建板块记录 |
| PUT | `/api/sectors/:id` | 更新板块记录 |
| DELETE | `/api/sectors/:id` | 删除板块记录 |

### 龙头股 `/api/leaders`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/leaders` | 获取龙头股列表 |
| GET | `/api/leaders/:id` | 获取单条龙头股记录 |
| GET | `/api/leaders/date/:date` | 获取指定日期的龙头股 |
| GET | `/api/leaders/sector/:sector` | 获取指定板块的龙头股 |
| POST | `/api/leaders` | 创建龙头股记录 |
| PUT | `/api/leaders/:id` | 更新龙头股记录 |
| DELETE | `/api/leaders/:id` | 删除龙头股记录 |

### 个股选择 `/api/stocks`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stocks` | 获取个股选择列表 |
| GET | `/api/stocks/:id` | 获取单条个股记录 |
| GET | `/api/stocks/date/:date` | 获取指定日期的个股 |
| GET | `/api/stocks/type/:type` | 按类型筛选（买入/卖出/观察） |
| POST | `/api/stocks` | 创建个股记录 |
| PUT | `/api/stocks/:id` | 更新个股记录 |
| DELETE | `/api/stocks/:id` | 删除个股记录 |

### 执行清单 `/api/checklist`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/checklist` | 获取执行清单列表 |
| GET | `/api/checklist/:id` | 获取单条清单项 |
| GET | `/api/checklist/date/:date` | 获取指定日期的清单 |
| POST | `/api/checklist` | 创建清单项 |
| PUT | `/api/checklist/:id` | 更新清单项（含勾选状态） |
| DELETE | `/api/checklist/:id` | 删除清单项 |

### 应用配置 `/api/config`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取应用配置 |
| PUT | `/api/config` | 更新应用配置 |

---

## 数据库设计

共 7 张数据表：

| 表名 | 说明 |
|------|------|
| `weekly_reviews` | 周度复盘记录 |
| `daily_reviews` | 每日复盘记录 |
| `sector_tracking` | 板块跟踪记录 |
| `leader_stocks` | 龙头股记录 |
| `stock_picks` | 个股选择记录 |
| `checklist_items` | 执行清单项 |
| `app_config` | 应用配置 |

数据库文件位于 `data/database.db`，首次启动时自动创建并写入示例数据。

---

## 数据备份与迁移

### 导出备份

```bash
# 浏览器直接访问下载 JSON
curl http://localhost:3000/api/export > backup.json
```

### 导入恢复

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

---

## 常见问题

**Q：启动报错 `Cannot find module 'better-sqlite3'`？**  
A：请先运行 `npm install` 安装依赖。better-sqlite3 需要本地编译，确保已安装 Node.js 开发工具。

**Q：端口 3000 被占用？**  
A：使用自定义端口启动：`$env:PORT=8080; npm start`（Windows）或 `PORT=8080 npm start`（Linux/macOS）。

**Q：数据存在哪里？**  
A：所有数据存储在 `data/database.db`（SQLite 文件），可直接复制该文件进行备份。

**Q：如何重置数据库？**  
A：停止服务器后删除 `data/database.db`，重新启动会自动创建新数据库并写入示例数据。

---

## 免责声明

本项目仅供学习研究和个人复盘记录使用，不构成任何投资建议。

- 项目中涉及的股票名称、代码、板块等信息仅为示例数据，不代表任何推荐。
- 股市有风险，投资需谨慎。任何基于本工具做出的投资决策，风险由使用者自行承担。
- 本项目作者不对因使用本软件而产生的任何直接或间接损失负责。
- 请遵守当地法律法规，合法合规使用本工具。

---

## License

MIT License

---

## 作者

zhaochangjian2017

GitHub：https://github.com/zhaochangjian2017/M-D-PRO
