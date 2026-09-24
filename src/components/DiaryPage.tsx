const calendarDays = [
  '', '', 1, 2, 3, 4, 5,
  6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, '', '', '',
]

const diaryEntries = [
  {
    date: '9月24日',
    weekday: '星期四',
    title: '雨停之后',
    preview: '傍晚的风里有一点桂花味，回家的路上绕了远路。',
    active: true,
  },
  {
    date: '9月21日',
    weekday: '星期一',
    title: '安静地完成了一件事',
    preview: '没有想象的困难，真正开始之后，事情就简单了。',
    active: false,
  },
  {
    date: '9月18日',
    weekday: '星期五',
    title: '最近的小事',
    preview: '整理书架、给植物浇水，还有一杯刚刚好的咖啡。',
    active: false,
  },
  {
    date: '9月12日',
    weekday: '星期六',
    title: '周末散步',
    preview: '河边人不多，天色慢慢暗下来。',
    active: false,
  },
  {
    date: '9月5日',
    weekday: '星期六',
    title: '九月计划',
    preview: '少做一些计划，多留一点空白。',
    active: false,
  },
]

const diaryContent = `今天的雨断断续续，直到傍晚才停。

出门时空气很轻，路边的桂花已经开了。没有急着回家，沿着河边慢慢走了一圈。

最近总觉得需要给生活留一点空白，不必把每个时间段都安排得很满。`

export function DiaryPage() {
  return (
    <section className="page diary-page" aria-labelledby="diary-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">私人空间</p>
          <h1 id="diary-title">最近日记</h1>
        </div>
        <div className="page-actions">
          <span className="demo-badge">界面预览</span>
          <button className="primary-button" type="button">
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
              <strong>9 篇记录</strong>
            </div>
            <button className="icon-button" type="button" aria-label="更多操作">
              <span aria-hidden="true">•••</span>
            </button>
          </div>

          <label className="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input type="search" placeholder="搜索标题或正文" aria-label="搜索日记" />
          </label>

          <section className="mini-calendar" aria-label="日记日期筛选">
            <div className="calendar-heading">
              <button type="button" aria-label="上个月">‹</button>
              <strong>2026年9月</strong>
              <button type="button" aria-label="下个月">›</button>
            </div>
            <div className="calendar-weekdays" aria-hidden="true">
              <span>一</span><span>二</span><span>三</span><span>四</span>
              <span>五</span><span>六</span><span>日</span>
            </div>
            <div className="calendar-grid">
              {calendarDays.map((day, index) => (
                <span
                  className={[
                    'calendar-day',
                    day === 24 ? 'is-selected' : '',
                    typeof day === 'number' && [5, 12, 18, 21, 24].includes(day) ? 'has-entry' : '',
                  ].filter(Boolean).join(' ')}
                  key={`${day}-${index}`}
                >
                  {day}
                </span>
              ))}
            </div>
          </section>

          <div className="entry-list" aria-label="日记列表">
            {diaryEntries.map((entry) => (
              <button
                className={`entry-card${entry.active ? ' is-active' : ''}`}
                type="button"
                key={entry.date + entry.title}
              >
                <span className="entry-date">
                  <strong>{entry.date}</strong>
                  <span>{entry.weekday}</span>
                </span>
                <strong className="entry-title">{entry.title}</strong>
                <span className="entry-preview">{entry.preview}</span>
              </button>
            ))}
          </div>
        </aside>

        <article className="panel editor-panel">
          <div className="editor-toolbar">
            <div className="editor-date">
              <span className="status-dot" />
              2026年9月24日 · 星期四
            </div>
            <div className="editor-tools" aria-label="编辑器工具栏">
              <button type="button" aria-label="加粗"><strong>B</strong></button>
              <button type="button" aria-label="斜体"><em>I</em></button>
              <button type="button" aria-label="插入分隔线">—</button>
              <span className="toolbar-divider" />
              <button type="button" aria-label="更多格式">Aa</button>
            </div>
          </div>

          <div className="editor-paper">
            <input
              className="editor-title"
              type="text"
              defaultValue="雨停之后"
              aria-label="日记标题"
            />
            <div className="editor-meta">
              <span>最后编辑于 21:42</span>
              <span className="saved-state">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6.5 12.4 3.4 3.4 7.6-8" />
                </svg>
                已保存
              </span>
            </div>
            <textarea
              className="editor-content"
              defaultValue={diaryContent}
              aria-label="日记正文"
              spellCheck="false"
            />
          </div>

          <footer className="editor-footer">
            <span>示例内容</span>
            <span>纯文本模式</span>
          </footer>
        </article>
      </div>
    </section>
  )
}