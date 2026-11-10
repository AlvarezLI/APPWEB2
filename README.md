# NUVEA - Tienda Premium (Aplicaciones Web 2)

**Autor:** Alvarez Luis Ignacio

- Repositorio: https://github.com/AlvarezLI/APPWEB2
- Video explicativo: https://drive.google.com/drive/folders/1uvM7AaA52c122FkrnHUukZtMmztObiQQ?usp=sharing


Tienda online con tres categorías (Moda, Electrónica y Hogar). El proyecto es un **monorepo**: el servidor (server/, Express + MongoDB) y el cliente (client/, HTML + CSS + JS con módulos) están en el mismo repositorio, y el servidor también entrega el front-end.

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
docs/postman/NUVEA API/        # Colección de Postman (formato YAML) para probar toda la API
```

**Arquitectura:** API REST en capas. routes (endpoints y reglas de negocio) -> models (esquemas Mongoose, acceso a MongoDB), con middlewares transversales (JWT, validación de ID, errores) y utils reutilizables (bcrypt, JWT, validaciones). El cliente consume la API con fetch desde client/js/api/ y guarda el token JWT en localStorage.

## Cómo ejecutarlo

Requisitos: Node.js 18+ y una base MongoDB (local o [MongoDB Atlas](https://www.mongodb.com/atlas)).

```bash
cd server
npm install
cp .env.example .env      # completar MONGODB_URI y JWT_SECRET
npm run seed              # migra los JSON de server/data a MongoDB (encripta las contraseñas)
npm run dev               # o npm start
```

Abrir **http://localhost:3000** (redirige a /pages/index.html). La API responde en http://localhost:3000/api.

También se puede abrir client/ con Live Server: el cliente apunta a http://localhost:3000/api y el servidor tiene CORS habilitado.

### Usuarios de prueba (cargados por el seed)

- lucia.fernandez@example.com - Lf#2024Secure - activo (tiene ventas)
- martin.gomez@example.com - Mg$Pass2024 - activo (tiene ventas)
- sofia.ramirez@example.com - Sr!Clave99 - **inactivo** (el login devuelve 403)
- diego.torres@example.com - Dt2024*key - activo
- valentina.lopez@example.com - Vl_pass2024 - activo

## Estructuras de datos

- **usuarios:** nombre, apellido, email (único), contraseña (hash bcrypt, nunca se devuelve), fechaNacimiento, activo (boolean).
- **productos:** nombre, desc, precio, imagen, categoria (moda, electronica u hogar), etiqueta, stock, disponible (boolean).
- **ventas:** usuario (ref Usuario), fecha, total, direccion, pagado (boolean), productos: [{ producto (ref Producto), cantidad, precioUnitario }].

Las referencias usan ObjectId con ref y las consultas de ventas usan populate para devolver los datos del usuario y de los productos.

## Rutas de la API

Base: http://localhost:3000/api. Las rutas marcadas con **(token)** requieren el header Authorization: Bearer <token>, que se obtiene en el login.

### Productos - /api/productos

- GET /api/productos - Lista todos. Filtros opcionales: ?categoria=moda&disponible=true.
- GET /api/productos/categoria/:categoria - Productos de una categoría (moda, electronica, hogar).
- GET /api/productos/:id - Un producto.
- POST /api/productos **(token)** - Crea un producto.
  Body: { "nombre", "precio", "categoria", "desc?", "imagen?", "etiqueta?", "stock?", "disponible?" }
- POST /api/productos/buscar - Búsqueda con filtros en el body.
  Body: { "texto?", "categoria?", "precioMin?", "precioMax?", "soloDisponibles?" }
- PUT /api/productos/:id **(token)** - Actualiza campos del producto (cualquiera de los campos del producto).
- DELETE /api/productos/:id **(token)** - Elimina el producto. **409** si figura en alguna venta (se sugiere PUT { "disponible": false }).

### Usuarios - /api/usuarios

- GET /api/usuarios - Lista usuarios (sin contraseña).
- GET /api/usuarios/:id - Un usuario (sin contraseña).
- POST /api/usuarios/registro - Crea un usuario; la contraseña se guarda encriptada con bcrypt.
  Body: { "nombre", "apellido", "email", "contraseña", "fechaNacimiento?" }
- POST /api/usuarios/login - Valida credenciales y devuelve { token, usuario } (JWT).
  Body: { "email", "contraseña" }
- PUT /api/usuarios/:id **(token)** - Actualiza los datos propios (si cambia la contraseña se vuelve a encriptar).
  Body: { "nombre?", "apellido?", "email?", "contraseña?", "fechaNacimiento?", "activo?" }
- DELETE /api/usuarios/:id **(token)** - Elimina la cuenta propia. **409** si el usuario tiene ventas asociadas.

### Ventas - /api/ventas (todas requieren token)

- GET /api/ventas - Ventas **del usuario del token** con populate de usuario y productos.
- GET /api/ventas/usuario/:idUsuario - Historial de compras del usuario logueado.
- GET /api/ventas/:id - Una venta propia (404 si es de otro usuario).
- POST /api/ventas - Genera la orden de compra del usuario del token. Precios y total se calculan en el servidor, se valida y descuenta el stock.
  Body: { "direccion", "productos": [{ "producto": "<id>", "cantidad": 2 }] }
- POST /api/ventas/buscar - Filtra las compras propias.
  Body: { "desde?": "AAAA-MM-DD", "hasta?": "AAAA-MM-DD", "pagado?": true }
- PUT /api/ventas/:id - Actualiza dirección o estado de pago de una venta propia.
  Body: { "direccion?", "pagado?" }
- DELETE /api/ventas/:id - Cancela una venta propia y **devuelve el stock** de sus productos.

### Integridad de los datos al eliminar

- Un **usuario** con ventas no se puede eliminar (409): primero hay que eliminar sus ventas o desactivarlo con PUT { "activo": false }.
- Un **producto** que figura en ventas no se puede eliminar (409): se marca como no disponible.
- Al eliminar una **venta** se restituye el stock de los productos.

### Códigos de respuesta usados

- 200 OK
- 201 creado
- 400 datos inválidos / ID mal formado
- 401 sin token o token inválido/expirado
- 403 sin permiso o cuenta inactiva
- 404 no encontrado
- 409 conflicto (duplicado, stock insuficiente, integridad)
- 500 error interno

## Front-end (Entrega 3)

- pages/index.html - Home con destacados por categoría.
- pages/productos.html - **Listado de todos los productos** con **filtro por categoría**, búsqueda por texto y "solo disponibles" (?categoria=hogar también funciona por URL).
- pages/moda.html, electronica.html, hogar.html - Productos de cada categoría.
- pages/cart.html - **Carrito guardado en localStorage** y **compra**: envía la orden a POST /api/ventas con el token. Requiere sesión (ver criterio de navegación abajo).
- pages/compras.html - Historial de compras del usuario (requiere sesión).
- pages/login.html, register.html - Login y registro contra la API.

**Criterio de navegación/login:** se puede recorrer el catálogo completo (home, categorías, listado con filtros) sin estar logueado. Iniciar sesión solo es obligatorio para **usar el carrito** (agregarlo, verlo) y para **comprar**; al intentar cualquiera de las dos acciones sin sesión, se redirige a login.html y vuelve a la página de origen (?next=) después de loguearse.

## Seguridad (Entrega 4)

- **bcrypt**: las contraseñas se encriptan al registrarse, al actualizarlas y al migrar los JSON (utils/password.js, 10 salt rounds). En MongoDB solo se guarda el hash; el campo tiene select: false y nunca se devuelve en las respuestas.
- **JWT**: el login firma un token con JWT_SECRET (expira según JWT_EXPIRES_IN, 2h por defecto) con el payload { id, email }. El middleware verificarToken (header Authorization: Bearer <token>) protege las acciones clave: comprar y todo el módulo de ventas, crear/editar/eliminar productos y editar/eliminar usuarios. soloPropietario impide operar sobre datos de otro usuario (403).
- **MongoDB**: los datos se migraron de los JSON a colecciones con esquemas de Mongoose (npm run seed).
- El archivo .env está en .gitignore; el repositorio solo incluye .env.example.

## Pruebas con Postman

Abrir la colección [docs/postman/NUVEA API](docs/postman/NUVEA%20API) en Postman (formato YAML nativo: *Import* y seleccionar la carpeta) y ejecutar **Run collection** con el servidor levantado. La colección usa variables (baseUrl, token, usuarioId, productoId, ventaId) que se completan solas con los tests de cada request, y recorre en orden:

1. **Usuarios y autenticación**: registro (POST), duplicado (409), contraseña corta (400), login incorrecto (401), login (guarda el JWT), listar/obtener (GET) y actualizar (PUT).
2. **Pruebas de JWT**: sin token (401), token inválido (401) y operar sobre otro usuario (403).
3. **Productos (CRUD)**: listar, por categoría, buscar, crear, obtener, actualizar.
4. **Ventas (CRUD)**: comprar (descuenta stock), stock insuficiente (409), listar, historial, obtener, buscar, actualizar, cancelar (devuelve stock).
5. **Limpieza (DELETE)**: elimina el producto y el usuario de prueba creados.

## Dependencias y tecnologías

- **express** ^5.1 - Servidor HTTP y enrutamiento.
- **mongoose** ^8.18 - ODM para MongoDB: esquemas, validaciones, populate.
- **bcrypt** ^6.0 - Hash de contraseñas.
- **jsonwebtoken** ^9.0 - Firma y verificación de tokens JWT.
- **dotenv** ^17 - Variables de entorno (.env).
- **cors** ^2.8 - Permite consumir la API desde otro origen (Live Server).

Base de datos: MongoDB (local o Atlas). Front-end: HTML5, CSS3 y JavaScript con ES Modules (sin librerías). Node.js 18+.

## Mejoras implementadas

- Migración de JSON a **MongoDB** con referencias (ObjectId + ref) y script de migración reproducible (npm run seed).
- **Contraseñas con bcrypt** (incluida la migración de las contraseñas en texto plano de los JSON originales).
- **Autenticación JWT** con expiración y control de propiedad de los recursos; el cliente guarda el token y redirige al login si expira (401).
- **Integridad de datos**: no se elimina un usuario o producto con ventas asociadas (409); cancelar una venta restituye el stock.
- **Compra segura**: el servidor calcula precios y total desde la base (no confía en el cliente), valida disponibilidad y descuenta stock de forma condicional con rollback.
- Cada usuario solo ve y modifica sus propias ventas.
- Whitelist de campos editables, validación de ObjectID, manejador central de errores y códigos HTTP consistentes.
- Colección de Postman con tests automáticos.

