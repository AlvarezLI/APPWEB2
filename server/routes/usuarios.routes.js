import { Router } from 'express';
import Usuario from '../models/Usuario.js';
import Venta from '../models/Venta.js';
import { verificarToken, soloPropietario } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import { camposFaltantes, tomarCampos, noEncontrado } from '../utils/validaciones.js';
import { encriptarContraseña, compararContraseña } from '../utils/password.js';
import { generarToken } from '../utils/jwt.js';

const router = Router();

const CAMPOS_EDITABLES = ['nombre', 'apellido', 'email', 'contraseña', 'fechaNacimiento', 'activo'];
const LARGO_MINIMO_CONTRASEÑA = 8;

router.get('/', async (req, res) => {
  const usuarios = await Usuario.find().sort({ apellido: 1 });
  res.status(200).json(usuarios);
});

router.get('/:id', validarId(), async (req, res) => {
  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) return noEncontrado(res, 'Usuario');
  res.status(200).json(usuario);
});

router.post('/registro', async (req, res) => {
  const faltantes = camposFaltantes(req.body, ['nombre', 'apellido', 'email', 'contraseña']);
  if (faltantes.length) {
    return res.status(400).json({ error: `Faltan campos obligatorios: ${faltantes.join(', ')}` });
  }
  if (req.body.contraseña.length < LARGO_MINIMO_CONTRASEÑA) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASEÑA} caracteres` });
  }

  const existe = await Usuario.exists({ email: req.body.email.toLowerCase() });
  if (existe) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });

  const datos = tomarCampos(req.body, ['nombre', 'apellido', 'email', 'fechaNacimiento']);
  datos.contraseña = await encriptarContraseña(req.body.contraseña);

  const usuario = await Usuario.create(datos);
  const { contraseña, ...usuarioSinContraseña } = usuario.toObject();
  res.status(201).json(usuarioSinContraseña);
});

router.post('/login', async (req, res) => {
  const faltantes = camposFaltantes(req.body, ['email', 'contraseña']);
  if (faltantes.length) {
    return res.status(400).json({ error: `Faltan campos obligatorios: ${faltantes.join(', ')}` });
  }

  const usuario = await Usuario.findOne({ email: req.body.email.toLowerCase() }).select('+contraseña');
  const valida = usuario && (await compararContraseña(req.body.contraseña, usuario.contraseña));
  if (!valida) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  if (!usuario.activo) return res.status(403).json({ error: 'La cuenta está desactivada' });

  const { contraseña, ...usuarioSinContraseña } = usuario.toObject();
  res.status(200).json({ token: generarToken(usuario), usuario: usuarioSinContraseña });
});

router.put('/:id', verificarToken, validarId(), soloPropietario(), async (req, res) => {
  const cambios = tomarCampos(req.body, CAMPOS_EDITABLES);
  if (!Object.keys(cambios).length) {
    return res.status(400).json({ error: `No se enviaron campos para actualizar. Permitidos: ${CAMPOS_EDITABLES.join(', ')}` });
  }
  if (cambios.contraseña !== undefined) {
    if (cambios.contraseña.length < LARGO_MINIMO_CONTRASEÑA) {
      return res.status(400).json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASEÑA} caracteres` });
    }
    cambios.contraseña = await encriptarContraseña(cambios.contraseña);
  }

  const usuario = await Usuario.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true });
  if (!usuario) return noEncontrado(res, 'Usuario');
  res.status(200).json(usuario);
});

// No se elimina si tiene ventas asociadas (quedarían apuntando a un ID inexistente)
router.delete('/:id', verificarToken, validarId(), soloPropietario(), async (req, res) => {
  const ventasAsociadas = await Venta.countDocuments({ usuario: req.params.id });
  if (ventasAsociadas > 0) {
    return res.status(409).json({
      error: `No se puede eliminar: el usuario tiene ${ventasAsociadas} venta(s) asociada(s). Eliminá esas ventas primero o desactivá la cuenta con PUT { "activo": false }.`,
    });
  }

  const usuario = await Usuario.findByIdAndDelete(req.params.id);
  if (!usuario) return noEncontrado(res, 'Usuario');
  res.status(200).json({ mensaje: 'Usuario eliminado', usuario });
});

export default router;
