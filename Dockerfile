FROM node:18-alpine

# 安装 MySQL 客户端工具（可选，方便调试）
RUN apk add --no-cache mysql-client

WORKDIR /app

# 复制依赖文件并安装
COPY package.json ./
RUN npm install --production

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
