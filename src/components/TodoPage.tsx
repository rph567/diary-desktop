const todoCalendarDays = [
  '', 1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 11, 12, 13,
  14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, '', '', '', '',
]

const taskGroups = [
  {
    label: '已过期',
    tone: 'danger',
    count: 1,
    tasks: [
      {
        title: '整理项目复盘',
        date: '9月22日',
        status: '逾期 2 天',
        completed: false,
      },
    ],
  },
  {
    label: '今天',
    tone: 'today',
    count: 1,
    tasks: [
      {
        title: '整理产品设计书',
        date: '9月24日',
        status: '今天到期',
        completed: false,
      },
    ],
  },
  {
    label: '接下来',
    tone: 'default',
    count: 2,
    tasks: [
      {
        title: '完成前端页面演示',
        date: '9月26日',
        status: '还有 2 天',
        completed: false,
      },
      {
        title: '提交本周学习记录',
        date: '9月30日',
        status: '还有 6 天',
        completed: false,
      },
    ],
  },
  {
    label: '已完成',
    tone: 'completed',
    count: 1,
    tasks: [
      {
        title: '梳理 MVP 功能范围',
        date: '9月20日',
        status: '已完成',
        completed: true,
      },
    ],
  },
]

export function TodoPage() {
  return (
    <section className="page todo-page" aria-labelledby="todo-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">按时间推进</p>
          <h1 id="todo-title">待办事项</h1>
        </div>
        <div className="page-actions">
          <span className="demo-badge">界面预览</span>
          <button className="primary-button" type="button">
            <span aria-hidden="true">+</span>
            新建待办
          </button>
        </div>
      </header>

      <div className="todo-layout">
        <aside className="panel todo-calendar-panel">
          <div className="calendar-heading calendar-heading-large">
            <button type="button" aria-label="上个月">‹</button>
            <div>
              <span>2026</span>
              <strong>九月</strong>
            </div>
            <button type="button" aria-label="下个月">›</button>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            <span>一</span><span>二</span><span>三</span><span>四</span>
            <span>五</span><span>六</span><span>日</span>
          </div>
          <div className="calendar-grid calendar-grid-large">
            {todoCalendarDays.map((day, index) => (
              <span
                className={[
                  'calendar-day',
                  day === 24 ? 'is-selected' : '',
                  typeof day === 'number' && [22, 24, 26, 30].includes(day) ? 'has-task' : '',
                  day === 22 ? 'is-overdue' : '',
                ].filter(Boolean).join(' ')}
                key={`${day}-${index}`}
              >
                {day}
              </span>
            ))}
          </div>

          <div className="calendar-legend">
            <span><i className="legend-dot is-overdue" />已过期</span>
            <span><i className="legend-dot is-upcoming" />待处理</span>
          </div>

          <div className="calendar-note">
            <span className="calendar-note-mark">24</span>
            <div>
              <strong>今天还有 1 项待办</strong>
              <span>最近截止：整理产品设计书</span>
            </div>
          </div>
        </aside>

        <section className="panel task-board" aria-label="待办列表">
          <div className="task-board-header">
            <div>
              <span className="section-kicker">全部未完成</span>
              <h2>按截止日期排列</h2>
            </div>
            <button className="filter-button" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 7h14M8 12h8M10 17h4" />
              </svg>
              排序
            </button>
          </div>

          <div className="task-summary">
            <div>
              <strong>4</strong>
              <span>未完成</span>
            </div>
            <div>
              <strong className="danger-text">1</strong>
              <span>已过期</span>
            </div>
            <div>
              <strong className="today-text">1</strong>
              <span>今天到期</span>
            </div>
          </div>

          <div className="task-groups">
            {taskGroups.map((group) => (
              <section className={`task-group is-${group.tone}`} key={group.label}>
                <div className="task-group-heading">
                  <span>{group.label}</span>
                  <span>{group.count}</span>
                </div>
                <div className="task-list">
                  {group.tasks.map((task) => (
                    <article className={`task-item${task.completed ? ' is-completed' : ''}`} key={task.title}>
                      <span className="task-check" aria-hidden="true">
                        {task.completed ? '✓' : ''}
                      </span>
                      <div className="task-copy">
                        <strong>{task.title}</strong>
                        <span>{task.status}</span>
                      </div>
                      <span className="task-date">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="4" y="5.5" width="16" height="14" rx="3" />
                          <path d="M8 3.5v4M16 3.5v4M4 10h16" />
                        </svg>
                        {task.date}
                      </span>
                      <button className="task-more" type="button" aria-label={`${task.title}的更多操作`}>
                        •••
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}