import axios from 'axios';

export const REGISTER_URL = "/users/register";
export const LOGIN_URL = "/users/login";
export const NEW_QUIZ_URL = '/quizzes';
export const JOIN_URL = '/join';
export const CREATE_URL = '/create';
export const CREATE_QUESTION_URL = '/questions';
export const CREATE_QUESTION_WITH_ANSWERS_URL = '/questions/answers';

const api = axios.create({
    baseURL: "http://localhost:8080",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;