// Script de ayuda para debugging y verificación del sistema

// Función para verificar el estado de Firebase
window.checkFirebaseStatus = function() {
    console.log('=== ESTADO DE FIREBASE ===');
    console.log('Firebase App:', window.firebaseApp ? '✅ Inicializado' : '❌ No inicializado');
    console.log('Firebase Auth:', window.firebaseAuth ? '✅ Inicializado' : '❌ No inicializado');
    console.log('Firebase DB:', window.firebaseDb ? '✅ Inicializado' : '❌ No inicializado');
    console.log('Usuario actual:', window.firebaseAuth?.currentUser ? 
        `✅ ${window.firebaseAuth.currentUser.email}` : '❌ No autenticado');
    console.log('=======================');
};

// Función para verificar el estado de los managers
window.checkManagersStatus = function() {
    console.log('=== ESTADO DE LOS MANAGERS ===');
    console.log('AuthManager:', window.authManager ? '✅ Inicializado' : '❌ No inicializado');
    console.log('VoluntariadosManager:', window.voluntariadosManager ? '✅ Inicializado' : '❌ No inicializado');
    console.log('AdminManager:', window.adminManager ? '✅ Inicializado' : '❌ No inicializado');
    console.log('AdminSetup:', window.adminSetup ? '✅ Inicializado' : '❌ No inicializado');
    console.log('============================');
};

// Función para verificar elementos del DOM
window.checkDOMElements = function() {
    console.log('=== ELEMENTOS DEL DOM ===');
    const elements = [
        'user-voluntariados-container',
        'voluntariados-spinner',
        'admin-link',
        'user-name-display',
        'user-email-display'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '✅ Encontrado' : '❌ No encontrado');
    });
    console.log('========================');
};

// Función para probar la conexión a Firestore
window.testFirestoreConnection = async function() {
    console.log('=== PRUEBA DE CONEXIÓN FIRESTORE ===');
    
    if (!window.firebaseDb) {
        console.log('❌ Firebase DB no está inicializado');
        return;
    }
    
    try {
        // Probar lectura de voluntariados
        const voluntariadosSnapshot = await window.firebaseDb.collection('voluntariados').limit(1).get();
        console.log('✅ Conexión a Firestore exitosa');
        console.log(`📊 Voluntariados encontrados: ${voluntariadosSnapshot.size}`);
        
        if (voluntariadosSnapshot.size > 0) {
            const voluntariado = voluntariadosSnapshot.docs[0];
            console.log('📋 Primer voluntariado:', voluntariado.data().name);
        }
        
    } catch (error) {
        console.log('❌ Error de conexión a Firestore:', error.message);
    }
    
    console.log('===================================');
};

// Función para probar la autenticación
window.testAuthentication = function() {
    console.log('=== PRUEBA DE AUTENTICACIÓN ===');
    
    if (!window.firebaseAuth) {
        console.log('❌ Firebase Auth no está inicializado');
        return;
    }
    
    const user = window.firebaseAuth.currentUser;
    if (user) {
        console.log('✅ Usuario autenticado:', user.email);
        console.log('🆔 UID:', user.uid);
        console.log('📧 Email verificado:', user.emailVerified);
        console.log('🕒 Último login:', user.metadata.lastSignInTime);
    } else {
        console.log('❌ Usuario no autenticado');
    }
    
    console.log('==============================');
};

// Función para probar la carga de voluntariados
window.testLoadVoluntariados = async function() {
    console.log('=== PRUEBA DE CARGA DE VOLUNTARIADOS ===');
    
    if (!window.voluntariadosManager) {
        console.log('❌ VoluntariadosManager no está inicializado');
        return;
    }
    
    try {
        const voluntariados = await window.voluntariadosManager.getAllVoluntariados();
        console.log('✅ Voluntariados cargados exitosamente');
        console.log(`📊 Total de voluntariados: ${voluntariados.length}`);
        
        voluntariados.forEach((vol, index) => {
            console.log(`${index + 1}. ${vol.name} (${vol.code})`);
        });
        
    } catch (error) {
        console.log('❌ Error cargando voluntariados:', error.message);
    }
    
    console.log('======================================');
};

// Función para probar la carga de datos del usuario
window.testLoadUserData = async function() {
    console.log('=== PRUEBA DE CARGA DE DATOS DEL USUARIO ===');
    
    if (!window.authManager) {
        console.log('❌ AuthManager no está inicializado');
        return;
    }
    
    const user = window.firebaseAuth?.currentUser;
    if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
    }
    
    try {
        const userData = await window.authManager.getUserData(user.uid);
        console.log('✅ Datos del usuario cargados exitosamente');
        console.log('👤 Datos:', userData);
        
        if (userData.voluntariados) {
            const voluntariadoIds = Object.keys(userData.voluntariados);
            console.log(`📊 Voluntariados del usuario: ${voluntariadoIds.length}`);
            voluntariadoIds.forEach(id => {
                console.log(`- ${id}: ${userData.voluntariados[id].status}`);
            });
        }
        
    } catch (error) {
        console.log('❌ Error cargando datos del usuario:', error.message);
    }
    
    console.log('==========================================');
};

// Función para ejecutar todas las pruebas
window.runAllTests = async function() {
    console.log('🚀 EJECUTANDO TODAS LAS PRUEBAS...');
    console.log('');
    
    checkFirebaseStatus();
    console.log('');
    
    checkManagersStatus();
    console.log('');
    
    checkDOMElements();
    console.log('');
    
    await testFirestoreConnection();
    console.log('');
    
    testAuthentication();
    console.log('');
    
    await testLoadVoluntariados();
    console.log('');
    
    await testLoadUserData();
    console.log('');
    
    console.log('✅ PRUEBAS COMPLETADAS');
};

// Mostrar mensaje de ayuda al cargar
console.log(`
🔧 SCRIPT DE DEBUGGING CARGADO

Funciones disponibles:
- checkFirebaseStatus() - Verificar estado de Firebase
- checkManagersStatus() - Verificar estado de los managers
- checkDOMElements() - Verificar elementos del DOM
- testFirestoreConnection() - Probar conexión a Firestore
- testAuthentication() - Probar autenticación
- testLoadVoluntariados() - Probar carga de voluntariados
- testLoadUserData() - Probar carga de datos del usuario
- runAllTests() - Ejecutar todas las pruebas

Ejemplo de uso:
runAllTests()
`);
