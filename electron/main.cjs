const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

// عنوان التطبيق المنشور على Lovable (يمكن تغييره بعد النشر)
const APP_URL =
  process.env.APP_URL ||
  "https://id-preview--d4f1a194-0d6a-4660-9c11-9763fbe457d6.lovable.app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "نظام مخالفات جمصة",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // تفعيل التخزين المحلي والكاش للعمل أوفلاين
      partition: "persist:gamasa-violations",
    },
  });

  // قائمة بسيطة بالعربية
  const menu = Menu.buildFromTemplate([
    {
      label: "ملف",
      submenu: [
        { label: "إعادة تحميل", role: "reload" },
        { label: "ملء الشاشة", role: "togglefullscreen" },
        { type: "separator" },
        { label: "خروج", role: "quit" },
      ],
    },
    {
      label: "تحرير",
      submenu: [
        { label: "تراجع", role: "undo" },
        { label: "إعادة", role: "redo" },
        { type: "separator" },
        { label: "قص", role: "cut" },
        { label: "نسخ", role: "copy" },
        { label: "لصق", role: "paste" },
      ],
    },
    {
      label: "أدوات",
      submenu: [
        { label: "أدوات المطور", role: "toggleDevTools" },
        { label: "تكبير", role: "zoomIn" },
        { label: "تصغير", role: "zoomOut" },
        { label: "حجم افتراضي", role: "resetZoom" },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  win.loadURL(APP_URL);

  // فتح الروابط الخارجية في المتصفح
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // إعادة المحاولة عند فشل التحميل (مفيد عند بدء التشغيل أوفلاين)
  win.webContents.on("did-fail-load", () => {
    setTimeout(() => win.loadURL(APP_URL), 2000);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
