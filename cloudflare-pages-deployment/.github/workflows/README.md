# GitHub Actions للنشر التلقائي

## إعداد GitHub Actions للنشر على Cloudflare Pages

هذا المجلد يحتوي على workflow للنشر التلقائي للتطبيق على Cloudflare Pages عند كل push إلى المستودع.

### المتطلبات

#### 1. إعداد GitHub Secrets

في إعدادات المستودع، أضف المتغيرات التالية في **Settings > Secrets and variables > Actions**:

**Required Secrets:**
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token مع صلاحية Cloudflare Pages
- `CLOUDFLARE_ACCOUNT_ID`: معرف حساب Cloudflare الخاص بك

#### 2. الحصول على Cloudflare API Token

1. اذهب إلى [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. انقر "Create Token" 
3. استخدم قالب "Cloudflare Pages" أو أنشئ token مخصص مع الصلاحيات:
   - Zone: Zone Settings:Read, Zone:Read
   - Account: Cloudflare Pages:Edit

#### 3. العثور على Account ID

1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. في الشريط الجانبي الأيمن، انسخ "Account ID"

### كيف يعمل

- **التفعيل**: يعمل عند كل push إلى branch `main` أو `cursor/create-stealthy-multi-layered-code-e0db`
- **النشر**: ينشر جميع ملفات المشروع مباشرة إلى Cloudflare Pages
- **المشروع**: يستهدف مشروع باسم `dyad-ai-app` في Cloudflare
- **التحديث**: يحدث تلقائياً بدون تدخل يدوي

### استكشاف الأخطاء

**خطأ "Authentication failed":**
- تأكد من صحة `CLOUDFLARE_API_TOKEN`
- تأكد من أن Token له الصلاحيات المطلوبة

**خطأ "Project not found":**
- تأكد من وجود مشروع بنفس الاسم `dyad-ai-app` في Cloudflare Pages
- أو قم بتغيير `projectName` في ملف `deploy.yml`

**خطأ "Account ID invalid":**
- تأكد من صحة `CLOUDFLARE_ACCOUNT_ID` في GitHub Secrets

### تخصيص الـ Workflow

يمكن تعديل ملف `deploy.yml` لتخصيص:
- اسم المشروع (`projectName`)
- أي إعدادات إضافية للنشر
- شروط التفعيل (`on` section)