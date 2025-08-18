# ✅ قائمة تحقق رفع Dyad إلى GitHub

## قبل البدء - تأكد من وجود:
- [ ] حساب GitHub (إنشاء من: https://github.com/signup)
- [ ] الملفات محملة محلياً (dyad-cloudflare-pages/)
- [ ] Git مثبت (تحقق بـ: `git --version`)

## الطريقة 1: GitHub Desktop (الأسهل - مُوصى بها للمبتدئين)
- [ ] تحميل GitHub Desktop من: https://desktop.github.com
- [ ] تسجيل الدخول بحساب GitHub
- [ ] File → Clone repository from the Internet → Create
- [ ] Repository name: `dyad-cloudflare-pages`
- [ ] Local path: اختر مجلد فارغ
- [ ] Create repository
- [ ] نسخ جميع ملفات Dyad إلى المجلد
- [ ] في GitHub Desktop: Review changes → Commit to main
- [ ] Publish repository (تأكد من Public)

## الطريقة 2: موقع GitHub (سهل - للملفات القليلة)
- [ ] اذهب إلى: https://github.com/new
- [ ] Repository name: `dyad-cloudflare-pages`
- [ ] اختر: Public
- [ ] Create repository
- [ ] اضغط: "uploading an existing file"
- [ ] سحب وإسقاط جميع الملفات (أو اختيار الملفات)
- [ ] Commit message: "Initial Dyad deployment"
- [ ] Commit new files

## الطريقة 3: سطر الأوامر (للمطورين)
- [ ] إعداد Git:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- [ ] إنشاء مستودع على GitHub.com (كما في الطريقة 2)
- [ ] في Terminal/Command Prompt:
  ```bash
  cd dyad-cloudflare-pages
  git init
  git add .
  git commit -m "Initial Dyad deployment for Cloudflare Pages"
  git remote add origin https://github.com/USERNAME/dyad-cloudflare-pages.git
  git branch -M main
  git push -u origin main
  ```

## الطريقة 4: GitHub CLI (الأسرع للمطورين)
- [ ] تثبيت من: https://cli.github.com
- [ ] تسجيل الدخول: `gh auth login`
- [ ] في Terminal:
  ```bash
  cd dyad-cloudflare-pages
  gh repo create dyad-cloudflare-pages --public --source=. --remote=origin --push
  ```

## بعد الرفع - التحقق:
- [ ] المستودع موجود على: https://github.com/USERNAME/dyad-cloudflare-pages
- [ ] جميع الملفات مرفوعة (379 ملف تقريباً)
- [ ] ملفات مهمة موجودة:
  - [ ] index.html
  - [ ] assets/ (مجلد بملفات JS و CSS)
  - [ ] _headers و _redirects
  - [ ] .github/workflows/deploy.yml
  - [ ] manifest.webmanifest

## ربط Cloudflare Pages:
- [ ] اذهب إلى: https://dash.cloudflare.com/pages
- [ ] Create a project → Connect to Git
- [ ] Connect GitHub (إذا لم يكن مربوط)
- [ ] اختر مستودع: `dyad-cloudflare-pages`
- [ ] إعدادات:
  - [ ] Framework preset: None
  - [ ] Build command: (فارغ)
  - [ ] Build output directory: `/`
  - [ ] Root directory: `/`
- [ ] Environment variables (اختياري):
  - [ ] OPENAI_API_KEY
  - [ ] ANTHROPIC_API_KEY
  - [ ] GOOGLE_API_KEY
- [ ] Save and Deploy
- [ ] انتظار انتهاء النشر (2-3 دقائق)
- [ ] التطبيق متاح على: `dyad-cloudflare-pages.pages.dev`

## اختبار التطبيق:
- [ ] الصفحة الرئيسية تحمل
- [ ] واجهة Dyad تظهر بشكل صحيح
- [ ] يمكن تثبيته كـ PWA (خيار Install App في Chrome)
- [ ] محرر الكود يعمل
- [ ] النشر التلقائي يعمل (عند push جديد)

## حل المشاكل الشائعة:
- [ ] **Git not found**: تثبيت Git من https://git-scm.com
- [ ] **Permission denied**: استخدام Personal Access Token بدل كلمة المرور
- [ ] **Repository exists**: اختيار اسم مختلف أو حذف المستودع الموجود
- [ ] **Large files**: تأكد من عدم تجاوز حد GitHub (100MB للملف الواحد)
- [ ] **Deploy failed**: تحقق من إعدادات Cloudflare Pages

## روابط للمساعدة:
- [ ] وثائق Git: https://git-scm.com/doc
- [ ] وثائق GitHub: https://docs.github.com
- [ ] وثائق Cloudflare Pages: https://developers.cloudflare.com/pages

✅ **عند إكمال جميع النقاط، ستكون قد نشرت Dyad بنجاح على Cloudflare Pages!**