# music980
## 项目介绍
  这是一个基于Vue3的音乐播放器项目。

## 项目部署
- Node.js 版本：20.19+ 或 22.12+（Vite 7 强制要求）
- MySQL 版本：5.7 或以上
### 1.前端部署
- npm install
### 2.后端部署
- cd backend
- npm install

### 3.配置环境变量（必做）
后端所有敏感配置都在 `backend/.env` 中，**该文件不会提交到 git**：
- `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`：数据库连接信息
- `JWT_SECRET`：JWT 签名密钥（务必保密，泄露等于后台大门敞开）
- `ADMIN_PASSWORD`：首次启动时创建 admin 账号的初始密码
- `CORS_ORIGIN`：允许访问的前端来源，逗号分隔

前端生产环境 API 地址在 `.env.production` 的 `VITE_API_BASE_URL`，部署时改为实际域名。

## 启动服务
### 1.前端服务
- npm run dev
### 2.后端服务
- cd backend && npm start

## 管理员账号
- 账号：admin
- 初始密码：见 `backend/.env` 的 `ADMIN_PASSWORD`；未配置时首次启动会生成随机密码并打印到后端控制台（仅显示一次）
- 进入管理页面：http://localhost:5173/admin

## 功能特性
- 随机音乐播放、上传音乐（mp3/wav/flac/ogg/m4a，封面 jpg/png/webp/gif）
- 点赞、评论
- 管理后台：用户 / 评论 / 歌曲管理（删除用户/歌曲会同步清理磁盘文件，管理员账号受保护）

## 安全说明
- 密码使用 bcrypt 加密存储；接口使用 JWT 认证
- 登录/注册接口已加限流（每 IP 15 分钟 30 次）
- 上传文件有类型白名单和大小限制（音乐 30MB，封面 5MB）
