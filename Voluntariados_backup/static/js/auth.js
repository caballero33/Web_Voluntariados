// Firebase Authentication Functions

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isReady = false;
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        if (window.firebaseAuth) {
            this.setupAuthStateListener();
        } else {
            // Listen for Firebase ready event
            window.addEventListener('firebaseReady', () => {
                this.setupAuthStateListener();
            });
        }
    }

    setupAuthStateListener() {
        if (window.firebaseAuth) {
            window.firebaseAuth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateUI(user);
                this.isReady = true;
                // Auth state changed
            });
        }
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await this.saveUserData(user.uid, userData);
            
            // Register user in Django system with inactive status
            await this.registerUserInDjango(user.uid, email, userData);
            
            this.showMessage('¡Registro exitoso! Tu cuenta está pendiente de activación.', 'success');
            return user;
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Check user status in Django system
            await this.checkUserStatus(user.uid);
            
            this.showMessage('¡Bienvenido de nuevo!', 'success');
            return user;
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    async signOut() {
        try {
            await window.firebaseAuth.signOut();
            this.showMessage('Has cerrado sesión correctamente.', 'info');
            window.location.href = '/';
        } catch (error) {
            this.showMessage('Error al cerrar sesión.', 'error');
        }
    }

    async saveUserData(uid, userData) {
        try {
            await window.firebaseDb.collection('users').doc(uid).set({
                email: userData.email || '',
                firstName: userData.nombre || userData.firstName || '',
                lastName: userData.apellido || userData.lastName || '',
                fullName: `${userData.nombre || userData.firstName || ''} ${userData.apellido || userData.lastName || ''}`.trim(),
                phone: userData.phone || userData.telefono || '',
                estado: userData.estado || 'inactivo',
                rol: userData.rol || 'usuario',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    async getUserData(uid) {
        try {
            const docSnap = await window.firebaseDb.collection('users').doc(uid).get();
            
            if (docSnap.exists) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    updateUI(user) {
        const loginButton = document.querySelector('#login-btn');
        const registerButton = document.querySelector('#register-btn');
        const userMenu = document.querySelector('#user-menu');
        
        if (user) {
            // User is signed in
            if (loginButton) loginButton.style.display = 'none';
            if (registerButton) registerButton.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'block';
                const userName = userMenu.querySelector('#user-name');
                if (userName) userName.textContent = user.email;
            }
        } else {
            // User is signed out
            if (loginButton) loginButton.style.display = 'block';
            if (registerButton) registerButton.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    showMessage(message, type) {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification is-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}`;
        notification.innerHTML = `
            <button class="delete"></button>
            ${message}
        `;
        
        // Add to page
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(notification, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Add click to close
        notification.querySelector('.delete').onclick = () => {
            notification.remove();
        };
    }

    async registerUserInDjango(uid, email, userData) {
        try {
            // Guardar usuario en Firebase con estado inactivo por defecto
            await window.firebaseDb.collection('users').doc(uid).set({
                email: email,
                firstName: userData.nombre || userData.firstName || '',
                lastName: userData.apellido || userData.lastName || '',
                fullName: `${userData.nombre || userData.firstName || ''} ${userData.apellido || userData.lastName || ''}`.trim(),
                phone: userData.phone || userData.telefono || '',
                estado: 'inactivo',  // Estado inicial inactivo
                rol: 'usuario',      // Rol por defecto
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, message: 'Usuario registrado exitosamente' };
            
        } catch (error) {
            console.error('❌ Error al registrar usuario en Firebase:', error);
            return { success: false, message: error.message };
        }
    }

    async checkUserStatus(uid) {
        try {
            // Debug log removed
            
            // Obtener datos del usuario desde Firebase
            const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const user = {
                    id: userDoc.id,
                    firebase_uid: userDoc.id,
                    email: userData.email || '',
                    nombre: userData.nombre || '',
                    apellido: userData.apellido || '',
                    estado: userData.estado || 'inactivo',
                    rol: userData.rol || 'usuario',
                    can_access: (userData.estado || 'inactivo') === 'activo'
                };
                
                // Debug log removed
                
                // Si el usuario no está activo, redirigir a página de estado inactivo
                if (!user.can_access) {
                    window.location.href = '/auth/inactive-user/';
                    return false;
                }
                
                // Si es admin, permitir acceso al panel de administración
                if (user.rol === 'admin') {
                    // Debug log removed
                }
                
                return user;
            } else {
                console.warn('⚠️ Usuario no encontrado en Firebase');
                // Si el usuario no está en Firebase, redirigir a registro
                return null;
            }
        } catch (error) {
            console.error('❌ Error al verificar estado del usuario en Firebase:', error);
            return null;
        }
    }

    async updateUserStatus(targetUid, newStatus, newRole = null) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('No hay usuario autenticado');
            }
            
            // Debug log removed
            
            // Verificar que el usuario actual es administrador
            const currentUserDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
            if (!currentUserDoc.exists || currentUserDoc.data().rol !== 'admin') {
                throw new Error('No tienes permisos de administrador');
            }
            
            // Actualizar el usuario en Firebase
            const updateData = {};
            if (newStatus) {
                updateData.estado = newStatus;
            }
            if (newRole) {
                updateData.rol = newRole;
            }
            updateData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            await window.firebaseDb.collection('users').doc(targetUid).update(updateData);
            
            // Debug log removed
            this.showMessage('Estado actualizado exitosamente', 'success');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error al actualizar estado en Firebase:', error);
            this.showMessage('Error al actualizar estado del usuario: ' + error.message, 'error');
            return { success: false, message: error.message };
        }
    }

    async getAllUsers() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('No hay usuario autenticado');
            }
            
            // Debug log removed
            
            // Obtener usuarios desde la colección 'users' en Firestore
            const usersSnapshot = await window.firebaseDb.collection('users').get();
            
            const users = [];
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    firebase_uid: doc.id,
                    email: userData.email || '',
                    nombre: userData.nombre || '',
                    apellido: userData.apellido || '',
                    estado: userData.estado || 'inactivo',
                    rol: userData.rol || 'usuario',
                    fecha_registro: userData.createdAt ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
                    fecha_ultima_actividad: userData.lastLogin ? userData.lastLogin.toDate().toISOString() : new Date().toISOString(),
                    voluntariados: userData.voluntariados || []
                });
            });
            
            // Debug log removed
            return users;
            
        } catch (error) {
            console.error('❌ Error al obtener usuarios desde Firebase:', error);
            this.showMessage('Error al obtener lista de usuarios desde Firebase', 'error');
            return [];
        }
    }

    getErrorMessage(errorCode) {
        const messages = {
            'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
            'auth/invalid-email': 'El formato del correo electrónico no es válido.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
            'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
            'auth/wrong-password': 'La contraseña es incorrecta.',
            'auth/invalid-credential': 'Las credenciales son incorrectas.',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet.'
        };
        
        return messages[errorCode] || 'Ha ocurrido un error inesperado.';
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Export for global use
window.authManager = authManager;
