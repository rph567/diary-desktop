import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const vitePath = require.resolve('vite/bin/vite.js')
const electronPath = require('electron')

const vite = spawn(process.execPath, [vitePath, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
  stdio: 'inherit',
})

let electron = null
let shuttingDown = false

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  if (electron && !electron.killed) electron.kill()
  if (!vite.killed) vite.kill()
  process.exit(exitCode)
}

async function waitForVite() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:5173')
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Vite development server did not start')
}

vite.on('exit', (code) => {
  if (!shuttingDown && code !== 0) shutdown(code ?? 1)
})

try {
  await waitForVite()
  electron = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: 'http://127.0.0.1:5173',
    },
  })
  electron.on('exit', (code) => shutdown(code ?? 0))
} catch (error) {
  console.error(error)
  shutdown(1)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))