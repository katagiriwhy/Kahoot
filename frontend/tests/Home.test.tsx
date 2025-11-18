import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Home from '../src/components/Home';

const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('../src/components/Api', () => ({
    default: {
        post: mockPost,
        get: mockGet,
    },
    CREATE_LOBBY_URL: '/game-sessions',
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Home component', () => {
    beforeEach(() => {
        mockPost.mockReset();
        mockGet.mockReset();
        mockNavigate.mockReset();
    });

    it('renders create and join lobby cards', () => {
        render(<Home />);

        expect(screen.getByText(/Create Lobby/i)).toBeInTheDocument();
        expect(screen.getByText(/Join Lobby/i)).toBeInTheDocument();
    });

    it('creates lobby and navigates host to lobby page', async () => {
        mockPost.mockResolvedValueOnce({ data: { game_session_id: 555 } });

        render(<Home />);

        await userEvent.type(screen.getByPlaceholderText(/Quiz ID/i), '42');
        await userEvent.click(screen.getByText(/Create Lobby/i, { selector: 'button' }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/game-sessions', { quiz_id: 42 });
        });
        expect(mockNavigate).toHaveBeenCalledWith('/lobby/555', { state: { isHost: true } });
    });

    it('joins existing lobby as player', async () => {
        mockGet.mockResolvedValueOnce({ data: { exists: true } });

        render(<Home />);

        await userEvent.type(screen.getByPlaceholderText(/Lobby ID/i), '777');
        await userEvent.click(screen.getByText(/Join Lobby/i, { selector: 'button' }));

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalledWith('/game-sessions/777/exists');
        });
        expect(mockNavigate).toHaveBeenCalledWith('/lobby/777', { state: { isHost: false } });
    });
});

