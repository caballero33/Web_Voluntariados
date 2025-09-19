// Sistema de gestión de administradores

class AdminManager {
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
        this.auth = window.firebaseAuth;
        this.currentUser = window.firebaseAuth.currentUser;
        // AdminManager inicializado
        
        // Escuchar cambios en la autenticación
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
        });
    }

    // Verificar si el usuario actual es admin de algún voluntariado
    async isUserAdmin(voluntariadoId = null) {
        // Usar el usuario actual de Firebase directamente
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            return false;
        }

        try {
            // Si se especifica un voluntariado, verificar solo ese
            if (voluntariadoId) {
                const voluntariadoDoc = await this.db.collection('voluntariados').doc(voluntariadoId).get();
                if (voluntariadoDoc.exists) {
                    const adminUids = voluntariadoDoc.data().adminUids || [];
                    const isAdmin = adminUids.includes(currentUser.uid);
                    console.log('👑 Verificación de admin:', {
                        voluntariadoId: voluntariadoId,
                        userUid: currentUser.uid,
                        adminUids: adminUids,
                        isAdmin: isAdmin
                    });
                    return isAdmin;
                }
                return false;
            }

            // Verificar si es admin global
            const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();
            
            if (!userData) return false;

            if (userData.role === 'admin') {
                return true;
            }

            // Verificar si es admin de algún voluntariado
            const voluntariadosSnapshot = await this.db.collection('voluntariados').get();
            for (const doc of voluntariadosSnapshot.docs) {
                const adminUids = doc.data().adminUids || [];
                if (adminUids.includes(currentUser.uid)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('❌ Error verificando permisos de admin:', error);
            return false;
        }
    }

    // Obtener voluntariados donde el usuario es admin
    async getAdminVoluntariados() {
        if (!this.db || !this.currentUser) return [];

        try {
            const voluntariadosSnapshot = await this.db.collection('voluntariados').get();
            const adminVoluntariados = [];

            for (const doc of voluntariadosSnapshot.docs) {
                const data = doc.data();
                const adminUids = data.adminUids || [];
                
                if (adminUids.includes(this.currentUser.uid)) {
                    adminVoluntariados.push({
                        id: doc.id,
                        ...data
                    });
                }
            }

            return adminVoluntariados;
        } catch (error) {
            console.error('❌ Error obteniendo voluntariados de admin:', error);
            return [];
        }
    }

    // Asignar admin a un voluntariado (solo para super admins)
    async assignAdminToVoluntariado(voluntariadoId, adminEmail) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que el usuario actual es admin global
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.data();
            
            if (userData.role !== 'admin') {
                throw new Error('No tienes permisos para asignar administradores');
            }

            // Buscar usuario por email
            const usersSnapshot = await this.db.collection('users')
                .where('email', '==', adminEmail)
                .limit(1)
                .get();

            if (usersSnapshot.empty) {
                throw new Error('No se encontró usuario con ese email');
            }

            const adminUser = usersSnapshot.docs[0];
            const adminUid = adminUser.id;

            // Agregar a la lista de admins del voluntariado
            const voluntariadoRef = this.db.collection('voluntariados').doc(voluntariadoId);
            const voluntariadoDoc = await voluntariadoRef.get();
            
            if (!voluntariadoDoc.exists) {
                throw new Error('Voluntariado no encontrado');
            }

            const currentAdminUids = voluntariadoDoc.data().adminUids || [];
            
            if (currentAdminUids.includes(adminUid)) {
                throw new Error('El usuario ya es administrador de este voluntariado');
            }

            currentAdminUids.push(adminUid);
            
            await voluntariadoRef.update({
                adminUids: currentAdminUids
            });

            return {
                success: true,
                message: `Usuario ${adminEmail} asignado como administrador`
            };

        } catch (error) {
            console.error('❌ Error asignando admin:', error);
            throw error;
        }
    }

    // Remover admin de un voluntariado
    async removeAdminFromVoluntariado(voluntariadoId, adminUid) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que el usuario actual es admin global
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.data();
            
            if (userData.role !== 'admin') {
                throw new Error('No tienes permisos para remover administradores');
            }

            const voluntariadoRef = this.db.collection('voluntariados').doc(voluntariadoId);
            const voluntariadoDoc = await voluntariadoRef.get();
            
            if (!voluntariadoDoc.exists) {
                throw new Error('Voluntariado no encontrado');
            }

            const currentAdminUids = voluntariadoDoc.data().adminUids || [];
            const updatedAdminUids = currentAdminUids.filter(uid => uid !== adminUid);
            
            if (currentAdminUids.length === updatedAdminUids.length) {
                throw new Error('El usuario no es administrador de este voluntariado');
            }

            await voluntariadoRef.update({
                adminUids: updatedAdminUids
            });

            return {
                success: true,
                message: 'Administrador removido exitosamente'
            };

        } catch (error) {
            console.error('❌ Error removiendo admin:', error);
            throw error;
        }
    }

    // Crear evento para un voluntariado (solo admins del voluntariado)
    async createEvent(voluntariadoId, eventData) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            console.error('❌ Usuario no autenticado:', {
                db: !!this.db,
                currentUser: !!currentUser
            });
            throw new Error('Usuario no autenticado');
        }

        try {
            console.log('🔄 Creando evento:', {
                voluntariadoId,
                eventData,
                userEmail: currentUser.email
            });

            // Verificar que el usuario es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('No tienes permisos para crear eventos en este voluntariado');
            }

            // Preparar datos del evento
            const eventToSave = {
                title: eventData.title,
                description: eventData.description,
                eventDate: firebase.firestore.Timestamp.fromDate(eventData.eventDate),
                duration: eventData.duration || 2, // Duración del evento en horas
                maxParticipants: eventData.maxParticipants,
                status: eventData.status || 'abierto',
                voluntariadoId: voluntariadoId,
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                participants: [currentUser.uid], // Inscribir automáticamente al admin que crea el evento
                currentParticipants: 1,
                attended: [] // Lista de asistencias (inicialmente vacía)
            };

            // Debug log removed

            // Crear el evento
            const eventRef = await this.db.collection('eventos').add(eventToSave);

            // Debug log removed
            // Debug log removed

            return {
                success: true,
                message: 'Evento creado exitosamente. Has sido inscrito automáticamente.',
                eventId: eventRef.id
            };

        } catch (error) {
            console.error('❌ Error creando evento:', error);
            throw error;
        }
    }

    // Obtener miembros de un voluntariado
    async getVoluntariadoMembers(voluntariadoId) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que el usuario es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('No tienes permisos para ver los miembros de este voluntariado');
            }

            // Buscar todos los usuarios que pertenecen a este voluntariado
            const usersSnapshot = await this.db.collection('users').get();
            const members = [];

            for (const doc of usersSnapshot.docs) {
                const userData = doc.data();
                const voluntariados = userData.voluntariados || {};
                
                if (voluntariados[voluntariadoId]) {
                    members.push({
                        uid: doc.id,
                        ...userData,
                        voluntariadoData: voluntariados[voluntariadoId]
                    });
                }
            }

            return members;
        } catch (error) {
            console.error('❌ Error obteniendo miembros:', error);
            throw error;
        }
    }

    // Actualizar datos de un miembro en un voluntariado
    async updateMemberData(voluntariadoId, memberUid, updateData) {
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que el usuario es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('No tienes permisos para actualizar datos de miembros');
            }

            const userRef = this.db.collection('users').doc(memberUid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                throw new Error('Usuario no encontrado');
            }

            const userData = userDoc.data();
            const voluntariados = userData.voluntariados || {};
            
            if (!voluntariados[voluntariadoId]) {
                throw new Error('El usuario no pertenece a este voluntariado');
            }

            // Actualizar datos específicos del voluntariado
            voluntariados[voluntariadoId] = {
                ...voluntariados[voluntariadoId],
                ...updateData
            };

            await userRef.update({
                voluntariados: voluntariados
            });

            return {
                success: true,
                message: 'Datos del miembro actualizados exitosamente'
            };

        } catch (error) {
            console.error('❌ Error actualizando datos del miembro:', error);
            throw error;
        }
    }

    // NUEVO: Crear post en el muro del voluntariado
    async createPost(voluntariadoId, postData) {
        // Usar el usuario actual de Firebase directamente
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            console.error('❌ Usuario no autenticado:', {
                db: !!this.db,
                currentUser: !!currentUser,
                userEmail: currentUser ? currentUser.email : 'N/A'
            });
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden crear posts');
            }

            const postRef = this.db.collection('posts').doc();
            await postRef.set({
                voluntariadoId: voluntariadoId,
                title: postData.title,
                content: postData.content,
                type: postData.type || 'general',
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                priority: postData.priority || 'medium'
            });

            // Debug log removed
            return postRef.id;
        } catch (error) {
            console.error('❌ Error creating post:', error);
            throw error;
        }
    }

    // NUEVO: Obtener posts del muro del voluntariado
    async getVolunteerPosts(voluntariadoId) {
        try {
            // Intentar con índice primero
            try {
                const postsSnapshot = await this.db
                    .collection('posts')
                    .where('voluntariadoId', '==', voluntariadoId)
                    .orderBy('createdAt', 'desc')
                    .limit(20)
                    .get();

                return postsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (indexError) {
                // Si falla por índice, obtener todos y filtrar localmente
                // Debug log removed
                const allPostsSnapshot = await this.db
                    .collection('posts')
                    .get();

                const posts = allPostsSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(post => post.voluntariadoId === voluntariadoId)
                    .sort((a, b) => {
                        const aTime = a.createdAt ? a.createdAt.toDate().getTime() : 0;
                        const bTime = b.createdAt ? b.createdAt.toDate().getTime() : 0;
                        return bTime - aTime;
                    })
                    .slice(0, 20);

                return posts;
            }
        } catch (error) {
            console.error('Error getting posts:', error);
            return [];
        }
    }

    // NUEVO: Gestionar participantes de eventos
    async manageEventParticipants(eventId, action, userId = null) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            
            // Verificar que es admin del voluntariado O que es el usuario mismo
            const isAdmin = await this.isUserAdmin(eventData.voluntariadoId);
            const isSelf = userId === null || userId === currentUser.uid;
            
            if (!isAdmin && !isSelf) {
                throw new Error('No tienes permisos para esta acción');
            }

            const targetUserId = userId || currentUser.uid;

            if (action === 'add') {
                // Verificar límite de participantes
                if (eventData.participants && eventData.participants.length >= eventData.maxParticipants) {
                    throw new Error('El evento ha alcanzado el límite máximo de participantes');
                }
                
                // Verificar que el evento esté abierto
                if (eventData.status !== 'abierto') {
                    throw new Error('El evento no está abierto para inscripciones');
                }

                // Verificar si el evento ya pasó
                const eventDate = eventData.eventDate?.toDate?.() || new Date(0);
                if (eventDate < new Date()) {
                    throw new Error('No puedes inscribirte a un evento que ya pasó');
                }

                // Verificar si ya está inscrito
                if (eventData.participants && eventData.participants.includes(targetUserId)) {
                    throw new Error('Ya estás inscrito en este evento');
                }

                await eventDoc.ref.update({
                    participants: firebase.firestore.FieldValue.arrayUnion(targetUserId),
                    currentParticipants: firebase.firestore.FieldValue.increment(1)
                });

                // Debug log removed
            } else if (action === 'remove') {
                await eventDoc.ref.update({
                    participants: firebase.firestore.FieldValue.arrayRemove(targetUserId),
                    currentParticipants: firebase.firestore.FieldValue.increment(-1)
                });

                // Debug log removed
            }

            return true;
        } catch (error) {
            console.error('Error managing participants:', error);
            throw error;
        }
    }

    // NUEVO: Obtener eventos de un voluntariado
    async getVolunteerEvents(voluntariadoId) {
        try {
            // Debug log removed
            
            // Intentar con orderBy primero, si falla usar solo where
            let eventsSnapshot;
            try {
                eventsSnapshot = await this.db
                    .collection('eventos')
                    .where('voluntariadoId', '==', voluntariadoId)
                    .orderBy('eventDate', 'desc')
                    .get();
            } catch (indexError) {
                // Debug log removed
                eventsSnapshot = await this.db
                    .collection('eventos')
                    .where('voluntariadoId', '==', voluntariadoId)
                    .get();
            }

            // Debug log removed
            
            const events = eventsSnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('📅 Evento:', {
                    id: doc.id,
                    title: data.title,
                    status: data.status,
                    eventDate: data.eventDate?.toDate?.() || data.eventDate,
                    participants: data.participants?.length || 0,
                    maxParticipants: data.maxParticipants
                });
                return {
                    id: doc.id,
                    ...data
                };
            });

            // Ordenar por fecha en el cliente (más reciente primero)
            events.sort((a, b) => {
                const dateA = a.eventDate?.toDate ? a.eventDate.toDate() : new Date(a.eventDate || 0);
                const dateB = b.eventDate?.toDate ? b.eventDate.toDate() : new Date(b.eventDate || 0);
                return dateB - dateA;
            });

            // Debug log removed
            return events;
        } catch (error) {
            console.error('❌ Error getting events:', error);
            
            // Intentar sin orderBy si falla por índice
            try {
                // Debug log removed
                const eventsSnapshot = await this.db
                    .collection('eventos')
                    .where('voluntariadoId', '==', voluntariadoId)
                    .get();

                const events = eventsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => {
                    const dateA = a.eventDate?.toDate?.() || new Date(0);
                    const dateB = b.eventDate?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });

                // Debug log removed
                return events;
            } catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
                return [];
            }
        }
    }

    // NUEVO: Obtener un evento específico
    async getEvent(eventId) {
        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            if (eventDoc.exists) {
                return {
                    id: eventDoc.id,
                    ...eventDoc.data()
                };
            }
            throw new Error('Evento no encontrado');
        } catch (error) {
            console.error('Error getting event:', error);
            throw error;
        }
    }

    // NUEVO: Obtener participantes de un evento
    async getEventParticipants(eventId) {
        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            const participantIds = eventData.participants || [];
            const attendedIds = eventData.attended || [];
            
            if (participantIds.length === 0) {
                return [];
            }
            
            const participants = [];
            for (const participantId of participantIds) {
                const userDoc = await this.db.collection('users').doc(participantId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    participants.push({
                        uid: participantId,
                        ...userData,
                        attended: attendedIds.includes(participantId), // Marcar si asistió
                        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                    });
                }
            }
            
            // Ordenar por nombre
            participants.sort((a, b) => a.fullName.localeCompare(b.fullName));
            
            return participants;
        } catch (error) {
            console.error('Error getting participants:', error);
            throw error;
        }
    }

    // NUEVO: Obtener participantes con datos completos para exportar
    async getEventParticipantsDetailed(eventId) {
        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            const participantIds = eventData.participants || [];
            const attendedIds = eventData.attended || [];
            
            if (participantIds.length === 0) {
                return [];
            }
            
            const participants = [];
            for (const participantId of participantIds) {
                const userDoc = await this.db.collection('users').doc(participantId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    participants.push({
                        uid: participantId,
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                        email: userData.email || '',
                        phone: userData.phone || '',
                        attended: attendedIds.includes(participantId),
                        attendanceStatus: attendedIds.includes(participantId) ? 'Asistió' : 'No confirmado'
                    });
                }
            }
            
            // Ordenar por nombre
            participants.sort((a, b) => a.fullName.localeCompare(b.fullName));
            
            return participants;
        } catch (error) {
            console.error('Error getting detailed participants:', error);
            throw error;
        }
    }

    // NUEVO: Actualizar estado de evento
    async updateEventStatus(eventId, newStatus) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(eventData.voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden cambiar el estado del evento');
            }

            await eventDoc.ref.update({
                status: newStatus
            });

            // Debug log removed
            return true;
        } catch (error) {
            console.error('Error updating event status:', error);
            throw error;
        }
    }

    // NUEVO: Marcar asistencia individual
    async markAttendance(eventId, participantId) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(eventData.voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden marcar asistencia');
            }

            // Verificar que el participante está inscrito
            if (!eventData.participants || !eventData.participants.includes(participantId)) {
                throw new Error('El usuario no está inscrito en este evento');
            }

            // Marcar asistencia en el evento
            const attendedList = eventData.attended || [];
            
            // Verificar si ya se marcó asistencia para evitar duplicados
            if (attendedList.includes(participantId)) {
                // Debug log removed
                return true;
            }
            
            // Actualizar estadísticas del usuario en el voluntariado
            const userDoc = await this.db.collection('users').doc(participantId).get();
            const userData = userDoc.data();
            
            if (!userData || !userData.voluntariados || !userData.voluntariados[eventData.voluntariadoId]) {
                throw new Error('El usuario no está inscrito en este voluntariado');
            }
            
            const volunteerData = userData.voluntariados[eventData.voluntariadoId];
            const eventHours = eventData.duration || 2; // Horas por defecto si no se especifica
            
            // Actualizar datos del voluntariado
            const newEventsCompleted = (volunteerData.eventsCompleted || 0) + 1;
            const newTotalHours = (volunteerData.totalHours || 0) + eventHours;
            
            // Crear entrada de historial de horas
            const hoursEntry = {
                hours: eventHours,
                event: eventData.title,
                date: firebase.firestore.Timestamp.fromDate(new Date()),
                addedBy: currentUser.uid,
                addedAt: firebase.firestore.Timestamp.fromDate(new Date()),
                comments: `Asistencia confirmada al evento: ${eventData.title}`,
                type: 'event_attendance'
            };
            
            // Actualizar evento con asistencia
            await eventDoc.ref.update({
                attended: firebase.firestore.FieldValue.arrayUnion(participantId)
            });
            
            // Obtener historial actual del usuario
            const currentHistory = volunteerData.hoursHistory || [];
            
            // Agregar nueva entrada al historial
            const updatedHistory = [...currentHistory, hoursEntry];
            
            // Actualizar usuario con horas y estadísticas
            await userDoc.ref.update({
                [`voluntariados.${eventData.voluntariadoId}.eventsCompleted`]: newEventsCompleted,
                [`voluntariados.${eventData.voluntariadoId}.totalHours`]: newTotalHours,
                [`voluntariados.${eventData.voluntariadoId}.lastEventDate`]: firebase.firestore.FieldValue.serverTimestamp(),
                [`voluntariados.${eventData.voluntariadoId}.hoursHistory`]: updatedHistory
            });

            // Debug log removed
            return true;
        } catch (error) {
            console.error('Error marking attendance:', error);
            throw error;
        }
    }

    // NUEVO: Marcar asistencia en lote (checklist)
    async markAttendanceBatch(eventId, participantIds) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(eventData.voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden marcar asistencia');
            }

            const eventHours = eventData.duration || 2;
            const attendedList = eventData.attended || [];
            let successCount = 0;
            let errorCount = 0;

            // Procesar cada participante
            for (const participantId of participantIds) {
                try {
                    // Verificar que el participante está inscrito
                    if (!eventData.participants || !eventData.participants.includes(participantId)) {
                        console.warn(`⚠️ Usuario ${participantId} no está inscrito en el evento`);
                        errorCount++;
                        continue;
                    }

                    // Verificar si ya se marcó asistencia
                    if (attendedList.includes(participantId)) {
                        // Debug log removed
                        continue;
                    }

                    // Actualizar estadísticas del usuario
                    const userDoc = await this.db.collection('users').doc(participantId).get();
                    const userData = userDoc.data();
                    
                    if (!userData || !userData.voluntariados || !userData.voluntariados[eventData.voluntariadoId]) {
                        console.warn(`⚠️ Usuario ${participantId} no está inscrito en el voluntariado`);
                        errorCount++;
                        continue;
                    }
                    
                    const volunteerData = userData.voluntariados[eventData.voluntariadoId];
                    
                    // Actualizar datos del voluntariado
                    const newEventsCompleted = (volunteerData.eventsCompleted || 0) + 1;
                    const newTotalHours = (volunteerData.totalHours || 0) + eventHours;
                    
                    // Crear entrada de historial de horas
                    const hoursEntry = {
                        hours: eventHours,
                        event: eventData.title,
                        date: firebase.firestore.Timestamp.fromDate(new Date()),
                        addedBy: currentUser.uid,
                        addedAt: firebase.firestore.Timestamp.fromDate(new Date()),
                        comments: `Asistencia confirmada al evento: ${eventData.title}`,
                        type: 'event_attendance'
                    };
                    
                    // Obtener historial actual del usuario
                    const currentHistory = volunteerData.hoursHistory || [];
                    const updatedHistory = [...currentHistory, hoursEntry];
                    
                    // Actualizar usuario con horas y estadísticas
                    await userDoc.ref.update({
                        [`voluntariados.${eventData.voluntariadoId}.eventsCompleted`]: newEventsCompleted,
                        [`voluntariados.${eventData.voluntariadoId}.totalHours`]: newTotalHours,
                        [`voluntariados.${eventData.voluntariadoId}.lastEventDate`]: firebase.firestore.FieldValue.serverTimestamp(),
                        [`voluntariados.${eventData.voluntariadoId}.hoursHistory`]: updatedHistory
                    });

                    successCount++;
                    // Debug log removed
                } catch (error) {
                    console.error(`❌ Error marcando asistencia para ${participantId}:`, error);
                    errorCount++;
                }
            }

            // Actualizar evento con todas las asistencias
            await eventDoc.ref.update({
                attended: firebase.firestore.FieldValue.arrayUnion(...participantIds)
            });

            // Debug log removed
            return {
                success: successCount,
                errors: errorCount,
                total: participantIds.length
            };
        } catch (error) {
            console.error('Error marking batch attendance:', error);
            throw error;
        }
    }

    // NUEVO: Actualizar evento
    async updateEvent(eventId, updateData) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(eventData.voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden editar eventos');
            }

            // Preparar datos de actualización
            const updateToSave = {
                title: updateData.title,
                description: updateData.description,
                eventDate: firebase.firestore.Timestamp.fromDate(updateData.eventDate),
                maxParticipants: updateData.maxParticipants,
                status: updateData.status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.uid
            };

            await eventDoc.ref.update(updateToSave);

            // Debug log removed
            return true;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }

    // NUEVO: Eliminar evento
    async deleteEvent(eventId) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const eventDoc = await this.db.collection('eventos').doc(eventId).get();
            const eventData = eventDoc.data();
            
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(eventData.voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden eliminar eventos');
            }

            // Eliminar el evento
            await eventDoc.ref.delete();

            // Debug log removed
            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }

    // NUEVO: Cerrar eventos pasados automáticamente
    async closePastEvents() {
        try {
            // Debug log removed
            
            const now = new Date();
            const eventsSnapshot = await this.db
                .collection('eventos')
                .where('status', '==', 'abierto')
                .get();

            const pastEvents = [];
            eventsSnapshot.docs.forEach(doc => {
                const eventData = doc.data();
                const eventDate = eventData.eventDate?.toDate?.() || new Date(0);
                
                if (eventDate < now) {
                    pastEvents.push({
                        id: doc.id,
                        ...eventData
                    });
                }
            });

            if (pastEvents.length > 0) {
                // Debug log removed
                
                const batch = this.db.batch();
                pastEvents.forEach(event => {
                    const eventRef = this.db.collection('eventos').doc(event.id);
                    batch.update(eventRef, {
                        status: 'cerrado',
                        closedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        closedReason: 'Evento pasado automáticamente'
                    });
                });
                
                await batch.commit();
                // Debug log removed
            } else {
                // Debug log removed
            }
            
            return pastEvents.length;
        } catch (error) {
            console.error('Error closing past events:', error);
            return 0;
        }
    }

    // NUEVO: Obtener estadísticas de un voluntariado
    async getVolunteerStatistics(voluntariadoId) {
        try {
            // Debug log removed
            
            // Obtener todos los miembros del voluntariado
            const membersSnapshot = await this.db
                .collection('users')
                .where(`voluntariados.${voluntariadoId}`, '!=', null)
                .get();
            
            // Debug log removed
            
            const members = membersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Debug log removed
            
            // Obtener todos los eventos del voluntariado
            const eventsSnapshot = await this.db
                .collection('eventos')
                .where('voluntariadoId', '==', voluntariadoId)
                .get();
            
            const events = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Calcular estadísticas
            const stats = {
                totalMembers: members.length,
                totalEvents: events.length,
                totalHours: 0,
                activeMembers: 0,
                eventsCompleted: 0,
                membersByActivity: [],
                monthlyHours: {},
                eventParticipation: []
            };
            
            // Procesar datos de miembros
            members.forEach(member => {
                const volunteerData = member.voluntariados[voluntariadoId] || {};
                const hours = volunteerData.totalHours || 0;
                const eventsCompleted = volunteerData.eventsCompleted || 0;
                
                stats.totalHours += hours;
                stats.eventsCompleted += eventsCompleted;
                
                if (eventsCompleted > 0) {
                    stats.activeMembers++;
                }
                
                stats.membersByActivity.push({
                    id: member.id,
                    name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
                    email: member.email,
                    hours: hours,
                    eventsCompleted: eventsCompleted,
                    lastEvent: volunteerData.lastEventDate ? volunteerData.lastEventDate.toDate() : null,
                    joinedDate: volunteerData.joinedDate ? volunteerData.joinedDate.toDate() : null
                });
            });
            
            // Ordenar miembros por actividad
            stats.membersByActivity.sort((a, b) => b.hours - a.hours);
            
            // Procesar datos de eventos
            events.forEach(event => {
                const participants = event.participants ? event.participants.length : 0;
                stats.eventParticipation.push({
                    id: event.id,
                    title: event.title,
                    participants: participants,
                    maxParticipants: event.maxParticipants,
                    eventDate: event.eventDate ? event.eventDate.toDate() : null,
                    status: event.status
                });
            });
            
            // Debug log removed
            return stats;
            
        } catch (error) {
            console.error('Error getting volunteer statistics:', error);
            throw error;
        }
    }

    // NUEVO: Obtener estadísticas de horas por actividad
    async getHoursByActivity(voluntariadoId) {
        try {
            // Debug log removed
            
            const members = await this.getVoluntariadoMembers(voluntariadoId);
            const activityStats = {};
            
            members.forEach(member => {
                const volunteerData = member.voluntariadoData || {};
                const hoursHistory = volunteerData.hoursHistory || [];
                
                hoursHistory.forEach(entry => {
                    const activity = entry.event || 'Actividad sin nombre';
                    
                    if (!activityStats[activity]) {
                        activityStats[activity] = {
                            name: activity,
                            totalHours: 0,
                            participants: new Set(),
                            entries: []
                        };
                    }
                    
                    activityStats[activity].totalHours += entry.hours || 0;
                    activityStats[activity].participants.add(member.uid);
                    activityStats[activity].entries.push({
                        memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
                        hours: entry.hours,
                        date: entry.date ? entry.date.toDate() : new Date(),
                        comments: entry.comments
                    });
                });
            });
            
            // Convertir Set a número y ordenar por horas totales
            const sortedActivities = Object.values(activityStats)
                .map(activity => ({
                    ...activity,
                    participantCount: activity.participants.size
                }))
                .sort((a, b) => b.totalHours - a.totalHours);
            
            // Debug log removed
            return sortedActivities;
            
        } catch (error) {
            console.error('❌ Error getting hours by activity:', error);
            throw error;
        }
    }

    // NUEVO: Agregar horas a un miembro
    async addHoursToMember(memberId, voluntariadoId, hoursData) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Debug log removed
            
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden agregar horas');
            }

            const memberDoc = await this.db.collection('users').doc(memberId).get();
            const memberData = memberDoc.data();
            
            if (!memberData || !memberData.voluntariados || !memberData.voluntariados[voluntariadoId]) {
                throw new Error('El miembro no está inscrito en este voluntariado');
            }

            // Actualizar datos del voluntariado del miembro
            const volunteerData = memberData.voluntariados[voluntariadoId];
            const newTotalHours = (volunteerData.totalHours || 0) + hoursData.hours;
            
            // Obtener historial actual
            const currentHistory = volunteerData.hoursHistory || [];
            
            // Crear nueva entrada de historial
            const newHoursEntry = {
                hours: hoursData.hours,
                event: hoursData.event,
                date: firebase.firestore.Timestamp.fromDate(hoursData.date),
                addedBy: currentUser.uid,
                addedAt: firebase.firestore.Timestamp.fromDate(new Date()),
                comments: hoursData.comments || ''
            };
            
            // Agregar nueva entrada al historial
            const updatedHistory = [...currentHistory, newHoursEntry];
            
            // Actualizar documento sin usar arrayUnion
            await memberDoc.ref.update({
                [`voluntariados.${voluntariadoId}.totalHours`]: newTotalHours,
                [`voluntariados.${voluntariadoId}.lastHoursUpdate`]: firebase.firestore.FieldValue.serverTimestamp(),
                [`voluntariados.${voluntariadoId}.hoursHistory`]: updatedHistory
            });

            // Debug log removed
            return true;
            
        } catch (error) {
            console.error('❌ Error adding hours to member:', error);
            throw error;
        }
    }

    // NUEVO: Obtener historial de horas de un miembro
    async getMemberHoursHistory(memberId, voluntariadoId) {
        try {
            // Debug log removed
            
            const memberDoc = await this.db.collection('users').doc(memberId).get();
            
            if (!memberDoc.exists) {
                throw new Error('Usuario no encontrado');
            }
            
            const memberData = memberDoc.data();
            
            if (!memberData || !memberData.voluntariados || !memberData.voluntariados[voluntariadoId]) {
                throw new Error('El miembro no está inscrito en este voluntariado');
            }
            
            const volunteerData = memberData.voluntariados[voluntariadoId];
            const hoursHistory = volunteerData.hoursHistory || [];
            
            // Debug log removed
            // Debug log removed
            
            // Ordenar por fecha (más reciente primero) - manejar diferentes formatos de fecha
            const sortedHistory = hoursHistory.sort((a, b) => {
                let dateA, dateB;
                
                // Manejar diferentes formatos de fecha
                if (a.date && typeof a.date.toDate === 'function') {
                    dateA = a.date.toDate();
                } else if (a.date && typeof a.date === 'string') {
                    dateA = new Date(a.date);
                } else if (a.addedAt && typeof a.addedAt.toDate === 'function') {
                    dateA = a.addedAt.toDate();
                } else if (a.addedAt && typeof a.addedAt === 'string') {
                    dateA = new Date(a.addedAt);
                } else {
                    dateA = new Date(0);
                }
                
                if (b.date && typeof b.date.toDate === 'function') {
                    dateB = b.date.toDate();
                } else if (b.date && typeof b.date === 'string') {
                    dateB = new Date(b.date);
                } else if (b.addedAt && typeof b.addedAt.toDate === 'function') {
                    dateB = b.addedAt.toDate();
                } else if (b.addedAt && typeof b.addedAt === 'string') {
                    dateB = new Date(b.addedAt);
                } else {
                    dateB = new Date(0);
                }
                
                return dateB - dateA;
            });
            
            // Debug log removed
            return {
                totalHours: volunteerData.totalHours || 0,
                history: sortedHistory,
                memberInfo: {
                    id: memberId,
                    firstName: memberData.firstName,
                    lastName: memberData.lastName,
                    email: memberData.email
                }
            };
            
        } catch (error) {
            console.error('❌ Error getting member hours history:', error);
            throw error;
        }
    }

    // NUEVO: Crear logro
    async createAchievement(voluntariadoId, achievementData) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden crear logros');
            }

            // Crear el logro
            const achievementDoc = {
                name: achievementData.name,
                description: achievementData.description,
                criteria: achievementData.criteria,
                value: achievementData.value,
                hours: achievementData.hours || 0, // AGREGAR CAMPO DE HORAS
                icon: achievementData.icon || 'fas fa-trophy',
                voluntariadoId: voluntariadoId,
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                assignedTo: [], // Inicializar arrays vacíos
                assignedAt: [],
                assignedBy: []
            };
            
            // Debug log removed
            
            const achievementRef = await this.db.collection('logros').add(achievementDoc);

            // Debug log removed
            // Debug log removed
            
            return achievementRef.id;
            
        } catch (error) {
            console.error('Error creating achievement:', error);
            throw error;
        }
    }

    // NUEVO: Obtener logros de un voluntariado
    async getVolunteerAchievements(voluntariadoId) {
        try {
            // Debug log removed
            
            // Método más simple: obtener todos los logros y filtrar localmente
            // Debug log removed
            const achievementsSnapshot = await this.db
                .collection('logros')
                .get();
            
            // Debug log removed
            
            if (achievementsSnapshot.empty) {
                // Debug log removed
                return [];
            }
            
            const allAchievements = [];
            achievementsSnapshot.forEach(doc => {
                const data = doc.data();
                allAchievements.push({
                    id: doc.id,
                    ...data
                });
            });
            
            // Debug log removed
            
            // Filtrar por voluntariado y estado activo
            const filteredAchievements = allAchievements.filter(achievement => {
                const matchesVoluntariado = achievement.voluntariadoId === voluntariadoId;
                const isActive = achievement.isActive !== false;
                // Debug log removed
                return matchesVoluntariado && isActive;
            });
            
            // Ordenar por fecha de creación (más reciente primero)
            const sortedAchievements = filteredAchievements.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });
            
            // Debug log removed
            sortedAchievements.forEach(achievement => {
                // Debug log removed
            });
            
            return sortedAchievements;
            
        } catch (error) {
            console.error('❌ Error getting volunteer achievements:', error);
            console.error('Error details:', error.message);
            return [];
        }
    }

    // NUEVO: Asignar logro a un miembro
    async assignAchievementToMember(memberId, voluntariadoId, achievementId) {
        const currentUser = window.firebaseAuth.currentUser;
        
        if (!this.db || !currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
            if (!isAdmin) {
                throw new Error('Solo los administradores pueden asignar logros');
            }

            // Verificar que el logro existe
            const achievementDoc = await this.db.collection('logros').doc(achievementId).get();
            if (!achievementDoc.exists) {
                throw new Error('El logro no existe');
            }

            const achievementData = achievementDoc.data();
            
            // Verificar que el miembro no tenga ya este logro
            const memberDoc = await this.db.collection('users').doc(memberId).get();
            if (!memberDoc.exists) {
                throw new Error('El miembro no existe');
            }

            const memberData = memberDoc.data();
            const volunteerData = memberData.voluntariados?.[voluntariadoId] || {};

            // Verificar en user_achievements si ya tiene este logro
            const existingAchievementQuery = await this.db
                .collection('user_achievements')
                .where('userId', '==', memberId)
                .where('achievementId', '==', achievementId)
                .get();

            if (!existingAchievementQuery.empty) {
                throw new Error('Este miembro ya tiene este logro asignado');
            }

            // Obtener horas del logro (si tiene)
            const achievementHours = achievementData.hours || 0;

            // Usar batch para operaciones atómicas
            const batch = this.db.batch();
            
            // 1. Agregar logro al miembro en la colección users
            const userRef = this.db.collection('users').doc(memberId);
            const currentAchievements = volunteerData.achievements || [];
            batch.update(userRef, {
                [`voluntariados.${voluntariadoId}.achievements`]: [...currentAchievements, achievementId]
            });

            // 2. Si el logro tiene horas, sumarlas al total del miembro
            if (achievementHours > 0) {
                const currentTotalHours = volunteerData.totalHours || 0;
                const newTotalHours = currentTotalHours + achievementHours;
                
                // Actualizar total de horas
                batch.update(userRef, {
                    [`voluntariados.${voluntariadoId}.totalHours`]: newTotalHours
                });

                // Agregar entrada al historial de horas
                const currentHoursHistory = volunteerData.hoursHistory || [];
                const newHoursEntry = {
                    hours: achievementHours,
                    event: `Logro: ${achievementData.name}`,
                    date: firebase.firestore.Timestamp.fromDate(new Date()),
                    addedAt: firebase.firestore.Timestamp.fromDate(new Date()),
                    addedBy: currentUser.uid,
                    type: 'achievement',
                    achievementId: achievementId,
                    comments: `Horas otorgadas por logro: ${achievementData.name}`
                };
                
                batch.update(userRef, {
                    [`voluntariados.${voluntariadoId}.hoursHistory`]: [...currentHoursHistory, newHoursEntry]
                });
            }

            // 3. Crear registro en user_achievements para tracking
            const userAchievementRef = this.db.collection('user_achievements').doc();
            batch.set(userAchievementRef, {
                userId: memberId,
                achievementId: achievementId,
                voluntariadoId: voluntariadoId,
                achievementName: achievementData.name,
                achievementIcon: achievementData.icon,
                achievementHours: achievementHours,
                assignedBy: currentUser.uid,
                assignedAt: firebase.firestore.Timestamp.fromDate(new Date())
            });

            // 4. Actualizar el logro para incluir al miembro en la lista
            const achievementRef = this.db.collection('logros').doc(achievementId);
            const currentAssignedTo = achievementData.assignedTo || [];
            const currentAssignedAt = achievementData.assignedAt || [];
            const currentAssignedBy = achievementData.assignedBy || [];
            
            batch.update(achievementRef, {
                assignedTo: [...currentAssignedTo, memberId],
                assignedAt: [...currentAssignedAt, firebase.firestore.Timestamp.fromDate(new Date())],
                assignedBy: [...currentAssignedBy, currentUser.uid]
            });

            // Ejecutar todas las operaciones
            await batch.commit();

            // Debug log removed
            return true;
            
        } catch (error) {
            console.error('❌ Error assigning achievement:', error);
            throw error;
        }
    }

    // NUEVO: Eliminar logro
    async deleteAchievement(achievementId) {
        try {
            // Debug log removed
            
            const currentUser = window.firebaseAuth.currentUser;
            if (!currentUser) {
                throw new Error('Usuario no autenticado');
            }

            // Verificar que el logro existe
            const achievementDoc = await this.db.collection('logros').doc(achievementId).get();
            if (!achievementDoc.exists) {
                throw new Error('Logro no encontrado');
            }

            const achievementData = achievementDoc.data();
            const voluntariadoId = achievementData.voluntariadoId;

            // Verificar que el usuario es admin del voluntariado del logro
            if (!await this.isUserAdmin(voluntariadoId)) {
                throw new Error('No tienes permisos para eliminar este logro');
            }

            // Eliminar el logro
            await this.db.collection('logros').doc(achievementId).delete();
            // Debug log removed
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting achievement:', error);
            throw error;
        }
    }

    // NUEVO: Obtener detalles completos de un logro
    async getAchievementDetails(achievementId) {
        try {
            // Debug log removed
            
            const achievementDoc = await this.db.collection('logros').doc(achievementId).get();
            if (!achievementDoc.exists) {
                throw new Error('Logro no encontrado');
            }

            const achievementData = achievementDoc.data();
            achievementData.id = achievementId;

            // Obtener información de los miembros asignados desde user_achievements
            const userAchievementsSnapshot = await this.db
                .collection('user_achievements')
                .where('achievementId', '==', achievementId)
                .get();

            // Debug log removed

            if (userAchievementsSnapshot.docs.length > 0) {
                const memberPromises = userAchievementsSnapshot.docs.map(async (doc) => {
                    const userAchievementData = doc.data();
                    try {
                        const memberDoc = await this.db.collection('users').doc(userAchievementData.userId).get();
                        if (memberDoc.exists) {
                            const memberData = memberDoc.data();
                            return {
                                id: userAchievementData.userId,
                                name: `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim() || memberData.email,
                                email: memberData.email,
                                assignedAt: userAchievementData.assignedAt,
                                assignedBy: userAchievementData.assignedBy,
                                achievementHours: userAchievementData.achievementHours || 0
                            };
                        }
                    } catch (error) {
                        console.warn('Error obteniendo datos del miembro:', userAchievementData.userId, error);
                    }
                    return null;
                });

                achievementData.assignedMembers = (await Promise.all(memberPromises)).filter(member => member !== null);
            } else {
                // Fallback: usar datos del logro si no hay registros en user_achievements
                if (achievementData.assignedTo && achievementData.assignedTo.length > 0) {
                    const memberPromises = achievementData.assignedTo.map(async (memberId, index) => {
                        try {
                            const memberDoc = await this.db.collection('users').doc(memberId).get();
                            if (memberDoc.exists) {
                                const memberData = memberDoc.data();
                                return {
                                    id: memberId,
                                    name: `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim() || memberData.email,
                                    email: memberData.email,
                                    assignedAt: achievementData.assignedAt?.[index] || null,
                                    assignedBy: achievementData.assignedBy?.[index] || null,
                                    achievementHours: achievementData.hours || 0
                                };
                            }
                        } catch (error) {
                            console.warn('Error obteniendo datos del miembro:', memberId, error);
                        }
                        return null;
                    });

                    achievementData.assignedMembers = (await Promise.all(memberPromises)).filter(member => member !== null);
                } else {
                    achievementData.assignedMembers = [];
                }
            }

            // Debug log removed
            // Debug log removed
            return achievementData;
            
        } catch (error) {
            console.error('❌ Error getting achievement details:', error);
            throw error;
        }
    }

    // NUEVO: Obtener logros de un miembro específico
    async getMemberAchievements(memberId, voluntariadoId) {
        try {
            // Debug log removed
            
            const memberDoc = await this.db.collection('users').doc(memberId).get();
            if (!memberDoc.exists) {
                throw new Error('Usuario no encontrado');
            }

            const memberData = memberDoc.data();
            const volunteerData = memberData.voluntariados?.[voluntariadoId];
            
            if (!volunteerData || !volunteerData.achievements) {
                return [];
            }

            // Obtener detalles de cada logro
            const achievementPromises = volunteerData.achievements.map(async (achievementId) => {
                try {
                    const achievementDoc = await this.db.collection('logros').doc(achievementId).get();
                    if (achievementDoc.exists) {
                        const achievementData = achievementDoc.data();
                        achievementData.id = achievementId;
                        return achievementData;
                    }
                } catch (error) {
                    console.warn('Error obteniendo logro:', achievementId, error);
                }
                return null;
            });

            const achievements = (await Promise.all(achievementPromises)).filter(achievement => achievement !== null);
            // Debug log removed
            return achievements;
            
        } catch (error) {
            console.error('❌ Error getting member achievements:', error);
            throw error;
        }
    }

    // FUNCIÓN DE DEBUGGING: Ver todos los logros en Firestore
    async debugAllAchievements() {
        try {
            // Debug log removed
            
            const allAchievementsSnapshot = await this.db
                .collection('logros')
                .get();
            
            // Debug log removed
            
            allAchievementsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                console.log(`🏆 Logro: ${data.name || 'Sin nombre'}`, {
                    id: doc.id,
                    voluntariadoId: data.voluntariadoId,
                    isActive: data.isActive,
                    createdAt: data.createdAt ? data.createdAt.toDate() : 'Sin fecha',
                    createdBy: data.createdBy
                });
            });
            
            return allAchievementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('❌ Error en debugAllAchievements:', error);
            return [];
        }
    }
}

// Inicializar globalmente
window.adminManager = new AdminManager();

// Exponer función de debugging globalmente
window.debugAchievements = async function() {
    return await window.adminManager.debugAllAchievements();
};

// Función para verificar que AdminManager está funcionando
window.testAdminManager = function() {
    // Debug log removed
    // Debug log removed
    // Debug log removed
    // Debug log removed
    // Debug log removed
    // Debug log removed
    // Debug log removed
    return window.adminManager;
};

// Función específica para debugging del sistema de logros
window.debugAchievementSystem = async function() {
    // Debug log removed
    
    try {
        // 1. Verificar AdminManager
        // Debug log removed
        // Debug log removed
        // Debug log removed
        // Debug log removed
        // Debug log removed
        
        // 2. Verificar Firebase
        // Debug log removed
        // Debug log removed
        // Debug log removed
        // Debug log removed
        
        // 3. Ver todos los logros en Firestore
        // Debug log removed
        const allAchievements = await window.debugAchievements();
        // Debug log removed
        allAchievements.forEach(achievement => {
            console.log(`🏆 ${achievement.name} (${achievement.id})`, {
                voluntariadoId: achievement.voluntariadoId,
                hours: achievement.hours,
                isActive: achievement.isActive,
                assignedTo: achievement.assignedTo?.length || 0
            });
        });
        
        // 4. Ver user_achievements
        // Debug log removed
        const userAchievementsSnapshot = await window.firebaseDb
            .collection('user_achievements')
            .get();
        // Debug log removed
        userAchievementsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`👤 User Achievement: ${data.userId} -> ${data.achievementId}`, {
                voluntariadoId: data.voluntariadoId,
                hours: data.achievementHours,
                assignedAt: data.assignedAt
            });
        });
        
        // Debug log removed
        
    } catch (error) {
        console.error('❌ Error en debugging del sistema de logros:', error);
    }
};
