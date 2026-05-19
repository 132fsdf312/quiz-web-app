#!/bin/bash
# ============================================================
# 大学社团在线答题系统 - 一键部署脚本
# 适用于：Ubuntu / CentOS / Debian 服务器
# ============================================================

set -e

echo "========================================="
echo "  大学社团在线答题系统 - 部署脚本"
echo "========================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装"
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装"
fi

# 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  已创建 .env 文件，请编辑数据库密码后重新运行！"
    echo "   编辑命令: nano .env"
    exit 1
fi

# 构建并启动
echo "🚀 构建并启动服务..."
docker-compose up -d --build

echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "  网站地址: http://你的服务器IP:3000"
echo "  管理员账号: admin / (请在 .env 中配置)"
echo ""
echo "  常用命令："
echo "    查看日志: docker-compose logs -f"
echo "    停止服务: docker-compose down"
echo "    重启服务: docker-compose restart"
echo ""
