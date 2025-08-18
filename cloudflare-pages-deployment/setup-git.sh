#!/bin/bash

echo "🚀 إعداد Dyad للرفع على GitHub"
echo "=================================="

# التحقق من وجود git
if ! command -v git &> /dev/null; then
    echo "❌ Git غير مثبت. يرجى تثبيت Git أولاً:"
    echo "   Windows: https://git-scm.com/download/win"
    echo "   Mac: brew install git"
    echo "   Linux: sudo apt install git"
    exit 1
fi

echo "✅ Git موجود"

# إعداد Git إذا لم يكن معداً
if [[ -z "$(git config --global user.name)" ]]; then
    echo ""
    echo "⚙️ إعداد Git:"
    echo "git config --global user.name \"Your Name\""
    echo "git config --global user.email \"your.email@example.com\""
    echo ""
    echo "يرجى تشغيل الأوامر أعلاه أولاً، ثم إعادة تشغيل هذا الـ script"
    exit 1
fi

# التحقق من وجود .git directory
if [[ -d ".git" ]]; then
    echo "✅ Git repository موجود بالفعل"
else
    echo "🔧 إنشاء Git repository جديد..."
    git init
    echo "✅ تم إنشاء Git repository"
fi

# إضافة الملفات
echo "📁 إضافة الملفات..."
git add .

# إنشاء commit
if git diff-index --quiet HEAD --; then
    echo "ℹ️ لا توجد تغييرات جديدة للـ commit"
else
    echo "💾 إنشاء commit..."
    git commit -m "Initial Dyad deployment for Cloudflare Pages

- Complete web deployment package for Dyad AI App Builder
- PWA configuration with manifest and service worker
- Optimized for Cloudflare Pages deployment
- GitHub Actions workflow included
- Arabic documentation provided

Built from: https://github.com/dyad-sh/dyad v0.6.0"
    echo "✅ تم إنشاء commit بنجاح"
fi

echo ""
echo "🎉 Git repository جاهز!"
echo ""
echo "📋 الخطوات التالية:"
echo "1. إنشاء مستودع على GitHub:"
echo "   - اذهب إلى https://github.com/new"
echo "   - Repository name: dyad-cloudflare-pages"  
echo "   - اختر Public"
echo "   - اضغط Create repository"
echo ""
echo "2. ربط المستودع المحلي بـ GitHub:"
echo "   git remote add origin https://github.com/[username]/dyad-cloudflare-pages.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. أو استخدام GitHub CLI (إذا كان مثبت):"
echo "   gh repo create dyad-cloudflare-pages --public --source=. --remote=origin --push"
echo ""
echo "📖 للمزيد من التفاصيل، راجع: GITHUB_SETUP_GUIDE.md"