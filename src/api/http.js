import axios from 'axios';
import { API_URL, CENTRAL_URL } from '../config';
import { debeCerrarSesion, limpiarSesion } from '../utils/sesion';

// Si el token venció, fue cerrado o el central lo rechaza (401): se limpia la sesión y se vuelve
// al login del sistema central. Ya no hay "refresh token": el central decide cuánto dura la sesión.
// Un 403 (sin permiso) o un 503 (central caído) NO sacan al usuario: solo se informan.
let saliendo = false;

// Misma lógica para cualquier cliente HTTP de la aplicación (el backend propio y el del central)
export function configurarSesion(instancia) {
  // Adjunta el token de la aplicación a cada petición
  instancia.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instancia.interceptors.response.use(
    (response) => response,
    (error) => {
      if (debeCerrarSesion(error) && !saliendo) {
        saliendo = true;
        limpiarSesion(localStorage);
        window.location.assign(CENTRAL_URL);
      }
      return Promise.reject(error);
    }
  );
  return instancia;
}

const http = configurarSesion(axios.create({ baseURL: API_URL }));

export default http;
