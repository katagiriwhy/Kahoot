import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function devServerAllowedHosts(backendURL: string, rootEnv: Record<string, string>): string[] {
    const hosts = new Set<string>(['localhost', '127.0.0.1'])
    for (const h of (rootEnv.VITE_DEV_SERVER_ALLOWED_HOSTS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)) {
        hosts.add(h)
    }
    try {
        const hostname = new URL(backendURL).hostname
        if (hostname) hosts.add(hostname)
    } catch {
        /* ignore invalid URL */
    }
    return [...hosts]
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Merge process.env so Docker-injected vars (no .env file in image) apply.
    const rootEnv = {
        ...loadEnv(mode, path.join(__dirname, '..'), ''),
        ...process.env,
    } as Record<string, string>
    const publicBackend =
        rootEnv.VITE_PUBLIC_BACKEND_ORIGIN ||
        rootEnv.PUBLIC_BACKEND_ORIGIN ||
        'http://localhost:8080'
    const apiPathPrefix =
        rootEnv.VITE_PUBLIC_API_PATH_PREFIX || rootEnv.PUBLIC_API_PATH_PREFIX || ''
    const sameOriginNoApiPrefix =
        rootEnv.VITE_SAME_ORIGIN_NO_API_PREFIX || rootEnv.PUBLIC_SAME_ORIGIN_NO_API_PREFIX || ''

    return {
        envDir: '..',
        define: {
            'import.meta.env.VITE_PUBLIC_BACKEND_ORIGIN': JSON.stringify(publicBackend.replace(/\/$/, '')),
            'import.meta.env.VITE_PUBLIC_API_PATH_PREFIX': JSON.stringify(apiPathPrefix.trim()),
            'import.meta.env.VITE_SAME_ORIGIN_NO_API_PREFIX': JSON.stringify(sameOriginNoApiPrefix.trim()),
        },
        plugins: [react()],
        server: {
            host: true,
            port: 5173,
            allowedHosts: devServerAllowedHosts(publicBackend, rootEnv),
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './tests/setupTests.ts', // Path to your setup file
            css: true, // if you want to include CSS during tests
        },
    }
})
