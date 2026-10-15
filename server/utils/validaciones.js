/* Funciones reutilizables de validación y respuesta usadas por las rutas */

// Devuelve la lista de campos obligatorios que no vienen en el body
export function camposFaltantes(body, campos) {
  return campos.filter((campo) => body?.[campo] === undefined || body[campo] === '');
}

// Copia del body solo las claves permitidas (evita que se modifiquen campos no deseados)
export function tomarCampos(body, permitidos) {
  const resultado = {};
  for (const campo of permitidos) {
    if (body?.[campo] !== undefined) resultado[campo] = body[campo];
  }
  return resultado;
}

export function noEncontrado(res, entidad) {
  return res.status(404).json({ error: `${entidad} no encontrado` });
}
