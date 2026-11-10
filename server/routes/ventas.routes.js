import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import { verificarToken, soloPropietario } from '../middlewares/auth.js';
import { validarId } from '../middlewares/validarId.js';
import { tomarCampos, noEncontrado } from '../utils/validaciones.js';

const router = Router();

router.use(verificarToken);

const POPULATE = [
  { path: 'usuario', select: 'nombre apellido email' },
  { path: 'productos.producto', select: 'nombre precio categoria imagen' },
];

function buscarVentaPropia(id, idUsuario) {
  return Venta.findOne({ _id: id, usuario: idUsuario });
}

async function devolverStock(items) {
  for (const { producto, cantidad } of items) {
    await Producto.updateOne({ _id: producto }, { $inc: { stock: cantidad } });
  }
}

// Cada usuario solo accede a sus propias ventas (el token identifica al comprador)
router.get('/', async (req, res) => {
  const ventas = await Venta.find({ usuario: req.usuario.id }).populate(POPULATE).sort({ fecha: -1 });
  res.status(200).json(ventas);
});

router.get('/usuario/:idUsuario', validarId('idUsuario'), soloPropietario('idUsuario'), async (req, res) => {
  const ventas = await Venta.find({ usuario: req.params.idUsuario }).populate(POPULATE).sort({ fecha: -1 });
  res.status(200).json(ventas);
});

router.get('/:id', validarId(), async (req, res) => {
  const venta = await buscarVentaPropia(req.params.id, req.usuario.id).populate(POPULATE);
  if (!venta) return noEncontrado(res, 'Venta');
  res.status(200).json(venta);
});

// Total y precios se calculan acá con los datos de la base, no con lo que mande el cliente
router.post('/', async (req, res) => {
  const { direccion, productos } = req.body ?? {};

  if (!direccion || !String(direccion).trim()) {
    return res.status(400).json({ error: 'La dirección de envío es obligatoria' });
  }
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'La compra debe incluir al menos un producto' });
  }

  // Agrupa cantidades por producto por si el mismo ID viene repetido
  const cantidades = new Map();
  for (const item of productos) {
    const cantidad = Number(item?.cantidad);
    if (!isValidObjectId(item?.producto) || !Number.isInteger(cantidad) || cantidad < 1) {
      return res.status(400).json({ error: 'Cada producto debe tener un ID válido y una cantidad entera mayor a 0' });
    }
    cantidades.set(item.producto, (cantidades.get(item.producto) || 0) + cantidad);
  }

  const encontrados = await Producto.find({ _id: { $in: [...cantidades.keys()] } });
  const items = [];
  for (const [id, cantidad] of cantidades) {
    const producto = encontrados.find((p) => p._id.toString() === id);
    if (!producto) return res.status(404).json({ error: `Producto ${id} no encontrado` });
    if (!producto.disponible) return res.status(409).json({ error: `"${producto.nombre}" no está disponible` });
    if (producto.stock < cantidad) {
      return res.status(409).json({ error: `Stock insuficiente de "${producto.nombre}" (disponible: ${producto.stock})` });
    }
    items.push({ producto: producto._id, cantidad, precioUnitario: producto.precio });
  }

  // Descuenta stock solo si sigue alcanzando; si algún producto falla se revierte lo ya descontado
  const descontados = [];
  for (const item of items) {
    const resultado = await Producto.updateOne(
      { _id: item.producto, stock: { $gte: item.cantidad } },
      { $inc: { stock: -item.cantidad } }
    );
    if (resultado.modifiedCount === 0) {
      await devolverStock(descontados);
      return res.status(409).json({ error: 'El stock cambió mientras se procesaba la compra. Intentá nuevamente.' });
    }
    descontados.push(item);
  }

  const total = items.reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0);
  const venta = await Venta.create({
    usuario: req.usuario.id,
    direccion: String(direccion).trim(),
    productos: items,
    total,
    pagado: true,
  });

  await venta.populate(POPULATE);
  res.status(201).json(venta);
});

router.post('/buscar', async (req, res) => {
  const { desde, hasta, pagado } = req.body ?? {};
  const filtro = { usuario: req.usuario.id };

  if (desde || hasta) {
    filtro.fecha = {};
    if (desde) filtro.fecha.$gte = new Date(desde);
    if (hasta) filtro.fecha.$lte = new Date(`${hasta}T23:59:59.999Z`);
  }
  if (typeof pagado === 'boolean') filtro.pagado = pagado;

  const ventas = await Venta.find(filtro).populate(POPULATE).sort({ fecha: -1 });
  res.status(200).json(ventas);
});

router.put('/:id', validarId(), async (req, res) => {
  const cambios = tomarCampos(req.body, ['direccion', 'pagado']);
  if (!Object.keys(cambios).length) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar. Permitidos: direccion, pagado' });
  }

  const venta = await buscarVentaPropia(req.params.id, req.usuario.id);
  if (!venta) return noEncontrado(res, 'Venta');

  Object.assign(venta, cambios);
  await venta.save();
  await venta.populate(POPULATE);
  res.status(200).json(venta);
});

router.delete('/:id', validarId(), async (req, res) => {
  const venta = await buscarVentaPropia(req.params.id, req.usuario.id);
  if (!venta) return noEncontrado(res, 'Venta');

  await devolverStock(venta.productos);
  await venta.deleteOne();
  res.status(200).json({ mensaje: 'Venta eliminada y stock restituido', venta });
});

export default router;
