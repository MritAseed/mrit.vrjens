const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  showDialogMessage: (message) => ipcRenderer.invoke("show-dialog", message),
  showAbout: () => ipcRenderer.invoke("show-about"), // استدعاء نافذة "حول البرنامج"
  checkForUpdates: () => ipcRenderer.invoke("check-updates"), // التحقق من التحديثات
});


