# Title2SVG 部署指南

完整的 GitHub Pages 部署指南，支持多种部署方式。

## 🌐 预览地址

部署完成后，你的应用将在以下地址可访问：

- **📱 在线体验**: [https://fecym.github.io/title2svg](https://fecym.github.io/title2svg)
- **📂 GitHub 仓库**: [https://github.com/fecym/title2svg](https://github.com/fecym/title2svg)
- **🔧 Actions 页面**: [https://github.com/fecym/title2svg/actions](https://github.com/fecym/title2svg/actions)

## 📋 目录

- [🚀 一键部署脚本（推荐）](#-一键部署脚本推荐)
- [⚙️ 手动部署方式](#️-手动部署方式)
- [🔧 部署配置说明](#-部署配置说明)
- [❓ 常见问题解决](#-常见问题解决)
- [🌐 访问和验证](#-访问和验证)

## 🚀 一键部署脚本（推荐）

我们提供了跨平台的自动化部署脚本，让部署变得超级简单！

### 📁 脚本说明

- **`deploy.sh`** - Linux/macOS 版本
- **`deploy.bat`** - Windows 版本
- **GitHub Actions** - 自动部署工作流 (`.github/workflows/deploy.yml`)

### ✨ 脚本功能特性

- ✅ **智能检查**: 自动检查 Git、pnpm 等依赖工具
- ✅ **状态检测**: 检查工作区状态和远程仓库配置
- ✅ **自动构建**: 自动安装依赖并构建项目
- ✅ **彩色日志**: 带颜色的日志输出，清晰明了
- ✅ **错误处理**: 完善的错误处理和提示信息
- ✅ **交互式**: 支持命令行参数和交互式选择
- ✅ **两种部署方式**: GitHub Actions 和手动部署

### 🖥️ Linux/macOS 使用方法

```bash
# 首次使用，给脚本添加执行权限
chmod +x deploy.sh

# 交互式使用（推荐新手）
./deploy.sh

# 命令行参数使用
./deploy.sh -a      # GitHub Actions 自动部署
./deploy.sh -m      # 手动部署到 gh-pages 分支
./deploy.sh -h      # 显示帮助信息
```

### 💻 Windows 使用方法

```cmd
# 交互式使用（推荐新手）
deploy.bat

# 命令行参数使用
deploy.bat -a       # GitHub Actions 自动部署
deploy.bat -m       # 手动部署到 gh-pages 分支
deploy.bat -h       # 显示帮助信息
```

### 🎯 部署流程详解

#### GitHub Actions 自动部署（推荐）

1. **检查环境**：脚本自动检查必要工具
2. **检查Git状态**：确认工作区状态
3. **构建项目**：自动安装依赖并构建
4. **提交代码**：如有未提交更改，提示输入提交信息
5. **推送到GitHub**：推送到 main 分支触发 GitHub Actions
6. **自动部署**：GitHub Actions 自动构建并部署到 Pages

#### 手动部署到 gh-pages

1. **检查环境**：同上
2. **构建项目**：同上
3. **创建部署分支**：在 dist 目录初始化新的 Git 仓库
4. **推送到gh-pages**：强制推送到 gh-pages 分支
5. **清理临时文件**：清理部署过程中的临时文件

## ⚙️ 手动部署方式

如果不使用脚本，也可以手动执行以下步骤：

### 方法一：GitHub Actions 手动触发

```bash
# 1. 确保代码已提交
git add .
git commit -m "准备部署"

# 2. 构建项目
pnpm install
pnpm build

# 3. 推送到main分支
git push origin main

# 4. 在GitHub仓库设置中启用Pages
#    Settings → Pages → Source: GitHub Actions
```

### 方法二：手动部署到 gh-pages 分支

```bash
# 1. 构建项目
pnpm install
pnpm build

# 2. 进入构建目录
cd dist

# 3. 初始化git仓库
git init
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"

# 4. 推送到gh-pages分支
git push -f https://github.com/fecym/title2svg.git main:gh-pages

# 5. 返回项目根目录
cd ..

# 6. 在GitHub仓库设置中启用Pages
#    Settings → Pages → Source: Deploy from a branch → gh-pages
```

## 🔧 部署配置说明

### Vite 配置

项目已预配置 Vite 用于 GitHub Pages 部署：

```javascript
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  base: '/title2svg/',  // 重要：匹配仓库名
  server: {
    port: 3000,
    open: true
  }
})
```

### GitHub Actions 工作流

`.github/workflows/deploy.yml` 配置说明：

- **触发条件**: push 到 main 分支
- **Node.js版本**: 18
- **包管理器**: pnpm 8
- **部署目标**: ./dist 目录
- **权限**: 使用 GITHUB_TOKEN

### package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",           // 开发服务器
    "build": "vite build",   // 构建生产版本
    "preview": "vite preview" // 预览构建结果
  }
}
```

## ❓ 常见问题解决

### 1. 脚本权限问题

**Linux/macOS**:
```bash
chmod +x deploy.sh
```

**Windows**: 如果无法执行，右键 → 属性 → 安全，确保有执行权限

### 2. Git 相关问题

**未配置远程仓库**:
```bash
git remote add origin https://github.com/fecym/title2svg.git
```

**推送失败（认证问题）**:
- 确保已配置 GitHub 认证（Personal Access Token 或 SSH Key）
- 使用 HTTPS: `git remote set-url origin https://github.com/fecym/title2svg.git`
- 使用 SSH: `git remote set-url origin git@github.com:fecym/title2svg.git`

### 3. 构建失败

**依赖安装失败**:
```bash
# 清除缓存重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**构建错误**:
```bash
# 检查 Node.js 版本（推荐 16+）
node --version

# 更新依赖
pnpm update
```

### 4. GitHub Pages 问题

**Pages 未启用**:
1. 进入仓库 Settings → Pages
2. 选择正确的 Source:
   - GitHub Actions (推荐)
   - Deploy from a branch → gh-pages

**404 错误**:
- 检查 `vite.config.js` 中的 `base` 配置是否正确
- 确保仓库名和配置一致

**更新未生效**:
- GitHub Pages 有缓存，可能需要等待几分钟
- 强制刷新浏览器 (Ctrl+F5)

### 5. 路径问题

**资源加载失败**:
- 确保 `base: '/title2svg/'` 与仓库名匹配
- 检查构建后的 `index.html` 中资源路径是否正确

## 🌐 访问和验证

### 部署完成后的访问地址

| 类型 | 地址 | 说明 |
|------|------|------|
| 🌐 **主应用** | [https://fecym.github.io/title2svg](https://fecym.github.io/title2svg) | 线上版本，供用户使用 |
| 📂 **仓库首页** | [https://github.com/fecym/title2svg](https://github.com/fecym/title2svg) | 源代码和文档 |
| 🔧 **Actions** | [https://github.com/fecym/title2svg/actions](https://github.com/fecym/title2svg/actions) | 查看部署状态和日志 |
| ⚙️ **Settings** | [https://github.com/fecym/title2svg/settings/pages](https://github.com/fecym/title2svg/settings/pages) | Pages 设置页面 |

> 💡 **快速访问**: 建议将主应用地址添加到浏览器书签，方便日常使用

### 验证部署状态

1. **GitHub Actions**: 仓库页面 → Actions 选项卡，查看构建状态
2. **Pages 状态**: Settings → Pages，查看部署状态
3. **访问测试**: 打开部署链接，测试功能是否正常

### 部署日志查看

**GitHub Actions 日志**:
1. 进入仓库 Actions 页面
2. 点击最新的工作流运行
3. 查看详细的构建和部署日志

**本地脚本日志**:
- 脚本运行时会显示彩色日志
- 出现错误时会显示详细错误信息

## 📞 技术支持

如果遇到部署问题：

1. **检查日志**: 查看 GitHub Actions 或脚本的错误日志
2. **验证配置**: 确认 Vite 配置和仓库设置正确
3. **清理重试**: 删除 `dist` 目录重新构建
4. **权限检查**: 确认 GitHub 仓库权限和 Personal Access Token

---

**Happy Deploying! 🚀**