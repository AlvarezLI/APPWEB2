import jwt from 'jsonwebtoken';

export function generarToken(usuario) {
  const payload = { id: usuario._id.toString(), email: usuario.email };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
}

export function decodificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
