# 大学社团在线答题系统 - 部署指南

## 📁 项目结构

```
├── public/
│   └── index.html        # 前端页面（对接后端API）
├── server.js              # Express 后端服务
├── database.js            # MySQL 数据库配置
├── package.json           # 项目依赖
├── Dockerfile             # Docker 镜像构建
├── docker-compose.yml     # Docker Compose 编排
├── .env.example           # 环境变量模板
├── deploy.sh              # Linux 一键部署脚本
├── deploy.bat             # Windows 本地部署脚本
├── nginx.conf.example     # Nginx 反向代理配置
└── index.html             # 纯前端版（无需后端，备选）
```

---

## 🚀 方式一：Docker Compose 一键部署（推荐）

### 前提
- 服务器已安装 Docker 和 Docker Compose

### 步骤

```bash
# 1. 上传项目到服务器
scp -r ./quiz-app root@你的服务器IP:/opt/quiz-app

# 2. SSH 登录服务器
ssh root@你的服务器IP

# 3. 进入项目目录
cd /opt/quiz-app

# 4. 复制环境变量文件并修改密码
cp .env.example .env
nano .env    # 修改 DB_PASSWORD

# 5. 同时修改 docker-compose.yml 中的密码（两处）

# 6. 一键启动
docker-compose up -d --build

# 7. 查看日志
docker-compose logs -f
```

访问 `http://服务器IP:3000` 即可！

---

## 🚀 方式二：手动部署（Linux 服务器）

### 1. 安装 Node.js 和 MySQL

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL
sudo apt-get install -y mysql-server
sudo mysql_secure_installation
```

### 2. 创建数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE quiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 如需单独创建用户：
-- CREATE USER 'quiz'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON quiz_db.* TO 'quiz'@'localhost';
-- FLUSH PRIVILEGES;
```

### 3. 部署应用

```bash
# 上传项目到 /opt/quiz-app
cd /opt/quiz-app

# 安装依赖
npm install --production

# 修改数据库配置
nano database.js   # 修改 dbConfig 中的密码

# 启动（推荐用 pm2 守护进程）
npm install -g pm2
pm2 start server.js --name quiz-app
pm2 save
pm2 startup
```

### 4. 配置 Nginx 反向代理（可选）

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/quiz
sudo ln -s /etc/nginx/sites-available/quiz /etc/nginx/sites-enabled/
# 编辑 server_name
sudo nano /etc/nginx/sites-available/quiz
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 方式三：Windows 本地开发

### 1. 安装依赖
- [Node.js](https://nodejs.org/) 18+
- [MySQL](https://dev.mysql.com/downloads/mysql/) 8.0+

### 2. 创建数据库
```sql
CREATE DATABASE quiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 修改密码
编辑 `database.js`，将 `root123456` 改为你的 MySQL 密码

### 4. 双击 `deploy.bat` 或手动执行：
```cmd
npm install
node server.js
```

访问 `http://localhost:3000`

---

## ⚙️ 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3000 | 服务端口 |
| DB_HOST | localhost | MySQL 主机 |
| DB_PORT | 3306 | MySQL 端口 |
| DB_USER | root | MySQL 用户名 |
| DB_PASSWORD | root123456 | MySQL 密码 |
| DB_NAME | quiz_db | 数据库名 |

---

## 👨‍💼 管理员

- 姓名：`admin`
- 学号：`114514`
- 登录后进入管理后台，可管理题库、查看成绩、导出记录

---

## 📋 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/questions | 获取所有题目 |
| POST | /api/submit | 提交答卷 |
| GET | /api/admin/records | 获取成绩记录 |
| DELETE | /api/admin/records | 清空成绩记录 |
| GET | /api/admin/export | 导出成绩汇总txt |
| POST | /api/admin/questions | 添加题目 |
| PUT | /api/admin/questions/:id | 更新题目 |
| DELETE | /api/admin/questions/:id | 删除题目 |

---

## ❓ 常见问题

### 数据库连接失败
1. 确认 MySQL 服务已启动
2. 检查密码是否正确
3. 检查数据库 `quiz_db` 是否已创建

### 端口被占用
修改 `.env` 文件中的 `PORT` 或 `docker-compose.yml` 中的端口映射

### 数据库表自动创建
首次启动服务时，程序会自动创建 `questions` 和 `records` 表，并导入默认题目
