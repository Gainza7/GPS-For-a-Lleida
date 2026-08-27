# Panel de rendimiento — despliegue

## 1. Base de datos (Supabase)
Si ya ejecutaste `schema_reset.sql`, ahora ejecuta también `data_seed.sql`
en el SQL Editor de Supabase (Nueva consulta → pegar → Run). Esto carga
las 8 sesiones y todas las métricas que ya teníamos.

## 2. Subir el proyecto a GitHub
1. Descomprime este proyecto en tu ordenador.
2. Entra en tu repositorio de GitHub → "Add file" → "Upload files".
3. Arrastra TODA la carpeta descomprimida (o todos sus archivos manteniendo
   la estructura: `api/`, `public/`, `package.json`, etc.).
4. Confirma el commit ("Commit changes").

## 3. Desplegar en Vercel
1. Ve a vercel.com → inicia sesión con tu cuenta de GitHub (botón "Continue with GitHub").
2. "Add New..." → "Project".
3. Busca tu repositorio y pulsa "Import".
4. Antes de darle a "Deploy", abre "Environment Variables" y añade estas 3:
   - `SUPABASE_URL` → la Project URL de Supabase
   - `SUPABASE_SERVICE_KEY` → la clave service_role / secreta de Supabase
   - `JWT_SECRET` → invéntate una frase larga random (ej: una contraseña larga que generes tú)
5. Pulsa "Deploy". En 1-2 minutos tendrás una URL como `panel-rendimiento.vercel.app`.

## 4. Probar
Abre la URL que te da Vercel. Deberías ver las casillas de los 14 jugadores.
Los PIN son los mismos de siempre (1111, 2222, 3333... según el jugador).

## Actualizaciones futuras
Cada vez que subas cambios de código a GitHub, Vercel vuelve a desplegar
solo, automáticamente. De momento, añadir una sesión nueva sigue requiriendo
que yo procese el CSV y te dé un script SQL nuevo para pegar en Supabase —
la importación de CSV directamente desde la web es el siguiente paso pendiente.
