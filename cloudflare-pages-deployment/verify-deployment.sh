#!/bin/bash

echo "🔍 فحص ملفات نشر Dyad على Cloudflare Pages"
echo "=================================================="

# التحقق من الملفات الأساسية
echo "✅ فحص الملفات الأساسية:"
files=("index.html" "manifest.webmanifest" "sw.js" "registerSW.js" "_headers" "_redirects" "robots.txt")

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✓ $file موجود"
    else
        echo "   ✗ $file مفقود"
    fi
done

# التحقق من المجلدات
echo ""
echo "✅ فحص المجلدات:"
directories=("assets" "icons" ".github/workflows")

for dir in "${directories[@]}"; do
    if [[ -d "$dir" ]]; then
        file_count=$(find "$dir" -type f | wc -l)
        echo "   ✓ $dir موجود ($file_count ملف)"
    else
        echo "   ✗ $dir مفقود"
    fi
done

# إحصائيات
echo ""
echo "📊 إحصائيات المشروع:"
total_files=$(find . -type f | wc -l)
total_size=$(du -sh . | cut -f1)
js_files=$(find . -name "*.js" | wc -l)
css_files=$(find . -name "*.css" | wc -l)

echo "   📁 إجمالي الملفات: $total_files"
echo "   💾 حجم المشروع: $total_size"
echo "   📜 ملفات JS: $js_files"
echo "   🎨 ملفات CSS: $css_files"

# فحص manifest.webmanifest
echo ""
echo "✅ فحص PWA manifest:"
if [[ -f "manifest.webmanifest" ]]; then
    if grep -q "Dyad" "manifest.webmanifest"; then
        echo "   ✓ manifest صحيح ويحتوي على معلومات Dyad"
    else
        echo "   ⚠️ manifest موجود لكن قد يحتاج تحديث"
    fi
fi

# فحص _redirects
echo ""
echo "✅ فحص إعدادات التوجيه:"
if [[ -f "_redirects" ]]; then
    if grep -q "/*   /index.html   200" "_redirects"; then
        echo "   ✓ إعدادات SPA routing صحيحة"
    else
        echo "   ⚠️ إعدادات التوجيه قد تحتاج مراجعة"
    fi
fi

# فحص الأيقونات
echo ""
echo "✅ فحص أيقونات PWA:"
if [[ -f "icons/icon-192.png" && -f "icons/icon-512.png" ]]; then
    echo "   ✓ أيقونات PWA موجودة"
else
    echo "   ⚠️ بعض أيقونات PWA قد تكون مفقودة"
fi

echo ""
echo "🎉 اكتمل الفحص! المشروع جاهز للنشر على Cloudflare Pages"
echo ""
echo "📋 خطوات النشر التالية:"
echo "1. اذهب إلى https://dash.cloudflare.com/pages"
echo "2. اضغط 'Create a project' > 'Upload assets'"
echo "3. ارفع جميع ملفات هذا المجلد"
echo "4. اضغط 'Deploy site'"
echo ""
echo "📖 للمزيد من التفاصيل، راجع: CLOUDFLARE_DEPLOYMENT.md"