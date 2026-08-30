import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

// Adjunta el access token a cada petición
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el access token expiró (401), intenta renovarlo una vez con el refresh token
let refrescando = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && localStorage.getItem('refreshToken')) {
      original._retry = true;
      try {
        refrescando = refrescando || axios.post(
          `${http.defaults.baseURL}/auth/refresh-token`,
          { refreshToken: localStorage.getItem('refreshToken') }
        );
        const { data } = await refrescando;
        refrescando = null;
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return http(original);
      } catch (refreshErr) {
        refrescando = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
