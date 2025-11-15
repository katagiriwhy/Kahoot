package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/net/context"
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  2048,
	WriteBufferSize: 2048,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type GameSessionState struct {
	Questions    []QuestionData
	CurrentIndex int
}

type QuestionData struct {
	ID      int64
	Text    string
	Answers []AnswerData
}

type AnswerData struct {
	ID   int64
	Text string
}

type Player struct {
	Id       string `json:"id"`
	Nickname string `json:"nickname"`
}

type Hub struct {
	Clients      map[int64]map[*Client]struct{}
	GameSessions map[int64]*GameSessionState
	Register     chan *Client
	Unregister   chan *Client
	mu           *sync.RWMutex
	db           *pgxpool.Pool
}

func NewHub(db *pgxpool.Pool) *Hub {
	return &Hub{
		Clients:      make(map[int64]map[*Client]struct{}),
		GameSessions: make(map[int64]*GameSessionState),
		Register:     make(chan *Client),
		Unregister:   make(chan *Client),
		mu:           &sync.RWMutex{},
		db:           db,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.registerClient(client)
		case client := <-h.Unregister:
			h.unregisterClient(client)
		}
	}
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	if h.Clients[client.SessionID] == nil {
		h.Clients[client.SessionID] = make(map[*Client]struct{})
	}
	h.Clients[client.SessionID][client] = struct{}{}
	h.mu.Unlock()

	h.BroadcastLobby(client.SessionID)
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	if clients, ok := h.Clients[client.SessionID]; ok {
		if _, ok := clients[client]; ok {
			delete(clients, client)
			close(client.Send)
			log.Printf("[Hub] unregistered user=%d session=%d", client.UserID, client.SessionID)
			if len(clients) == 0 {
				delete(h.Clients, client.SessionID)
			}
		}
	}
	h.mu.Unlock()
	h.BroadcastLobby(client.SessionID)
}

func (h *Hub) CloseLobby(sessionID int64) {
	h.mu.RLock()
	clients, ok := h.Clients[sessionID]
	h.mu.RUnlock()
	if !ok {
		return
	}

	for client := range clients {
		select {
		case client.Send <- []byte(`{"type":"lobby_closed"}`):
		default:
		}

		h.Unregister <- client
	}
}

func (h *Hub) BroadcastLobby(sessionId int64) {
	players, err := h.getPlayers(sessionId)
	if err != nil {
		log.Println(err)
		return
	}

	msg := map[string]any{
		"type":      "lobby_update",
		"sessionId": sessionId,
		"players":   players,
	}

	data, err := json.Marshal(msg)

	if err != nil {
		log.Println(err)
		return
	}

	h.mu.RLock()
	clients, ok := h.Clients[sessionId]
	h.mu.RUnlock()
	if !ok || clients == nil {
		return
	}

	for client := range clients {
		select {
		case client.Send <- data:
		default:
			h.Unregister <- client
		}
	}
}

func (h *Hub) getPlayers(sessionId int64) ([]Player, error) {
	const query = `SELECT id, nickname FROM session_players WHERE session_id = $1 ORDER BY joined_at DESC`

	rows, err := h.db.Query(context.Background(), query, sessionId)

	defer rows.Close()

	if err != nil {
		log.Println(err)
	}

	var players []Player

	for rows.Next() {
		var player Player

		if err := rows.Scan(&player.Id, &player.Nickname); err != nil {
			log.Println(err)
		}
		players = append(players, player)
	}

	if len(players) == 0 {
		return []Player{}, nil
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return players, nil
}
