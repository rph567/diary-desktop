import type { ReactNode } from 'react'
import type { AppPage } from '../App'

type AppShellProps = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  children: ReactNode
}

const navigation: Array<{
  id: AppPage
  label: string
  icon: ReactNode
}> = [
  {
    id: 'diary',
    label: '日记',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.75h9.5A2.25 2.25 0 0 1 17.75 6v14.25H7.5A2.5 2.5 0 0 1 5 17.75V5.75A2 2 0 0 1 7 3.75h-1Z" />
        <path d="M8.25 7.5h6M8.25 11h6M8.25 14.5h3.5" />
      </svg>
    ),
  },
  {
    id: 'todo',
    label: '待办',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="m8 12 2.4 2.4L16.5 8.5" />
      </svg>
    ),
  },
]

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  return (
    <div className="app-frame">
      <aside className="app-rail">
        <div className="brand" aria-label="日记本">
          <span className="brand-mark">日</span>
          <span className="brand-name">日记</span>
        </div>

        <nav className="primary-navigation" aria-label="主导航">
          {navigation.map((item) => (
            <button
              className={`nav-item${activePage === item.id ? ' is-active' : ''}`}
              type="button"
              aria-current={activePage === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              key={item.id}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="rail-footer">
          <div className="local-badge" title="数据仅保存在本机">
            <span className="status-dot" />
            <span>本地</span>
          </div>
          <button className="rail-settings" type="button" aria-label="设置" title="设置">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.86 1.86-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V20h-2.63v-.1A1.7 1.7 0 0 0 11 18.4a1.7 1.7 0 0 0-1.88.34l-.06.06-1.86-1.86.06-.06A1.7 1.7 0 0 0 7.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H5.8v-2.63h.1A1.7 1.7 0 0 0 7.6 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06L9.06 6.2l.06.06A1.7 1.7 0 0 0 11 6.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1v-.1h2.63v.1A1.7 1.7 0 0 0 16 6.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.86 1.86-.06.06A1.7 1.7 0 0 0 19.4 10c.16.37.37.7.65.98.36.36.84.56 1.35.56h.1v2.63h-.1a1.7 1.7 0 0 0-1.35.56c-.28.28-.49.61-.65.98Z" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  )
}