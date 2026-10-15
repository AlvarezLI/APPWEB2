import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { conectarDB } from './config/db.js';
import productosRouter from './routes/productos.routes.js';
import usuariosRouter from './routes/usuarios.routes.js';
import ventasRouter from './routes/ventas.routes.js';
import { rutaNoEncontrada, manejarErrores } from './middlewares/errores.js';

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env (ver .env.example)');
  process.exit(1);
}

const app = express();

// Middlewares globales
app.use(cors());           // permite que el cliente (Live Server u otro origen) consuma la API
app.use(express.json());   // parsea el body JSON de las peticiones

// Enrutamiento de la API
app.use('/api/productos', productosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api', rutaNoEncontrada);

// Cliente (monorepo): el mismo servidor entrega el front-end
app.use(express.static(path.join(__dirname, '../client')));

app.use(rutaNoEncontrada);
app.use(manejarErrores);

try {
  await conectarDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nuvea');
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Tienda: http://localhost:${PORT}/pages/index.html`);
  });
} catch (error) {
  console.error('No se pudo conectar a MongoDB:', error.message);
  process.exit(1);
}
