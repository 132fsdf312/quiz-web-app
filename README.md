# 多人在线答题网站

Express + MySQL 在线答题系统，支持局域网/公网部署。

## 功能

- **选择题 / 判断题 / 简答题** 三种题型
- **自动评分** — 选择题判断正误，简答题5字满分
- **管理后台** — 题目增删改、成绩查看导出
- **Docker 部署** — 一键启动
- **Nginx + SSL** — 生产环境反代支持

## 快速启动

```bash
# 安装依赖
npm install

# 启动
node server.js
```

浏览器打开 `http://localhost:3000`

## Docker 部署

```bash
docker-compose up -d --build
```

## 管理员接口

| 接口 | 说明 |
|------|------|
| `POST /api/admin/questions` | 添加题目 |
| `PUT /api/admin/questions/:id` | 修改题目 |
| `DELETE /api/admin/questions/:id` | 删除题目 |
| `GET /api/admin/records` | 查看成绩 |
| `GET /api/admin/export` | 导出成绩 |

## 技术栈

- **后端:** Express + mysql2
- **数据库:** MySQL 8.0
- **前端:** 原生 HTML/CSS/JS
- **部署:** Docker + Nginx
