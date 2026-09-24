import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { formatDateLong, localDateKey } from './date-utils'
import type { DiaryApi, DiaryData } from './types'

const today = localDateKey()
const sampleData: DiaryData = {
  version: 1,
  entries: [
    {
      id: 'entry-1',
      entryDate: today,
      content: '今天完成了一件重要的事。',
      createdAt: '2026-09-24T10:00:00.000Z',
      updatedAt: '2026-09-24T10:00:00.000Z',
    },
  ],
  todos: [
    {
      id: 'todo-1',
      title: '整理产品设计书',
      dueDate: today,
      completed: false,
      completedAt: null,
      createdAt: '2026-09-24T08:00:00.000Z',
      updatedAt: '2026-09-24T08:00:00.000Z',
    },
  ],
}

function createApi(): DiaryApi {
  return {
    load: vi.fn().mockResolvedValue(sampleData),
    getDataPath: vi.fn().mockResolvedValue('D:\\76188\\日记本\\data\\diary.json'),
    createEntry: vi.fn().mockResolvedValue(sampleData),
    updateEntry: vi.fn().mockResolvedValue(sampleData),
    deleteEntry: vi.fn().mockResolvedValue(sampleData),
    createTodo: vi.fn().mockResolvedValue(sampleData),
    updateTodo: vi.fn().mockResolvedValue(sampleData),
    toggleTodo: vi.fn().mockResolvedValue(sampleData),
    deleteTodo: vi.fn().mockResolvedValue(sampleData),
  }
}

let api: DiaryApi

beforeEach(() => {
  api = createApi()
  Object.defineProperty(window, 'diaryAPI', {
    configurable: true,
    value: api,
  })
})

describe('日记本桌面界面', () => {
  it('默认展示没有标题字段的日记编辑器', async () => {
    render(<App />)

    expect(await screen.findByDisplayValue('今天完成了一件重要的事。')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '日记标题' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '日记正文' })).toBeInTheDocument()
  })

  it('点击日历日期后可以直接添加待办', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '待办' }))

    const dateButton = await screen.findByLabelText(`${formatDateLong(today)}，点击添加待办`)
    fireEvent.click(dateButton)

    const titleInput = screen.getByPlaceholderText('输入待办事项')
    fireEvent.change(titleInput, { target: { value: '完成桌面版打包' } })
    fireEvent.click(screen.getByRole('button', { name: '添加' }))

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith({ title: '完成桌面版打包', dueDate: today })
    })
  })

  it('待办支持完成、编辑和删除操作', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '待办' }))

    expect(await screen.findByText('整理产品设计书')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '完成整理产品设计书' }))
    await waitFor(() => expect(api.toggleTodo).toHaveBeenCalledWith('todo-1'))

    fireEvent.click(screen.getByRole('button', { name: '编辑' }))
    expect(screen.getByDisplayValue('整理产品设计书')).toBeInTheDocument()
  })
})