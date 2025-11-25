# 📘 QuizHub — интерактивная система викторин

QuizHub — это web-приложение для создания, управления и проведения интерактивных викторин в реальном времени. Проект разработан в рамках курсовой работы.

---

## 👥 Участники проекта

- **Кумекова Хасият** — Frontend (Register, Login, Home) - 5130904/30104
- **Кузьмина Дарья** — Frontend (InterimPage, FinalPage, Lobby) - 5130904/30104
- **Аюпов Дмитрий** — Frontend (QuestionPage, QuizCreate, CreateQuestions) - 5130904/30104
- **Новохацкий Данил** — Backend (REST API, WebSocket, PostgreSQL, Docker) - 5130904/30104

---

## 🎯 Описание проекта

QuizHub позволяет:

- Создавать викторины
- Добавлять вопросы с изображениями и вариантами ответов
- Настраивать время и количество очков
- Проводить викторины в реальном времени
- Подключаться к игре по коду
- Просматривать промежуточные и итоговые результаты

Проект решает проблему отсутствия простого и удобного инструмента для проведения интерактивных опросов и викторин.

---

## 🛠️ Технологический стек

### **Frontend**
- React
- Vite
- JavaScript / TypeScript
- Axios
- HTML / CSS

### **Backend**
- Golang
- Gin
- Gorilla/WebSocket
- JWT

### **Database**
- PostgreSQL

---

## 🧩 Основная функциональность

### ✔ Создание викторин
- Название, описание
- Уровень сложности
- Время на вопрос
- Публичная/закрытая викторина
- Загрузка изображений

### ✔ Работа с вопросами
- Добавление текста
- Несколько вариантов ответов
- Изображения для вопросов
- Указание правильного ответа
- Настройка очков

### ✔ Игровой процесс
- Присоединение по коду
- Синхронизация через WebSocket
- Состояния игры: lobby → question → results → finished
- Показ правильных ответов
- Промежуточные результаты
- Финальная статистика

---

## 🔌 API (контракты)

### **POST /users/register**
```json
{
  "username": "string",
  "login": "string",
  "password": "string"
}
```
### **POST /users/login**
```json
{
  "login": "string",
  "password": "string"
}
```

### **POST /quizzes**
```json
{
  "title": "string",
  "difficulty": "Легкий | Средний | Сложный",
  "is_public": true,
  "question_amount": 10,
  "time_limit": 30,
  "description": "string"
}
```

### **POST /game-sessions**
```json
{
  "quiz_id": 1
}
```

### **POST /questions/answers**
```json
{
  "quiz_id": 1,
  "question_text": "string",
  "points": 100,
  "answers": [
    {
      "answer_text": "string",
      "is_correct": false
    },
    {
      "answer_text": "string",
      "is_correct": true
    }
  ],
  "image": "File"
}
```

## 🧪 Тестирование (Frontend)

Тестируются компоненты:

### **Home**
- Рендеринг интерфейса
- Создание лобби (POST)
- Вход в лобби (GET)

### **CreateQuestions**
- Добавление вариантов ответов
- Выбор правильного ответа
- Создание FormData
- Отправка POST запроса

### Используемые инструменты
- @testing-library/react
- user-event
- моки API и навигации

---

## 🗄️ Архитектура базы данных

Основные сущности:

- users
- quizzes
- questions
- answers
- game_sessions
- session_players
- player_answers

(Полную SQL-схему см. в файлах проекта.)

---

## 🐳 Сборка и запуск (Docker)

Проект использует **Docker Compose** и разворачивает 3 контейнера:

- **Frontend**
- **Backend**
- **PostgreSQL**

### 🚀 Запуск проекта

```bash
docker compose up -d
