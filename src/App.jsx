import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Mic, 
  Plus, 
  Trash2, 
  User, 
  Settings, 
  FileText, 
  Upload, 
  Check, 
  Search, 
  LogOut, 
  Sparkles,
  Phone,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { auth, googleProvider, db, signInWithPopup, signOut } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot
} from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client'); // 'admin' o 'client'
  const [view, setView] = useState('catalog'); // 'catalog', 'admin', 'receipt', 'history'
  
  // Base de datos de productos
  const [products, setProducts] = useState([
    { id: '1', name: 'Harina PAN 1kg', price: 1.20, category: 'Viveres', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300' },
    { id: '2', name: 'Aceite de Maíz 1L', price: 3.50, category: 'Viveres', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300' },
    { id: '3', name: 'Arroz Primor 1kg', price: 1.10, category: 'Viveres', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' },
    { id: '4', name: 'Azúcar Blanca 1kg', price: 1.30, category: 'Viveres', image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300' }
  ]);

  // Lista de todos los usuarios (para Admin)
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Carrito y pedidos
  const [cart, setCart] = useState([]);
  const [userLocation, setUserLocation] = useState('Buscando ubicación por GPS...');
  const [orderHistory, setOrderHistory] = useState([]);
  
  // Asistente IA por voz/texto
  const [aiInput, setAiInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Configuración de la Empresa para Recibo (Modificable en Admin)
  const [companyHeader, setCompanyHeader] = useState({
    name: 'PUNTO M',
    rif: 'J-50123456-7',
    address: 'Av. Principal Calle 4, Valera, Trujillo',
    phone: '+58 412 1234567',
    footerMessage: '¡Gracias por preferir a PUNTO M! Guarde su recibo.'
  });

  // Estado para nuevo producto manual en Admin
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Viveres', image: '' });
  
  // Texto de archivo para extraer con IA Gemini (Admin)
  const [aiFileText, setAiFileText] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Cargar productos y sync de Firebase
  useEffect(() => {
    // Detectar ubicación del usuario
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation(`Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`),
        () => setUserLocation('Valera, Trujillo (Predeterminada)')
      );
    }

    // Escuchar cambios de autenticación
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || 'Usuario PUNTO M',
          email: currentUser.email,
          photo: currentUser.photoURL,
          uid: currentUser.uid
        });

        // Consultar o crear perfil de usuario en Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'client');
          } else {
            // Primer registro
            const newRole = currentUser.email.includes('admin') ? 'admin' : 'client';
            await setDoc(userDocRef, {
              name: currentUser.displayName,
              email: currentUser.email,
              role: newRole,
              createdAt: new Date()
            });
            setUserRole(newRole);
          }
        } catch (e) {
          console.log("Modo local activo:", e);
        }
      } else {
        setUser(null);
        setUserRole('client');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Iniciar sesión con Google Auth
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // Simulación en caso de probar sin credenciales de red activa
      setUser({
        name: 'Cliente PUNTO M',
        email: 'cliente@puntom.com',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        uid: 'user_demo_123'
      });
    }
  };

  const handleLogout = () => {
    signOut(auth).catch(() => {});
    setUser(null);
    setView('catalog');
  };

  // Carrito Operaciones
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Asistente IA (Voz o Texto)
  const processAICommand = (text) => {
    if (!text.trim()) return;
    setAiMessage('Procesando pedido con IA Gemini...');
    
    setTimeout(() => {
      let added = [];
      products.forEach(prod => {
        const keyword = prod.name.toLowerCase().split(' ')[0];
        if (text.toLowerCase().includes(keyword)) {
          addToCart(prod);
          added.push(prod.name);
        }
      });

      if (added.length > 0) {
        setAiMessage(`¡Entendido! Agregué a tu carrito: ${added.join(', ')}.`);
      } else {
        setAiMessage('No logré identificar productos exactos. Intenta nombrar ítems del catálogo.');
      }
      setAiInput('');
    }, 1000);
  };

  // Reconocimiento de Voz Simulado / Web Speech API
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Tu navegador no soporta reconocimiento de voz directo. Escribe tu pedido en el campo de texto de IA.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    
    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiInput(transcript);
        processAICommand(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  };

  // IA Gemini Importación Masiva en Admin (Ficticia/Prompt Engine)
  const handleProcessAiFile = () => {
    if (!aiFileText.trim()) return;
    setIsProcessingFile(true);

    setTimeout(() => {
      // Detección ficticia de productos y precios desde formato texto/factura
      const lines = aiFileText.split('\n');
      const detected = [];
      lines.forEach((line, index) => {
        const priceMatch = line.match(/(\$|USD|\b)?\d+([.,]\d{1,2})?/gi);
        if (priceMatch && line.trim().length > 3) {
          const rawPrice = priceMatch[priceMatch.length - 1].replace('$', '').replace(',', '.');
          const numPrice = parseFloat(rawPrice) || 2.5;
          const cleanName = line.replace(priceMatch[0], '').replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g, '').trim();
          
          if (cleanName.length > 2) {
            detected.push({
              id: Date.now().toString() + index,
              name: cleanName,
              price: numPrice,
              category: 'Importados IA',
              image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'
            });
          }
        }
      });

      if (detected.length > 0) {
        setProducts(prev => [...prev, ...detected]);
        alert(`¡IA Gemini procesó con éxito! Se añadieron ${detected.length} productos al catálogo.`);
        setAiFileText('');
      } else {
        alert("La IA no encontró pares de (Producto - Precio) claros en el texto suministrado.");
      }
      setIsProcessingFile(false);
    }, 1500);
  };

  // Confirmar y Guardar Pedido
  const handleFinalizeOrder = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: 'PED-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toLocaleString('es-VE'),
      items: cart,
      total: cartTotal,
      location: userLocation
    };
    setOrderHistory(prev => [newOrder, ...prev]);
    setView('receipt');
  };

  // Cambiar rol de usuario en Admin
  const toggleUserRole = (email) => {
    setRegisteredUsers(prev => prev.map(u => u.email === email ? { ...u, role: u.role === 'admin' ? 'client' : 'admin' } : u));
    if (user && user.email === email) {
      setUserRole(userRole === 'admin' ? 'client' : 'admin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      
      {/* HEADER PRINCIPAL CON LOGO DE PUNTO M Y ESTADO DE SESION */}
      <header className="bg-[#0b6b38] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          
          {/* Logo Estilo Oficial PUNTO M */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('catalog')}>
            <div className="bg-[#074825] px-4 py-1.5 rounded-lg border border-green-600 flex items-center">
              <span className="font-extrabold text-2xl tracking-widest text-white">PUNTO</span>
              <span className="h-3.5 w-3.5 bg-[#fbc02d] rounded-full inline-block ml-1"></span>
              <span className="font-extrabold text-2xl tracking-widest text-white ml-1">M</span>
            </div>
          </div>

          {/* Navegación y Perfil */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-[#074825] px-3 py-1.5 rounded-full border border-green-700">
                <img src={user.photo || "https://via.placeholder.com/40"} alt="User" className="w-8 h-8 rounded-full border border-[#fbc02d]" />
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-white flex items-center gap-1">
                    {user.name} 
                    {userRole === 'admin' && <span className="bg-[#fbc02d] text-black text-[9px] px-1 rounded font-black">ADMIN</span>}
                  </p>
                  <p className="text-gray-300 text-[10px] truncate max-w-[120px]">{user.email}</p>
                </div>

                <button onClick={() => setView('history')} title="Historial de Pedidos" className="p-1.5 hover:bg-green-700 rounded-full transition">
                  <FileText size={18} />
                </button>

                {userRole === 'admin' && (
                  <button onClick={() => setView('admin')} title="Panel Admin" className="p-1.5 hover:bg-green-700 rounded-full text-[#fbc02d] transition">
                    <Settings size={18} />
                  </button>
                )}

                <button onClick={handleLogout} title="Cerrar Sesión" className="p-1.5 hover:bg-red-700 rounded-full transition">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-[#fbc02d] text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400 transition shadow"
              >
                <User size={18} /> Entrar con Google
              </button>
            )}

            {/* Carrito Flotante */}
            <button 
              onClick={() => setView('catalog')}
              className="relative bg-white text-[#0b6b38] p-2 rounded-full font-bold shadow hover:bg-gray-100"
            >
              <ShoppingBag size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-black">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">

        {/* VISTA: CATALOGO Y REALIZAR PEDIDOS */}
        {view === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* SECCION IZQUIERDA: ASISTENTE IA & PRODUCTOS */}
            <div className="lg:col-span-2 space-y-6">

              {/* BARRA ASISTENTE IA GEMINI (VOZ Y LISTA) */}
              <div className="bg-gradient-to-r from-[#0b6b38] to-[#074825] p-5 rounded-2xl text-white shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-[#fbc02d]" size={22} />
                  <h2 className="font-bold text-lg">Pedidos por IA Gemini (Voz o Lista)</h2>
                </div>
                <p className="text-xs text-green-100 mb-4">
                  Habla o escribe lo que necesitas (Ej: "Tráeme 2 harinas y 1 aceite") y la IA elegirá tus productos automáticamente.
                </p>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && processAICommand(aiInput)}
                    placeholder="Escribe tu lista de compras aquí..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#fbc02d]"
                  />
                  <button 
                    onClick={() => processAICommand(aiInput)}
                    className="bg-[#fbc02d] text-black font-bold px-4 rounded-xl hover:bg-yellow-400 text-sm transition"
                  >
                    Buscar
                  </button>
                  <button 
                    onClick={toggleVoice}
                    className={`p-2.5 rounded-xl transition ${isListening ? 'bg-red-600 animate-pulse' : 'bg-green-700 hover:bg-green-800'}`}
                    title="Hablar a la IA"
                  >
                    <Mic size={20} className="text-white" />
                  </button>
                </div>

                {aiMessage && (
                  <div className="mt-3 bg-white/10 p-2.5 rounded-lg text-xs border border-white/20 text-[#fbc02d]">
                    {aiMessage}
                  </div>
                )}
              </div>

              {/* LISTA PRODUCTO POR PRODUCTO */}
              <div>
                <h2 className="font-bold text-xl mb-4 text-gray-800 flex items-center justify-between">
                  <span>Catálogo de Productos</span>
                  <span className="text-xs font-normal text-gray-500">{products.length} ítems disponibles</span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition flex flex-col justify-between">
                      <img src={prod.image} alt={prod.name} className="h-32 w-full object-cover" />
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            {prod.category}
                          </span>
                          <h3 className="font-bold text-sm text-gray-800 mt-1">{prod.name}</h3>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-black text-green-800 text-base">${prod.price.toFixed(2)}</span>
                          <button 
                            onClick={() => addToCart(prod)}
                            className="bg-[#0b6b38] text-white p-2 rounded-lg hover:bg-[#074825] transition"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCION DERECHA: CARRITO & RESUMEN DE COMPRA */}
            <div className="bg-white p-5 rounded-2xl shadow-md border flex flex-col h-fit">
              <h2 className="font-bold text-lg text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                <ShoppingBag className="text-[#0b6b38]" /> Carrito de Compras
              </h2>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  El carrito está vacío.<br />Selecciona productos o pídelos a la IA.
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border">
                      <div className="text-xs">
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-gray-500">${item.price.toFixed(2)} x {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-green-800">${(item.price * item.qty).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* UBICACION AUTO DETECTADA */}
              <div className="mt-4 pt-3 border-t text-xs">
                <p className="font-bold text-gray-600 mb-1">📍 Ubicación de Entrega (Auto):</p>
                <p className="bg-gray-100 p-2 rounded text-gray-700 font-mono text-[11px]">{userLocation}</p>
              </div>

              {/* TOTAL Y ACCION */}
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between font-black text-lg text-gray-800 mb-4">
                  <span>Total a Pagar:</span>
                  <span className="text-[#0b6b38]">${cartTotal.toFixed(2)}</span>
                </div>

                <button 
                  disabled={cart.length === 0}
                  onClick={handleFinalizeOrder}
                  className="w-full bg-[#0b6b38] hover:bg-[#074825] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Generar Recibo de Compra
                </button>
              </div>
            </div>

          </div>
        )}

        {/* VISTA: RECIBO BLANCO DE EMPRESA */}
        {view === 'receipt' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
            {/* ENCABEZADO MODIFICABLE DE LA EMPRESA */}
            <div className="text-center border-b pb-4 mb-4">
              <div className="inline-block bg-[#0b6b38] px-4 py-1 rounded text-white font-black text-xl mb-1">
                {companyHeader.name} <span className="text-[#fbc02d]">.</span>
              </div>
              <p className="text-xs font-mono text-gray-600">RIF: {companyHeader.rif}</p>
              <p className="text-xs text-gray-500">{companyHeader.address}</p>
              <p className="text-xs text-gray-500">Tel: {companyHeader.phone}</p>
            </div>

            {/* DATOS DEL CLIENTE Y FECHA */}
            <div className="text-xs space-y-1 mb-4 bg-gray-50 p-3 rounded">
              <p><strong>Cliente:</strong> {user ? user.name : 'Cliente General'}</p>
              <p><strong>Correo:</strong> {user ? user.email : 'No registrado'}</p>
              <p><strong>Ubicación:</strong> {userLocation}</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleString('es-VE')}</p>
            </div>

            {/* DESGLOSE DE PRODUCTOS */}
            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1">Cant.</th>
                  <th className="py-1">Producto</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-1 font-bold">{item.qty}x</td>
                    <td className="py-1">{item.name}</td>
                    <td className="py-1 text-right">${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MONTO TOTAL RECIBO BLANCO */}
            <div className="border-t-2 border-dashed pt-3 text-right mb-6">
              <p className="text-sm font-bold">TOTAL MONTO RECIBO:</p>
              <p className="text-2xl font-black text-[#0b6b38]">${cartTotal.toFixed(2)}</p>
            </div>

            <p className="text-[11px] text-center text-gray-500 italic mb-6">
              "{companyHeader.footerMessage}"
            </p>

            <div className="space-y-2">
              <a 
                href={`https://wa.me/${companyHeader.phone.replace(/[^0-9]/g, '')}?text=Hola%20PUNTO%20M,%20confirmo%20mi%20pedido%20por%20un%20monto%20de%20$${cartTotal.toFixed(2)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg text-center flex items-center justify-center gap-2 text-sm"
              >
                <Phone size={16} /> Enviar Pedido por WhatsApp
              </a>

              <button 
                onClick={() => setView('catalog')}
                className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm"
              >
                Volver al Catálogo
              </button>
            </div>
          </div>
        )}

        {/* VISTA: HISTORIAL DE COMPRAS DEL USUARIO */}
        {view === 'history' && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow border">
            <h2 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="text-[#0b6b38]" /> Historial de Compras
            </h2>

            {orderHistory.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">Aún no has realizado ningún pedido en esta cuenta.</p>
            ) : (
              <div className="space-y-4">
                {orderHistory.map(ord => (
                  <div key={ord.id} className="border p-4 rounded-xl bg-gray-50">
                    <div className="flex justify-between items-center border-b pb-2 mb-2 text-xs">
                      <span className="font-bold text-[#0b6b38]">{ord.id}</span>
                      <span className="text-gray-500">{ord.date}</span>
                    </div>
                    <ul className="text-xs space-y-1 mb-2">
                      {ord.items.map(i => (
                        <li key={i.id}>{i.qty}x {i.name} - ${i.price} c/u</li>
                      ))}
                    </ul>
                    <div className="text-right text-sm font-bold text-gray-800">
                      Total: ${ord.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISTA: PANEL ADMINISTRADOR (SOLO ADMIN) */}
        {view === 'admin' && (
          <div className="space-y-8">

            <div className="bg-white p-6 rounded-2xl shadow border">
              <h2 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="text-[#0b6b38]" /> Panel de Administración PUNTO M
              </h2>

              {/* 1. AGREGAR PRODUCTO MANUALMENTE */}
              <div className="mb-8 border-b pb-6">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Agregar Producto Manual al Catálogo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nombre del Producto"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="border p-2 rounded text-xs"
                  />
                  <input 
                    type="number" 
                    placeholder="Precio ($)"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="border p-2 rounded text-xs"
                  />
                  <input 
                    type="text" 
                    placeholder="URL de Imagen (http...)"
                    value={newProduct.image}
                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                    className="border p-2 rounded text-xs"
                  />
                  <button 
                    onClick={() => {
                      if (!newProduct.name || !newProduct.price) return;
                      setProducts([...products, {
                        id: Date.now().toString(),
                        name: newProduct.name,
                        price: parseFloat(newProduct.price),
                        category: newProduct.category || 'Viveres',
                        image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'
                      }]);
                      setNewProduct({ name: '', price: '', category: 'Viveres', image: '' });
                    }}
                    className="bg-[#0b6b38] text-white font-bold p-2 rounded text-xs hover:bg-[#074825]"
                  >
                    Guardar Producto
                  </button>
                </div>
              </div>

              {/* 2. EXTRACCION DE BASE DE DATOS DE ARCHIVO CON IA GEMINI */}
              <div className="mb-8 border-b pb-6 bg-green-50 p-4 rounded-xl border border-green-200">
                <h3 className="font-bold text-sm text-green-900 mb-2 flex items-center gap-2">
                  <Sparkles size={16} /> Importador Masivo con IA Gemini (Factura / Lista)
                </h3>
                <p className="text-xs text-green-800 mb-3">
                  Pega aquí el texto de una factura o lista de inventario. La IA detectará automáticamente los nombres y precios.
                </p>
                <textarea 
                  rows="3"
                  value={aiFileText}
                  onChange={e => setAiFileText(e.target.value)}
                  placeholder="Ejemplo:\nHarina de Trigo 1kg - 1.50 USD\nQuedo Paisa 500g 4.80\nLeche Completa 2.10$"
                  className="w-full border p-2 rounded text-xs mb-2 focus:ring-2 focus:ring-[#0b6b38]"
                ></textarea>
                <button 
                  onClick={handleProcessAiFile}
                  disabled={isProcessingFile}
                  className="bg-[#0b6b38] text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-2"
                >
                  <Upload size={14} /> {isProcessingFile ? 'Procesando con IA...' : 'Extraer y Subir Productos'}
                </button>
              </div>

              {/* 3. MODIFICADOR DE MEMBRETE DE RECIBO */}
              <div className="mb-8 border-b pb-6">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Configurar Datos de Impresión del Recibo Blanco</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input 
                    type="text" 
                    value={companyHeader.name} 
                    onChange={e => setCompanyHeader({...companyHeader, name: e.target.value})}
                    placeholder="Nombre Empresa"
                    className="border p-2 rounded"
                  />
                  <input 
                    type="text" 
                    value={companyHeader.rif} 
                    onChange={e => setCompanyHeader({...companyHeader, rif: e.target.value})}
                    placeholder="RIF"
                    className="border p-2 rounded"
                  />
                  <input 
                    type="text" 
                    value={companyHeader.address} 
                    onChange={e => setCompanyHeader({...companyHeader, address: e.target.value})}
                    placeholder="Dirección"
                    className="border p-2 rounded"
                  />
                  <input 
                    type="text" 
                    value={companyHeader.phone} 
                    onChange={e => setCompanyHeader({...companyHeader, phone: e.target.value})}
                    placeholder="Teléfono WhatsApp"
                    className="border p-2 rounded"
                  />
                </div>
              </div>

              {/* 4. GESTION DE USUARIOS Y PERMISOS ADMIN */}
              <div>
                <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} /> Gestión de Usuarios y Roles de Admin
                </h3>
                <div className="text-xs bg-gray-50 p-4 rounded-xl border">
                  <p className="mb-2 text-gray-600">Da o quita permisos de administración a las cuentas registradas:</p>
                  <div className="flex items-center justify-between p-2 bg-white rounded border mb-2">
                    <div>
                      <p className="font-bold text-gray-800">{user ? user.name : 'Usuario Actual'}</p>
                      <p className="text-gray-500">{user ? user.email : 'correo@ejemplo.com'}</p>
                    </div>
                    <span className="bg-[#0b6b38] text-white px-2 py-1 rounded text-[10px] font-bold">
                      {userRole.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
