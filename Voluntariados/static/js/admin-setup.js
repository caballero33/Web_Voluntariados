// Script para configurar administradores de voluntariados
// Ejecutar desde la consola del navegador

class AdminSetup {
    constructor() {
        this.db = null;
        this.auth = null;
        this.init();
    }

    init() {
        // Esperar a que Firebase esté listo
        if (window.firebaseDb && window.firebaseAuth) {
            this.setupFirebase();
        } else {
            window.addEventListener('firebaseReady', () => {
                this.setupFirebase();
            });
        }
    }

    setupFirebase() {
        this.db = window.firebaseDb;
        this.auth = window.firebaseAuth;
        console.log('🔧 AdminSetup inicializado correctamente');
    }

    // Función para asignar administrador a un voluntariado específico
    async assignAdminToVoluntariado(voluntariadoId, adminEmail) {
        console.log(`🔧 Asignando administrador ${adminEmail} al voluntariado ${voluntariadoId}`);
        
        if (!this.db) {
            throw new Error('Firebase no está inicializado. Espera un momento y vuelve a intentar.');
        }
        
        try {
            // Buscar usuario por email
            const usersSnapshot = await this.db.collection('users')
                .where('email', '==', adminEmail)
                .limit(1)
                .get();

            if (usersSnapshot.empty) {
                throw new Error(`No se encontró usuario con email: ${adminEmail}`);
            }

            const adminUser = usersSnapshot.docs[0];
            const adminUid = adminUser.id;
            const adminData = adminUser.data();

            console.log(`👤 Usuario encontrado: ${adminData.firstName} ${adminData.lastName}`);

            // Verificar que el voluntariado existe
            const voluntariadoDoc = await this.db.collection('voluntariados').doc(voluntariadoId).get();
            if (!voluntariadoDoc.exists) {
                throw new Error(`Voluntariado no encontrado: ${voluntariadoId}`);
            }

            const voluntariadoData = voluntariadoDoc.data();
            console.log(`🏢 Voluntariado encontrado: ${voluntariadoData.name}`);

            // Verificar que el usuario ya pertenece al voluntariado
            const userVoluntariados = adminData.voluntariados || {};
            if (!userVoluntariados[voluntariadoId]) {
                console.log(`⚠️ El usuario no pertenece al voluntariado. Agregando primero...`);
                
                // Agregar usuario al voluntariado
                userVoluntariados[voluntariadoId] = {
                    status: 'activo',
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    eventsCompleted: 0,
                    totalHours: 0
                };

                await this.db.collection('users').doc(adminUid).update({
                    voluntariados: userVoluntariados
                });

                // Incrementar contador de miembros
                await this.db.collection('voluntariados').doc(voluntariadoId).update({
                    memberCount: firebase.firestore.FieldValue.increment(1)
                });

                console.log(`✅ Usuario agregado al voluntariado`);
            }

            // Obtener lista actual de administradores
            const currentAdminUids = voluntariadoData.adminUids || [];
            
            if (currentAdminUids.includes(adminUid)) {
                console.log(`⚠️ El usuario ya es administrador de este voluntariado`);
                return;
            }

            // Agregar a la lista de administradores
            currentAdminUids.push(adminUid);
            
            // Actualizar voluntariado con nuevo admin
            await this.db.collection('voluntariados').doc(voluntariadoId).update({
                adminUids: currentAdminUids,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Actualizar usuario para marcarlo como admin
            await this.db.collection('users').doc(adminUid).update({
                isAdmin: true,
                adminVoluntariados: firebase.firestore.FieldValue.arrayUnion(voluntariadoId),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Administrador asignado exitosamente!`);
            console.log(`👑 ${adminData.firstName} ${adminData.lastName} es ahora administrador de ${voluntariadoData.name}`);
            
            return {
                success: true,
                message: `Usuario ${adminEmail} asignado como administrador de ${voluntariadoData.name}`,
                adminUid: adminUid,
                voluntariadoId: voluntariadoId
            };

        } catch (error) {
            console.error(`❌ Error asignando administrador:`, error);
            throw error;
        }
    }

    // Función para listar todos los voluntariados
    async listVoluntariados() {
        console.log('📋 Listando todos los voluntariados...');
        
        if (!this.db) {
            throw new Error('Firebase no está inicializado. Espera un momento y vuelve a intentar.');
        }
        
        try {
            const voluntariadosSnapshot = await this.db.collection('voluntariados').get();
            
            if (voluntariadosSnapshot.empty) {
                console.log('No hay voluntariados registrados');
                return [];
            }

            const voluntariados = voluntariadosSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    code: data.code,
                    category: data.category,
                    adminCount: (data.adminUids || []).length,
                    memberCount: data.memberCount || 0
                };
            });

            console.table(voluntariados);
            return voluntariados;

        } catch (error) {
            console.error('❌ Error listando voluntariados:', error);
            throw error;
        }
    }

    // Función para listar administradores de un voluntariado
    async listAdmins(voluntariadoId) {
        console.log(`👑 Listando administradores del voluntariado: ${voluntariadoId}`);
        
        if (!this.db) {
            throw new Error('Firebase no está inicializado. Espera un momento y vuelve a intentar.');
        }
        
        try {
            const voluntariadoDoc = await this.db.collection('voluntariados').doc(voluntariadoId).get();
            
            if (!voluntariadoDoc.exists) {
                throw new Error(`Voluntariado no encontrado: ${voluntariadoId}`);
            }

            const voluntariadoData = voluntariadoDoc.data();
            const adminUids = voluntariadoData.adminUids || [];
            
            if (adminUids.length === 0) {
                console.log('No hay administradores asignados a este voluntariado');
                return [];
            }

            const admins = [];
            for (const adminUid of adminUids) {
                const adminDoc = await this.db.collection('users').doc(adminUid).get();
                if (adminDoc.exists) {
                    const adminData = adminDoc.data();
                    admins.push({
                        uid: adminUid,
                        name: `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim(),
                        email: adminData.email,
                        joinedAt: adminData.createdAt ? adminData.createdAt.toDate().toLocaleDateString() : 'N/A'
                    });
                }
            }

            console.table(admins);
            return admins;

        } catch (error) {
            console.error('❌ Error listando administradores:', error);
            throw error;
        }
    }

    // Función para remover administrador de un voluntariado
    async removeAdminFromVoluntariado(voluntariadoId, adminEmail) {
        console.log(`🗑️ Removiendo administrador ${adminEmail} del voluntariado ${voluntariadoId}`);
        
        if (!this.db) {
            throw new Error('Firebase no está inicializado. Espera un momento y vuelve a intentar.');
        }
        
        try {
            // Buscar usuario por email
            const usersSnapshot = await this.db.collection('users')
                .where('email', '==', adminEmail)
                .limit(1)
                .get();

            if (usersSnapshot.empty) {
                throw new Error(`No se encontró usuario con email: ${adminEmail}`);
            }

            const adminUid = usersSnapshot.docs[0].id;

            // Obtener voluntariado
            const voluntariadoDoc = await this.db.collection('voluntariados').doc(voluntariadoId).get();
            if (!voluntariadoDoc.exists) {
                throw new Error(`Voluntariado no encontrado: ${voluntariadoId}`);
            }

            const voluntariadoData = voluntariadoDoc.data();
            const currentAdminUids = voluntariadoData.adminUids || [];
            
            if (!currentAdminUids.includes(adminUid)) {
                throw new Error(`El usuario no es administrador de este voluntariado`);
            }

            // Remover de la lista de administradores
            const updatedAdminUids = currentAdminUids.filter(uid => uid !== adminUid);
            
            // Actualizar voluntariado
            await this.db.collection('voluntariados').doc(voluntariadoId).update({
                adminUids: updatedAdminUids,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Actualizar usuario
            await this.db.collection('users').doc(adminUid).update({
                adminVoluntariados: firebase.firestore.FieldValue.arrayRemove(voluntariadoId),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Administrador removido exitosamente!`);
            
            return {
                success: true,
                message: `Usuario ${adminEmail} removido como administrador`
            };

        } catch (error) {
            console.error(`❌ Error removiendo administrador:`, error);
            throw error;
        }
    }
}

// Crear instancia global
window.adminSetup = new AdminSetup();

// Funciones de conveniencia para usar desde la consola
window.assignAdmin = async (voluntariadoId, adminEmail) => {
    return await window.adminSetup.assignAdminToVoluntariado(voluntariadoId, adminEmail);
};

window.listVoluntariados = async () => {
    return await window.adminSetup.listVoluntariados();
};

window.listAdmins = async (voluntariadoId) => {
    return await window.adminSetup.listAdmins(voluntariadoId);
};

window.removeAdmin = async (voluntariadoId, adminEmail) => {
    return await window.adminSetup.removeAdminFromVoluntariado(voluntariadoId, adminEmail);
};

console.log(`
🎯 SISTEMA DE CONFIGURACIÓN DE ADMINISTRADORES

Funciones disponibles:
- assignAdmin(voluntariadoId, adminEmail) - Asignar administrador
- listVoluntariados() - Listar todos los voluntariados
- listAdmins(voluntariadoId) - Listar administradores de un voluntariado
- removeAdmin(voluntariadoId, adminEmail) - Remover administrador

Ejemplo de uso:
assignAdmin('voluntariado_id', 'admin@ejemplo.com')
`);
