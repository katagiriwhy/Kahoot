import '@testing-library/jest-dom';

// Provide minimal mocks for browser APIs used by components during tests
class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
    (globalThis as any).ResizeObserver = MockResizeObserver;
}

if (!('matchMedia' in window)) {
    window.matchMedia = () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}

