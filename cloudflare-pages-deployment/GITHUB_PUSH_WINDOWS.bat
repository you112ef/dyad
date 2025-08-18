@echo off
echo 🚀 رفع Dyad إلى GitHub - Windows
echo ===================================
echo.

echo 📋 الخطوات المطلوبة:
echo ====================
echo.

echo 1️⃣ إنشاء مستودع على GitHub:
echo    - اذهب إلى: https://github.com/new
echo    - Repository name: dyad-cloudflare-pages
echo    - اختر: Public
echo    - اضغط: Create repository
echo.

echo 2️⃣ تثبيت Git (إذا لم يكن مثبتاً):
echo    - حمل من: https://git-scm.com/download/win
echo    - ثبت وأعد تشغيل Command Prompt
echo.

echo 3️⃣ إعداد Git (مرة واحدة فقط):
echo    git config --global user.name "Your Name"
echo    git config --global user.email "your.email@example.com"
echo.

echo 4️⃣ الأوامر للنسخ واللصق:
echo ========================
echo.
echo # انتقل لمجلد المشروع
echo cd dyad-cloudflare-pages
echo.
echo # إعداد Git
echo git init
echo git add .
echo git commit -m "Initial Dyad deployment for Cloudflare Pages"
echo.
echo # ربط المستودع (استبدل USERNAME باسم المستخدم)
echo git remote add origin https://github.com/USERNAME/dyad-cloudflare-pages.git
echo git branch -M main
echo git push -u origin main
echo.

echo 5️⃣ بديل أسهل - GitHub Desktop:
echo    - حمل من: https://desktop.github.com
echo    - File ^> Add Local Repository
echo    - اختر مجلد المشروع
echo    - Repository ^> Push origin
echo.

echo 6️⃣ ربط Cloudflare Pages:
echo    https://dash.cloudflare.com/pages
echo.

pause