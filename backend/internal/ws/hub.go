package ws

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/net/context"
)

type Player struct {
	Nickname string `json:"nickname"`
}

type Client struct {
	Conn      *websocket.Conn
	Send      chan []byte
	SessionID int64
}

func NewClient(conn *websocket.Conn, sessionId int64) *Client {
	return &Client{
		Conn:      conn,
		Send:      make(chan []byte),
		SessionID: sessionId,
	}
}

type Hub struct {
	Clients    map[int64]map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	mu         *sync.RWMutex
	db         *pgxpool.Pool
}

func NewHub(db *pgxpool.Pool) *Hub {
	return &Hub{
		Clients:    make(map[int64]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		mu:         &sync.RWMutex{},
		db:         db,
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
		h.Clients[client.SessionID] = make(map[*Client]bool)
	}
	h.Clients[client.SessionID][client] = true
	h.mu.Unlock()

	h.broadcastLobby(client.SessionID)
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	if clients, ok := h.Clients[client.SessionID]; ok {
		if _, ok := clients[client]; ok {
			delete(clients, client)
			close(client.Send)
			if len(clients) == 0 {
				delete(h.Clients, client.SessionID)
			}
		}
	}
	h.mu.Unlock()
	h.broadcastLobby(client.SessionID)
}

func (h *Hub) broadcastLobby(sessionId int64) {
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
			h.mu.Lock()
			delete(h.Clients[client.SessionID], client)
			close(client.Send)
			h.mu.Unlock()
		}
	}
}

func (h *Hub) getPlayers(sessionId int64) ([]Player, error) {
	const query = `SELECT nickname FROM session_players WHERE session_id = $1 ORDER BY joined_at DESC`

	rows, err := h.db.Query(context.Background(), query, sessionId)

	defer rows.Close()

	if err != nil {
		log.Println(err)
	}

	var players []Player

	for rows.Next() {
		var player Player

		if err := rows.Scan(&player.Nickname); err != nil {
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
