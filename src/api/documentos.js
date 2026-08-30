import http from './http';

// Los documentos requieren el header Authorization, por lo que no se enlazan directo por <a href>,
// se descargan como blob mediante axios y luego se disparan con un enlace temporal.
export const documentosApi = {
  async descargarPdfVenta(ventaId, nombreArchivo) {
    const { data } = await http.get(`/documentos/ventas/${ventaId}/pdf`, { responseType: 'blob' });
    descargarBlob(data, nombreArchivo || `venta-${ventaId}.pdf`);
  },
  async descargarXmlVenta(ventaId, nombreArchivo) {
    const { data } = await http.get(`/documentos/ventas/${ventaId}/xml`, { responseType: 'blob' });
    descargarBlob(data, nombreArchivo || `venta-${ventaId}.xml`);
  },
  async obtenerUrlVistaPdf(ventaId) {
    const { data } = await http.get(`/documentos/ventas/${ventaId}/pdf/ver`, { responseType: 'blob' });
    return URL.createObjectURL(data);
  }
};

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
