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

// Extend the Window interface to include matchMedia
interface Window {
    matchMedia: (query: string) => {
        matches: boolean;
        media: string;
        onchange: any;
        addListener: (listener: (event: MediaQueryListEvent) => void) => void;
        removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
        addEventListener: (type: string, listener: EventListener) => void;
        removeEventListener: (type: string, listener: EventListener) => void;
        dispatchEvent: (event: Event) => boolean;
    };
}

if (!('matchMedia' in window)) {
    window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}
