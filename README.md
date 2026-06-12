# Mundial 2026 Predictor

Aplicación web para crear, guardar y seguir predicciones completas del Mundial FIFA 2026.

El usuario puede pronosticar todos los partidos del torneo, construir automáticamente la fase final, seguir sus selecciones favoritas y guardar su progreso en la nube con Firebase.

## Funcionalidades

- Registro e inicio de sesión con Firebase Authentication.
- Login con correo y contraseña.
- Login con Google.
- Verificación de correo para cuentas creadas con contraseña.
- Guardado automático en Cloud Firestore.
- Apodo personalizado para el usuario, presentado como “analista estrella”.
- Selección inicial de 2 selecciones favoritas.
- Seguimiento rápido del progreso de las favoritas.
- Calendario completo con partidos 1 al 104.
- Fase de grupos con predicción de victoria o empate.
- Tabla automática por grupo con PJ, PG, PE, PP y puntos.
- Ajuste manual de clasificación cuando hay empate en puntos.
- Eliminatorias sin empate desde dieciseisavos hasta la final.
- Bracket completo y campeón proyectado.
- Importar, exportar y compartir predicciones.
- Modo claro y modo oscuro.
- Diseño responsive para móvil, tablet y escritorio.

## Cómo Usar La App

1. Entra a la aplicación.
2. Elige una forma de acceso:
   - `Entrar con Google`
   - `Registrarme` con correo y contraseña
   - `Entrar` con correo y contraseña si ya tienes cuenta
3. Si te registras con correo y contraseña, revisa tu correo y confirma la cuenta antes de iniciar sesión.
4. Escribe tu apodo. Ese nombre se usará dentro de la app.
5. Selecciona tus 2 selecciones favoritas.
6. Empieza a pronosticar partidos desde `Calendario` o `Grupos`.
7. Cuando completes grupos, la app construye automáticamente las llaves.
8. Elige ganadores en eliminatorias hasta conocer tu campeón.

## Guardado De Datos

La app guarda automáticamente el progreso en Firestore.

Cada usuario tiene su propio documento:

```text
users/{uid}
```

Ahí se guarda:

- correo
- apodo
- selecciones favoritas
- predicciones de fase de grupos
- predicciones de eliminatorias
- ajustes manuales de clasificación
- tema claro/oscuro

No existe botón de guardar. Cada cambio se sincroniza automáticamente.

## Botones De Exportar, Importar Y Compartir

`Exportar` descarga un archivo JSON con las predicciones del usuario. Sirve como copia de seguridad.

`Importar` permite cargar nuevamente ese archivo JSON para restaurar una predicción.

`Compartir` genera un resumen corto de la predicción, por ejemplo el campeón elegido o el porcentaje completado.

## Tecnologías

- React
- TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- Lucide React
- CSS responsive personalizado

## Configuración Local

Instala dependencias:

```bash
npm install
```

Crea un archivo `.env` en la raíz del proyecto usando `.env.example` como plantilla:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

Ejecuta la app:

```bash
npm run dev
```

Compila para producción:

```bash
npm run build
```

Compila para GitHub Pages:

```bash
npm run build:pages
```

## Configuración De Firebase

En Firebase Console:

1. Crea un proyecto.
2. Agrega una aplicación web.
3. Copia la configuración `firebaseConfig`.
4. En `Authentication`, habilita:
   - `Correo electrónico/contraseña`
   - `Google`
5. En `Firestore Database`, crea la base de datos.
6. En `Reglas`, publica el contenido de `firestore.rules`.

Reglas usadas:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Estas reglas hacen que cada usuario solo pueda leer y escribir sus propios datos.

## Despliegue En GitHub Pages

El repositorio incluye un workflow en:

```text
.github/workflows/deploy-pages.yml
```

Para desplegar:

1. En GitHub, ve a `Settings`.
2. Entra a `Secrets and variables` → `Actions`.
3. Crea estos repository secrets con los valores reales de Firebase:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

4. Ve a `Settings` → `Pages`.
5. En `Source`, selecciona `GitHub Actions`.
6. Haz push a `main`.

La app se construirá y publicará automáticamente.

## Seguridad

No subas el archivo `.env` a GitHub.

El archivo `.env.example` sí se puede subir porque solo contiene nombres de variables, no valores reales.

Las claves web de Firebase no son secretos absolutos, pero deben manejarse como configuración de entorno y acompañarse siempre con reglas seguras de Firestore.

## Autor

Todos los derechos reservados.

Autor: Jhonatan Solano
