// Sistema de gestión de voluntariados

class VoluntariadosManager {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.voluntariados = [];
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
        console.log('🎯 VoluntariadosManager inicializado');
    }

    // Obtener todos los voluntariados
    async getAllVoluntariados() {
        if (!this.db) return [];

        try {
            const snapshot = await this.db.collection('voluntariados').get();
            this.voluntariados = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return this.voluntariados;
        } catch (error) {
            console.error('❌ Error obteniendo voluntariados:', error);
            return [];
        }
    }

    // Unirse a un voluntariado usando código
    async joinVoluntariadoByCode(code) {
        if (!this.db) {
            throw new Error('Firestore no está inicializado');
        }

        // Obtener el usuario actual en tiempo real
        const currentUser = window.firebaseAuth.currentUser;
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Buscar voluntariado por código
            const voluntariadosSnapshot = await this.db.collection('voluntariados')
                .where('code', '==', code.toUpperCase())
                .limit(1)
                .get();

            if (voluntariadosSnapshot.empty) {
                throw new Error('Código de voluntariado no válido');
            }

            const voluntariadoDoc = voluntariadosSnapshot.docs[0];
            const voluntariado = { id: voluntariadoDoc.id, ...voluntariadoDoc.data() };

            // Verificar si el voluntariado está activo
            if (!voluntariado.active) {
                throw new Error('Este voluntariado no está activo actualmente');
            }

            // Verificar si ya es miembro
            const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            const userVoluntariados = userData.voluntariados || {};

            if (userVoluntariados[voluntariado.id]) {
                throw new Error('Ya eres miembro de este voluntariado');
            }

            // Verificar límite de miembros
            if (voluntariado.memberCount >= voluntariado.maxMembers) {
                throw new Error('Este voluntariado ha alcanzado su límite de miembros');
            }

            // Agregar usuario al voluntariado
            await this.db.collection('users').doc(currentUser.uid).set({
                ...userData,
                voluntariados: {
                    ...userVoluntariados,
                    [voluntariado.id]: {
                        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'activo',
                        totalHours: 0,
                        eventsCompleted: 0
                    }
                }
            }, { merge: true });

            // Actualizar contador de miembros
            await this.db.collection('voluntariados').doc(voluntariado.id).update({
                memberCount: firebase.firestore.FieldValue.increment(1)
            });

            // Verificar y otorgar logro "Primer Voluntariado"
            await this.checkAndAwardAchievement('primer_voluntariado', {
                voluntariadoId: voluntariado.id
            });

            return {
                success: true,
                message: `¡Bienvenido a ${voluntariado.name}!`,
                voluntariado: voluntariado
            };

        } catch (error) {
            console.error('❌ Error uniéndose al voluntariado:', error);
            throw error;
        }
    }

    // Abandonar un voluntariado
    async leaveVoluntariado(voluntariadoId) {
        if (!this.db) {
            throw new Error('Firestore no está inicializado');
        }

        const currentUser = window.firebaseAuth.currentUser;
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();
            const userVoluntariados = userData.voluntariados || {};

            if (!userVoluntariados[voluntariadoId]) {
                throw new Error('No eres miembro de este voluntariado');
            }

            // Remover usuario del voluntariado
            delete userVoluntariados[voluntariadoId];
            
            await this.db.collection('users').doc(currentUser.uid).update({
                voluntariados: userVoluntariados
            });

            // Actualizar contador de miembros
            await this.db.collection('voluntariados').doc(voluntariadoId).update({
                memberCount: firebase.firestore.FieldValue.increment(-1)
            });

            return {
                success: true,
                message: 'Has abandonado el voluntariado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error abandonando voluntariado:', error);
            throw error;
        }
    }

    // Verificar y otorgar logros
    async checkAndAwardAchievement(achievementId, context = {}) {
        if (!this.db) return;

        const currentUser = window.firebaseAuth.currentUser;
        if (!currentUser) return;

        try {
            // Verificar si ya tiene el logro
            const userAchievementsDoc = await this.db.collection('user_achievements')
                .doc(currentUser.uid).get();
            
            const userAchievements = userAchievementsDoc.exists ? 
                userAchievementsDoc.data().achievements || {} : {};

            if (userAchievements[achievementId]) {
                return; // Ya tiene el logro
            }

            // Obtener datos del logro
            const achievementDoc = await this.db.collection('logros').doc(achievementId).get();
            if (!achievementDoc.exists) {
                console.error(`❌ Logro ${achievementId} no encontrado`);
                return;
            }

            const achievement = achievementDoc.data();

            // Verificar condiciones del logro
            let shouldAward = false;

            switch (achievement.condition.type) {
                case 'join_volunteering':
                    shouldAward = true; // Ya se unió al voluntariado
                    break;
                case 'events_completed':
                    // Verificar eventos completados
                    const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
                    const userData = userDoc.data();
                    const voluntariados = userData.voluntariados || {};
                    
                    let totalEvents = 0;
                    Object.values(voluntariados).forEach(vol => {
                        totalEvents += vol.eventsCompleted || 0;
                    });
                    
                    shouldAward = totalEvents >= achievement.condition.count;
                    break;
                case 'hours_completed':
                    // Verificar horas completadas
                    const userDoc2 = await this.db.collection('users').doc(currentUser.uid).get();
                    const userData2 = userDoc2.data();
                    const voluntariados2 = userData2.voluntariados || {};
                    
                    let totalHours = 0;
                    Object.values(voluntariados2).forEach(vol => {
                        totalHours += vol.totalHours || 0;
                    });
                    
                    shouldAward = totalHours >= achievement.condition.hours;
                    break;
            }

            if (shouldAward) {
                // Otorgar logro
                await this.db.collection('user_achievements').doc(currentUser.uid).set({
                    achievements: {
                        ...userAchievements,
                        [achievementId]: {
                            earnedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            ...context
                        }
                    }
                }, { merge: true });

                console.log(`🏆 Logro otorgado: ${achievement.name}`);
                
                // Mostrar notificación
                this.showAchievementNotification(achievement);
            }

        } catch (error) {
            console.error('❌ Error verificando logro:', error);
        }
    }

    // Mostrar notificación de logro
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = `notification is-${achievement.color} achievement-notification`;
        notification.innerHTML = `
            <button class="delete"></button>
            <div class="media">
                <div class="media-left">
                    <span class="icon is-large">
                        <i class="${achievement.icon}"></i>
                    </span>
                </div>
                <div class="media-content">
                    <h4 class="title is-5">¡Logro Desbloqueado!</h4>
                    <h5 class="subtitle is-6">${achievement.name}</h5>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
        
        // Agregar estilos
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '400px';
        notification.style.animation = 'slideInRight 0.5s ease-out';
        
        document.body.appendChild(notification);
        
        // Auto remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.5s ease-in';
                setTimeout(() => notification.remove(), 500);
            }
        }, 5000);
        
        // Click para cerrar
        notification.querySelector('.delete').onclick = () => notification.remove();
    }

    // Obtener voluntariados del usuario
    async getUserVoluntariados() {
        if (!this.db) return [];

        const currentUser = window.firebaseAuth.currentUser;
        if (!currentUser) return [];

        try {
            const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();
            const userVoluntariados = userData.voluntariados || {};

            // Obtener datos completos de cada voluntariado
            const voluntariadosWithData = [];
            for (const [voluntariadoId, userVolData] of Object.entries(userVoluntariados)) {
                const voluntariadoDoc = await this.db.collection('voluntariados').doc(voluntariadoId).get();
                if (voluntariadoDoc.exists) {
                    voluntariadosWithData.push({
                        id: voluntariadoId,
                        ...voluntariadoDoc.data(),
                        userData: userVolData
                    });
                }
            }

            return voluntariadosWithData;
        } catch (error) {
            console.error('❌ Error obteniendo voluntariados del usuario:', error);
            return [];
        }
    }
}

// Inicializar globalmente
window.voluntariadosManager = new VoluntariadosManager();

// Función de debug para verificar el estado
window.debugAuth = function() {
    console.log('=== DEBUG AUTH ===');
    console.log('Firebase Auth:', window.firebaseAuth);
    console.log('Usuario actual:', window.firebaseAuth?.currentUser);
    console.log('Firebase DB:', window.firebaseDb);
    console.log('VoluntariadosManager:', window.voluntariadosManager);
    console.log('==================');
};
