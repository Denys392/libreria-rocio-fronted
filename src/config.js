// Parámetros del entorno (archivo .env). Cada aplicativo se compila con su propio VITE_APP_CODE.

// Backend de esta aplicación
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Pantalla de login del sistema de seguridad central
export const CENTRAL_URL = import.meta.env.VITE_CENTRAL_URL || 'http://localhost:5177';

// Aplicativo que es este frontend: libreria | almacen | seguridad | clientes
export const APP_CODE = import.meta.env.VITE_APP_CODE || 'libreria';

// API del sistema central (la usa solo la aplicación de Seguridad: logs y administración de accesos)
export const CENTRAL_API_URL = import.meta.env.VITE_CENTRAL_API_URL || 'http://localhost:4100/api/seguridad';

// Dominio de los correos corporativos (el central es quien lo exige; aquí solo se avisa rápido)
export const DOMINIO_CORREO = import.meta.env.VITE_DOMINIO_CORREO || 'libreriarocio.com';
