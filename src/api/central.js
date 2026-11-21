import axios from 'axios';
import { CENTRAL_API_URL } from '../config';
import { configurarSesion } from './http';

// Cliente del sistema de seguridad central. Solo lo usa la aplicación de Seguridad: el central
// exige que el token sea de la app "seguridad" con el rol SEGURIDAD (si no, responde 403).
const central = configurarSesion(axios.create({ baseURL: CENTRAL_API_URL }));

export const centralApi = {
  // Logs de acceso (auditoría de quién entró y qué cambió Seguridad)
  logs: (params = {}) => central.get('/logs', { params }),
  resumen: () => central.get('/logs/resumen'),
  // Administración de accesos: qué usuario tiene activo cada rol/aplicación
  accesos: () => central.get('/accesos'),
  crearUsuario: (datos) => central.post('/accesos/usuarios', datos),
  asignarRol: ({ usuarioId, rolId, motivo }) => central.post('/accesos', { usuarioId, rolId, ...(motivo ? { motivo } : {}) }),
  // Opciones de menú de cada aplicación (activar, desactivar, crear, editar)
  menus: (app) => central.get('/opciones-menu', { params: app ? { app } : {} }),
  crearMenu: (datos) => central.post('/opciones-menu', datos),
  cambiarMenu: (id, cambios) => central.patch(`/opciones-menu/${id}`, cambios),
  cambiarAcceso: ({ usuarioId, rolId, activo, motivo }) =>
    central.patch('/accesos', { usuarioId, rolId, activo, ...(motivo ? { motivo } : {}) })
};

export default central;
