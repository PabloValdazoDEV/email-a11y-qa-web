# Email A11y QA Web

Frontend React de Email A11y QA. Incluye acceso privado por invitación, perfil, administración de usuarios y creación inicial de organización. No permite que una persona se registre por su cuenta.

## Stack

- React 19 y Vite
- React Router
- Axios con cookies y refresh single-flight
- React Hook Form y Zod
- DOMPurify para la representación derivada de la preview
- Tailwind CSS
- react-hot-toast

## Instalación

```bash
cp .env.example .env
npm install
npm run dev
```

Por defecto Vite abre `http://localhost:5173`.

## Variables de entorno

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Auth Template
```

`VITE_API_URL` apunta al backend sin barra final. `VITE_APP_NAME` es el único nombre visible de la plantilla y puede reemplazarse sin tocar componentes.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
```

## Rutas

| Ruta | Acceso | Página |
| --- | --- | --- |
| `/login` | Público | Login y “Recordarme” |
| `/forgot-password` | Público | Solicitud con mensaje indistinguible |
| `/reset-password#token=...` | Público | Contraseña inicial de invitación o recuperación |
| `/verify-email#token=...` | Público | Verificación automática |
| `/password-change-required` | Sesión limitada | Cambio obligatorio cuando han pasado 90 días |
| `/dashboard` | Privado | Creación y resumen de la organización del usuario |
| `/organization/members` | Privado | Listado, invitación y gestión autorizada de miembros de organización |
| `/organization/clients` | Privado | Listado de clientes activos y archivados, creación y restauración autorizadas |
| `/organization/clients/:clientId` | Privado | Consulta, edición y archivado autorizado de un cliente |
| `/organization/clients/:clientId/campaigns/:campaignId` | Privado | Consulta, edición y archivado autorizado de una campaña |
| `/profile` | Privado | Perfil y cambio de contraseña |
| `/admin/users` | `ADMIN` / `SUPERADMIN` | Concesión de acceso, búsqueda, paginación, roles y estado |

Las rutas desconocidas, incluida `/register`, muestran una página 404. Para entrar, una cuenta debe haberse creado mediante el seed del backend o desde la administración. En este segundo caso, la persona recibe un email para definir su propia contraseña.

## AuthContext

`src/context/AuthContext.jsx` mantiene únicamente el usuario público y el estado de carga. Al montar ejecuta `GET /auth/me`. Expone `login`, `logout`, `refreshAuth` y `updateCurrentUser`. El usuario público incluye `passwordChangeRequired` y `passwordExpiresAt`, nunca hashes ni contraseñas.

El contexto no contiene JWT, refresh tokens ni cookies. Los tokens solo existen en cookies `HttpOnly` administradas por el navegador.

## Axios y renovación de sesión

`src/api/api.js` crea una instancia con `withCredentials: true`. Si una petición normal responde `401`, el interceptor realiza un único `POST /auth/refresh` y reintenta la petición una vez.

La variable de módulo `refreshRequest` actúa como single-flight: si varias peticiones fallan simultáneamente, todas esperan la misma promesa. Login, logout, refresh, recuperación, reset y verificación se excluyen para impedir bucles. Si refresh falla, se emite `auth:unauthorized` y `AuthContext` limpia el usuario. Si el backend devuelve `PASSWORD_CHANGE_REQUIRED`, el contexto actualiza inmediatamente el estado y la navegación conduce al formulario obligatorio.

Las operaciones se separan en:

- `src/api/api.js`: cliente e interceptor
- `src/api/auth.js`: autenticación y perfil
- `src/api/users.js`: administración
- `src/api/organizations.js`: organizaciones, miembros e invitaciones
- `src/api/clients.js`: clientes de organización
- `src/api/campaigns.js`: campañas de cliente
- `src/api/drafts.js`: borrador HTML de una campaña

## Invitaciones de organización

La pantalla de miembros permite que un `OWNER` invite `ADMIN`, `EDITOR` o `VIEWER`. Un `ADMIN` de organización puede invitar únicamente `EDITOR` o `VIEWER`; el formulario no aparece para `EDITOR` ni `VIEWER`. Nombre y apellidos se utilizan solo si el email todavía no tiene una cuenta.

Las cuentas nuevas aparecen como «Invitación pendiente» hasta que la persona utiliza el enlace recibido y crea su contraseña. Si el email ya tiene una cuenta activa, se añade directamente a la organización sin cambiar su password ni su rol global. Los mensajes de éxito o de entrega SMTP fallida se muestran mediante el sistema de toasts existente.

## Clientes

La navegación privada incluye un área «Clientes». Todos los roles de organización ven primero los clientes activos y después los archivados, que aparecen atenuados y no pueden abrirse. `OWNER` y `ADMIN` ven además los controles para crear, cambiar el nombre, archivar con confirmación y restaurar; `EDITOR` y `VIEWER` conservan una interfaz de solo lectura. Los clientes archivados permanecen en PostgreSQL con todos sus datos y campañas.

## Campañas

El detalle de cliente incluye el listado de sus campañas activas. `OWNER` y `ADMIN` pueden crear campañas, abrir su detalle, cambiarles el nombre y archivarlas con confirmación. `EDITOR` y `VIEWER` pueden listar y consultar sin controles de escritura. La pantalla de campaña muestra el cliente propietario y contiene el área de trabajo del borrador descrita a continuación.

## Borrador HTML

El detalle de campaña permite pegar HTML o importar un único archivo `.html`/`.htm` de hasta 1 MiB. El código se muestra y edita como texto dentro de un textarea; nunca se inserta como HTML en el DOM principal. Una edición conserva el HTML original y modifica solo el contenido de trabajo, mientras que sustituir o importar actualiza ambos.

`OWNER`, `ADMIN` y `EDITOR` pueden crear, sustituir e importar el borrador. `VIEWER` puede leer el HTML actual y consultar su preview sin controles de escritura. La interfaz incluye estados de carga y error, validación del fichero, nombre seleccionado, botones deshabilitados y feedback mediante toasts.

La «Preview de edición» es una representación aproximada derivada en memoria de `htmlCurrent`; nunca sustituye ni escribe `htmlOriginal` o `htmlCurrent`. DOMPurify elimina elementos activos, formularios, frames anidados, handlers y atributos de recursos o navegación. Los bloques `<style>` se descartan, mientras que los estilos inline se conservan sin referencias `url()`. El resultado se renderiza exclusivamente mediante `srcDoc` dentro de un iframe `sandbox` sin permisos, con `referrerPolicy="no-referrer"` y una CSP que bloquea scripts, imágenes, fuentes, conexiones, objetos, frames y formularios. Las imágenes permanecen siempre desactivadas en este hito.

La preview ofrece tamaños Desktop (680 px) y Móvil (375 px). Al editar, se vuelve a derivar tras un debounce de 400 ms sin cambiar el guardado manual existente. Todavía no existe emulación real de Gmail, Outlook o Apple Mail ni un editor avanzado.

Axios conserva su comportamiento normal de errores: las promesas rechazadas no se convierten en falsos éxitos.

## Tokens en fragmentos

Reset y verificación leen el valor desde `window.location.hash`. `takeTokenFromHash()` lo guarda solo en memoria y limpia inmediatamente la barra de direcciones mediante `history.replaceState`. Nunca se escribe en `localStorage`, `sessionStorage`, Context ni cookies JavaScript.

## Guards

- `PrivateRoute`: espera la carga, redirige a login sin usuario y fuerza `/password-change-required` si la contraseña ha caducado.
- `PublicRoute`: evita mostrar el login a una sesión activa.
- `AdminRoute`: exige `role === "ADMIN"` o `role === "SUPERADMIN"`.

El backend vuelve a comprobar autenticación, vigencia de contraseña y rol; los guards son UX, no una frontera de seguridad.

## Diseño y accesibilidad

La UI es neutra y está construida con clases Tailwind. Los componentes reutilizables se limitan a `Button`, `Input`, `PasswordInput`, `Alert`, `Spinner` y `AuthCard`. Hay labels asociados, mensajes de error enlazados, estados de loading/disabled, autocomplete, foco visible, contraste y navegación por teclado.

Los formularios y cabeceras responden desde 320 px. El cambio obligatorio reutiliza la tarjeta responsive de autenticación, el formulario para conceder acceso pasa de dos columnas a una en móvil y la tabla administrativa usa un contenedor con scroll propio en pantallas estrechas para no provocar scroll horizontal en la página.

## Integración con el backend

El backend utiliza exclusivamente PostgreSQL y puede iniciarse mediante el Docker Compose incluido. Sigue su README para generar Prisma y aplicar las migraciones antes de iniciar el frontend.

En desarrollo, configura exactamente el mismo origen frontend en `FRONTEND_URL` y dentro de `CORS_ALLOWED_ORIGINS` del backend. Una vez preparada la base elegida, ambos servidores deben ejecutarse a la vez:

```bash
# terminal 1
cd ../email-a11y-qa-api
npm run dev

# terminal 2
cd ../email-a11y-qa-web
npm run dev
```

En producción, frontend y API deben usar HTTPS para que el navegador acepte las cookies `Secure` con prefijo `__Host-`.

## Reutilizar la plantilla

1. Clona `email-a11y-qa-web` y `email-a11y-qa-api` como repositorios separados.
2. Cambia `VITE_APP_NAME` y `APP_NAME`.
3. Configura los dos archivos `.env` sin versionarlos.
4. Ajusta colores en `tailwind.config.js` o en los componentes UI.
5. Conserva `AuthContext`, el cliente Axios y los guards como frontera de autenticación.
6. Añade las páginas de negocio fuera de `src/api/auth.js` y de las rutas de autenticación.

No introduzcas almacenamiento JavaScript para tokens al extender la plantilla.
