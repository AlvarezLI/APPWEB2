import { Router } from 'express';
import Producto, { CATEGORIAS } from '../models/Producto.js';
import Venta from '../models/Venta.js';
import { verificarToken } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import { camposFaltantes, tomarCampos, noEncontrado } from '../utils/validaciones.js';

const router = Router();

const CAMPOS_EDITABLES = ['nombre', 'desc', 'precio', 'imagen', 'categoria', 'etiqueta', 'stock', 'disponible'];

router.get('/', async (req, res) => {
  const filtro = {};
  if (req.query.categoria) filtro.categoria = req.query.categoria;
  if (req.query.disponible !== undefined) filtro.disponible = req.query.disponible === 'true';

  const productos = await Producto.find(filtro).sort({ categoria: 1, nombre: 1 });
  res.status(200).json(productos);
});

router.get('/categoria/:categoria', async (req, res) => {
  const { categoria } = req.params;
  if (!CATEGORIAS.includes(categoria)) {
    return res.status(400).json({ error: `Categoría inválida. Opciones: ${CATEGORIAS.join(', ')}` });
  }

  const productos = await Producto.find({ categoria }).sort({ nombre: 1 });
  res.status(200).json(productos);
});

router.get('/:id', validarId(), async (req, res) => {
  const producto = await Producto.findById(req.params.id);
  if (!producto) return noEncontrado(res, 'Producto');
  res.status(200).json(producto);
});

router.post('/', verificarToken, async (req, res) => {
  const faltantes = camposFaltantes(req.body, ['nombre', 'precio', 'categoria']);
  if (faltantes.length) {
    return res.status(400).json({ error: `Faltan campos obligatorios: ${faltantes.join(', ')}` });
  }

  const producto = await Producto.create(tomarCampos(req.body, CAMPOS_EDITABLES));
  res.status(201).json(producto);
});

router.post('/buscar', async (req, res) => {
  const { texto, categoria, precioMin, precioMax, soloDisponibles } = req.body ?? {};
  const filtro = {};

  if (texto) {
    const escapado = String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filtro.$or = [
      { nombre: { $regex: escapado, $options: 'i' } },
      { desc:   { $regex: escapado, $options: 'i' } },
    ];
  }
  if (categoria) filtro.categoria = categoria;
  if (precioMin !== undefined || precioMax !== undefined) {
    filtro.precio = {};
    if (precioMin !== undefined) filtro.precio.$gte = Number(precioMin);
    if (precioMax !== undefined) filtro.precio.$lte = Number(precioMax);
  }
  if (soloDisponibles) filtro.disponible = true;

  const productos = await Producto.find(filtro).sort({ precio: 1 });
  res.status(200).json(productos);
});

router.put('/:id', verificarToken, validarId(), async (req, res) => {
  const cambios = tomarCampos(req.body, CAMPOS_EDITABLES);
  if (!Object.keys(cambios).length) {
    return res.status(400).json({ error: `No se enviaron campos para actualizar. Permitidos: ${CAMPOS_EDITABLES.join(', ')}` });
  }

  const producto = await Producto.findByIdAndUpdate(req.params.id, cambios, { new: true, runValidators: true });
  if (!producto) return noEncontrado(res, 'Producto');
  res.status(200).json(producto);
});

// No se elimina si figura en alguna venta (se sugiere marcarlo como no disponible)
router.delete('/:id', verificarToken, validarId(), async (req, res) => {
  const ventasAsociadas = await Venta.countDocuments({ 'productos.producto': req.params.id });
  if (ventasAsociadas > 0) {
    return res.status(409).json({
      error: `No se puede eliminar: el producto figura en ${ventasAsociadas} venta(s). Marcalo como no disponible con PUT { "disponible": false }.`,
    });
  }

  const producto = await Producto.findByIdAndDelete(req.params.id);
  if (!producto) return noEncontrado(res, 'Producto');
  res.status(200).json({ mensaje: 'Producto eliminado', producto });
});

export default router;
