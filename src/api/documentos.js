import http from './http';

// Los documentos requieren el header Authorization, por lo que no se enlazan directo por <a href>,
// se descargan como blob mediante axios y luego se disparan con un enlace temporal.
export const documentosApi = {
  async descargarPdfVenta(ventaId, nombreArchivo) {
    const data = await getBlob(`/documentos/ventas/${ventaId}/pdf`);
    descargarBlob(data, nombreArchivo ? `${nombreArchivo}.pdf` : `venta-${ventaId}.pdf`);
  },
  async descargarXmlVenta(ventaId, nombreArchivo) {
    const data = await getBlob(`/documentos/ventas/${ventaId}/xml`);
    descargarBlob(data, nombreArchivo ? `${nombreArchivo}.xml` : `venta-${ventaId}.xml`);
  },
  async obtenerUrlVistaPdf(ventaId) {
    const data = await getBlob(`/documentos/ventas/${ventaId}/pdf/ver`);
    return URL.createObjectURL(data);
  }
};

// Hace el GET como blob y, si el backend responde con error, convierte ese blob
// (que en realidad es un JSON { message }) a un Error legible.
async function getBlob(url) {
  try {
    const { data } = await http.get(url, { responseType: 'blob' });
    return data;
  } catch (err) {
    const mensaje = await leerMensajeDeError(err);
    if (mensaje) err.mensajeLegible = mensaje;
    throw err;
  }
}

async function leerMensajeDeError(err) {
  const blob = err.response?.data;
  if (!(blob instanceof Blob)) return null;
  try {
    const texto = await blob.text();
    return JSON.parse(texto).message || null;
  } catch {
    return null;
  }
}

function descargarBlob(blobData, nombreArchivo) {
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
