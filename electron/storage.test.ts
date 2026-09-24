import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

type Storage = {
  dataPath: string
  load: () => { entries: Array<{ id: string; content: string }>; todos: Array<{ id: string; completed: boolean }> }
  createEntry: (payload: { entryDate: string; content?: string }) => unknown
  updateEntry: (id: string, patch: { content?: string }) => unknown
  deleteEntry: (id: string) => unknown
  createTodo: (payload: { title: string; dueDate: string }) => unknown
  toggleTodo: (id: string) => unknown
}

const require = createRequire(import.meta.url)
const { createStorage } = require('./storage.cjs') as {
  createStorage: (dataDir: string) => Storage
}

let temporaryDirectory = ''
let storage: Storage

beforeEach(() => {
  temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'diary-storage-'))
  storage = createStorage(temporaryDirectory)
})

afterEach(() => {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true })
})

describe('本地数据存储', () => {
  it('创建并重新加载日记正文', () => {
    storage.createEntry({ entryDate: '2026-09-24', content: '第一段正文' })
    const entry = storage.load().entries[0]

    expect(entry.entryDate).toBe('2026-09-24')
    expect(entry.content).toBe('第一段正文')

    storage.updateEntry(entry.id, { content: '修改后的正文' })
    expect(storage.load().entries[0].content).toBe('修改后的正文')
  })

  it('可以创建、完成和删除待办', () => {
    const created = storage.createTodo({ title: '完成打包', dueDate: '2026-09-30' }) as {
      todos: Array<{ id: string; completed: boolean }>
    }
    const todoId = created.todos[0].id

    storage.toggleTodo(todoId)
    expect(storage.load().todos[0].completed).toBe(true)

    storage.deleteTodo(todoId)
    expect(storage.load().todos).toHaveLength(0)
  })

  it('主数据损坏时从备份恢复', () => {
    storage.createEntry({ entryDate: '2026-09-24', content: '备份内容' })
    storage.createEntry({ entryDate: '2026-09-25', content: '触发备份更新' })
    fs.writeFileSync(storage.dataPath, '{broken json', 'utf8')

    const recovered = storage.load()
    expect(recovered.entries.some((entry) => entry.content === '备份内容')).toBe(true)
    expect(fs.readdirSync(temporaryDirectory).some((file) => file.startsWith('diary.corrupt-'))).toBe(true)
  })
})