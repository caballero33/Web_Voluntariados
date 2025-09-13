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
                console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
            });
        }
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await this.saveUserData(user.uid, userData);
            
            this.showMessage('¡Registro exitoso! Bienvenido a Voluntariados.', 'success');
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
                ...userData,
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
