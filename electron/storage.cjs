const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const SCHEMA_VERSION = 1
const DEFAULT_DATA_DIR = process.platform === 'win32'
  ? 'D:\\76188\\日记本\\data'
  : path.join(os.homedir(), '.diary-desktop', 'data')

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDate(value, fallback = localDateKey()) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : fallback
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null

  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString()
  return {
    id: raw.id,
    entryDate: normalizeDate(raw.entryDate),
    content: typeof raw.content === 'string' ? raw.content : '',
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  }
}

function normalizeTodo(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null

  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString()
  const completed = raw.completed === true
  return {
    id: raw.id,
    title: typeof raw.title === 'string' ? raw.title : '',
    dueDate: normalizeDate(raw.dueDate),
    completed,
    completedAt: completed && typeof raw.completedAt === 'string' ? raw.completedAt : null,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  }
}

function normalizeData(raw) {
  const entries = Array.isArray(raw?.entries)
    ? raw.entries.map(normalizeEntry).filter(Boolean)
    : []
  const todos = Array.isArray(raw?.todos)
    ? raw.todos.map(normalizeTodo).filter(Boolean)
    : []

  return {
    version: SCHEMA_VERSION,
    entries,
    todos,
  }
}

function emptyData() {
  return normalizeData({})
}

function createStorage(dataDir = DEFAULT_DATA_DIR) {
  const resolvedDataDir = path.resolve(dataDir)
  const dataPath = path.join(resolvedDataDir, 'diary.json')
  const backupPath = path.join(resolvedDataDir, 'diary.backup.json')

  function ensureDataDir() {
    fs.mkdirSync(resolvedDataDir, { recursive: true })
  }

  function readJson(filePath) {
    return normalizeData(JSON.parse(fs.readFileSync(filePath, 'utf8')))
  }

  function recoverCorruptFile() {
    if (!fs.existsSync(dataPath)) {
      if (fs.existsSync(backupPath)) {
        const recovered = readJson(backupPath)
        writeData(recovered)
        return recovered
      }
      return emptyData()
    }

    try {
      return readJson(dataPath)
    } catch (error) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const corruptPath = path.join(resolvedDataDir, `diary.corrupt-${stamp}.json`)
      fs.copyFileSync(dataPath, corruptPath)

      if (fs.existsSync(backupPath)) {
        try {
          const recovered = readJson(backupPath)
          writeData(recovered, { skipBackup: true })
          return recovered
        } catch {
          // Keep both files for manual recovery and continue with an empty dataset.
        }
      }

      console.error('Diary data could not be read:', error)
      return emptyData()
    }
  }

  function loadData() {
    ensureDataDir()
    return recoverCorruptFile()
  }

  function writeData(nextData, { skipBackup = false } = {}) {
    ensureDataDir()
    const normalized = normalizeData(nextData)
    const temporaryPath = `${dataPath}.tmp`

    fs.writeFileSync(temporaryPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
    if (!skipBackup && fs.existsSync(dataPath)) {
      fs.copyFileSync(dataPath, backupPath)
    }

    try {
      fs.renameSync(temporaryPath, dataPath)
    } catch {
      fs.copyFileSync(temporaryPath, dataPath)
      fs.rmSync(temporaryPath, { force: true })
    }

    return normalized
  }

  function update(mutator) {
    const data = loadData()
    mutator(data)
    return writeData(data)
  }

  return {
    dataDir: resolvedDataDir,
    dataPath,
    load: loadData,
    createEntry({ entryDate, content = '' } = {}) {
      return update((data) => {
        const now = new Date().toISOString()
        data.entries.push({
          id: crypto.randomUUID(),
          entryDate: normalizeDate(entryDate),
          content: typeof content === 'string' ? content : '',
          createdAt: now,
          updatedAt: now,
        })
      })
    },
    updateEntry(id, patch = {}) {
      return update((data) => {
        const entry = data.entries.find((item) => item.id === id)
        if (!entry) throw new Error('Diary entry not found')

        if (typeof patch.content === 'string') entry.content = patch.content
        if (typeof patch.entryDate === 'string') entry.entryDate = normalizeDate(patch.entryDate)
        entry.updatedAt = new Date().toISOString()
      })
    },
    deleteEntry(id) {
      return update((data) => {
        const nextEntries = data.entries.filter((item) => item.id !== id)
        if (nextEntries.length === data.entries.length) throw new Error('Diary entry not found')
        data.entries = nextEntries
      })
    },
    createTodo({ title, dueDate } = {}) {
      const normalizedTitle = typeof title === 'string' ? title.trim() : ''
      if (!normalizedTitle) throw new Error('Todo title is required')

      return update((data) => {
        const now = new Date().toISOString()
        data.todos.push({
          id: crypto.randomUUID(),
          title: normalizedTitle,
          dueDate: normalizeDate(dueDate),
          completed: false,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        })
      })
    },
    updateTodo(id, patch = {}) {
      return update((data) => {
        const todo = data.todos.find((item) => item.id === id)
        if (!todo) throw new Error('Todo not found')

        if (typeof patch.title === 'string') {
          const nextTitle = patch.title.trim()
          if (!nextTitle) throw new Error('Todo title is required')
          todo.title = nextTitle
        }
        if (typeof patch.dueDate === 'string') todo.dueDate = normalizeDate(patch.dueDate)
        todo.updatedAt = new Date().toISOString()
      })
    },
    toggleTodo(id) {
      return update((data) => {
        const todo = data.todos.find((item) => item.id === id)
        if (!todo) throw new Error('Todo not found')

        todo.completed = !todo.completed
        todo.completedAt = todo.completed ? new Date().toISOString() : null
        todo.updatedAt = new Date().toISOString()
      })
    },
    deleteTodo(id) {
      return update((data) => {
        const nextTodos = data.todos.filter((item) => item.id !== id)
        if (nextTodos.length === data.todos.length) throw new Error('Todo not found')
        data.todos = nextTodos
      })
    },
  }
}

module.exports = {
  DEFAULT_DATA_DIR,
  createStorage,
  localDateKey,
  normalizeData,
}