package ws

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
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
	Questions           []QuestionData
	CurrentIndex        int
	Answers             map[int64]map[int64]int64
	Scores              map[int64]int
	HostID              int64
	LastEndedQuestionID int64
}

type QuestionData struct {
	ID        int64
	Text      string
	Points    int
	Image     []byte
	ImageType string
	Answers   []AnswerData
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

func (h *Hub) StartGame(sessionID int64, hostID int64) error {
	h.mu.Lock()
	if _, exists := h.GameSessions[sessionID]; exists {
		h.mu.Unlock()
		return fmt.Errorf("session already started")
	}
	h.mu.Unlock()

	var quizID int64
	var timeLimit int16
	if err := h.db.QueryRow(context.Background(), `
        SELECT gs.quiz_id, q.time_limit
        FROM game_sessions gs
        JOIN quizzes q ON gs.quiz_id = q.id
        WHERE gs.id=$1`, sessionID).Scan(&quizID, &timeLimit); err != nil {
		return err
	}

	rows, err := h.db.Query(context.Background(), `
        SELECT q.id, q.question_text, q.points, q.image, a.id, a.answer_text
        FROM questions q
        JOIN answers a ON q.id = a.question_id
        WHERE q.quiz_id=$1
        ORDER BY q.id, a.id`, quizID)
	if err != nil {
		return err
	}
	defer rows.Close()

	qMap := make(map[int64]*QuestionData)
	for rows.Next() {
		var qID, aID int64
		var qText, aText string
		var qPoints int
		var qImage []byte
		if err := rows.Scan(&qID, &qText, &qPoints, &qImage, &aID, &aText); err != nil {
			return err
		}
		if _, ok := qMap[qID]; !ok {
			var imageCopy []byte
			if len(qImage) > 0 {
				imageCopy = make([]byte, len(qImage))
				copy(imageCopy, qImage)
			}
			imgType := ""
			if len(imageCopy) > 0 {
				imgType = http.DetectContentType(imageCopy)
			}
			qMap[qID] = &QuestionData{ID: qID, Text: qText, Points: qPoints, Image: imageCopy, ImageType: imgType, Answers: []AnswerData{}}
		}
		qMap[qID].Answers = append(qMap[qID].Answers, AnswerData{ID: aID, Text: aText})
	}

	gameQuestions := make([]QuestionData, 0, len(qMap))
	for _, q := range qMap {
		gameQuestions = append(gameQuestions, *q)
	}

	sort.Slice(gameQuestions, func(i, j int) bool {
		return gameQuestions[i].ID < gameQuestions[j].ID
	})

	log.Printf("[Hub] StartGame: session=%d, totalQuestions=%d", sessionID, len(gameQuestions))
	for i, q := range gameQuestions {
		log.Printf("[Hub] StartGame: question[%d] = ID=%d, text=%s", i, q.ID, q.Text)
	}

	gs := &GameSessionState{
		Questions:           gameQuestions,
		CurrentIndex:        0,
		Answers:             make(map[int64]map[int64]int64),
		Scores:              make(map[int64]int),
		HostID:              hostID,
		LastEndedQuestionID: 0,
	}

	h.mu.Lock()
	h.GameSessions[sessionID] = gs
	h.mu.Unlock()

	log.Printf("[Hub] StartGame: broadcasting first question (index 0)")
	h.BroadcastQuestion(sessionID, timeLimit)
	return nil
}

func (h *Hub) BroadcastQuestion(sessionId int64, timeLimit int16) {
	h.mu.RLock()
	clients, ok := h.Clients[sessionId]
	session, sessionExists := h.GameSessions[sessionId]
	h.mu.RUnlock()

	if !ok || !sessionExists {
		log.Printf("[Hub] BroadcastQuestion no session or clients session=%d ", sessionId)
		return
	}

	if session.CurrentIndex >= len(session.Questions) {
		log.Printf("[Hub] BroadcastQuestion no more questions in session=%d", sessionId)
		return
	}

	question := session.Questions[session.CurrentIndex]
	log.Printf("[Hub] BroadcastQuestion: session=%d, index=%d/%d, questionID=%d, text=%s",
		sessionId, session.CurrentIndex, len(session.Questions), question.ID, question.Text)

	questionPayload := map[string]any{
		"id":      question.ID,
		"text":    question.Text,
		"answers": question.Answers,
		"points":  question.Points,
	}
	if len(question.Image) > 0 {
		questionPayload["image"] = base64.StdEncoding.EncodeToString(question.Image)
		if question.ImageType != "" {
			questionPayload["imageType"] = question.ImageType
		}
	}

	msg := map[string]any{
		"type":      "question",
		"question":  questionPayload,
		"timeLimit": timeLimit,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Println(err)
		return
	}

	for client := range clients {
		select {
		case client.Send <- data:
			log.Printf("[Hub] BroadcastQuestion SENT QUESTION TO client user=%d", client.UserID)
		default:
			log.Printf("[Hub] client channel full, skipping send user=%d", client.UserID)
			//h.Unregister <- client
		}
	}
}

func (h *Hub) SubmitAnswer(sessionID int64, userID int64, questionID int64, answerID int64) {
	h.mu.Lock()
	defer h.mu.Unlock()
	session, ok := h.GameSessions[sessionID]
	if !ok {
		return
	}
	if _, exists := session.Answers[questionID]; !exists {
		session.Answers[questionID] = make(map[int64]int64)
	}
	session.Answers[questionID][userID] = answerID
}

func (h *Hub) EndQuestion(sessionID int64) {
	h.mu.Lock()
	session, ok := h.GameSessions[sessionID]
	if !ok {
		h.mu.Unlock()
		return
	}
	if session.CurrentIndex >= len(session.Questions) {
		h.mu.Unlock()
		return
	}
	question := session.Questions[session.CurrentIndex]

	if session.LastEndedQuestionID == question.ID {
		h.mu.Unlock()
		return
	}
	session.LastEndedQuestionID = question.ID
	h.mu.Unlock()

	var correctID int64
	var correctText string
	err := h.db.QueryRow(context.Background(),
		`SELECT id, answer_text FROM answers WHERE question_id=$1 AND is_correct = true LIMIT 1`, question.ID).Scan(&correctID, &correctText)
	if err != nil {
		log.Println("can't get correct answer:", err)
	}

	h.mu.Lock()
	answersForQ := session.Answers[question.ID]

	clients := h.Clients[sessionID]
	players := make([]map[string]any, 0, len(clients))
	for client := range clients {
		uid := client.UserID

		if uid == session.HostID {
			continue
		}
		var nick string
		_ = h.db.QueryRow(context.Background(), `SELECT nickname FROM session_players WHERE session_id=$1 AND user_id=$2`, sessionID, uid).Scan(&nick)
		if answersForQ != nil {
			if ans, ok := answersForQ[uid]; ok && ans == correctID {
				pointsAward := question.Points
				if pointsAward <= 0 {
					pointsAward = 1
				}
				session.Scores[uid] += pointsAward
			}
		}
		players = append(players, map[string]any{
			"user_id":  uid,
			"nickname": nick,
			"score":    session.Scores[uid],
		})
	}
	h.mu.Unlock()

	msg := map[string]any{
		"type":              "question_end",
		"questionId":        question.ID,
		"correctAnswerId":   correctID,
		"correctAnswerText": correctText,
		"players":           players,
	}
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	clients2 := h.Clients[sessionID]
	h.mu.RUnlock()
	for client := range clients2 {
		select {
		case client.Send <- data:
		default:
			h.Unregister <- client
		}
	}
}

func (h *Hub) NextQuestion(sessionID int64, userID int64, timeLimit int16) {
	h.mu.Lock()
	session, ok := h.GameSessions[sessionID]
	if !ok {
		h.mu.Unlock()
		return
	}
	if session.HostID != userID {
		h.mu.Unlock()
		return
	}

	if session.CurrentIndex >= len(session.Questions) {
		h.mu.Unlock()
		return
	}
	currentIdx := session.CurrentIndex
	h.mu.Unlock()

	h.EndQuestion(sessionID)

	h.mu.Lock()
	session2, ok2 := h.GameSessions[sessionID]
	if !ok2 {
		h.mu.Unlock()
		return
	}

	if session2.CurrentIndex == currentIdx {
		if session2.CurrentIndex < len(session2.Questions) {
			session2.CurrentIndex++
			log.Printf("[Hub] NextQuestion: moved from index %d to %d", currentIdx, session2.CurrentIndex)
		} else {
			log.Printf("[Hub] NextQuestion: no more questions, currentIndex=%d, total=%d", session2.CurrentIndex, len(session2.Questions))
			h.mu.Unlock()
			return
		}
	} else {
		log.Printf("[Hub] NextQuestion: index changed unexpectedly from %d to %d", currentIdx, session2.CurrentIndex)
	}
	h.mu.Unlock()

	h.BroadcastQuestion(sessionID, timeLimit)

	h.mu.RLock()
	s := h.GameSessions[sessionID]
	more := s.CurrentIndex < len(s.Questions)
	h.mu.RUnlock()
	if !more {

		h.mu.RLock()
		clients := h.Clients[sessionID]
		h.mu.RUnlock()

		players := make([]map[string]any, 0, len(clients))
		for client := range clients {
			uid := client.UserID

			if uid == s.HostID {
				continue
			}
			var nick string
			_ = h.db.QueryRow(context.Background(),
				`SELECT nickname FROM session_players WHERE session_id=$1 AND user_id=$2`,
				sessionID, uid).Scan(&nick)
			players = append(players, map[string]any{
				"user_id":  uid,
				"nickname": nick,
				"score":    s.Scores[uid],
			})
		}

		msg := map[string]any{
			"type":    "game_finished",
			"scores":  s.Scores,
			"players": players,
		}
		data, _ := json.Marshal(msg)
		h.mu.RLock()
		clients2 := h.Clients[sessionID]
		h.mu.RUnlock()
		for client := range clients2 {
			select {
			case client.Send <- data:
			default:
				h.Unregister <- client
			}
		}
		h.mu.Lock()
		delete(h.GameSessions, sessionID)
		h.mu.Unlock()
	}
}
