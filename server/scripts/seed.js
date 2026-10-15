/*
  Migración de los JSON (server/data) a MongoDB.
  - Borra las colecciones y las vuelve a cargar.
  - Encripta las contraseñas con bcrypt.
  - Convierte los IDs numéricos de los JSON en ObjectID y arma las referencias (ref).
  Uso: npm run seed
*/
import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';

import { conectarDB } from '../config/db.js';
import Usuario from '../models/Usuario.js';
import Producto from '../models/Producto.js';
import Venta from '../models/Venta.js';
import { encriptarContraseña } from '../utils/password.js';

async function leerJSON(nombre) {
  const url = new URL(`../data/${nombre}.json`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf-8'));
}

async function migrar() {
  await conectarDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nuvea');

  const [usuarios, productos, ventas] = await Promise.all([
    leerJSON('usuarios'),
    leerJSON('productos'),
    leerJSON('ventas'),
  ]);

  await Promise.all([Usuario.deleteMany(), Producto.deleteMany(), Venta.deleteMany()]);

  // id numérico del JSON -> ObjectID de Mongo
  const idsUsuarios = new Map();
  const idsProductos = new Map();

  for (const { id, contraseña, ...datos } of usuarios) {
    const usuario = await Usuario.create({ ...datos, contraseña: await encriptarContraseña(contraseña) });
    idsUsuarios.set(id, usuario._id);
  }

  for (const { id, ...datos } of productos) {
    const producto = await Producto.create(datos);
    idsProductos.set(id, producto._id);
  }

  for (const venta of ventas) {
    await Venta.create({
      usuario: idsUsuarios.get(venta.id_usuario),
      fecha: new Date(`${venta.fecha}T12:00:00`), // mediodía: evita que la zona horaria corra el día
      total: venta.total,
      direccion: venta.direccion,
      pagado: venta.pagado,
      productos: venta.productos.map((item) => ({
        producto: idsProductos.get(item.id_producto),
        cantidad: item.cantidad,
        precioUnitario: item.precio_unitario,
      })),
    });
  }

  console.log(`Migración completa: ${usuarios.length} usuarios, ${productos.length} productos, ${ventas.length} ventas`);
}

try {
  await migrar();
} catch (error) {
  console.error('Error en la migración:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
