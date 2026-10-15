// Rutas inexistentes
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
}

// Manejador central de errores (Express 5 envía acá los errores de las funciones async)
export function manejarErrores(err, req, res, next) {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos únicos', campos: err.keyValue });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El body no es un JSON válido' });
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
