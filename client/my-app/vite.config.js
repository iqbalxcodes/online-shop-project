import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'
import process from 'node:process'

// Commit yang sedang di-build. Vercel mengisi VERCEL_GIT_COMMIT_SHA otomatis;
// deploy.sh mengisi APP_COMMIT saat deploy lewat Vercel CLI.
function currentCommit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA
  if (process.env.APP_COMMIT) return process.env.APP_COMMIT
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'local'
  }
}

// Menulis dist/version.json supaya deploy.sh bisa memastikan versi terbaru sudah live di Vercel.
function versionFile() {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ commit: currentCommit(), builtAt: new Date().toISOString() }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionFile()],
})
