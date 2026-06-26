# تشغيل التطبيق على الكمبيوتر (Tauri)

تطبيق Tauri يفتح نافذة سطح مكتب أصلية ويُحمّل تطبيقك المنشور على Lovable.
بفضل PWA service worker، أول تشغيل يحتاج إنترنت لكاش كل شيء، وبعدها يعمل بالكامل أوفلاين.

> ملاحظة: المشروع يستخدم TanStack Start (SSR)، فاستخدمنا نفس استراتيجية Electron — نفتح الرابط المنشور.
> لو حبيت تحوّله لـ static export كامل (بدون إنترنت أبداً)، هتحتاج تتخلى عن SSR وserver functions.

## المتطلبات (مرة واحدة)
1. **Rust**: نزّل من <https://rustup.rs>
2. **Node.js 18+**
3. **متطلبات النظام**:
   - **Windows**: Microsoft Visual Studio C++ Build Tools + WebView2 (مثبت افتراضياً على Win10/11)
   - **macOS**: `xcode-select --install`
   - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev`

## ثبّت Tauri CLI
```bash
npm install --save-dev @tauri-apps/cli
```

## بعد النشر من Lovable
1. اضغط Publish في Lovable.
2. عدّل `url` في `src-tauri/tauri.conf.json` بالرابط الجديد لو اختلف.
3. ضع أيقونات التطبيق في `src-tauri/icons/` (يمكن توليدها بـ `npx @tauri-apps/cli icon path/to/logo.png`).

## التشغيل والبناء
```bash
# تشغيل تجريبي
npx tauri dev

# بناء ملف تنفيذي للنظام الحالي
npx tauri build
```

ستجد الملف الناتج في:
- **Windows**: `src-tauri/target/release/bundle/nsis/*.exe` أو `msi/*.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/*.dmg`
- **Linux**: `src-tauri/target/release/bundle/appimage/*.AppImage` أو `deb/*.deb`

## مزايا Tauri مقابل Electron
- حجم أصغر بكثير (~10MB بدل ~150MB)
- استهلاك ذاكرة أقل
- يستخدم WebView النظام بدل تجميع Chromium

## ملاحظات
- Tauri 2 يدعم استخدام `url` خارجي مباشر في إعدادات النافذة كما هو موضح في `tauri.conf.json`.
- البيانات (localStorage) تُحفظ في profile الـ WebView محلياً وتبقى بين التشغيلات.
