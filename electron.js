const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

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
    height: 250,
    frame: false, // Kenarlıksız
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

  // Güncelleme kontrolü başlat
  autoUpdater.checkForUpdatesAndNotify();
});

// Güncelleme bulunduğunda pencereyi aç ve mesajı yolla
autoUpdater.on('update-available', () => {
  createUpdaterWindow();
  if (updaterWindow) {
    updaterWindow.webContents.send('update-message', 'Yeni güncelleme bulundu. İndirme başlıyor...');
  }
});

// Güncelleme yoksa (isteğe bağlı, görmek isterseniz diye loglanabilir)
autoUpdater.on('update-not-available', () => {
  // console.log('Güncelleme yok');
});

// İndirme ilerlemesini HTML dosyasına yolla
autoUpdater.on('download-progress', (progressObj) => {
  if (!updaterWindow) {
    createUpdaterWindow();
  }
  updaterWindow.webContents.send('download-progress', progressObj);
});

// Güncelleme indirildiğinde yeniden başlatmayı sor
autoUpdater.on('update-downloaded', () => {
  if (updaterWindow) {
    // Mesajı güncelle
    updaterWindow.webContents.send('update-message', 'Güncelleme hazır. Yeniden başlatılıyor...');
    
    // 2 saniye sonra otomatik kur
    setTimeout(() => {
      updaterWindow.close();
      autoUpdater.quitAndInstall();
    }, 2000);
  } else {
    autoUpdater.quitAndInstall();
  }
});

autoUpdater.on('error', (err) => {
  console.log('Güncelleme hatası: ', err);
  if (updaterWindow) {
    updaterWindow.webContents.send('update-message', 'Güncelleme sırasında bir hata oluştu: ' + err.message);
    setTimeout(() => {
      updaterWindow.close();
    }, 5000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});