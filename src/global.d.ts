import type { DiaryApi } from './types'

declare global {
  interface Window {
    diaryAPI: DiaryApi
  }
}

export {}