#!/bin/bash

# Title2SVG 部署脚本
# 支持自动部署到 GitHub Pages

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查必要工具
check_dependencies() {
    log_info "检查依赖工具..."
    check_command "git"
    check_command "pnpm"
    log_success "依赖检查完成"
}

# 检查Git状态
check_git_status() {
    if [ ! -d ".git" ]; then
        log_error "当前目录不是Git仓库"
        exit 1
    fi

    if [ -n "$(git status --porcelain)" ]; then
        log_warning "工作区有未提交的更改"
        echo "未提交的文件："
        git status --short
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 1
        fi
    fi
}

# 构建项目
build_project() {
    log_info "安装依赖..."
    pnpm install

    log_info "构建项目..."
    pnpm build

    if [ ! -d "dist" ]; then
        log_error "构建失败，dist 目录不存在"
        exit 1
    fi

    log_success "项目构建完成"
}

# GitHub Actions 自动部署
deploy_github_actions() {
    log_info "准备 GitHub Actions 自动部署..."

    # 检查是否有远程仓库
    if ! git remote get-url origin &> /dev/null; then
        log_error "未配置远程仓库，请先添加 origin 远程仓库"
        echo "示例: git remote add origin https://github.com/用户名/title2svg.git"
        exit 1
    fi

    REMOTE_URL=$(git remote get-url origin)
    log_info "远程仓库: $REMOTE_URL"

    # 提交并推送代码
    if [ -n "$(git status --porcelain)" ]; then
        read -p "输入提交信息 (默认: Update project): " COMMIT_MSG
        COMMIT_MSG=${COMMIT_MSG:-"Update project"}

        git add .
        git commit -m "$COMMIT_MSG"
    fi

    log_info "推送代码到 GitHub..."
    git push origin main

    log_success "代码已推送到 GitHub"
    echo ""
    echo "🚀 GitHub Actions 将自动开始部署"
    echo "📝 请在 GitHub 仓库设置中启用 Pages (Settings → Pages → Source: GitHub Actions)"
    echo ""
    echo "📍 相关地址："

    # 提取用户名和仓库名
    USER_REPO=$(echo $REMOTE_URL | sed 's/.*github\.com[\/:]//; s/\.git$//')
    USER_NAME=$(echo $USER_REPO | cut -d'/' -f1)
    REPO_NAME=$(echo $USER_REPO | cut -d'/' -f2)

    echo "   🌐 预览地址: https://${USER_NAME}.github.io/${REPO_NAME}"
    echo "   📂 仓库地址: https://github.com/${USER_REPO}"
    echo "   🔧 Actions:  https://github.com/${USER_REPO}/actions"
}

# 手动部署到 gh-pages 分支
deploy_manual() {
    log_info "开始手动部署..."

    # 检查是否有远程仓库
    if ! git remote get-url origin &> /dev/null; then
        log_error "未配置远程仓库，请先添加 origin 远程仓库"
        exit 1
    fi

    # 进入构建目录
    cd dist

    # 初始化git仓库
    git init
    git add -A
    git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"

    # 推送到gh-pages分支
    REMOTE_URL=$(cd .. && git remote get-url origin)
    log_info "推送到 gh-pages 分支..."
    git push -f "$REMOTE_URL" main:gh-pages

    cd ..
    rm -rf dist/.git

    log_success "手动部署完成"
    echo ""
    echo "📍 相关地址："

    # 提取用户名和仓库名
    USER_REPO=$(echo $REMOTE_URL | sed 's/.*github\.com[\/:]//; s/\.git$//')
    USER_NAME=$(echo $USER_REPO | cut -d'/' -f1)
    REPO_NAME=$(echo $USER_REPO | cut -d'/' -f2)

    echo "   🌐 预览地址: https://${USER_NAME}.github.io/${REPO_NAME}"
    echo "   📂 仓库地址: https://github.com/${USER_REPO}"
    echo "   ⚙️ Pages设置: https://github.com/${USER_REPO}/settings/pages"
    echo ""
    echo "💡 几分钟后即可通过预览地址访问您的应用"
}

# 显示帮助信息
show_help() {
    echo "Title2SVG 部署脚本"
    echo ""
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -a, --auto      GitHub Actions 自动部署 (推荐)"
    echo "  -m, --manual    手动部署到 gh-pages 分支"
    echo "  -h, --help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh -a    # 自动部署"
    echo "  ./deploy.sh -m    # 手动部署"
}

# 主函数
main() {
    echo "🚀 Title2SVG 部署脚本"
    echo "=================="

    case "${1:-}" in
        -a|--auto)
            check_dependencies
            check_git_status
            build_project
            deploy_github_actions
            ;;
        -m|--manual)
            check_dependencies
            check_git_status
            build_project
            deploy_manual
            ;;
        -h|--help)
            show_help
            ;;
        "")
            echo "请选择部署方式:"
            echo "1) GitHub Actions 自动部署 (推荐)"
            echo "2) 手动部署到 gh-pages 分支"
            echo "3) 显示帮助信息"
            echo ""
            read -p "请输入选择 (1-3): " -n 1 -r
            echo ""
            case $REPLY in
                1)
                    check_dependencies
                    check_git_status
                    build_project
                    deploy_github_actions
                    ;;
                2)
                    check_dependencies
                    check_git_status
                    build_project
                    deploy_manual
                    ;;
                3)
                    show_help
                    ;;
                *)
                    log_error "无效选择"
                    exit 1
                    ;;
            esac
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"