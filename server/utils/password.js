import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export function encriptarContraseña(contraseña) {
  return bcrypt.hash(contraseña, SALT_ROUNDS);
}

export function compararContraseña(contraseña, hash) {
  return bcrypt.compare(contraseña, hash);
}
