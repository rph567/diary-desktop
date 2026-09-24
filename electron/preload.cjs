const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('diaryAPI', {
  load: () => ipcRenderer.invoke('data:load'),
  getDataPath: () => ipcRenderer.invoke('data:path'),
  createEntry: (payload) => ipcRenderer.invoke('entry:create', payload),
  updateEntry: (id, patch) => ipcRenderer.invoke('entry:update', id, patch),
  deleteEntry: (id) => ipcRenderer.invoke('entry:delete', id),
  createTodo: (payload) => ipcRenderer.invoke('todo:create', payload),
  updateTodo: (id, patch) => ipcRenderer.invoke('todo:update', id, patch),
  toggleTodo: (id) => ipcRenderer.invoke('todo:toggle', id),
  deleteTodo: (id) => ipcRenderer.invoke('todo:delete', id),
})