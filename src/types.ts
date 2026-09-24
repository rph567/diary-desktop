export type DiaryEntry = {
  id: string
  entryDate: string
  content: string
  createdAt: string
  updatedAt: string
}

export type TodoItem = {
  id: string
  title: string
  dueDate: string
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type DiaryData = {
  version: number
  entries: DiaryEntry[]
  todos: TodoItem[]
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type DiaryApi = {
  load: () => Promise<DiaryData>
  getDataPath: () => Promise<string>
  createEntry: (payload: { entryDate: string; content?: string }) => Promise<DiaryData>
  updateEntry: (id: string, patch: { content?: string; entryDate?: string }) => Promise<DiaryData>
  deleteEntry: (id: string) => Promise<DiaryData>
  createTodo: (payload: { title: string; dueDate: string }) => Promise<DiaryData>
  updateTodo: (id: string, patch: { title?: string; dueDate?: string }) => Promise<DiaryData>
  toggleTodo: (id: string) => Promise<DiaryData>
  deleteTodo: (id: string) => Promise<DiaryData>
}