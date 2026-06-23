# Logística Ágil 🚚

Sistema de gestión logística con panel de administración y vista de chofer.  
Stack: **React + Vite** · **Node.js + Express** · **MySQL 8**

---

## Requisitos previos

| Herramienta    | Versión mínima                  |
| -------------- | ------------------------------- |
| Docker         | 24+                             |
| Docker Compose | v2 (incluido en Docker Desktop) |

> **Sin** Node.js ni pnpm instalados localmente — todo corre dentro de los contenedores.

---

## Levantar la aplicación

### 1. Clonar el repositorio

```bash
git clone https://github.com/baltazarottonello/logistica-agil.git
cd logistica-agil
git checkout development
```

### 2. Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

Los valores por defecto funcionan sin modificación. Si querés cambiar la contraseña de MySQL, editá `.env` antes de continuar.

### 3. Copiar los Dockerfiles a sus carpetas

```bash
cp backend.Dockerfile  backend/Dockerfile
cp frontend.Dockerfile frontend/Dockerfile
cp nginx.conf          frontend/nginx.conf
```

### 4. Levantar los servicios

```bash
docker compose up --build
```

> La primera vez tarda unos minutos: descarga las imágenes base, instala dependencias y ejecuta el SQL de inicialización.

Cuando veas esto en los logs, todo está listo:

```
logistica_backend  | Backend de logística corriendo en el puerto 5000
logistica_frontend | /docker-entrypoint.sh: Configuration complete; ready for start up
```

---

## Acceder a la aplicación

http://localhost:5173

---

## Credenciales de prueba

```
ADMIN email: carlos.admin@logistica.com / pw: 1234
CHOFER email : juan.chofer@logistica.com / pw: 1234
CHOFER email : martin.chofer@logistica.com / pw: 1234
CHOFER email : roberto.chofer@logistica.com / pw: 1234
CHOFER email : elena.chofer@logistica.com / pw: 1234 (deshabilitada)
OPERADOR email : laura.ops@logistica.com / pw: 1234
```

---

## Flujo básico para probar

```
1. Iniciar sesión como Administrador
      ↓
2. Crear un Cliente remitente y un Cliente destinatario (o usar ya existentes)
      ↓
3. Crear un Pedido asignando remitente, destinatario y categorías
      ↓
4. Crear una Hoja de Ruta: seleccionar chofer, vehículo, pedido y estado inicial.
      ↓
5. Modificar estado del pedido a "En Ruta".
      ↓
6. Iniciar sesión como Chofer
      ↓
7. Ver la Hoja de Ruta activa y actualizar el estado de cada pedido
   (Entregado / Ausente / Rechazado)
      ↓
8. Volver al Administrador → ver el detalle de entrega clickeando la hoja de ruta
```

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Detener los contenedores (mantiene los datos)
docker compose stop

# Detener y eliminar contenedores + volúmenes (reset total)
docker compose down -v

# Reconstruir solo el backend después de cambios en el código
docker compose up --build backend
```

---

## Estructura del proyecto

```
logistica-agil/
├── backend/              # API REST — Node.js + Express
│   ├── src/
│   │   ├── app.js
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   └── routes/
│   └── backend.Dockerfile
│
├── database/
│   └── init.sql          # Schema + datos iniciales — se ejecuta al crear el contenedor
│   └── Dockerfile
│
├── frontend/             # SPA — React 19 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── frontend.Dockerfile
│
├── GRUPO 4 (DD, DER, Diagrama de actividad, script sql, Relevamiento+OLA)
├── docker-compose.yml
├── .env
└── README.md
```

---

## Variables de entorno disponibles

| Variable       | Descripción                         | Default                 |
| -------------- | ----------------------------------- | ----------------------- |
| `DB_PASSWORD`  | Contraseña de MySQL (root)          | `istea2026`             |
| `DB_NAME`      | Nombre de la base de datos          | `logistica_agil`        |
| `VITE_API_URL` | URL del backend que usa el frontend | `http://localhost:5000` |
