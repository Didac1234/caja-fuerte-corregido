# 🔐 Memory Safe

Juego de memoria de parejas hecho con JavaScript Vanilla, Vite y Supabase (PostgreSQL + Google OAuth).

## Reglas del juego

- Hay 16 cartas boca abajo con 8 parejas de animales.
- Pulsa dos cartas para girarlas: si son iguales se quedan descubiertas, si no se vuelven a tapar.
- Tienes 60 segundos para encontrar las 8 parejas.
- Puntuación: 100 puntos por pareja, -10 por cada fallo y +5 por cada segundo que sobre (solo si ganas).
- Cada partida terminada se guarda en la base de datos y aparece en el historial.

## Tecnologías

- HTML5 y CSS3
- JavaScript Vanilla
- Vite
- Supabase (PostgreSQL, Auth con Google y Row Level Security)
- GitHub y Vercel

## Cómo ejecutarlo

1. Instala las dependencias:

   ```
   npm install
   ```

2. Crea un proyecto en [Supabase](https://supabase.com) y ejecuta el contenido de `supabase.sql` en el SQL Editor (crea la tabla `partidas` y las políticas RLS).

3. En Supabase, ve a **Authentication → Providers → Google** y actívalo con el Client ID y Client Secret de Google Cloud
   (en Google Cloud la URI de redirección autorizada es `https://TU-PROYECTO.supabase.co/auth/v1/callback`).

4. En Supabase, ve a **Authentication → URL Configuration** y añade:
   - Site URL: la URL de Vercel
   - Redirect URLs: `http://localhost:5173` y la URL de Vercel

5. Copia `.env.example` a `.env` y rellena la URL y la clave `anon` de tu proyecto.

6. Arranca el proyecto:

   ```
   npm run dev
   ```

## Despliegue

Se despliega en Vercel importando el repositorio de GitHub. Hay que añadir en Vercel las variables de entorno
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
