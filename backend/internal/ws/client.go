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

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)

	defer func() {
		ticker.Stop()
		if err := c.Conn.Close(); err != nil {
			log.Println("close conn:", err)
		}
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if err := c.Conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				log.Println("set write deadline:", err)
			}
			if !ok {
				if err := c.Conn.WriteMessage(websocket.CloseMessage, []byte{}); err != nil {
					log.Println("write close:", err)
				}
			}
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := w.Write(message); err != nil {
				log.Println("write:", err)

			}

			for i := 0; i < len(c.Send); i++ {
				if msg, ok := <-c.Send; ok {
					w.Write(msg)
				}
			}

			if err := w.Close(); err != nil {
				log.Println("close writer:", err)
			}
		case <-ticker.C:
			if err := c.Conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				log.Println("set write deadline:", err)
			}
		}
	}
}

func (c *Client) ReadPump(hub *Hub) {
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
			break
		}
		var msg struct {
			Type string `json:"type"`
		}
		if json.Unmarshal(message, &msg) == nil && msg.Type == "leave" {
			hub.db.Exec(context.Background(),
				`DELETE FROM session_players WHERE session_id=$1 AND user_id=$2`,
				c.SessionID, c.UserID)
			break
		}
	}
}
