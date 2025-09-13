# Estructura de Datos Firestore - Voluntariados

## 📊 **Colecciones Principales**

### 1. **voluntariados** (Los 5 voluntariados existentes)
```json
{
  "pumas_verdes": {
    "id": "pumas_verdes",
    "name": "Pumas Verdes",
    "description": "Comprometidos con la sostenibilidad ambiental y la educación ecológica",
    "category": "medio-ambiente",
    "code": "PV2025",
    "logo": "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580608/Logo_PV_UNAH_VS-removebg-preview_jadsip.png",
    "active": true,
    "createdAt": "timestamp",
    "adminUids": ["uid_admin1", "uid_admin2"],
    "memberCount": 0,
    "maxMembers": 100
  },
  "sonriendo_juntos": {
    "id": "sonriendo_juntos", 
    "name": "Sonriendo Juntos",
    "description": "Transformando vidas a través de la salud y bienestar",
    "category": "social",
    "code": "SJ2025",
    "logo": "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580995/c31eebe3-8666-4c25-ba58-c81ae0da5ab6-removebg-preview_b1an3v.png",
    "active": true,
    "createdAt": "timestamp",
    "adminUids": ["uid_admin1"],
    "memberCount": 0,
    "maxMembers": 80
  },
  "patitas_unah": {
    "id": "patitas_unah",
    "name": "Patitas UNAH", 
    "description": "Protectores de la vida animal: Rescate y rehabilitación",
    "category": "animales",
    "code": "PU2025",
    "logo": "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580981/273c01b6-b5ce-4abb-af34-c5046222a2d6-removebg-preview_ycw82u.png",
    "active": true,
    "createdAt": "timestamp",
    "adminUids": ["uid_admin1"],
    "memberCount": 0,
    "maxMembers": 60
  },
  "pumas_unidos": {
    "id": "pumas_unidos",
    "name": "Pumas Unidos",
    "description": "Acciones solidarias que fortalecen comunidades vulnerables",
    "category": "social", 
    "code": "PUN2025",
    "logo": "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741581160/27022b04-71eb-4808-95e2-fbc2c4e43738-removebg-preview_hewtfm.png",
    "active": true,
    "createdAt": "timestamp",
    "adminUids": ["uid_admin1"],
    "memberCount": 0,
    "maxMembers": 120
  },
  "pumas_en_accion": {
    "id": "pumas_en_accion",
    "name": "Pumas en Acción",
    "description": "Educación y desarrollo comunitario",
    "category": "educacion",
    "code": "PEA2025", 
    "logo": "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580608/Logo_PV_UNAH_VS-removebg-preview_jadsip.png",
    "active": true,
    "createdAt": "timestamp",
    "adminUids": ["uid_admin1"],
    "memberCount": 0,
    "maxMembers": 90
  }
}
```

### 2. **users** (Estructura actualizada)
```json
{
  "user_uid": {
    "firstName": "Juan",
    "lastName": "Pérez", 
    "email": "juan@email.com",
    "phone": "+504 9999-9999",
    "volunteerInterest": "medio-ambiente",
    "fullName": "Juan Pérez",
    "role": "usuario", // "usuario" | "admin"
    "voluntariados": {
      "pumas_verdes": {
        "joinedAt": "timestamp",
        "status": "activo", // "activo" | "inactivo"
        "totalHours": 25,
        "eventsCompleted": 3
      }
    },
    "achievements": ["primer_voluntariado", "5_eventos"],
    "createdAt": "timestamp",
    "lastLogin": "timestamp"
  }
}
```

### 3. **eventos** (Por voluntariado)
```json
{
  "evento_id": {
    "title": "Limpieza del Campus",
    "description": "Actividad de limpieza y reciclaje en el campus",
    "voluntariadoId": "pumas_verdes",
    "date": "timestamp",
    "location": "UNAH Campus Cortés",
    "maxParticipants": 30,
    "currentParticipants": 15,
    "participants": ["uid1", "uid2", "uid3"],
    "status": "activo", // "activo" | "completado" | "cancelado"
    "createdBy": "admin_uid",
    "createdAt": "timestamp",
    "hours": 4,
    "requirements": ["Guantes", "Botas de trabajo"],
    "achievements": ["limpieza_campus", "5_horas"]
  }
}
```

### 4. **logros** (Sistema de logros)
```json
{
  "primer_voluntariado": {
    "id": "primer_voluntariado",
    "name": "Primer Voluntariado",
    "description": "¡Bienvenido al equipo!",
    "icon": "fas fa-medal",
    "color": "gold",
    "condition": {
      "type": "join_volunteering",
      "voluntariadoId": null
    }
  },
  "5_eventos": {
    "id": "5_eventos", 
    "name": "5 Eventos Completados",
    "description": "Has participado en 5 eventos",
    "icon": "fas fa-trophy",
    "color": "silver",
    "condition": {
      "type": "events_completed",
      "count": 5
    }
  },
  "limpieza_campus": {
    "id": "limpieza_campus",
    "name": "Guardián del Campus",
    "description": "Participaste en la limpieza del campus",
    "icon": "fas fa-leaf",
    "color": "green",
    "condition": {
      "type": "event_participation",
      "eventId": "limpieza_campus_event"
    }
  }
}
```

### 5. **user_achievements** (Logros de usuarios)
```json
{
  "user_uid": {
    "achievements": {
      "primer_voluntariado": {
        "earnedAt": "timestamp",
        "voluntariadoId": "pumas_verdes"
      },
      "5_eventos": {
        "earnedAt": "timestamp",
        "eventCount": 5
      }
    }
  }
}
```

## 🔐 **Reglas de Seguridad Firestore**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios: Solo pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Voluntariados: Lectura pública, escritura solo para admins
    match /voluntariados/{voluntariadoId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid in resource.data.adminUids || 
         request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.adminUids);
    }
    
    // Eventos: Lectura pública, escritura solo para admins del voluntariado
    match /eventos/{eventoId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/voluntariados/$(resource.data.voluntariadoId)) &&
        request.auth.uid in get(/databases/$(database)/documents/voluntariados/$(resource.data.voluntariadoId)).data.adminUids;
    }
    
    // Logros: Solo lectura
    match /logros/{logroId} {
      allow read: if true;
      allow write: if false; // Solo se crean desde código
    }
    
    // Logros de usuario: Solo el propio usuario
    match /user_achievements/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
