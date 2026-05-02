import axios from 'axios';
import { publicBackendOrigin } from '../config/publicBackend';

export const REGISTER_URL = "/users/register";
export const LOGIN_URL = "/users/login";
export const NEW_QUIZ_URL = '/quizzes';
export const CREATE_LOBBY_URL = '/game-sessions';
export const CREATE_QUESTION_WITH_ANSWERS_URL = '/questions/answers';

const api = axios.create({
    baseURL: publicBackendOrigin,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.withCredentials = true;
    return config;
});

export default api;