import axios from 'axios';

export const REGISTER_URL = "/users/register";
export const LOGIN_URL = "/users/login";
export const NEW_QUIZ_URL = '/quizzes';
export const JOIN_URL = '/join';
export const CREATE_LOBBY_URL = '/game-sessions';
export const CREATE_QUESTION_URL = '/questions';
export const CREATE_QUESTION_WITH_ANSWERS_URL = '/questions/answers';

const api = axios.create({
    baseURL: "http://172.20.10.3:8080",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.withCredentials = true;
    return config;
});

export default api;