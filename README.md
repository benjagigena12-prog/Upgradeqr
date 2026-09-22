# Upgrading — Sistema de tarjetas NFC/QR

Guía completa para poner en marcha tu sistema en `upgradingqr.store`, sin necesitar
conocimientos de programación.

## Qué tecnología usa esto y por qué

- **Next.js**: crea tanto las páginas públicas (`/A001`, `/A002`...) como el panel
  de administración y su API, todo en un solo proyecto. Es el framework más usado
  con Vercel (ver abajo), lo que hace que el despliegue sea prácticamente automático.
- **Vercel** (hosting): gratis para este tipo de proyecto pequeño, se conecta
  directamente con tu dominio y se encarga de la parte técnica (servidores,
  certificados HTTPS, etc.).
- **Upstash Redis** (base de datos): guarda el estado de cada tarjeta (activada o
  no, y su URL de Google Reviews). Es una base de datos muy simple tipo
  "clave-valor", perfecta para este caso porque solo necesitas guardar 3 datos
  por tarjeta. Tiene un plan gratuito más que suficiente para cientos de tarjetas.
  Se contrata desde el propio panel de Vercel, no hace falta crear otra cuenta
  aparte.
- Contraseña de administrador: se guarda como variable de entorno en Vercel
  (nunca en el código), así que nunca queda expuesta en el navegador.

Coste: 0 €/mes aparte del dominio, mientras el uso se mantenga dentro de los
límites gratuitos de Vercel/Upstash (de sobra para un negocio con decenas o
cientos de tarjetas).

---

## PASO 1: Crear una cuenta de GitHub

GitHub es donde vamos a guardar el código del proyecto. Vercel lo despliega
directamente desde ahí.

1. Ve a https://github.com/signup y crea una cuenta gratuita.
2. Crea un nuevo repositorio (botón verde "New"): ponle de nombre, por ejemplo,
   `upgrading-qr`. Déjalo en "Private" o "Public", cualquiera funciona.
3. Sube el contenido de esta carpeta a ese repositorio. La forma más sencilla:
   en la página del repositorio recién creado, usa el enlace
   "uploading an existing file" y arrastra todos los archivos y carpetas del
   proyecto (excepto `node_modules` y `.next`, que no existen si has descargado
   el proyecto tal cual te lo entrego).

   (Si en algún momento quieres usar la línea de comandos en vez de la web,
   también puedes hacerlo con `git`, pero no es necesario.)

## PASO 2: Crear una cuenta de Vercel y conectar el proyecto

1. Ve a https://vercel.com/signup y crea una cuenta usando "Continue with GitHub"
   (así quedan conectadas automáticamente).
2. En el panel de Vercel, pulsa "Add New..." → "Project".
3. Selecciona el repositorio `upgrading-qr` que subiste en el paso 1 y pulsa
   "Import".
4. Vercel detectará automáticamente que es un proyecto Next.js. **Todavía no
   pulses "Deploy"**: antes vamos a configurar la base de datos y las
   contraseñas (pasos 3 y 4). Si ya lo desplegaste, no pasa nada, lo
   configuraremos y volveremos a desplegar.

## PASO 3: Crear la base de datos (Upstash Redis) y conectarla

1. Dentro de tu proyecto en Vercel, ve a la pestaña **Storage**.
2. Pulsa "Create Database" (o "Marketplace Database Providers") y elige
   **Upstash — Redis**. Sigue los pasos (puedes usar el plan gratuito).
3. Cuando termines, conecta esa base de datos a tu proyecto `upgrading-qr` si no
   se ha conectado automáticamente. Esto añade solas las variables de entorno
   `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_URL` /
   `KV_REST_API_TOKEN`, según la versión de la integración; el proyecto
   funciona con cualquiera de las dos).

## PASO 4: Configurar la contraseña del panel

1. Dentro de tu proyecto en Vercel, ve a **Settings → Environment Variables**.
2. Añade estas dos variables (aplícalas a "Production", "Preview" y
   "Development"):
   - `ADMIN_PASSWORD` → la contraseña que quieras usar para entrar al panel.
     Elige algo que no sea fácil de adivinar.
   - `SESSION_SECRET` → una cadena larga y aleatoria (cuantos más caracteres,
     mejor; por ejemplo, une dos o tres códigos de
     https://www.uuidgenerator.net/). No la compartas con nadie: se usa
     internamente para firmar la sesión del panel.
3. Guarda los cambios.

## PASO 5: Publicar el proyecto (Deploy)

1. Ve a la pestaña **Deployments** de tu proyecto en Vercel y pulsa "Redeploy"
   (o "Deploy" si es la primera vez), usando la última versión del código.
2. Espera 1-2 minutos. Cuando termine, Vercel te da una URL de prueba del tipo
   `upgrading-qr.vercel.app`. Ábrela para comprobar que carga correctamente
   (verás la página de inicio "Upgrading").

## PASO 6: Conectar tu dominio upgradingqr.store

1. En tu proyecto de Vercel, ve a **Settings → Domains**.
2. Escribe `upgradingqr.store` y pulsa "Add".
3. Vercel te mostrará uno o dos registros DNS que debes crear en el sitio
   donde compraste el dominio (por ejemplo GoDaddy, Namecheap, IONOS...):
   normalmente un registro tipo `A` apuntando a una IP, y/o un `CNAME` para
   `www`. Entra en el panel de gestión DNS de tu proveedor de dominio, busca
   la sección "DNS" o "Nameservers/Registros", y añade exactamente los
   registros que te indica Vercel.
4. La propagación puede tardar desde unos minutos hasta un par de horas.
   Vercel marcará el dominio como "Valid" cuando esté listo, y te dará
   automáticamente el certificado HTTPS (candado verde).

## PASO 7: Acceder al panel de administración

1. Ve a `https://upgradingqr.store/admin`.
2. Introduce la contraseña que pusiste como `ADMIN_PASSWORD` en el paso 4.
3. La primera vez que entras, el sistema crea automáticamente los 50 códigos
   `A001` a `A050`, todos en estado "No activada".

## PASO 8: Activar la tarjeta A001

1. En el panel, busca `A001` en el buscador (o simplemente localízala en la
   tabla).
2. Pega en el campo de texto la URL de reseñas de Google del negocio, por
   ejemplo:
   `https://search.google.com/local/writereview?placeid=XXXXXXXX`
3. Pulsa "Guardar y activar". El estado cambiará a "Activada" en verde.
4. Pulsa "Copiar URL" junto al código para copiar
   `https://upgradingqr.store/A001` y usarla al generar el QR de esa tarjeta
   (o comprobar que coincide con lo que está grabado en el chip NFC).

## Comprobar que A001 funciona

1. Abre una pestaña de incógnito (o el móvil) y visita
   `https://upgradingqr.store/A001`.
2. Debe redirigirte automáticamente a la URL de reseñas de Google que pusiste,
   sin mostrar ninguna pantalla intermedia.
3. Prueba también con un código que no hayas activado (por ejemplo `A002`):
   debe mostrar el mensaje "Esta tarjeta todavía no está activada."

---

## Cómo generar más tarjetas en el futuro (A051, A052...)

No hace falta tocar código. En el panel de administración:

1. En la parte superior verás un campo numérico junto al botón
   "Generar nuevas tarjetas".
2. Escribe cuántos códigos nuevos quieres (por ejemplo, `20`) y pulsa el botón.
3. El sistema detecta automáticamente cuál es el último código usado y
   continúa la numeración (por ejemplo, si el último era `A050`, se crearán
   `A051` a `A070`).

## Cómo funciona por dentro (resumen)

- Cada tarjeta se guarda en la base de datos con: **código**, **activada
  (sí/no)** y **URL de Google Reviews**. No se guarda ningún dato personal de
  clientes ni del negocio, tal y como pediste.
- Cuando alguien visita `/A001`, el servidor consulta esa tarjeta en la base
  de datos y, si está activada, redirige inmediatamente. Si no, muestra el
  mensaje de "no activada". Esto ocurre en el servidor, así que el visitante
  nunca ve ninguna pantalla intermedia ni puede modificar nada.
- Solo las rutas del panel (`/admin` y su API) permiten cambiar datos, y están
  protegidas por la contraseña: sin una sesión válida, cualquier intento de
  modificar una tarjeta se rechaza automáticamente (comprobado en el
  servidor mediante `middleware.ts`).
- La contraseña de administrador vive únicamente en las variables de entorno
  de Vercel; nunca se envía al navegador ni aparece en el código fuente.

## Notas de mantenimiento

- Si alguna vez cambias de contraseña, solo tienes que actualizar la variable
  `ADMIN_PASSWORD` en Vercel (Settings → Environment Variables) y volver a
  desplegar.
- De vez en cuando conviene actualizar las dependencias del proyecto
  (especialmente Next.js) por seguridad. Esto lo puede hacer cualquier
  desarrollador ejecutando `npm update` y volviendo a subir los cambios a
  GitHub; Vercel se encarga del resto.
