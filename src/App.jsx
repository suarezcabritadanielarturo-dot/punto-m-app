import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';

const ADMIN_EMAIL = 'suarez.cabrita.daniel.arturo@gmail.com';

const CATALOGO_INICIAL = [
  { id: 1, nombre: 'Producto A', precio: 25.00, categoria: 'Categoría 1' },
  { id: 2, nombre: 'Producto B', precio: 45.50, categoria: 'Categoría 1' },
  { id: 3, nombre: 'Producto C', precio: 12.00, categoria: 'Categoría 2' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [catalogo, setCatalogo] = useState(CATALOGO_INICIAL);
  const [carrito, setCarrito] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState([]);
  const [vistaAdmin, setVistaAdmin] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(currentUser.email === ADMIN_EMAIL);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const estaBloqueado = user && usuariosBloqueados.includes(user.email);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  const calcularTotal = () => {
    return carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0).toFixed(2);
  };

  const realizarPedido = () => {
    if (carrito.length === 0) return;

    const nuevoPedido = {
      id: Date.now(),
      cliente: user.displayName || user.email,
      email: user.email,
      items: [...carrito],
      total: calcularTotal(),
      estado: 'Pendiente',
      fecha: new Date().toLocaleString(),
    };

    setPedidos([nuevoPedido, ...pedidos]);
    setSolicitudEnviada(nuevoPedido);
    setCarrito([]);
  };

  const enviarWhatsApp = (pedido) => {
    let mensaje = "*NUEVO PEDIDO - PUNTO M*\n";
    mensaje += "*Cliente:* " + pedido.cliente + "\n";
    mensaje += "*Correo:* " + pedido.email + "\n";
    mensaje += "*Fecha:* " + pedido.fecha + "\n\n";
    mensaje += "*LISTA DE PRODUCTOS:*\n";

    pedido.items.forEach((item) => {
      mensaje += "• " + item.nombre + " x" + item.cantidad + " - S/ " + (item.precio * item.cantidad).toFixed(2) + "\n";
    });

    mensaje += "\n*PRECIO TOTAL APROXIMADO: S/ " + pedido.total + "*\n\n";
    mensaje += "*DATOS PARA PAGO:*\n";
    mensaje += "• Yape / Plin: 999-999-999\n";
    mensaje += "• Transferencia BCP: 123-4567890-0-99\n";
    mensaje += "*Titular:* PUNTO M S.A.C.";

    const url = "https://wa.me/?text=" + encodeURIComponent(mensaje);
    window.open(url, '_blank');
  };

  const guardarProducto = (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoPrecio) return;

    if (productoEditando) {
      setCatalogo(catalogo.map(p => p.id === productoEditando.id ? {
        ...p,
        nombre: nuevoNombre,
        precio: parseFloat(nuevoPrecio),
        categoria: nuevaCategoria || 'General'
      } : p));
      setProductoEditando(null);
    } else {
      const nuevoProd = {
        id: Date.now(),
        nombre: nuevoNombre,
        precio: parseFloat(nuevoPrecio),
        categoria: nuevaCategoria || 'General'
      };
      setCatalogo([...catalogo, nuevoProd]);
    }

    setNuevoNombre('');
    setNuevoPrecio('');
    setNuevaCategoria('');
  };

  const iniciarEdicion = (prod) => {
    setProductoEditando(prod);
    setNuevoNombre(prod.nombre);
    setNuevoPrecio(prod.precio);
    setNuevaCategoria(prod.categoria);
  };

  const eliminarProductoCatalogo = (id) => {
    setCatalogo(catalogo.filter(p => p.id !== id));
  };

  const marcarComoPagado = (id) => {
    setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: 'Pagado y Archivada' } : p));
  };

  const alternarBloqueoUsuario = (email) => {
    if (usuariosBloqueados.includes(email)) {
      setUsuariosBloqueados(usuariosBloqueados.filter(e => e !== email));
    } else {
      setUsuariosBloqueados([...usuariosBloqueados, email]);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>PUNTO M</h1>
          <p style={{ color: '#4b5563', marginBottom: '24px', fontSize: '14px' }}>Inicia sesión con tu cuenta de Google para acceder al catálogo.</p>
          <button
            onClick={handleGoogleLogin}
            style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    );
  }

  if (estaBloqueado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #fecaca' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '8px' }}>Acceso Restringido</h2>
          <p style={{ color: '#4b5563', marginBottom: '24px', fontSize: '14px' }}>Tu usuario ha sido bloqueado por la administración de PUNTO M.</p>
          <button onClick={handleLogout} style={{ backgroundColor: '#1f2937', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#2563eb', margin: 0 }}>PUNTO M</h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Usuario: {user.displayName || user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isAdmin && (
            <button
              onClick={() => setVistaAdmin(!vistaAdmin)}
              style={{ backgroundColor: '#7c3aed', color: 'white', fontSize: '14px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              {vistaAdmin ? 'Ir a Tienda' : 'Panel Admin'}
            </button>
          )}
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontWeight: 'bold' }} title="Cerrar sesión">
            Salir
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {vistaAdmin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>Panel de Administración General</h2>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>Modificar Catálogo</h3>
              <form onSubmit={guardarProducto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '6px', fontSize: '14px' }}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio en Soles (S/)"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '6px', fontSize: '14px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Categoría"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '6px', fontSize: '14px' }}
                />
                <button type="submit" style={{ backgroundColor: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: 'bold', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                  {productoEditando ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </form>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px', marginTop: '16px' }}>
                {catalogo.map((prod) => (
                  <div key={prod.id} style={{ border: '1px solid #e5e7eb', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#7c3aed', backgroundColor: '#f3e8ff', padding: '2px 6px', borderRadius: '4px' }}>{prod.categoria}</span>
                      <h4 style={{ fontWeight: 'bold', fontSize: '14px', margin: '4px 0' }}>{prod.nombre}</h4>
                      <p style={{ fontSize: '12px', color: '#4b5563', margin: 0, fontWeight: 'bold' }}>S/ {prod.precio.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => iniciarEdicion(prod)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                      <button onClick={() => eliminarProductoCatalogo(prod.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>Historial de Pedidos y Bloqueo de Usuarios</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pedidos.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay pedidos registrados todavía.</p>
                ) : (
                  pedidos.map((p) => (
                    <div key={p.id} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '14px' }}>{p.cliente} <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#6b7280' }}>({p.email})</span></p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Fecha: {p.fecha}</p>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: '0 0 8px 0' }}>Precio Total Aproximado: S/ {p.total}</p>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '500', backgroundColor: p.estado === 'Pagado y Archivada' ? '#dcfce7' : '#fef9c3', color: p.estado === 'Pagado y Archivada' ? '#166534' : '#854d0e' }}>
                          {p.estado}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {p.estado !== 'Pagado y Archivada' && (
                          <button onClick={() => marcarComoPagado(p.id)} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Marcar Pagado y Archivar
                          </button>
                        )}
                        <button onClick={() => alternarBloqueoUsuario(p.email)} style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                          {usuariosBloqueados.includes(p.email) ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Catálogo de Productos</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {catalogo.map((prod) => (
                  <div key={prod.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>{prod.categoria}</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '8px 0 4px 0', color: '#1f2937' }}>{prod.nombre}</h3>
                      <p style={{ color: '#4b5563', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>S/ {prod.precio.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => agregarAlCarrito(prod)}
                      style={{ marginTop: '16px', width: '100%', backgroundColor: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 'medium', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                      Agregar al carrito
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', margin: 0 }}>Tu Pedido</h2>

              {carrito.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Tu carrito está vacío.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {carrito.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <div>
                        <p style={{ fontWeight: '500', margin: '0 0 2px 0', color: '#1f2937' }}>{item.nombre} x{item.cantidad}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                      </div>
                      <button onClick={() => eliminarDelCarrito(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
                      <span>Precio Total Aproximado:</span>
                      <span style={{ color: '#2563eb' }}>S/ {calcularTotal()}</span>
                    </div>
                  </div>

                  <button
                    onClick={realizarPedido}
                    style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    Generar Pedido
                  </button>
                </div>
              )}

              {solicitudEnviada && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', margin: 0 }}>¡Pedido Registrado con Éxito!</p>
                  <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>Envía el formato a WhatsApp para procesar el pago:</p>
                  
                  <button
                    onClick={() => enviarWhatsApp(solicitudEnviada)}
                    style={{ width: '100%', backgroundColor: '#059669', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    Enviar Lista por WhatsApp
                  </button>

                  <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '8px', fontSize: '12px', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 2px 0' }}>Datos para pagar:</p>
                    <p style={{ margin: 0 }}>• Yape / Plin: 999-999-999</p>
                    <p style={{ margin: 0 }}>• Transferencia BCP: 123-4567890-0-99</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
