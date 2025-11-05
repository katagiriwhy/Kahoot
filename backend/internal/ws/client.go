package ws

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

func (c *Client) writePump() {
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

func (c *Client) readPump(hub *Hub) {
	defer func() {
		hub.Unregister <- c
		if err := c.Conn.Close(); err != nil {
			log.Println("close conn:", err)
		}
	}()

	if err := c.Conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		log.Println("set read deadline:", err)
	}
	c.Conn.SetPongHandler(func(string) error {
		if err := c.Conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
			log.Println("set read deadline:", err)
		}
		return nil
	})

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("unexpected close: %v", err)
			}
			break
		}
	}
}
