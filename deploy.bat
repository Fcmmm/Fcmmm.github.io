@echo off
echo ====================================
echo 博客部署脚本 — 构建 + 推送源码
echo ====================================
echo.
echo [1/2] 清理并生成静态文件...
npx hexo clean
npx hexo generate
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)
echo ✅ 构建完成
echo.
echo [2/2] 推送源码到 GitHub（Actions 自动部署）...
git add .
git commit -m "博客更新"
git push origin source
if errorlevel 1 (
    echo ❌ 推送失败，请检查网络
    pause
    exit /b 1
)
echo.
echo ====================================
echo ✅ 推送成功！GitHub Actions 正在部署...
echo ====================================
pause
