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
        this.currentUser = window.firebaseAuth.currentUser;
        console.log('👑 AdminManager inicializado');
    }

    // Verificar si el usuario actual es admin de algún voluntariado
    async isUserAdmin(voluntariadoId = null) {
        if (!this.db || !this.currentUser) return false;

        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.data();
            
            if (!userData) return false;

            // Si se especifica un voluntariado, verificar solo ese
            if (voluntariadoId) {
                const voluntariadoDoc = await this.db.collection('voluntariados').doc(voluntariadoId).get();
                if (voluntariadoDoc.exists) {
                    const adminUids = voluntariadoDoc.data().adminUids || [];
                    return adminUids.includes(this.currentUser.uid);
                }
                return false;
            }

            // Verificar si es admin global
            if (userData.role === 'admin') {
                return true;
            }

            // Verificar si es admin de algún voluntariado
            const voluntariadosSnapshot = await this.db.collection('voluntariados').get();
            for (const doc of voluntariadosSnapshot.docs) {
                const adminUids = doc.data().adminUids || [];
                if (adminUids.includes(this.currentUser.uid)) {
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
        if (!this.db || !this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Verificar que el usuario es admin del voluntariado
            const isAdmin = await this.isUserAdmin(voluntariadoId);
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
}

// Inicializar globalmente
window.adminManager = new AdminManager();
