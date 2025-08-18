#!/bin/bash

echo "🚀 رفع Dyad إلى GitHub - دليل تفصيلي"
echo "========================================"
echo ""

# التحقق من النظام
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 نظام Windows مكتشف"
    SYSTEM="windows"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 نظام macOS مكتشف" 
    SYSTEM="mac"
else
    echo "🐧 نظام Linux مكتشف"
    SYSTEM="linux"
fi

echo ""
echo "📋 الخطوات المطلوبة:"
echo "===================="

echo ""
echo "1️⃣ إنشاء مستودع على GitHub:"
echo "   - اذهب إلى: https://github.com/new"
echo "   - Repository name: dyad-cloudflare-pages"
echo "   - اختر: Public"
echo "   - لا تضع ✓ في 'Add a README file'"
echo "   - اضغط: Create repository"

echo ""
echo "2️⃣ تحضير الملفات محلياً:"
echo "   أ) تحميل الملفات:"
echo "      - حمل dyad-github-ready.zip من Scout"
echo "      - استخرج الملفات في مجلد dyad-cloudflare-pages"
echo ""
echo "   ب) أو نسخ الملفات:"
echo "      - انسخ محتويات هذا المجلد إلى مجلد جديد"

echo ""
echo "3️⃣ إعداد Git (إذا لم يكن مثبتاً):"

if [[ $SYSTEM == "windows" ]]; then
    echo "   Windows:"
    echo "   - حمل Git من: https://git-scm.com/download/win"
    echo "   - ثبت Git وأعد تشغيل Command Prompt"
elif [[ $SYSTEM == "mac" ]]; then
    echo "   macOS:"
    echo "   brew install git"
    echo "   # أو حمل من: https://git-scm.com/download/mac"
else
    echo "   Linux (Ubuntu/Debian):"
    echo "   sudo apt update && sudo apt install git"
    echo "   # أو Fedora: sudo dnf install git"
fi

echo ""
echo "4️⃣ إعداد Git (مرة واحدة فقط):"
echo '   git config --global user.name "Your Name"'
echo '   git config --global user.email "your.email@example.com"'

echo ""
echo "5️⃣ رفع الملفات:"
echo "   # انتقل لمجلد المشروع"
echo "   cd dyad-cloudflare-pages"
echo ""
echo "   # إعداد Git"
echo "   git init"
echo "   git add ."
echo '   git commit -m "Initial Dyad deployment for Cloudflare Pages"'
echo ""
echo "   # ربط المستودع (استبدل USERNAME باسم المستخدم)"
echo "   git remote add origin https://github.com/USERNAME/dyad-cloudflare-pages.git"
echo "   git branch -M main"
echo "   git push -u origin main"

echo ""
echo "6️⃣ البديل: GitHub CLI (أسهل):"
echo "   # تثبيت GitHub CLI من: https://cli.github.com"
echo "   gh auth login"
echo "   cd dyad-cloudflare-pages"
echo "   gh repo create dyad-cloudflare-pages --public --source=. --remote=origin --push"

echo ""
echo "7️⃣ البديل: GitHub Desktop (الأسهل):"
echo "   - حمل GitHub Desktop من: https://desktop.github.com"
echo "   - File > Add Local Repository"
echo "   - اختر مجلد dyad-cloudflare-pages"  
echo "   - Repository > Push origin"

echo ""
echo "🔗 ربط Cloudflare Pages:"
echo "========================"
echo "بعد رفع المستودع:"
echo "1. اذهب إلى: https://dash.cloudflare.com/pages"
echo "2. Create a project > Connect to Git"
echo "3. اختر مستودع dyad-cloudflare-pages"
echo "4. Framework preset: None"
echo "5. Build output directory: /"
echo "6. Save and Deploy"

echo ""
echo "💡 نصائح مهمة:"
echo "=============="
echo "• تأكد من نسخ ملف .github/workflows/ للنشر التلقائي"
echo "• لا ترفع API keys في الكود"
echo "• استخدم Environment Variables في Cloudflare Pages"
echo "• ستحصل على رابط تطبيق مثل: dyad-cloudflare-pages.pages.dev"

echo ""
echo "❓ حل المشاكل:"
echo "============="
echo "• إذا كانت كلمة المرور مطلوبة، استخدم Personal Access Token"
echo "• إذا فشل git push، تأكد من صحة اسم المستودع"
echo "• للمساعدة: https://docs.github.com/en/github/importing-your-projects-to-github"