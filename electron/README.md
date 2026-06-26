# تشغيل التطبيق على الكمبيوتر (Electron)

## المتطلبات
- Node.js 18+ مثبت على جهازك
- اتصال إنترنت في أول تشغيل فقط (لتحميل وكاش التطبيق)

## خطوات سريعة

### 1) انشر التطبيق من Lovable أولاً
اضغط Publish في Lovable للحصول على رابط ثابت، ثم عدّل `APP_URL` في `electron/main.cjs`
ليطابق رابط النشر النهائي (مثال: `https://your-app.lovable.app`).

### 2) ثبّت الاعتمادات على جهازك
```bash
npm install --save-dev electron @electron/packager
```

### 3) جرّب التشغيل
```bash
npx electron electron/main.cjs
```

### 4) أنشئ ملف تثبيت لويندوز
```bash
npx @electron/packager . "GamasaViolations" ^
  --platform=win32 --arch=x64 ^
  --out=release --overwrite ^
  --ignore="^/src" --ignore="^/public" --ignore="^/release"
```
سيتولد مجلد `release/GamasaViolations-win32-x64/` بداخله `GamasaViolations.exe`.

### 5) (اختياري) للماك أو لينكس
غيّر `--platform=darwin` أو `--platform=linux`.

## كيف يعمل أوفلاين؟
- النافذة تستخدم partition دائم (`persist:gamasa-violations`) فيُحفظ:
  - كاش الـ Service Worker (كل ملفات التطبيق)
  - localStorage (كل بيانات المخالفات)
- في أول تشغيل: التطبيق يتصل بالإنترنت ويُكش كل شيء.
- بعد ذلك: يفتح ويعمل بالكامل بدون إنترنت، والبيانات تبقى محفوظة بين التشغيلات.
