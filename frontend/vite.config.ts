import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
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
})
