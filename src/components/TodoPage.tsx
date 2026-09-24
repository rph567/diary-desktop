import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  dateKeyFromParts,
  formatDateLabel,
  formatDateLong,
  getMonthGrid,
  localDateKey,
  monthTitle,
  shiftMonth,
} from '../date-utils'
import type { DiaryData, TodoItem } from '../types'

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const emptyData: DiaryData = { version: 1, entries: [], todos: [] }

function sortPending(todos: TodoItem[]) {
  return [...todos].sort((left, right) => {
    const dateOrder = left.dueDate.localeCompare(right.dueDate)
    return dateOrder !== 0 ? dateOrder : left.createdAt.localeCompare(right.createdAt)
  })
}

function sortCompleted(todos: TodoItem[]) {
  return [...todos].sort((left, right) => (
    (right.completedAt ?? right.updatedAt).localeCompare(left.completedAt ?? left.updatedAt)
  ))
}

function dueLabel(dueDate: string, today: string) {
  if (dueDate < today) return '已过期'
  if (dueDate === today) return '今天到期'
  return `${formatDateLabel(dueDate)}到期`
}

export function TodoPage() {
  const today = localDateKey()
  const now = new Date()
  const [calendarView, setCalendarView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [data, setData] = useState<DiaryData>(emptyData)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [composerDate, setComposerDate] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState(today)
  const [showCompleted, setShowCompleted] = useState(true)
  const [error, setError] = useState('')

  const calendarDays = useMemo(
    () => getMonthGrid(calendarView.year, calendarView.month),
    [calendarView],
  )
  const pendingTodos = data.todos.filter((todo) => !todo.completed)
  const visibleTodos = filterDate
    ? data.todos.filter((todo) => todo.dueDate === filterDate)
    : data.todos
  const sortedPending = sortPending(visibleTodos.filter((todo) => !todo.completed))
  const sortedCompleted = sortCompleted(visibleTodos.filter((todo) => todo.completed))
  const overdue = sortedPending.filter((todo) => todo.dueDate < today)
  const dueToday = sortedPending.filter((todo) => todo.dueDate === today)
  const upcoming = sortedPending.filter((todo) => todo.dueDate > today)
  const taskDates = new Set(data.todos.filter((todo) => !todo.completed).map((todo) => todo.dueDate))

  useEffect(() => {
    window.diaryAPI.load()
      .then(setData)
      .catch(() => setError('待办数据加载失败，请重新启动程序。'))
  }, [])

  async function addTodo(event: FormEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title || !composerDate) return

    try {
      const nextData = await window.diaryAPI.createTodo({ title, dueDate: composerDate })
      setData(nextData)
      setNewTitle('')
      setError('')
    } catch {
      setError('待办保存失败，请重试。')
    }
  }

  async function toggleTodo(id: string) {
    try {
      setData(await window.diaryAPI.toggleTodo(id))
      setError('')
    } catch {
      setError('状态更新失败，请重试。')
    }
  }

  async function deleteTodo(todo: TodoItem) {
    if (!window.confirm(`确定删除“${todo.title}”吗？`)) return
    try {
      setData(await window.diaryAPI.deleteTodo(todo.id))
      setError('')
    } catch {
      setError('删除失败，请重试。')
    }
  }

  function beginEdit(todo: TodoItem) {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditDate(todo.dueDate)
  }

  async function saveEdit(event: FormEvent, id: string) {
    event.preventDefault()
    const title = editTitle.trim()
    if (!title) return

    try {
      setData(await window.diaryAPI.updateTodo(id, { title, dueDate: editDate }))
      setEditingId(null)
      setError('')
    } catch {
      setError('修改失败，请重试。')
    }
  }

  function chooseDate(dateKey: string) {
    setFilterDate(dateKey)
    setComposerDate(dateKey)
    setNewTitle('')
  }

  function changeMonth(offset: number) {
    setCalendarView((current) => shiftMonth(current.year, current.month, offset))
  }

  function renderTask(todo: TodoItem) {
    if (editingId === todo.id) {
      return (
        <form className="task-edit-form" onSubmit={(event) => void saveEdit(event, todo.id)} key={todo.id}>
          <input
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            aria-label="修改待办名称"
            autoFocus
          />
          <input
            type="date"
            value={editDate}
            onChange={(event) => setEditDate(event.target.value)}
            aria-label="修改待办日期"
          />
          <button className="compact-primary" type="submit">保存</button>
          <button className="compact-button" type="button" onClick={() => setEditingId(null)}>取消</button>
        </form>
      )
    }

    const tone = todo.completed
      ? 'completed'
      : todo.dueDate < today
        ? 'danger'
        : todo.dueDate === today
          ? 'today'
          : 'upcoming'

    return (
      <article className={`task-item is-${tone}${todo.completed ? ' is-completed' : ''}`} key={todo.id}>
        <button
          className="task-check"
          type="button"
          aria-label={todo.completed ? `将${todo.title}标记为未完成` : `完成${todo.title}`}
          onClick={() => void toggleTodo(todo.id)}
        >
          {todo.completed ? '✓' : ''}
        </button>
        <div className="task-copy">
          <strong>{todo.title}</strong>
          <span>{todo.completed ? '已完成' : dueLabel(todo.dueDate, today)}</span>
        </div>
        <span className="task-date">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="5.5" width="16" height="14" rx="3" />
            <path d="M8 3.5v4M16 3.5v4M4 10h16" />
          </svg>
          {formatDateLabel(todo.dueDate)}
        </span>
        <div className="task-actions">
          <button type="button" onClick={() => beginEdit(todo)}>编辑</button>
          <button type="button" onClick={() => void deleteTodo(todo)}>删除</button>
        </div>
      </article>
    )
  }

  function renderGroup(label: string, tone: string, todos: TodoItem[]) {
    if (todos.length === 0) return null
    return (
      <section className={`task-group is-${tone}`} key={label}>
        <div className="task-group-heading">
          <span>{label}</span>
          <span>{todos.length}</span>
        </div>
        <div className="task-list">{todos.map(renderTask)}</div>
      </section>
    )
  }

  return (
    <section className="page todo-page" aria-labelledby="todo-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">按时间推进</p>
          <h1 id="todo-title">待办事项</h1>
        </div>
        <div className="page-actions">
          {error && <span className="error-badge">{error}</span>}
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setFilterDate(today)
              chooseDate(today)
            }}
          >
            <span aria-hidden="true">+</span>
            新建待办
          </button>
        </div>
      </header>

      <div className="todo-layout">
        <aside className="panel todo-calendar-panel">
          <div className="calendar-heading calendar-heading-large">
            <button type="button" aria-label="上个月" onClick={() => void changeMonth(-1)}>‹</button>
            <div>
              <span>{calendarView.year}</span>
              <strong>{calendarView.month + 1}月</strong>
            </div>
            <button type="button" aria-label="下个月" onClick={() => void changeMonth(1)}>›</button>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="calendar-grid calendar-grid-large">
            {calendarDays.map((day, index) => {
              if (!day) return <span className="calendar-empty" key={`empty-${index}`} />
              const dateKey = dateKeyFromParts(calendarView.year, calendarView.month, day)
              const classNames = [
                'calendar-day',
                dateKey === filterDate ? 'is-selected' : '',
                dateKey === today ? 'is-today' : '',
                taskDates.has(dateKey) ? 'has-task' : '',
                taskDates.has(dateKey) && dateKey < today ? 'is-overdue' : '',
              ].filter(Boolean).join(' ')

              return (
                <button
                  className={classNames}
                  type="button"
                  aria-label={`${formatDateLong(dateKey)}，点击添加待办`}
                  onClick={() => chooseDate(dateKey)}
                  key={dateKey}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="calendar-legend">
            <span><i className="legend-dot is-overdue" />已过期</span>
            <span><i className="legend-dot is-upcoming" />待处理</span>
          </div>

          <div className="calendar-note">
            <span className="calendar-note-mark">{filterDate ? Number(filterDate.slice(-2)) : new Date().getDate()}</span>
            <div>
              <strong>{composerDate ? `正在为 ${formatDateLabel(composerDate)} 添加` : '点击日期添加待办'}</strong>
              <span>选择日期后，在上方输入事项即可</span>
            </div>
          </div>
        </aside>

        <section className="panel task-board" aria-label="待办列表">
          <div className="task-board-header">
            <div>
              <span className="section-kicker">{filterDate ? `${formatDateLabel(filterDate)}事项` : '全部事项'}</span>
              <h2>{filterDate ? formatDateLong(filterDate) : '按截止日期排列'}</h2>
            </div>
            <button
              className="filter-button"
              type="button"
              onClick={() => {
                setFilterDate(null)
                setComposerDate(null)
              }}
            >
              显示全部
            </button>
          </div>

          <div className="task-summary">
            <div><strong>{pendingTodos.length}</strong><span>未完成</span></div>
            <div><strong className="danger-text">{data.todos.filter((todo) => !todo.completed && todo.dueDate < today).length}</strong><span>已过期</span></div>
            <div><strong className="today-text">{data.todos.filter((todo) => !todo.completed && todo.dueDate === today).length}</strong><span>今天到期</span></div>
          </div>

          {composerDate && (
            <form className="inline-composer" onSubmit={(event) => void addTodo(event)}>
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="输入待办事项"
                aria-label="待办名称"
                autoFocus
              />
              <span>DDL：{formatDateLabel(composerDate)}</span>
              <button className="compact-primary" type="submit">添加</button>
              <button className="compact-button" type="button" onClick={() => setComposerDate(null)}>取消</button>
            </form>
          )}

          <div className="task-groups">
            {renderGroup('已过期', 'danger', overdue)}
            {renderGroup('今天', 'today', dueToday)}
            {renderGroup('接下来', 'upcoming', upcoming)}

            {sortedCompleted.length > 0 && (
              <section className="task-group is-completed">
                <button
                  className="task-group-heading completed-heading"
                  type="button"
                  onClick={() => setShowCompleted((value) => !value)}
                >
                  <span>已完成 · {sortedCompleted.length}</span>
                  <span>{showCompleted ? '收起' : '展开'}</span>
                </button>
                {showCompleted && <div className="task-list">{sortedCompleted.map(renderTask)}</div>}
              </section>
            )}

            {overdue.length + dueToday.length + upcoming.length + sortedCompleted.length === 0 && (
              <div className="task-empty">
                <strong>这里暂时没有待办</strong>
                <span>点击左侧日历中的日期，就能直接添加事项。</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}