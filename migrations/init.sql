CREATE TYPE quiz_difficulty AS ENUM ('Легкий', 'Средний', 'Сложный');

CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(30) NOT NULL UNIQUE,
    login VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  is_public BOOLEAN DEFAULT TRUE,
  creator_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_data BYTEA,
  difficulty quiz_difficulty DEFAULT 'Легкий',
  question_amount INTEGER DEFAULT 0,
  title VARCHAR(255) NOT NULL,
  time_limit INTEGER DEFAULT 15,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_creator_id ON quizzes(creator_id);
CREATE INDEX idx_quizzes_is_public ON quizzes(is_public);

CREATE TABLE IF NOT EXISTS public.questions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    quiz_id       BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    points INTEGER DEFAULT 100
);

CREATE INDEX idx_questions_quiz_id ON questions(id);

CREATE TABLE IF NOT EXISTS public.answers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOLLEAN DEFAULT FALSE
);

CREATE INDEX idx_answers_question_id ON answers(id);
CREATE INDEX idx_answers_is_correct ON answers(is_correct);

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  host_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX idx_game_sessions_quiz_id ON game_sessions(quiz_id);
CREATE INDEX idx_game_sessions_host_id ON game_sessions(host_id);

CREATE TABLE IF NOT EXISTS public.session_players (
  id  BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id BIGINT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(30) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE INDEX idx_session_players_session_id ON session_players(session_id);
CREATE INDEX idx_session_players_user_id ON session_players(user_id);

CREATE TABLE IF NOT EXISTS public.player_answers (
    id  BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_player_id BIGINT NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id),
    selected_answer_id BIGINT NOT NULL REFERENCES answers(id),
    is_correct BOLLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score_earned INTEGER DEFAULT 0
);

CREATE INDEX idx_player_answers_session_player ON player_answers(session_player_id);
CREATE INDEX idx_player_answers_question ON player_answers(question_id);

-- CREATE TABLE player_results (
--     result_id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--     session_player_id  BIGINT NOT NULL REFERENCES session_players(session_player_id) ON DELETE CASCADE,
--     total_score        INTEGER DEFAULT 0,
--     rank               INTEGER
-- );
--
-- CREATE INDEX idx_player_results_session_player ON player_results(session_player_id);