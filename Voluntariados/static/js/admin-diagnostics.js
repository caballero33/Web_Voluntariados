// Sistema de diagnóstico y corrección para administradores
// Este archivo se carga automáticamente y corrige problemas de admin

class AdminDiagnostics {
    constructor() {
        this.db = null;
        this.auth = null;
        this.init();
    }

    init() {
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
        console.log('🔧 AdminDiagnostics inicializado');
        
        // Verificar admin automáticamente después de 2 segundos
        setTimeout(() => {
            this.autoFixAdminIssues();
        }, 2000);
    }

    async autoFixAdminIssues() {
        console.log('🔍 Verificando problemas de administrador...');
        
        const user = this.auth.currentUser;
        if (!user) {
            console.log('❌ Usuario no autenticado');
            return;
        }

        try {
            // 1. Verificar si es admin en Firestore
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            console.log('👤 Datos del usuario:', userData);
            console.log('👑 Es admin global:', userData?.isAdmin);
            console.log('🏢 Admin voluntariados:', userData?.adminVoluntariados);

            // 2. Verificar voluntariado actual
            const urlParams = new URLSearchParams(window.location.search);
            const currentVolunteerId = urlParams.get('id');
            
            if (currentVolunteerId) {
                const volunteerDoc = await this.db.collection('voluntariados').doc(currentVolunteerId).get();
                const volunteerData = volunteerDoc.data();
                const adminUids = volunteerData.adminUids || [];
                
                console.log('🏢 Voluntariado actual:', currentVolunteerId);
                console.log('👑 Admin UIDs del voluntariado:', adminUids);
                console.log('✅ Tu UID está en la lista:', adminUids.includes(user.uid));

                // 3. Si es admin, forzar mostrar elementos
                if (adminUids.includes(user.uid)) {
                    console.log('🎉 ¡Eres administrador! Forzando elementos...');
                    this.forceShowAdminElements();
                } else {
                    console.log('❌ No eres administrador de este voluntariado');
                }
            }

        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
        }
    }

    forceShowAdminElements() {
        console.log('🔧 Forzando visibilidad de elementos de admin...');
        
        // 1. Mostrar formulario de admin
        const adminForm = document.getElementById('admin-post-form');
        if (adminForm) {
            adminForm.style.display = 'block';
            console.log('✅ Formulario de admin mostrado');
        } else {
            console.log('❌ Formulario de admin no encontrado');
        }

        // 2. Establecer variables globales
        window.isAdmin = true;
        const urlParams = new URLSearchParams(window.location.search);
        window.currentVolunteerId = urlParams.get('id');
        
        console.log('✅ Variables globales establecidas');
        console.log('👑 isAdmin:', window.isAdmin);
        console.log('🏢 currentVolunteerId:', window.currentVolunteerId);

        // 3. Recargar datos si las funciones existen
        if (typeof loadPosts === 'function') {
            loadPosts();
            console.log('✅ Posts recargados');
        }
        
        if (typeof loadMembers === 'function') {
            loadMembers();
            console.log('✅ Miembros recargados');
        }

        // 4. Mostrar mensaje de éxito
        this.showMessage('¡Panel de administrador activado!', 'success');
    }

    async diagnosticAdmin() {
        console.log('=== DIAGNÓSTICO COMPLETO DE ADMIN ===');
        
        const user = this.auth.currentUser;
        if (!user) {
            console.log('❌ Usuario no autenticado');
            return;
        }

        console.log('👤 Usuario actual:', user.email);
        console.log('🆔 UID:', user.uid);
        
        try {
            // Verificar datos en Firestore
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            console.log('📊 Datos del usuario:', userData);
            console.log('👑 Es admin:', userData.isAdmin);
            console.log('🏢 Admin voluntariados:', userData.adminVoluntariados);
            
            // Verificar voluntariado actual
            const urlParams = new URLSearchParams(window.location.search);
            const currentVolunteerId = urlParams.get('id');
            
            if (currentVolunteerId) {
                const voluntariadoDoc = await this.db.collection('voluntariados').doc(currentVolunteerId).get();
                const voluntariadoData = voluntariadoDoc.data();
                console.log('🏢 Datos del voluntariado:', voluntariadoData);
                console.log('👑 Admin UIDs:', voluntariadoData.adminUids);
                console.log('✅ Tu UID está en la lista:', voluntariadoData.adminUids?.includes(user.uid));
            }
            
            // Verificar elementos del DOM
            const adminForm = document.getElementById('admin-post-form');
            console.log('📝 Formulario de admin encontrado:', adminForm ? 'Sí' : 'No');
            console.log('📝 Formulario visible:', adminForm ? adminForm.style.display : 'N/A');
            
            // Verificar AdminManager
            if (window.adminManager) {
                const isAdmin = await window.adminManager.isUserAdmin(currentVolunteerId);
                console.log('🔧 AdminManager dice que eres admin:', isAdmin);
            } else {
                console.log('❌ AdminManager no disponible');
            }
            
        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
        }
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification is-${type} is-light`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
            <button class="delete"></button>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        notification.querySelector('.delete').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
}

// Inicializar globalmente
window.adminDiagnostics = new AdminDiagnostics();

// Funciones globales para consola
window.diagnosticAdmin = () => window.adminDiagnostics.diagnosticAdmin();
window.forceShowAdminElements = () => window.adminDiagnostics.forceShowAdminElements();

// Función para verificar autenticación
window.checkAuth = () => {
    const user = window.firebaseAuth.currentUser;
    console.log('=== VERIFICACIÓN DE AUTENTICACIÓN ===');
    console.log('👤 Usuario actual:', user ? user.email : 'No autenticado');
    console.log('🆔 UID:', user ? user.uid : 'N/A');
    console.log('🔑 Firebase Auth:', !!window.firebaseAuth);
    console.log('🗄️ Firebase DB:', !!window.firebaseDb);
    console.log('👑 AdminManager:', !!window.adminManager);
    
    if (user) {
        console.log('✅ Usuario autenticado correctamente');
        return user;
    } else {
        console.log('❌ Usuario no autenticado');
        return null;
    }
};

// Función para diagnosticar eventos
window.diagnosticEvents = async () => {
    console.log('=== DIAGNÓSTICO DE EVENTOS ===');
    
    const user = window.firebaseAuth.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
    }

    try {
        // 1. Verificar voluntariado actual
        const urlParams = new URLSearchParams(window.location.search);
        const currentVolunteerId = urlParams.get('id');
        console.log('🏢 Voluntariado actual:', currentVolunteerId);

        // 2. Verificar eventos en Firestore
        const eventosSnapshot = await window.firebaseDb.collection('eventos').get();
        console.log('📅 Total de eventos en Firestore:', eventosSnapshot.size);
        
        eventosSnapshot.docs.forEach(doc => {
            const eventData = doc.data();
            console.log(`📅 Evento: ${eventData.title}`, {
                id: doc.id,
                voluntariadoId: eventData.voluntariadoId,
                status: eventData.status,
                eventDate: eventData.eventDate?.toDate?.() || eventData.eventDate,
                participants: eventData.participants?.length || 0,
                maxParticipants: eventData.maxParticipants
            });
        });

        // 3. Verificar eventos del voluntariado específico
        if (currentVolunteerId) {
            const volunteerEvents = eventosSnapshot.docs
                .filter(doc => doc.data().voluntariadoId === currentVolunteerId)
                .map(doc => ({ id: doc.id, ...doc.data() }));
            
            console.log(`📅 Eventos de ${currentVolunteerId}:`, volunteerEvents);

            // 4. Probar función getVolunteerEvents
            if (window.adminManager) {
                const adminEvents = await window.adminManager.getVolunteerEvents(currentVolunteerId);
                console.log('📅 Eventos desde AdminManager:', adminEvents);
            }
        }

        // 5. Verificar elementos del DOM
        const eventsList = document.getElementById('events-list');
        console.log('📅 Events list DOM:', eventsList ? 'Encontrado' : 'No encontrado');
        console.log('📅 Events list contenido:', eventsList?.innerHTML?.length || 0, 'caracteres');

    } catch (error) {
        console.error('❌ Error en diagnóstico de eventos:', error);
    }
};

// Función para forzar recargar eventos
window.forceReloadEvents = async () => {
    console.log('🔄 Forzando recarga de eventos...');
    
    if (typeof loadEvents === 'function') {
        await loadEvents();
        console.log('✅ Eventos recargados');
    } else {
        console.log('❌ Función loadEvents no encontrada');
    }
};

// Función para verificar y forzar mostrar Panel Admin
window.forceShowAdminPanel = async () => {
    console.log('🔄 Forzando visualización del Panel Admin...');
    
    const user = window.firebaseAuth.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
    }
    
    try {
        // Verificar datos del usuario
        const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        console.log('👤 Datos del usuario:', userData);
        
        if (userData && userData.adminVoluntariados && userData.adminVoluntariados.length > 0) {
            console.log('✅ Usuario es administrador de:', userData.adminVoluntariados);
            
            // Forzar mostrar el enlace
            const adminLink = document.getElementById('admin-link');
            if (adminLink) {
                adminLink.style.display = 'block';
                console.log('✅ Panel Admin mostrado forzadamente');
            } else {
                console.log('❌ Elemento admin-link no encontrado');
            }
        } else {
            console.log('❌ Usuario no es administrador');
            console.log('🔧 Para hacerte administrador, ejecuta:');
            console.log('   assignAdminByUID("' + user.uid + '", "pumas_verdes")');
        }
        
    } catch (error) {
        console.error('❌ Error verificando admin:', error);
    }
};

// Función para hacer admin por UID
window.assignAdminByUID = async (uid, voluntariadoId) => {
    try {
        console.log('🔄 Asignando administrador...');
        console.log('👤 UID:', uid);
        console.log('🏢 Voluntariado:', voluntariadoId);
        
        // Verificar que el usuario existe
        const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            console.error('❌ Usuario no encontrado en Firestore');
            return;
        }
        
        const userData = userDoc.data();
        console.log('👤 Usuario encontrado:', userData.fullName || userData.email);
        
        // Actualizar usuario
        await window.firebaseDb.collection('users').doc(uid).update({
            isAdmin: true,
            adminVoluntariados: window.firebase.firestore.FieldValue.arrayUnion(voluntariadoId)
        });
        console.log('✅ Usuario actualizado como admin');
        
        // Actualizar voluntariado
        const voluntariadoDoc = await window.firebaseDb.collection('voluntariados').doc(voluntariadoId).get();
        if (voluntariadoDoc.exists) {
            const currentAdmins = voluntariadoDoc.data().adminUids || [];
            console.log('👑 Admins actuales:', currentAdmins);
            
            if (!currentAdmins.includes(uid)) {
                await voluntariadoDoc.ref.update({
                    adminUids: window.firebase.firestore.FieldValue.arrayUnion(uid)
                });
                console.log('✅ UID agregado a adminUids del voluntariado');
            } else {
                console.log('⚠️ UID ya estaba en adminUids');
            }
        } else {
            console.error('❌ Voluntariado no encontrado');
            return;
        }
        
        console.log('🎉 ¡Administrador asignado exitosamente!');
        console.log('🔄 Recarga la página para ver los cambios');
        
    } catch (error) {
        console.error('❌ Error asignando administrador:', error);
    }
};

// Función específica para hacer admin en Patitas UNAH
window.makeAdminPatitasUNAH = async (uid) => {
    console.log('🐾 === ASIGNANDO ADMIN EN PATITAS UNAH ===');
    return await window.assignAdminByUID(uid, 'patitas_unah');
};

// Función para buscar usuario por email y hacerlo admin
window.makeAdminByEmail = async (email, voluntariadoId) => {
    try {
        console.log('🔍 Buscando usuario por email:', email);
        
        // Buscar usuario por email
        const usersSnapshot = await window.firebaseDb.collection('users')
            .where('email', '==', email)
            .get();
        
        if (usersSnapshot.empty) {
            console.error('❌ Usuario no encontrado con email:', email);
            return;
        }
        
        const userDoc = usersSnapshot.docs[0];
        const uid = userDoc.id;
        const userData = userDoc.data();
        
        console.log('👤 Usuario encontrado:', userData.fullName || userData.email);
        console.log('🆔 UID:', uid);
        
        // Asignar como admin
        await window.assignAdminByUID(uid, voluntariadoId);
        
    } catch (error) {
        console.error('❌ Error buscando usuario por email:', error);
    }
};

// Función específica para hacer admin en Patitas UNAH por email
window.makeAdminPatitasByEmail = async (email) => {
    console.log('🐾 === ASIGNANDO ADMIN EN PATITAS UNAH POR EMAIL ===');
    return await window.makeAdminByEmail(email, 'patitas_unah');
};

// Función para listar todos los usuarios y sus UIDs
window.listAllUsers = async () => {
    try {
        console.log('👥 === LISTANDO TODOS LOS USUARIOS ===');
        
        const usersSnapshot = await window.firebaseDb.collection('users').get();
        console.log('📊 Total de usuarios:', usersSnapshot.size);
        
        usersSnapshot.docs.forEach(doc => {
            const userData = doc.data();
            console.log(`👤 ${userData.fullName || userData.email}`, {
                uid: doc.id,
                email: userData.email,
                isAdmin: userData.isAdmin || false,
                adminVoluntariados: userData.adminVoluntariados || []
            });
        });
        
    } catch (error) {
        console.error('❌ Error listando usuarios:', error);
    }
};

// Función para verificar admins de un voluntariado específico
window.checkVolunteerAdmins = async (voluntariadoId) => {
    try {
        console.log(`👑 === ADMINS DE ${voluntariadoId.toUpperCase()} ===`);
        
        const voluntariadoDoc = await window.firebaseDb.collection('voluntariados').doc(voluntariadoId).get();
        if (!voluntariadoDoc.exists) {
            console.error('❌ Voluntariado no encontrado');
            return;
        }
        
        const voluntariadoData = voluntariadoDoc.data();
        const adminUids = voluntariadoData.adminUids || [];
        
        console.log('🏢 Voluntariado:', voluntariadoData.name);
        console.log('👑 Admin UIDs:', adminUids);
        
        // Obtener detalles de cada admin
        for (const uid of adminUids) {
            const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log(`👤 Admin: ${userData.fullName || userData.email} (${uid})`);
            } else {
                console.log(`❌ Admin no encontrado: ${uid}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error verificando admins:', error);
    }
};
