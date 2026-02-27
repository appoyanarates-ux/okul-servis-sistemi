const { app, BrowserWindow, dialog } = require("electron");
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

app.whenReady().then(() => {
  createWindow();

  // Güncelleme kontrolü başlat
  autoUpdater.checkForUpdatesAndNotify();
});

// Güncelleme bulunduğunda
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Güncelleme Mevcut',
    message: 'Yeni bir versiyon bulundu. Arka planda indiriliyor...'
  });
});

// Güncelleme indirildiğinde yeniden başlatmayı sor
autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Güncelleme Hazır',
    message: 'Güncelleme başarıyla indirildi. Şimdi uygulamayı yeniden başlatarak güncellemeyi yüklemek ister misiniz?',
    buttons: ['Yeniden Başlat', 'Daha Sonra']
  }).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.log('Güncelleme hatası: ', err);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});