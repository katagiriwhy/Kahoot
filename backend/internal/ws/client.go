package ws

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

type Client struct {
	Conn      *websocket.Conn
	Send      chan []byte
	SessionID int64
	UserID    int64
}

func NewClient(conn *websocket.Conn, sessionId int64, userId int64) *Client {
	return &Client{
		Conn:      conn,
		Send:      make(chan []byte, 256),
		SessionID: sessionId,
		UserID:    userId,
	}
}

func (c *Client) WritePump() {
	log.Printf("[WritePump] start user=%d session=%d", c.UserID, c.SessionID)
	ticker := time.NewTicker(pingPeriod)

	defer func() {
		log.Printf("[WritePump] STOP user=%d session=%d", c.UserID, c.SessionID)
		ticker.Stop()
		if err := c.Conn.Close(); err != nil {
			log.Println("close conn:", err)
		}
		log.Printf("[WritePump] STOP user=%d session=%d", c.UserID, c.SessionID)
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if err := c.Conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				log.Println("set write deadline:", err)
				return
			}
			if !ok {
				log.Printf("[WritePump] channel closed user=%d session=%d", c.UserID, c.SessionID)
				if err := c.Conn.WriteMessage(websocket.CloseMessage, []byte{}); err != nil {
					log.Println("write close:", err)
				}
				return
			}
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := w.Write(message); err != nil {
				log.Println("write:", err)
				return
			}

		drain:
			for {
				select {
				case msg, ok := <-c.Send:
					if !ok {
						return
					}
					w.Write(msg)
				default:
					if err := w.Close(); err != nil {
						log.Println("close writer:", err)
					}
					break drain
				}
			}

		case <-ticker.C:
			if err := c.Conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				return
			}
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("[WritePump] PING ERROR user=%d session=%d err=%v", c.UserID, c.SessionID, err)
				return
			}
		}
	}
}

func (c *Client) ReadPump(hub *Hub) {
	log.Printf("[ReadPump] start user=%d session=%d", c.UserID, c.SessionID)

	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			log.Printf("[ReadPump] read error user=%d session=%d: %v",
				c.UserID, c.SessionID, err)
			break
		}

		var msg map[string]any
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("[ReadPump] bad json user=%d session=%d: %v",
				c.UserID, c.SessionID, err)
			continue
		}

		msgType, _ := msg["type"].(string)

		switch msgType {

		case "leave":
			log.Printf("[ReadPump] LEAVE user=%d session=%d", c.UserID, c.SessionID)
			hub.db.Exec(context.Background(),
				`DELETE FROM session_players WHERE session_id=$1 AND user_id=$2`,
				c.SessionID, c.UserID)
			return

		case "start_game":
			log.Printf("[ReadPump] START_GAME by user %d", c.UserID)

			var hostID int64
			var startedAt *time.Time

			err := hub.db.QueryRow(context.Background(),
				`SELECT host_id, started_at  FROM game_sessions WHERE id = $1`, c.SessionID,
			).Scan(&hostID, &startedAt)

			log.Printf("[ReadPump]  user=%d, hostID=%d", c.UserID, hostID)
			if errors.Is(err, sql.ErrNoRows) {
				log.Printf("[ReadPump] No rows found for user=%d session=%d", c.UserID, c.SessionID)
				continue
			}
			if err != nil {
				log.Printf("[ReadPump] START_GAME ERROR user=%d session=%d: %v", c.UserID, c.SessionID, err)
				continue
			}
			if hostID != c.UserID {
				log.Printf("[ReadPump] ONLY HOST CAN START A GAME user=%d session=%d", c.UserID, c.SessionID)
				continue
			}

			if startedAt != nil {
				log.Printf("[ReadPump] Session already started at user=%d session=%d", c.UserID, c.SessionID)
				continue
			}

			var amountPlayers int64

			err = hub.db.QueryRow(context.Background(), `SELECT COUNT(*) FROM session_players WHERE session_id = $1`, c.SessionID).Scan(&amountPlayers)
			if err != nil {
				log.Printf("[ReadPump]Error: %v, user=%d session=%d", err, c.UserID, c.SessionID)
				continue
			}
			if amountPlayers == 0 {
				log.Printf("[ReadPump] Can't start a game, because not enough players for user=%d session=%d, players=%d", c.UserID, c.SessionID, amountPlayers)
				continue
			}

			if err := hub.StartGame(c.SessionID, c.UserID); err != nil {
				log.Println("hub.StartGame error:", err)
			}

		case "answer":
			answerFloat, ok := msg["answer_id"].(float64)
			if !ok {
				log.Printf("[ReadPump] invalid answer from user=%d", c.UserID)
				continue
			}
			answerID := int64(answerFloat)

			hub.mu.RLock()
			session := hub.GameSessions[c.SessionID]
			var questionID int64
			if session != nil && session.CurrentIndex < len(session.Questions) {
				questionID = session.Questions[session.CurrentIndex].ID
			}
			hub.mu.RUnlock()

			if questionID == 0 {
				log.Printf("[ReadPump] answer ignored: no active question user=%d", c.UserID)
				continue
			}

			hub.SubmitAnswer(c.SessionID, c.UserID, questionID, answerID)
			log.Printf("[ReadPump] answer accepted user=%d q=%d ans=%d",
				c.UserID, questionID, answerID)

		case "end_question":
			log.Printf("[ReadPump] END_QUESTION by user %d", c.UserID)

			var hostID int64
			err := hub.db.QueryRow(context.Background(),
				`SELECT host_id FROM game_sessions WHERE id = $1`, c.SessionID,
			).Scan(&hostID)
			if err != nil {
				log.Printf("[ReadPump] end_question failed: cannot get host_id: %v", err)
				continue
			}
			if hostID != c.UserID {
				log.Printf("[ReadPump] ONLY HOST CAN END QUESTION user=%d session=%d", c.UserID, c.SessionID)
				continue
			}

			hub.EndQuestion(c.SessionID)

		case "next_question":
			log.Printf("[ReadPump] NEXT QUESTION by user %d", c.UserID)

			var timeLimit int16
			err := hub.db.QueryRow(context.Background(),
				`SELECT q.time_limit 
				 FROM game_sessions gs 
				 JOIN quizzes q ON gs.quiz_id = q.id
				 WHERE gs.id=$1`,
				c.SessionID).Scan(&timeLimit)
			if err != nil {
				log.Printf("[ReadPump] next_question failed: cannot load time_limit: %v", err)
				continue
			}

			hub.NextQuestion(c.SessionID, c.UserID, timeLimit)

		default:
			log.Printf("[ReadPump] unknown message type=%s from user=%d", msgType, c.UserID)
		}
	}
}
