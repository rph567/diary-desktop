import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('日记本界面演示', () => {
  it('默认展示日记页面', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '最近日记' })).toBeInTheDocument()
    expect(screen.getByText('9 篇记录')).toBeInTheDocument()
    expect(screen.getByDisplayValue('雨停之后')).toBeInTheDocument()
  })

  it('可以切换到待办页面', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '待办' }))

    expect(screen.getByRole('heading', { name: '待办事项' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '按截止日期排列' })).toBeInTheDocument()
    expect(screen.getByText('整理项目复盘')).toBeInTheDocument()
  })

  it('切回日记页面后保留界面结构', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '待办' }))
    fireEvent.click(screen.getByRole('button', { name: '日记' }))

    expect(screen.getByRole('heading', { name: '最近日记' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: '搜索日记' })).toBeInTheDocument()
  })
})