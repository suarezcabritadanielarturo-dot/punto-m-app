import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithRedirect, 
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged 
} from './firebase';

const ADMIN_EMAIL = "suarez.cabrita.daniel.arturo@gmail.com";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((err) => {
        setErrorMsg("Error al autenticar con Google: " + err.message);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setErrorMsg("No se pudo conectar con Google: " + err.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password) {
      setErrorMsg("Por favor completa todos los campos.");
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setErrorMsg("No existe una cuenta registrada con este correo.");
          break;
        case 'auth/wrong-password':
          setErrorMsg("Contraseña incorrecta.");
          break;
        case 'auth/email-already-in-use':
          setErrorMsg("El correo ya está registrado. Intenta iniciar sesión.");
          break;
        case 'auth/weak-password':
          setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
          break;
        case 'auth/invalid-email':
          setErrorMsg("Formato de correo electrónico no válido.");
          break;
        default:
          setErrorMsg("Error: " + err.message);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMsg("Ingresa tu correo en el campo superior para enviarte el enlace de recuperación.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMsg("Se ha enviado un enlace de recuperación a tu correo.");
      setErrorMsg('');
    } catch (err) {
      setErrorMsg("Error al enviar el correo: " + err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p>Cargando PUNTO M...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', fontFamily: 'sans-serif', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
        <h1 style={{ textAlign: 'center', color: '#0f172a', marginBottom: '8px' }}>PUNTO M</h1>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          {isRegistering ? "Crea tu cuenta para acceder" : "Ingresa para explorar el catálogo"}
        </p>

        {errorMsg && <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{errorMsg}</div>}
        {infoMsg && <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{infoMsg}</div>}

        <button 
          onClick={handleGoogleLogin} 
          style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '16px' }}
        >
          Continuar con Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
          <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
          <span style={{ padding: '0 8px', color: '#94a3b8', fontSize: '12px' }}>O CON TU CORREO</span>
          <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
        </div>

        <form onSubmit={handleEmailAuth}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Correo electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="tu@correo.com"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}
          >
            {isRegistering ? "Registrarse" : "Iniciar Sesión"}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px' }}>
          {!isRegistering && (
            <button 
              type="button"
              onClick={handleResetPassword} 
              style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', display: 'block', margin: '0 auto 12px' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); setInfoMsg(''); }} 
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>PUNTO M</h1>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Bienvenido, {user.email}</span>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </header>

      {isAdmin && (
        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
          <strong style={{ color: '#0f172a' }}>Panel de Administración Exclusivo</strong>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>Acceso concedido a {ADMIN_EMAIL}. Puedes gestionar productos y controlar pedidos en Soles (S/).</p>
        </div>
      )}

      <main>
        <h2>Catálogo de Productos</h2>
        <p style={{ color: '#64748b' }}>Precios mostrados en Soles (S/).</p>
        
        <div style={{ border: '1px dashed #cbd5e1', padding: '30px', textAlign: 'center', color: '#94a3b8', borderRadius: '8px' }}>
          Los productos agregados se mostrarán aquí.
        </div>
      </main>
    </div>
  );
}
