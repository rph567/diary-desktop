import { useEffect, useMemo, useRef, useState } from 'react'
import {
  dateKeyFromParts,
  formatDateLabel,
  formatDateLong,
  getMonthGrid,
  localDateKey,
  monthTitle,
  shiftMonth,
} from '../date-utils'
import type { DiaryData, DiaryEntry, SaveStatus } from '../types'

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const emptyData: DiaryData = { version: 1, entries: [], todos: [] }

function sortEntries(entries: DiaryEntry[]) {
  return [...entries].sort((left, right) => {
    const dateOrder = right.entryDate.localeCompare(left.entryDate)
    return dateOrder !== 0 ? dateOrder : right.createdAt.localeCompare(left.createdAt)
  })
}

export function DiaryPage() {
  const today = localDateKey()
  const now = new Date()
  const [monthView, setMonthView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [data, setData] = useState<DiaryData>(emptyData)
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [loadError, setLoadError] = useState('')
  const draftRef = useRef<{ id: string | null; content: string }>({ id: null, content: '' })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedEntry = data.entries.find((entry) => entry.id === selectedEntryId) ?? null
  const calendarDays = useMemo(
    () => getMonthGrid(monthView.year, monthView.month),
    [monthView],
  )
  const entriesForDate = useMemo(
    () => sortEntries(data.entries.filter((entry) => entry.entryDate === selectedDate)),
    [data.entries, selectedDate],
  )
  const visibleEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('zh-CN')
    if (!query) return entriesForDate

    return sortEntries(data.entries).filter((entry) => {
      const dateLabel = formatDateLong(entry.entryDate)
      return entry.content.toLocaleLowerCase('zh-CN').includes(query)
        || dateLabel.toLocaleLowerCase('zh-CN').includes(query)
    })
  }, [data.entries, entriesForDate, search])

  async function persistDraft() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }

    const draft = draftRef.current
    if (!draft.id) return

    const current = data.entries.find((entry) => entry.id === draft.id)
    if (current && current.content === draft.content) {
      setSaveStatus('saved')
      return
    }

    setSaveStatus('saving')
    try {
      const nextData = await window.diaryAPI.updateEntry(draft.id, { content: draft.content })
      setData(nextData)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  useEffect(() => {
    let active = true

    window.diaryAPI.load()
      .then((loadedData) => {
        if (!active) return
        const sorted = sortEntries(loadedData.entries)
        setData({ ...loadedData, entries: sorted })
        const initialEntry = sorted.find((entry) => entry.entryDate === today) ?? sorted[0] ?? null

        if (initialEntry) {
          setSelectedDate(initialEntry.entryDate)
          setSelectedEntryId(initialEntry.id)
          setContent(initialEntry.content)
          draftRef.current = { id: initialEntry.id, content: initialEntry.content }
          setSaveStatus('saved')
        }
      })
      .catch(() => setLoadError('日记数据加载失败，请重新启动程序。'))

    return () => {
      active = false
      if (saveTimer.current) clearTimeout(saveTimer.current)
      const draft = draftRef.current
      if (draft.id) {
        void window.diaryAPI.updateEntry(draft.id, { content: draft.content })
      }
    }
  }, [today])

  async function selectEntry(entry: DiaryEntry) {
    await persistDraft()
    setSelectedDate(entry.entryDate)
    setSelectedEntryId(entry.id)
    setContent(entry.content)
    draftRef.current = { id: entry.id, content: entry.content }
    setSaveStatus('saved')
  }

  async function selectDate(value: string) {
    await persistDraft()
    setSelectedDate(value)
    const firstEntry = sortEntries(data.entries.filter((entry) => entry.entryDate === value))[0]

    if (firstEntry) {
      setSelectedEntryId(firstEntry.id)
      setContent(firstEntry.content)
      draftRef.current = { id: firstEntry.id, content: firstEntry.content }
      setSaveStatus('saved')
    } else {
      setSelectedEntryId(null)
      setContent('')
      draftRef.current = { id: null, content: '' }
      setSaveStatus('idle')
    }
  }

  async function createEntry() {
    await persistDraft()
    try {
      const nextData = await window.diaryAPI.createEntry({ entryDate: selectedDate, content: '' })
      const created = sortEntries(nextData.entries).find(
        (entry) => entry.entryDate === selectedDate && !data.entries.some((old) => old.id === entry.id),
      )

      setData(nextData)
      if (created) {
        setSelectedEntryId(created.id)
        setContent('')
        draftRef.current = { id: created.id, content: '' }
        setSaveStatus('saved')
      }
    } catch {
      setSaveStatus('error')
    }
  }

  async function deleteEntry() {
    if (!selectedEntry || !window.confirm('确定删除这篇日记吗？删除后无法恢复。')) return

    try {
      const nextData = await window.diaryAPI.deleteEntry(selectedEntry.id)
      setData(nextData)
      setSelectedEntryId(null)
      setContent('')
      draftRef.current = { id: null, content: '' }
      setSaveStatus('idle')
    } catch {
      setSaveStatus('error')
    }
  }

  function handleContentChange(value: string) {
    if (!selectedEntryId) return

    setContent(value)
    setSaveStatus('saving')
    draftRef.current = { id: selectedEntryId, content: value }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void persistDraft()
    }, 600)
  }

  async function changeMonth(offset: number) {
    setMonthView((current) => shiftMonth(current.year, current.month, offset))
  }

  const saveLabel = {
    idle: '等待输入',
    saving: '保存中…',
    saved: '已保存',
    error: '保存失败',
  }[saveStatus]

  return (
    <section className="page diary-page" aria-labelledby="diary-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">私人空间</p>
          <h1 id="diary-title">萧炎的日记</h1>
        </div>
        <div className="page-actions">
          {loadError && <span className="error-badge">{loadError}</span>}
          <button className="primary-button" type="button" onClick={() => void createEntry()}>
            <span aria-hidden="true">+</span>
            新建日记
          </button>
        </div>
      </header>

      <div className="diary-layout">
        <aside className="panel diary-browser">
          <div className="browser-heading">
            <div>
              <span className="section-kicker">日记归档</span>
              <strong>{data.entries.length} 篇记录</strong>
            </div>
          </div>

          <label className="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索日记正文"
              aria-label="搜索日记"
            />
          </label>

          <section className="mini-calendar" aria-label="日记日期筛选">
            <div className="calendar-heading">
              <button type="button" aria-label="上个月" onClick={() => void changeMonth(-1)}>‹</button>
              <strong>{monthTitle(monthView.year, monthView.month)}</strong>
              <button type="button" aria-label="下个月" onClick={() => void changeMonth(1)}>›</button>
            </div>
            <div className="calendar-weekdays" aria-hidden="true">
              {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                if (!day) return <span className="calendar-empty" key={`empty-${index}`} />
                const dateKey = dateKeyFromParts(monthView.year, monthView.month, day)
                const classNames = [
                  'calendar-day',
                  dateKey === selectedDate ? 'is-selected' : '',
                  data.entries.some((entry) => entry.entryDate === dateKey) ? 'has-entry' : '',
                ].filter(Boolean).join(' ')

                return (
                  <button
                    className={classNames}
                    type="button"
                    aria-label={formatDateLong(dateKey)}
                    onClick={() => void selectDate(dateKey)}
                    key={dateKey}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </section>

          <div className="entry-list" aria-label="日记列表">
            {visibleEntries.length === 0 ? (
              <div className="list-empty">
                <span>{search ? '没有匹配的日记' : '这一天还没有记录'}</span>
                {!search && <button type="button" onClick={() => void createEntry()}>写一篇</button>}
              </div>
            ) : visibleEntries.map((entry) => (
              <button
                className={`entry-card${entry.id === selectedEntryId ? ' is-active' : ''}`}
                type="button"
                onClick={() => void selectEntry(entry)}
                key={entry.id}
              >
                <span className="entry-date">
                  <strong>{formatDateLabel(entry.entryDate)}</strong>
                  <span>{entry.content.trim() ? '已记录' : '空白日记'}</span>
                </span>
                <span className="entry-preview">
                  {entry.content.trim() || '还没有写下内容，点击开始记录。'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <article className="panel editor-panel">
          {selectedEntry ? (
            <>
              <div className="editor-toolbar">
                <div className="editor-date">
                  <span className="status-dot" />
                  {formatDateLong(selectedEntry.entryDate)}
                </div>
                <div className="editor-actions">
                  <span className={`save-state is-${saveStatus}`}>{saveLabel}</span>
                  <button className="danger-button" type="button" onClick={() => void deleteEntry()}>
                    删除
                  </button>
                </div>
              </div>

              <div className="editor-paper editor-paper-text-only">
                <textarea
                  className="editor-content editor-content-focus"
                  value={content}
                  onChange={(event) => handleContentChange(event.target.value)}
                  onBlur={() => void persistDraft()}
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                      event.preventDefault()
                      void persistDraft()
                    }
                  }}
                  aria-label="日记正文"
                  placeholder="写下今天发生的事……"
                  spellCheck="false"
                  autoFocus
                />
              </div>

              <footer className="editor-footer">
                <span>{content.length} 字</span>
                <span>内容只保存在本机</span>
              </footer>
            </>
          ) : (
            <div className="editor-empty">
              <span className="empty-seal">日</span>
              <h2>{formatDateLong(selectedDate)}</h2>
              <p>这一天还没有日记。可以写下今天发生的事，也可以留一段空白。</p>
              <button className="primary-button" type="button" onClick={() => void createEntry()}>
                开始写日记
              </button>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}