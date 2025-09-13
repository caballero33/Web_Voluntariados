# Configuración de Firebase para Voluntariados

## Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto: `voluntariados-unah` (o el nombre que prefieras)
4. Desactiva Google Analytics (opcional)
5. Haz clic en "Crear proyecto"

### 2. Habilitar Authentication
1. En el panel izquierdo, haz clic en "Authentication"
2. Ve a la pestaña "Sign-in method"
3. Habilita "Correo electrónico/contraseña"
4. Haz clic en "Guardar"

### 3. Configurar Firestore Database
1. En el panel izquierdo, haz clic en "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (para desarrollo)
4. Elige una ubicación cercana (us-central, us-east, etc.)
5. Haz clic en "Habilitar"

### 4. Obtener Configuración del Proyecto
1. Ve a "Configuración del proyecto" (icono de engranaje)
2. Haz clic en "Configuración general"
3. Desplázate hacia abajo hasta "Tus apps"
4. Haz clic en el icono web (</>) para agregar una app web
5. Nombra tu app: `voluntariados-web`
6. **NO** marques "También configura Firebase Hosting"
7. Haz clic en "Registrar app"
8. Copia la configuración que aparece

### 5. Actualizar Archivos de Configuración

#### En `voluntariados/settings.py`:
```python
FIREBASE_CONFIG = {
    'apiKey': "tu-api-key-aqui",
    'authDomain': "tu-proyecto.firebaseapp.com",
    'projectId': "tu-proyecto-id",
    'storageBucket': "tu-proyecto.appspot.com",
    'messagingSenderId': "tu-sender-id",
    'appId': "tu-app-id"
}
```

#### En `static/js/firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "tu-api-key-aqui",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "tu-sender-id",
    appId: "tu-app-id"
};
```

### 6. Configurar Reglas de Seguridad de Firestore

En Firestore Database > Reglas, actualiza las reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura solo a usuarios autenticados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir lectura pública de voluntariados
    match /voluntariados/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Permitir lectura pública de eventos
    match /eventos/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 7. Probar la Configuración

1. Ejecuta el servidor Django: `python manage.py runserver`
2. Ve a `http://localhost:8000/auth/register/`
3. Intenta registrarte con un email y contraseña
4. Verifica en Firebase Console > Authentication que el usuario se creó
5. Verifica en Firestore Database que se creó el documento del usuario

### 8. Estructura de Datos en Firestore

#### Colección `users`:
```json
{
  "uid": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+504 9999-9999",
    "volunteerInterest": "medio-ambiente",
    "fullName": "Juan Pérez",
    "createdAt": "timestamp",
    "lastLogin": "timestamp"
  }
}
```

#### Colección `voluntariados`:
```json
{
  "pumas_verdes": {
    "name": "Pumas Verdes",
    "description": "Comprometidos con la sostenibilidad ambiental",
    "category": "medio-ambiente",
    "active": true,
    "members": ["uid1", "uid2"],
    "createdAt": "timestamp"
  }
}
```

## Comandos Útiles

```bash
# Instalar dependencias si es necesario
pip install django

# Ejecutar servidor
python manage.py runserver

# Crear migraciones si agregaste modelos
python manage.py makemigrations
python manage.py migrate

# Crear superusuario para Django admin
python manage.py createsuperuser
```

## Notas Importantes

- **Nunca** expongas las claves de API en repositorios públicos
- Usa variables de entorno para producción
- Configura las reglas de Firestore apropiadamente
- Haz backup de tu base de datos regularmente
- Prueba la autenticación en diferentes navegadores

## Soporte

Si tienes problemas:
1. Revisa la consola del navegador para errores
2. Verifica que Firebase esté correctamente configurado
3. Asegúrate de que las reglas de Firestore permitan las operaciones
4. Verifica que Authentication esté habilitado
