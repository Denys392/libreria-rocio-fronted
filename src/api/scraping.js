import http from "./http";

export const solicitarScraping = (data) =>
  http.post("/scraping/ejecutar", data);
export const getHistorialScraping = () => http.get("/scraping/historial");
export const getDetalleJob = (jobId) =>
  http.get(`/scraping/job/${jobId}/detalle`);
export const importarProductosScrapeados = (payload) =>
  http.post("/scraping/importar", payload);
export const getComparacionesGlobales = (soloAlertas = false) =>
  http.get("/scraping/comparaciones", { params: { soloAlertas } });

// Fuentes externas (API JSON de socios, ej. Bazar Elena): se configuran
// una sola vez y luego solo se sincronizan por id.
export const getFuentesExternas = () => http.get("/scraping/fuentes-externas");
export const crearFuenteExterna = (payload) =>
  http.post("/scraping/fuentes-externas", payload);
export const actualizarFuenteExterna = (id, payload) =>
  http.put(`/scraping/fuentes-externas/${id}`, payload);
export const activarFuenteExterna = (id) =>
  http.patch(`/scraping/fuentes-externas/${id}/activar`);
export const desactivarFuenteExterna = (id) =>
  http.patch(`/scraping/fuentes-externas/${id}/desactivar`);
export const sincronizarFuenteExterna = (id) =>
  http.post(`/scraping/fuentes-externas/${id}/sincronizar`);
