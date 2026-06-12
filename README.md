# Mundial 2026 Predictor

Aplicación React + TypeScript para pronosticar el Mundial 2026.

## Firebase

La app usa:

- Firebase Authentication para registro/login con correo y contraseña.
- Verificación de correo obligatoria antes de entrar.
- Cloud Firestore para guardar apodo, favoritas, predicciones y ajustes.

## Configuración local

1. Crea un proyecto en Firebase Console.
2. En Authentication, habilita `Email/Password`.
3. En Firestore Database, crea la base de datos.
4. Copia `.env.example` como `.env`.
5. Llena las variables `VITE_FIREBASE_*` con la configuración web de Firebase.
6. Ejecuta:

```bash
npm install
npm run dev
```

## Reglas de Firestore

Publica el contenido de `firestore.rules` en Firestore Rules. Cada usuario solo puede leer y escribir su propio documento:

```text
users/{uid}
```

## Despliegue

En Vercel, Netlify o el hosting que uses, crea las mismas variables de entorno `VITE_FIREBASE_*`.

No subas `.env` a GitHub.
