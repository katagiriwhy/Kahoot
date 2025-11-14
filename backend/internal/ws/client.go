package ws

import (
	"context"
	"encoding/json"
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
		log.Printf("[ReadPump] PONG user=%d session=%d", c.UserID, c.SessionID)
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			log.Printf("[ReadPump] READ ERROR user=%d session=%d err=%v",
				c.UserID, c.SessionID, err)
			break
		}
		var msg struct {
			Type string `json:"type"`
		}
		if json.Unmarshal(message, &msg) == nil && msg.Type == "leave" {
			log.Printf("[ReadPump] LEAVE user=%d session=%d", c.UserID, c.SessionID)
			hub.db.Exec(context.Background(),
				`DELETE FROM session_players WHERE session_id=$1 AND user_id=$2`,
				c.SessionID, c.UserID)
			break
		}
	}
}
