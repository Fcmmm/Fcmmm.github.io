@echo off
echo ====================================
echo 博客部署脚本 — 自动拉取 + 构建
echo ====================================
echo.
echo [1/3] 从 GitHub 拉取最新源码...
git pull
if errorlevel 1 (
    echo ❌ 拉取失败，请检查网络或解决冲突
    pause
    exit /b 1
)
echo ✅ 源码已同步
echo.
echo [2/3] 清理并生成静态文件...
npx hexo clean
npx hexo generate
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建完成
echo.
echo [3/3] 部署到 GitHub Pages...
npx hexo deploy
if errorlevel 1 (
    echo ❌ 部署失败，请检查网络
    pause
    exit /b 1
)
echo.
echo ====================================
echo ✅ 部署成功！
echo ====================================
pause
