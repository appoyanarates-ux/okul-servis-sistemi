const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

// SSL/Sertifika hatalarını bazı durumlarda görmezden gelmek için (İndirme hatasını önleyebilir)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile(path.join(__dirname, "dist/index.html"));
  }

  win.on('restore', () => {
    win.focus();
  });
}

let updaterWindow;

function createUpdaterWindow() {
  if (updaterWindow) return;

  updaterWindow = new BrowserWindow({
    width: 400,
    height: 300, // Biraz büyüttük hatalar sığsın diye
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  updaterWindow.loadFile(path.join(__dirname, "updater.html"));

  updaterWindow.on('closed', () => {
    updaterWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Güncelleme ayarları
  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = false;

  // Güncelleme kontrolü başlat
  autoUpdater.checkForUpdatesAndNotify();
});

// Güncelleme bulunduğunda
autoUpdater.on('update-available', (info) => {
  createUpdaterWindow();
  if (updaterWindow) {
    updaterWindow.webContents.send('update-message', `Yeni sürüm bulundu: v${info.version}`);
  }
});

autoUpdater.on('update-not-available', () => {
  // console.log('Güncelleme yok');
});

// İndirme ilerlemesi
autoUpdater.on('download-progress', (progressObj) => {
  if (!updaterWindow) {
    createUpdaterWindow();
  }
  updaterWindow.webContents.send('download-progress', progressObj);
});

// Güncelleme indirildiğinde
autoUpdater.on('update-downloaded', () => {
  if (updaterWindow) {
    updaterWindow.webContents.send('update-message', 'Güncelleme hazır. Yeniden başlatılıyor...');
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 3000);
  } else {
    autoUpdater.quitAndInstall();
  }
});

// HATA YÖNETİMİ
autoUpdater.on('error', (err) => {
  console.error('Güncelleme hatası:', err);
  if (updaterWindow) {
    updaterWindow.webContents.send('update-message', 'Hata: ' + (err.message || 'Bağlantı kesildi'));
    // Hata durumunda pencereyi hemen kapatma ki kullanıcı görsün
    setTimeout(() => {
      if (updaterWindow) updaterWindow.close();
    }, 10000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});