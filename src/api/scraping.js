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
