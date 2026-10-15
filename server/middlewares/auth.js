import { decodificarToken } from '../utils/jwt.js';

// Verifica el header "Authorization: Bearer <token>" y deja los datos del usuario en req.usuario
export function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    req.usuario = decodificarToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Solo permite continuar si el :id (o el parámetro indicado) coincide con el usuario del token
export function soloPropietario(param = 'id') {
  return (req, res, next) => {
    if (req.params[param] !== req.usuario.id) {
      return res.status(403).json({ error: 'No tenés permiso para acceder a este recurso' });
    }
    next();
  };
}
