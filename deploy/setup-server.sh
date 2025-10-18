#!/usr/bin/env bash
# 生产服务器一键初始化脚本（Ubuntu 20.04/22.04）
# 功能：安装 Docker 与 compose 插件、Nginx、可选 Certbot；创建基本目录结构
# 使用：sudo bash deploy/setup-server.sh your-domain.com
set -euo pipefail

DOMAIN="${1:-your-domain.com}"
APP_DIR="/opt/spirit-pet"
LOG_DIR="${APP_DIR}/logs"
DATA_DIR="${APP_DIR}/data"
PUB_DIR="${APP_DIR}/public"

echo "[INFO] 初始化服务器，目标域名：${DOMAIN}"

echo "[STEP] 更新系统与安装依赖"
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw

echo "[STEP] 安装 Docker Engine 与 Compose 插件"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

echo "[STEP] 安装 Nginx"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

echo "[STEP] 可选：安装 Certbot（用于 HTTPS 证书）"
apt-get install -y certbot python3-certbot-nginx || true

echo "[STEP] 创建应用目录"
mkdir -p "${APP_DIR}"
mkdir -p "${LOG_DIR}" "${DATA_DIR}" "${PUB_DIR}"

echo "[STEP] 防火墙设置（开放 80/443，限制其他端口）"
ufw allow 80/tcp || true
ufw allow 443/tcp || true
# 如需远程 SSH，确保 22 已开放：ufw allow 22/tcp
# 启用防火墙（如果尚未启用，谨慎操作）：
# ufw enable

echo "[STEP] 放置 Nginx 站点配置（占位，稍后替换为你的域名）"
/bin/cp -f "$(pwd)/deploy/nginx.site.conf" /etc/nginx/sites-available/spirit-pet.conf || true
ln -sf /etc/nginx/sites-available/spirit-pet.conf /etc/nginx/sites-enabled/spirit-pet.conf || true
nginx -t && systemctl reload nginx || true

echo "[NEXT] 后续步骤："
echo "  1) 将项目代码放到 ${APP_DIR}（或保持在用户目录并映射卷）"
echo "  2) 在项目根目录创建 .env（参考 .env.example.production）"
echo "  3) 运行：docker compose up -d"
echo "  4) 申请证书（将 your-domain.com 替换为你的域名）："
echo "     certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "  5) 验证：https://${DOMAIN}/health 与 /api/info"
echo "[DONE] 初始化完成"