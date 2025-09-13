// Sistema de gestión de eventos

class EventsManager {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Esperar a que Firebase esté listo
        if (window.firebaseDb) {
            this.setupFirestore();
        } else {
            window.addEventListener('firebaseReady', () => {
                this.setupFirestore();
            });
        }
    }

    setupFirestore() {
        this.db = window.firebaseDb;
        this.currentUser = window.firebaseAuth.currentUser;
        console.log('📅 EventsManager inicializado');
    }

    // Crear evento (solo admins)
    async createEvent(voluntariadoId, eventData) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que el usuario es admin del voluntariado
            const isAdmin = await window.adminManager.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('No tienes permisos para crear eventos en este voluntariado');
            }

            // Crear el evento
            const eventRef = await this.db.collection('eventos').add({
                ...eventData,
                voluntariadoId: voluntariadoId,
                createdBy: this.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                participants: [],
                currentParticipants: 0,
                status: 'activo'
            });

            console.log('✅ Evento creado:', eventRef.id);
            return {
                success: true,
                message: 'Evento creado exitosamente',
                eventId: eventRef.id
            };

        } catch (error) {
            console.error('❌ Error creando evento:', error);
            throw error;
        }
    }

    // Obtener eventos de un voluntariado
    async getVoluntariadoEvents(voluntariadoId) {
        if (!this.db) return [];

        try {
            const snapshot = await this.db.collection('eventos')
                .where('voluntariadoId', '==', voluntariadoId)
                .orderBy('date', 'asc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Error obteniendo eventos:', error);
            return [];
        }
    }

    // Obtener todos los eventos (públicos)
    async getAllEvents() {
        if (!this.db) return [];

        try {
            const snapshot = await this.db.collection('eventos')
                .where('status', '==', 'activo')
                .orderBy('date', 'asc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Error obteniendo todos los eventos:', error);
            return [];
        }
    }

    // Participar en un evento
    async joinEvent(eventId) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventRef = this.db.collection('eventos').doc(eventId);
            const eventDoc = await eventRef.get();

            if (!eventDoc.exists) {
                throw new Error('Evento no encontrado');
            }

            const eventData = eventDoc.data();

            // Verificar si ya está participando
            if (eventData.participants.includes(this.currentUser.uid)) {
                throw new Error('Ya estás participando en este evento');
            }

            // Verificar si hay espacios disponibles
            if (eventData.currentParticipants >= eventData.maxParticipants) {
                throw new Error('Este evento ha alcanzado su límite de participantes');
            }

            // Verificar si el usuario pertenece al voluntariado
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.data();
            const userVoluntariados = userData.voluntariados || {};

            if (!userVoluntariados[eventData.voluntariadoId]) {
                throw new Error('Debes pertenecer al voluntariado para participar en sus eventos');
            }

            // Agregar participante
            await eventRef.update({
                participants: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid),
                currentParticipants: firebase.firestore.FieldValue.increment(1)
            });

            return {
                success: true,
                message: 'Te has unido al evento exitosamente'
            };

        } catch (error) {
            console.error('❌ Error uniéndose al evento:', error);
            throw error;
        }
    }

    // Abandonar evento
    async leaveEvent(eventId) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventRef = this.db.collection('eventos').doc(eventId);
            const eventDoc = await eventRef.get();

            if (!eventDoc.exists) {
                throw new Error('Evento no encontrado');
            }

            const eventData = eventDoc.data();

            // Verificar si está participando
            if (!eventData.participants.includes(this.currentUser.uid)) {
                throw new Error('No estás participando en este evento');
            }

            // Remover participante
            await eventRef.update({
                participants: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid),
                currentParticipants: firebase.firestore.FieldValue.increment(-1)
            });

            return {
                success: true,
                message: 'Has abandonado el evento exitosamente'
            };

        } catch (error) {
            console.error('❌ Error abandonando evento:', error);
            throw error;
        }
    }

    // Completar evento (solo admins)
    async completeEvent(eventId, completionData = {}) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventRef = this.db.collection('eventos').doc(eventId);
            const eventDoc = await eventRef.get();

            if (!eventDoc.exists) {
                throw new Error('Evento no encontrado');
            }

            const eventData = eventDoc.data();

            // Verificar que el usuario es admin del voluntariado
            const isAdmin = await window.adminManager.isUserAdmin(eventData.voluntariadoId);
            if (!isAdmin) {
                throw new Error('No tienes permisos para completar este evento');
            }

            // Actualizar evento como completado
            await eventRef.update({
                status: 'completado',
                completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...completionData
            });

            // Actualizar estadísticas de participantes
            await this.updateParticipantsStats(eventData);

            // Verificar y otorgar logros
            await this.checkEventAchievements(eventId, eventData);

            return {
                success: true,
                message: 'Evento completado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error completando evento:', error);
            throw error;
        }
    }

    // Actualizar estadísticas de participantes
    async updateParticipantsStats(eventData) {
        const { participants, voluntariadoId, hours = 0 } = eventData;

        for (const participantUid of participants) {
            try {
                const userRef = this.db.collection('users').doc(participantUid);
                const userDoc = await userRef.get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const voluntariados = userData.voluntariados || {};
                    
                    if (voluntariados[voluntariadoId]) {
                        await userRef.update({
                            [`voluntariados.${voluntariadoId}.totalHours`]: 
                                firebase.firestore.FieldValue.increment(hours),
                            [`voluntariados.${voluntariadoId}.eventsCompleted`]: 
                                firebase.firestore.FieldValue.increment(1)
                        });
                    }
                }
            } catch (error) {
                console.error(`❌ Error actualizando stats de usuario ${participantUid}:`, error);
            }
        }
    }

    // Verificar logros relacionados con eventos
    async checkEventAchievements(eventId, eventData) {
        const { participants, voluntariadoId } = eventData;

        for (const participantUid of participants) {
            try {
                // Verificar logro de 5 eventos
                await window.voluntariadosManager.checkAndAwardAchievement('5_eventos');
                
                // Verificar logro de 10 eventos
                await window.voluntariadosManager.checkAndAwardAchievement('10_eventos');
                
                // Verificar logro de 50 horas
                await window.voluntariadosManager.checkAndAwardAchievement('50_horas');

            } catch (error) {
                console.error(`❌ Error verificando logros para usuario ${participantUid}:`, error);
            }
        }
    }

    // Obtener eventos del usuario
    async getUserEvents() {
        if (!this.db || !this.currentUser) return [];

        try {
            const allEvents = await this.getAllEvents();
            const userEvents = allEvents.filter(event => 
                event.participants.includes(this.currentUser.uid)
            );

            return userEvents;
        } catch (error) {
            console.error('❌ Error obteniendo eventos del usuario:', error);
            return [];
        }
    }

    // Obtener eventos disponibles para el usuario (donde puede participar)
    async getAvailableEventsForUser() {
        if (!this.db || !this.currentUser) return [];

        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.data();
            const userVoluntariados = Object.keys(userData.voluntariados || {});

            const allEvents = await this.getAllEvents();
            const availableEvents = allEvents.filter(event => {
                // El usuario pertenece al voluntariado del evento
                const belongsToVoluntariado = userVoluntariados.includes(event.voluntariadoId);
                // El evento no está lleno
                const hasSpace = event.currentParticipants < event.maxParticipants;
                // El usuario no está ya participando
                const notParticipating = !event.participants.includes(this.currentUser.uid);

                return belongsToVoluntariado && hasSpace && notParticipating;
            });

            return availableEvents;
        } catch (error) {
            console.error('❌ Error obteniendo eventos disponibles:', error);
            return [];
        }
    }
}

// Inicializar globalmente
window.eventsManager = new EventsManager();
