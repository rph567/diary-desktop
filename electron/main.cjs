const path = require('node:path')
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { createStorage } = require('./storage.cjs')

const storage = createStorage()
let mainWindow = null

function registerIpcHandlers() {
  ipcMain.handle('data:load', () => storage.load())
  ipcMain.handle('data:path', () => storage.dataPath)
  ipcMain.handle('entry:create', (_event, payload) => storage.createEntry(payload))
  ipcMain.handle('entry:update', (_event, id, patch) => storage.updateEntry(id, patch))
  ipcMain.handle('entry:delete', (_event, id) => storage.deleteEntry(id))
  ipcMain.handle('todo:create', (_event, payload) => storage.createTodo(payload))
  ipcMain.handle('todo:update', (_event, id, patch) => storage.updateTodo(id, patch))
  ipcMain.handle('todo:toggle', (_event, id) => storage.toggleTodo(id))
  ipcMain.handle('todo:delete', (_event, id) => storage.deleteTodo(id))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#eceae3',
    title: '日记本',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const singleInstanceLock = app.requestSingleInstanceLock()
if (!singleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('local.diary.desktop')
    registerIpcHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})