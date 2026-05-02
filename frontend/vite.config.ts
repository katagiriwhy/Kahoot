import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const rootEnv = loadEnv(mode, path.join(__dirname, '..'), '')
    const publicBackend =
        rootEnv.VITE_PUBLIC_BACKEND_ORIGIN ||
        rootEnv.PUBLIC_BACKEND_ORIGIN ||
        'http://localhost:8080'

    return {
        envDir: '..',
        define: {
            'import.meta.env.VITE_PUBLIC_BACKEND_ORIGIN': JSON.stringify(publicBackend.replace(/\/$/, '')),
        },
        plugins: [react()],
        server: {
            host: true,
            port: 5173,
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './tests/setupTests.ts', // Path to your setup file
            css: true, // if you want to include CSS during tests
        },
    }
})
