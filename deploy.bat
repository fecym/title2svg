@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: Title2SVG 部署脚本 (Windows版本)
:: 支持自动部署到 GitHub Pages

echo 🚀 Title2SVG 部署脚本
echo ==================

:: 检查Git是否安装
git --version > nul 2>&1
if errorlevel 1 (
    echo [错误] Git 未安装，请先安装 Git
    pause
    exit /b 1
)

:: 检查pnpm是否安装
pnpm --version > nul 2>&1
if errorlevel 1 (
    echo [错误] pnpm 未安装，请先安装 pnpm
    pause
    exit /b 1
)

:: 检查是否为Git仓库
if not exist ".git" (
    echo [错误] 当前目录不是Git仓库
    pause
    exit /b 1
)

:: 显示菜单
if "%1"=="-a" goto auto_deploy
if "%1"=="--auto" goto auto_deploy
if "%1"=="-m" goto manual_deploy
if "%1"=="--manual" goto manual_deploy
if "%1"=="-h" goto show_help
if "%1"=="--help" goto show_help

echo 请选择部署方式:
echo 1) GitHub Actions 自动部署 (推荐)
echo 2) 手动部署到 gh-pages 分支
echo 3) 显示帮助信息
echo.
set /p choice="请输入选择 (1-3): "

if "%choice%"=="1" goto auto_deploy
if "%choice%"=="2" goto manual_deploy
if "%choice%"=="3" goto show_help
echo [错误] 无效选择
pause
exit /b 1

:auto_deploy
echo [信息] GitHub Actions 自动部署模式
echo.

:: 检查Git状态
git status --porcelain > temp_status.txt
set /p git_status=<temp_status.txt
del temp_status.txt

if not "!git_status!"=="" (
    echo [警告] 工作区有未提交的更改
    git status --short
    set /p continue="是否继续部署？(y/N): "
    if not "!continue!"=="y" if not "!continue!"=="Y" (
        echo [信息] 部署已取消
        pause
        exit /b 1
    )
)

:: 检查远程仓库
git remote get-url origin > nul 2>&1
if errorlevel 1 (
    echo [错误] 未配置远程仓库，请先添加 origin 远程仓库
    echo 示例: git remote add origin https://github.com/用户名/title2svg.git
    pause
    exit /b 1
)

:: 构建项目
echo [信息] 安装依赖...
pnpm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo [信息] 构建项目...
pnpm build
if errorlevel 1 (
    echo [错误] 项目构建失败
    pause
    exit /b 1
)

if not exist "dist" (
    echo [错误] 构建失败，dist 目录不存在
    pause
    exit /b 1
)

:: 提交并推送代码
git status --porcelain > temp_status.txt
set /p git_status=<temp_status.txt
del temp_status.txt

if not "!git_status!"=="" (
    set /p commit_msg="输入提交信息 (默认: Update project): "
    if "!commit_msg!"=="" set commit_msg=Update project

    git add .
    git commit -m "!commit_msg!"
)

echo [信息] 推送代码到 GitHub...
git push origin main
if errorlevel 1 (
    echo [错误] 推送失败
    pause
    exit /b 1
)

echo.
echo [成功] 代码已推送到 GitHub
echo.
echo 🚀 GitHub Actions 将自动开始部署
echo 📝 请在 GitHub 仓库设置中启用 Pages (Settings → Pages → Source: GitHub Actions)
echo.
echo 📍 相关地址：

:: 从远程URL提取用户名和仓库名
for /f "tokens=*" %%i in ('git remote get-url origin') do set remote_url=%%i
echo !remote_url! | findstr /C:"github.com" > nul
if not errorlevel 1 (
    for /f "tokens=4,5 delims=/" %%a in ("!remote_url!") do (
        set user_name=%%a
        set repo_name=%%b
    )
    for /f "tokens=*" %%i in ("!repo_name!") do set repo_name=%%~ni
    echo    🌐 预览地址: https://!user_name!.github.io/!repo_name!
    echo    📂 仓库地址: https://github.com/!user_name!/!repo_name!
    echo    🔧 Actions:  https://github.com/!user_name!/!repo_name!/actions
)
echo.
pause
exit /b 0

:manual_deploy
echo [信息] 手动部署模式
echo.

:: 检查远程仓库
git remote get-url origin > nul 2>&1
if errorlevel 1 (
    echo [错误] 未配置远程仓库，请先添加 origin 远程仓库
    pause
    exit /b 1
)

:: 构建项目
echo [信息] 安装依赖...
pnpm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo [信息] 构建项目...
pnpm build
if errorlevel 1 (
    echo [错误] 项目构建失败
    pause
    exit /b 1
)

if not exist "dist" (
    echo [错误] 构建失败，dist 目录不存在
    pause
    exit /b 1
)

:: 获取远程仓库URL
for /f "tokens=*" %%i in ('git remote get-url origin') do set remote_url=%%i

:: 进入构建目录
cd dist

:: 初始化git仓库
git init
git add -A

:: 获取当前时间作为提交信息
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set mm=%%a
    set dd=%%b
    set yyyy=%%c
)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (
    set time=%%a:%%b
)

git commit -m "deploy: %yyyy%-%mm%-%dd% %time%"

:: 推送到gh-pages分支
echo [信息] 推送到 gh-pages 分支...
git push -f "%remote_url%" main:gh-pages
if errorlevel 1 (
    echo [错误] 推送失败
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo [成功] 手动部署完成
echo.
echo 📍 相关地址：

:: 从远程URL提取用户名和仓库名
echo !remote_url! | findstr /C:"github.com" > nul
if not errorlevel 1 (
    for /f "tokens=4,5 delims=/" %%a in ("!remote_url!") do (
        set user_name=%%a
        set repo_name=%%b
    )
    for /f "tokens=*" %%i in ("!repo_name!") do set repo_name=%%~ni
    echo    🌐 预览地址: https://!user_name!.github.io/!repo_name!
    echo    📂 仓库地址: https://github.com/!user_name!/!repo_name!
    echo    ⚙️ Pages设置: https://github.com/!user_name!/!repo_name!/settings/pages
)
echo.
echo 💡 几分钟后即可通过预览地址访问您的应用
echo.
pause
exit /b 0

:show_help
echo Title2SVG 部署脚本 (Windows版本)
echo.
echo 用法: deploy.bat [选项]
echo.
echo 选项:
echo   -a, --auto      GitHub Actions 自动部署 (推荐)
echo   -m, --manual    手动部署到 gh-pages 分支
echo   -h, --help      显示帮助信息
echo.
echo 示例:
echo   deploy.bat -a    # 自动部署
echo   deploy.bat -m    # 手动部署
echo.
pause
exit /b 0