@echo off
chcp 65001 >nul
REM ============================================================
REM Windows 本地开发/部署脚本
REM ============================================================

echo =========================================
echo   大学社团在线答题系统 - 本地部署
echo =========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

REM 检查 MySQL
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  未检测到 MySQL 客户端
    echo    请确保 MySQL 服务已安装并运行
    echo    下载地址: https://dev.mysql.com/downloads/mysql/
    echo.
)

REM 安装依赖
echo.
echo 📦 安装项目依赖...
call npm install
echo ✅ 依赖安装完成

REM 提示配置数据库
echo.
echo ⚠️  请确保 MySQL 已运行，并修改 database.js 中的数据库密码！
echo.
echo 默认配置：
echo   主机: localhost:3306
echo   用户: root
echo   密码: your_password_here
echo   数据库: quiz_db （自动创建）
echo.

REM 创建数据库（尝试）
echo 🔧 尝试创建数据库...
mysql -u root -pyour_password_here -e "CREATE DATABASE IF NOT EXISTS quiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ 数据库 quiz_db 已创建
) else (
    echo ⚠️  自动创建失败，请手动创建数据库 quiz_db
    echo    命令: mysql -u root -p -e "CREATE DATABASE quiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)

REM 启动服务
echo.
echo 🚀 启动服务器...
echo.
node server.js

pause
