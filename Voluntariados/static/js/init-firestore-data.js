// Script para inicializar datos en Firestore
// Este script debe ejecutarse una vez para poblar la base de datos

class FirestoreInitializer {
    constructor() {
        this.db = null;
        this.voluntariados = [
            {
                id: "pumas_verdes",
                name: "Pumas Verdes",
                description: "Comprometidos con la sostenibilidad ambiental y la educación ecológica en nuestro campus y comunidades.",
                category: "medio-ambiente",
                code: "PV2025",
                logo: "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580608/Logo_PV_UNAH_VS-removebg-preview_jadsip.png",
                active: true,
                adminUids: [], // Se llenará con UIDs de admins
                memberCount: 0,
                maxMembers: 100
            },
            {
                id: "sonriendo_juntos",
                name: "Sonriendo Juntos", 
                description: "Transformando vidas a través de la salud y bienestar, colaborando con Operación Sonrisa Honduras.",
                category: "social",
                code: "SJ2025",
                logo: "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580995/c31eebe3-8666-4c25-ba58-c81ae0da5ab6-removebg-preview_b1an3v.png",
                active: true,
                adminUids: [],
                memberCount: 0,
                maxMembers: 80
            },
            {
                id: "patitas_unah",
                name: "Patitas UNAH",
                description: "Protectores de la vida animal: Rescate, rehabilitación y concienciación sobre tenencia responsable.",
                category: "animales", 
                code: "PU2025",
                logo: "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580981/273c01b6-b5ce-4abb-af34-c5046222a2d6-removebg-preview_ycw82u.png",
                active: true,
                adminUids: [],
                memberCount: 0,
                maxMembers: 60
            },
            {
                id: "pumas_unidos",
                name: "Pumas Unidos",
                description: "Acciones solidarias que fortalecen comunidades vulnerables mediante ayuda humanitaria y educación.",
                category: "social",
                code: "PUN2025", 
                logo: "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741581160/27022b04-71eb-4808-95e2-fbc2c4e43738-removebg-preview_hewtfm.png",
                active: true,
                adminUids: [],
                memberCount: 0,
                maxMembers: 120
            },
            {
                id: "pumas_en_accion",
                name: "Pumas en Acción",
                description: "Educación y desarrollo comunitario a través de programas de enseñanza y apoyo social.",
                category: "educacion",
                code: "PEA2025",
                logo: "https://res.cloudinary.com/dcm2dsjov/image/upload/v1741580608/Logo_PV_UNAH_VS-removebg-preview_jadsip.png",
                active: true,
                adminUids: [],
                memberCount: 0,
                maxMembers: 90
            }
        ];

        this.logros = [
            {
                id: "primer_voluntariado",
                name: "Primer Voluntariado",
                description: "¡Bienvenido al equipo! Has dado el primer paso hacia el cambio.",
                icon: "fas fa-medal",
                color: "gold",
                condition: {
                    type: "join_volunteering",
                    voluntariadoId: null
                }
            },
            {
                id: "5_eventos",
                name: "5 Eventos Completados", 
                description: "Has participado en 5 eventos exitosamente.",
                icon: "fas fa-trophy",
                color: "silver",
                condition: {
                    type: "events_completed",
                    count: 5
                }
            },
            {
                id: "10_eventos",
                name: "10 Eventos Completados",
                description: "¡Eres un voluntario experimentado! 10 eventos completados.",
                icon: "fas fa-crown",
                color: "gold",
                condition: {
                    type: "events_completed", 
                    count: 10
                }
            },
            {
                id: "limpieza_campus",
                name: "Guardián del Campus",
                description: "Participaste en la limpieza del campus universitario.",
                icon: "fas fa-leaf",
                color: "green",
                condition: {
                    type: "event_participation",
                    eventId: "limpieza_campus_event"
                }
            },
            {
                id: "50_horas",
                name: "50 Horas de Servicio",
                description: "Has dedicado 50 horas al servicio comunitario.",
                icon: "fas fa-clock",
                color: "blue",
                condition: {
                    type: "hours_completed",
                    hours: 50
                }
            }
        ];
    }

    async initialize() {
        if (!window.firebaseDb) {
            console.error('❌ Firestore no está inicializado');
            return;
        }

        this.db = window.firebaseDb;
        console.log('🚀 Iniciando población de datos en Firestore...');

        try {
            // Crear voluntariados
            await this.createVoluntariados();
            
            // Crear logros
            await this.createLogros();
            
            console.log('✅ Datos inicializados correctamente en Firestore');
            
        } catch (error) {
            console.error('❌ Error inicializando datos:', error);
        }
    }

    async createVoluntariados() {
        console.log('📝 Creando voluntariados...');
        
        for (const voluntariado of this.voluntariados) {
            try {
                // Verificar si ya existe
                const doc = await this.db.collection('voluntariados').doc(voluntariado.id).get();
                
                if (!doc.exists) {
                    await this.db.collection('voluntariados').doc(voluntariado.id).set({
                        ...voluntariado,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`✅ Voluntariado creado: ${voluntariado.name}`);
                } else {
                    console.log(`⚠️ Voluntariado ya existe: ${voluntariado.name}`);
                }
            } catch (error) {
                console.error(`❌ Error creando voluntariado ${voluntariado.name}:`, error);
            }
        }
    }

    async createLogros() {
        console.log('🏆 Creando logros...');
        
        for (const logro of this.logros) {
            try {
                // Verificar si ya existe
                const doc = await this.db.collection('logros').doc(logro.id).get();
                
                if (!doc.exists) {
                    await this.db.collection('logros').doc(logro.id).set(logro);
                    console.log(`✅ Logro creado: ${logro.name}`);
                } else {
                    console.log(`⚠️ Logro ya existe: ${logro.name}`);
                }
            } catch (error) {
                console.error(`❌ Error creando logro ${logro.name}:`, error);
            }
        }
    }

    // Método para asignar admin a un voluntariado
    async assignAdmin(voluntariadoId, adminUid) {
        if (!this.db) {
            console.error('❌ Firestore no está inicializado');
            return;
        }

        try {
            const voluntariadoRef = this.db.collection('voluntariados').doc(voluntariadoId);
            const voluntariado = await voluntariadoRef.get();
            
            if (voluntariado.exists) {
                const data = voluntariado.data();
                const adminUids = data.adminUids || [];
                
                if (!adminUids.includes(adminUid)) {
                    adminUids.push(adminUid);
                    await voluntariadoRef.update({ adminUids });
                    console.log(`✅ Admin asignado al voluntariado ${voluntariadoId}`);
                } else {
                    console.log(`⚠️ El usuario ya es admin del voluntariado ${voluntariadoId}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error asignando admin:`, error);
        }
    }
}

// Función global para inicializar datos
window.initializeFirestoreData = function() {
    const initializer = new FirestoreInitializer();
    return initializer.initialize();
};

// Función global para asignar admin
window.assignVoluntariadoAdmin = function(voluntariadoId, adminUid) {
    const initializer = new FirestoreInitializer();
    return initializer.assignAdmin(voluntariadoId, adminUid);
};
