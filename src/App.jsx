import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from './firebase';
import { 
  ShoppingCart, 
  Trash2, 
  CheckCircle, 
  ShieldAlert, 
  LogOut, 
  PlusCircle,
  Package,
  Edit,
  Save,
  Send
} from 'lucide-react';

// Correo configurado como Administrador principal único
const ADMIN_EMAIL = 'suarez.cabrita.daniel.arturo@gmail.com'; 

// Catálogo inicial de muestra (Precios en Soles S/)
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

  // Formulario del Admin para agregar / editar productos
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

  // Inicio de sesión forzando a Google a mostrar el selector de cuentas
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

  // Lógica del Carrito
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

  // Creación de Pedido y envío a WhatsApp
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
    let mensaje = `*NUEVO PEDIDO - PUNTO M*\n`;
    mensaje += `*Cliente:* ${pedido.cliente}\n`;
    mensaje += `*Correo:* ${pedido.email}\n`;
    mensaje += `*Fecha:* ${pedido.fecha}\n\n`;
    mensaje += `*LISTA DE PRODUCTOS:*\n`;

    pedido.items.forEach((item) => {
      mensaje += `• ${item.nombre} x${item.cantidad} - S/ ${(item.precio * item.cantidad).toFixed(2)}\n`;
    });

    mensaje += `\n*PRECIO TOTAL APROXIMADO: S/ ${pedido.total}*\n\n`;
    mensaje += `*DATOS PARA PAGO:*\n`;
    mensaje += `• Yape / Plin: 999-999-999\n`;
    mensaje += `• Transferencia BCP: 123-4567890-0-99\n`;
    mensaje += `*Titular:* PUNTO M S.A.C.`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Lógica del Panel de Administración del Catálogo
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

  // Lógica de Pedidos y Usuarios en Admin
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

  // 1. Pantalla de Inicio de Sesión Obligatorio
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">PUNTO M</h1>
          <p className="text-gray-600 mb-6">Debes iniciar sesión con tu cuenta de Google para acceder al catálogo.</p>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    );
  }

  // 2. Pantalla si el usuario está bloqueado por el Admin
  if (estaBloqueado) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center border border-red-200">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">Tu usuario ha sido bloqueado por la administración de PUNTO M.</p>
          <button onClick={handleLogout} className="bg-gray-800 text-white px-4 py-2 rounded-lg">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Encabezado */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-blue-600">PUNTO M</h1>
          <p className="text-xs text-gray-500">Usuario: {user.displayName || user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setVistaAdmin(!vistaAdmin)}
              className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              {vistaAdmin ? 'Ir a Tienda' : 'Panel Admin'}
            </button>
          )}
          <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-600" title="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {vistaAdmin ? (
          /* PANEL DE ADMINISTRACIÓN */
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Panel de Administración General</h2>
            </div>

            {/* SECCIÓN 1: MODIFICAR Y ADMINISTRAR CATÁLOGO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Package className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">Modificar Catálogo</h3>
              </div>

              <form onSubmit={guardarProducto} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="border p-2 rounded text-sm bg-white"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio en Soles (S/)"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  className="border p-2 rounded text-sm bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Categoría"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  className="border p-2 rounded text-sm bg-white"
                />
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 px-4 rounded flex items-center justify-center gap-2">
                  {productoEditando ? <Save className="w-4 h-4"/> : <PlusCircle className="w-4 h-4"/>}
                  {productoEditando ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {catalogo.map((prod) => (
                  <div key={prod.id} className="border p-3 rounded-lg flex justify-between items-center bg-white shadow-xs">
                    <div>
                      <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{prod.categoria}</span>
                      <h4 className="font-bold text-sm mt-1">{prod.nombre}</h4>
                      <p className="text-xs text-gray-600 font-semibold">S/ {prod.precio.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => iniciarEdicion(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => eliminarProductoCatalogo(prod.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 2: GESTIÓN DE PEDIDOS Y USUARIOS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3">Historial de Pedidos y Bloqueo de Usuarios</h3>
              <div className="space-y-4">
                {pedidos.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay pedidos registrados todavía.</p>
                ) : (
                  pedidos.map((p) => (
                    <div key={p.id} className="border p-4 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-800">{p.cliente} <span className="text-xs font-normal text-gray-500">({p.email})</span></p>
                        <p className="text-xs text-gray-600">Fecha: {p.fecha}</p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">Precio Total Aproximado: S/ {p.total}</p>
                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded font-medium ${p.estado === 'Pagado y Archivada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {p.estado}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {p.estado !== 'Pagado y Archivada' && (
                          <button onClick={() => marcarComoPagado(p.id)} className="bg-green-600 text-white text-xs px-3 py-2 rounded font-semibold hover:bg-green-700">
                            Marcar Pagado y Archivar
                          </button>
                        )}
                        <button onClick={() => alternarBloqueoUsuario(p.email)} className="bg-red-100 text-red-600 text-xs px-3 py-2 rounded font-semibold hover:bg-red-200">
                          {usuariosBloqueados.includes(p.email) ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* VISTA DE CATÁLOGO Y CLIENTES */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lista de Productos Dinámica */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Catálogo de Productos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {catalogo.map((prod) => (
                  <div key={prod.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{prod.categoria}</span>
                      <h3 className="font-bold text-lg mt-2 text-gray-800">{prod.nombre}</h3>
                      <p className="text-gray-600 font-semibold mt-1">S/ {prod.precio.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => agregarAlCarrito(prod)}
                      className="mt-4 w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Agregar al carrito
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrito y Factura */}
            <div className="bg-white p-6 rounded-xl shadow-sm border h-fit space-y-6">
              <div className="flex items-center gap-2 border-b pb-3">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">Tu Pedido</h2>
              </div>

              {carrito.length === 0 ? (
                <p className="text-gray-400 text-sm">Tu carrito está vacío.</p>
              ) : (
                <div className="space-y-3">
                  {carrito.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{item.nombre} x{item.cantidad}</p>
                        <p className="text-xs text-gray-500">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                      </div>
                      <button onClick={() => eliminarDelCarrito(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Precio Total Aproximado:</span>
                      <span className="text-blue-600">S/ {calcularTotal()}</span>
                    </div>
                  </div>

                  <button
                    onClick={realizarPedido}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    Generar Pedido
                  </button>
                </div>
              )}

              {/* Confirmación e Impresión a WhatsApp */}
              {solicitudEnviada && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" /> ¡Pedido Registrado!
                  </div>
                  <p className="text-xs text-gray-600">Envía la lista formateada por WhatsApp para coordinar el pago:</p>
                  
                  <button
                    onClick={() => enviarWhatsApp(solicitudEnviada)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Enviar por WhatsApp
                  </button>

                  <div className="border-t border-green-200 pt-2 text-xs text-gray-600 space-y-1">
                    <p className="font-bold">Datos para pago:</p>
                    <p>• Yape / Plin: 999-999-999</p>
                    <p>• Transferencia BCP: 123-4567890-0-99</p>
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
