# NUVEA — Tienda Premium (Aplicaciones Web 2)

**Autor:** Alvarez Luis Ignacio

Tienda online con tres categorías (Moda, Electrónica y Hogar). El proyecto es un **monorepo**: el servidor (`server/`, Express + MongoDB) y el cliente (`client/`, HTML + CSS + JS con módulos) están en el mismo repositorio, y el servidor también entrega el front-end.

## Estructura

```
APPWEB2/
├── client/                    # Front-end
│   ├── css/styles.css
│   ├── img/                   # Imágenes de productos
│   ├── pages/                 # Vistas HTML
│   └── js/
│       ├── api/               # Funciones fetch hacia el back-end (config, productos, usuarios, ventas)
│       ├── components/        # Componentes reutilizables (navbar, productCard, alert)
│       ├── pages/             # Controlador de cada vista
│       └── utils/             # Sesión (JWT), carrito (localStorage), formato
└── server/                    # Back-end
    ├── index.js               # Inicialización del servidor y enrutamiento
    ├── config/db.js           # Conexión a MongoDB
    ├── models/                # Esquemas de Mongoose (Usuario, Producto, Venta)
    ├── routes/                # *.routes.js (endpoints por entidad)
    ├── middlewares/           # verificarToken, validarId, manejo de errores
    ├── utils/                 # bcrypt, JWT y validaciones reutilizables
    ├── data/                  # JSON originales (usuarios, productos, ventas)
    └── scripts/seed.js        # Migración JSON -> MongoDB
```

## Cómo ejecutarlo

Requisitos: Node.js 18+ y una base MongoDB (local o [MongoDB Atlas](https://www.mongodb.com/atlas)).

```bash
cd server
npm install
cp .env.example .env      # completar MONGODB_URI y JWT_SECRET
npm run seed              # migra los JSON de server/data a MongoDB (encripta las contraseñas)
npm run dev               # o npm start
```

Abrir **http://localhost:3000** (redirige a `/pages/index.html`). La API responde en `http://localhost:3000/api`.

También se puede abrir `client/` con Live Server: el cliente apunta a `http://localhost:3000/api` y el servidor tiene CORS habilitado.

### Usuarios de prueba (cargados por el seed)

| Email | Contraseña | Estado |
|---|---|---|
| lucia.fernandez@example.com | `Lf#2024Secure` | activo (tiene ventas) |
| martin.gomez@example.com | `Mg$Pass2024` | activo (tiene ventas) |
| sofia.ramirez@example.com | `Sr!Clave99` | **inactivo** (el login devuelve 403) |
| diego.torres@example.com | `Dt2024*key` | activo |
| valentina.lopez@example.com | `Vl_pass2024` | activo |

## Estructuras de datos

| Colección | Campos |
|---|---|
| **usuarios** | `nombre`, `apellido`, `email` (único), `contraseña` (hash bcrypt, nunca se devuelve), `fechaNacimiento`, `activo` (boolean) |
| **productos** | `nombre`, `desc`, `precio`, `imagen`, `categoria` (`moda` \| `electronica` \| `hogar`), `etiqueta`, `stock`, `disponible` (boolean) |
| **ventas** | `usuario` (ref Usuario), `fecha`, `total`, `direccion`, `pagado` (boolean), `productos: [{ producto (ref Producto), cantidad, precioUnitario }]` |

Las referencias usan `ObjectId` con `ref` y las consultas de ventas usan `populate` para devolver los datos del usuario y de los productos.

## Rutas de la API

Base: `http://localhost:3000/api` · 🔒 = requiere header `Authorization: Bearer <token>` (se obtiene en el login).

### Productos — `/api/productos`

| Método | Ruta | Descripción | Body |
|---|---|---|---|
| GET | `/api/productos` | Lista todos. Filtros opcionales: `?categoria=moda&disponible=true` | — |
| GET | `/api/productos/categoria/:categoria` | Productos de una categoría (`moda`, `electronica`, `hogar`) | — |
| GET | `/api/productos/:id` | Un producto | — |
| POST | `/api/productos` 🔒 | Crea un producto | `{ "nombre", "precio", "categoria", "desc?", "imagen?", "etiqueta?", "stock?", "disponible?" }` |
| POST | `/api/productos/buscar` | Búsqueda con filtros en el body | `{ "texto?", "categoria?", "precioMin?", "precioMax?", "soloDisponibles?" }` |
| PUT | `/api/productos/:id` 🔒 | Actualiza campos del producto | cualquiera de los campos del producto |
| DELETE | `/api/productos/:id` 🔒 | Elimina el producto. **409** si figura en alguna venta (se sugiere `PUT { "disponible": false }`) | — |

### Usuarios — `/api/usuarios`

| Método | Ruta | Descripción | Body |
|---|---|---|---|
| GET | `/api/usuarios` | Lista usuarios (sin contraseña) | — |
| GET | `/api/usuarios/:id` | Un usuario (sin contraseña) | — |
| POST | `/api/usuarios/registro` | Crea un usuario; la contraseña se guarda encriptada con bcrypt | `{ "nombre", "apellido", "email", "contraseña", "fechaNacimiento?" }` |
| POST | `/api/usuarios/login` | Valida credenciales y devuelve `{ token, usuario }` (JWT) | `{ "email", "contraseña" }` |
| PUT | `/api/usuarios/:id` 🔒 | Actualiza los datos propios (si cambia la contraseña se vuelve a encriptar) | `{ "nombre?", "apellido?", "email?", "contraseña?", "fechaNacimiento?", "activo?" }` |
| DELETE | `/api/usuarios/:id` 🔒 | Elimina la cuenta propia. **409** si el usuario tiene ventas asociadas | — |

### Ventas — `/api/ventas` (todas 🔒)

| Método | Ruta | Descripción | Body |
|---|---|---|---|
| GET | `/api/ventas` | Todas las ventas con `populate` de usuario y productos | — |
| GET | `/api/ventas/usuario/:idUsuario` | Historial de compras del usuario logueado | — |
| GET | `/api/ventas/:id` | Una venta | — |
| POST | `/api/ventas` | Genera la orden de compra del usuario del token. Precios y total se calculan en el servidor, se valida y descuenta el stock | `{ "direccion", "productos": [{ "producto": "<id>", "cantidad": 2 }] }` |
| POST | `/api/ventas/buscar` | Filtra las compras propias | `{ "desde?": "AAAA-MM-DD", "hasta?": "AAAA-MM-DD", "pagado?": true }` |
| PUT | `/api/ventas/:id` | Actualiza dirección o estado de pago de una venta propia | `{ "direccion?", "pagado?" }` |
| DELETE | `/api/ventas/:id` | Cancela una venta propia y **devuelve el stock** de sus productos | — |

### Integridad de los datos al eliminar

- Un **usuario** con ventas no se puede eliminar (409): primero hay que eliminar sus ventas o desactivarlo con `PUT { "activo": false }`.
- Un **producto** que figura en ventas no se puede eliminar (409): se marca como no disponible.
- Al eliminar una **venta** se restituye el stock de los productos.

### Códigos de respuesta usados

`200` OK · `201` creado · `400` datos inválidos / ID mal formado · `401` sin token o token inválido/expirado · `403` sin permiso o cuenta inactiva · `404` no encontrado · `409` conflicto (duplicado, stock insuficiente, integridad) · `500` error interno.

## Front-end (Entrega 3)

| Vista | Función |
|---|---|
| `pages/index.html` | Home con destacados por categoría |
| `pages/productos.html` | **Listado de todos los productos** con **filtro por categoría**, búsqueda por texto y “solo disponibles” (`?categoria=hogar` también funciona por URL) |
| `pages/moda.html`, `electronica.html`, `hogar.html` | Productos de cada categoría |
| `pages/cart.html` | **Carrito guardado en localStorage** y **compra**: envía la orden a `POST /api/ventas` con el token. Requiere sesión (ver criterio de navegación abajo) |
| `pages/compras.html` | Historial de compras del usuario (requiere sesión) |

**Criterio de navegación/login:** se puede recorrer el catálogo completo (home, categorías, listado con filtros) sin estar logueado. Iniciar sesión solo es obligatorio para **usar el carrito** (agregarlo, verlo) y para **comprar**; al intentar cualquiera de las dos acciones sin sesión, se redirige a `login.html` y vuelve a la página de origen (`?next=`) después de loguearse.
| `pages/login.html`, `register.html` | Login y registro contra la API |

## Seguridad (Entrega 4)

- **bcrypt**: las contraseñas se encriptan al registrarse, al actualizarlas y al migrar los JSON (`utils/password.js`).
- **JWT**: el login firma un token con `JWT_SECRET` (expira según `JWT_EXPIRES_IN`). El middleware `verificarToken` protege las acciones clave (comprar, ver compras, modificar/eliminar datos) y `soloPropietario` impide operar sobre datos de otro usuario.
- **MongoDB**: los datos se migraron de los JSON a colecciones con esquemas de Mongoose (`npm run seed`).
- El archivo `.env` está en `.gitignore`; el repositorio solo incluye `.env.example`.

## Tecnologías

Node.js · Express 5 · MongoDB + Mongoose · bcrypt · jsonwebtoken · dotenv · cors · HTML5 · CSS3 · JavaScript (ES Modules)
