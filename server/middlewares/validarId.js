import { isValidObjectId } from 'mongoose';

// Rechaza con 400 los ObjectID mal formados antes de consultar la base
export function validarId(param = 'id') {
  return (req, res, next) => {
    if (!isValidObjectId(req.params[param])) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    next();
  };
}
