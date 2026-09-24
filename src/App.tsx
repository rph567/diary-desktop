import { useState } from 'react'
import { AppShell } from './components/AppShell'
import { DiaryPage } from './components/DiaryPage'
import { TodoPage } from './components/TodoPage'

export type AppPage = 'diary' | 'todo'

export function App() {
  const [activePage, setActivePage] = useState<AppPage>('diary')

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'diary' ? <DiaryPage /> : <TodoPage />}
    </AppShell>
  )
}