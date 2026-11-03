import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  User, 
  Settings, 
  FileText, 
  Upload, 
  LogOut, 
  Sparkles,
  Phone,
  Send
} from 'lucide-react';
import { auth, googleProvider, db, signInWithPopup, signOut } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot
} from 'firebase/firestore';

// API Key de Google Gemini
const GEMINI_API_KEY = "AQ.Ab8RN6I6YA6ngJ0jFh7QWo6Fusf2aHbSLp3vbMahAu5WrUJu4A"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client'); 
  const [view, setView] = useState('catalog'); 
  
  const [products, setProducts] = useState([
    { id: '1', name: 'Harina de Trigo 1kg', price: 4.50, category: 'Viveres', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300' },
    { id: '2', name: 'Aceite Vegetal 1L', price: 8.90, category: 'Viveres', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300' },
    { id: '3', name: 'Arroz Extra 1kg', price: 4.20, category: 'Viveres', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' },
    { id: '4', name: 'Azúcar Rubia 1kg', price: 3.80, category: 'Viveres', image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300' }
  ]);

  const [cart, setCart] = useState([]);
  
  const [companyHeader, setCompanyHeader] = useState({
    name: 'PUNTO M',
    rif: 'RUC 20123456789',
    address: 'Av. Principal 123, Lima',
    phone: '+51 987 654 321',
    footerMessage: '¡Gracias por su compra en PUNTO M! Conservar comprobante.'
  });

  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Viveres', image: '' });
  
  const [aiFileText, setAiFileText] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  // Estados para el Asistente de Pedidos por IA de los clientes
  const [clientPrompt, setClientPrompt] = useState('');
  const [isAiOrdering, setIsAiOrdering] = useState(false);
  const [aiOrderFeedback, setAiOrderFeedback] = useState('');

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const dbProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (dbProducts.length > 0) {
        setProducts(dbProducts);
      }
    }, (error) => {
      console.log("Modo offline o usando catálogo base:", error);
    });

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const adminEmail = 'suarez.cabrita.daniel.arturo@gmail.com';
        const isOwner = currentUser.email === adminEmail;

        setUser({
          name: currentUser.displayName || 'Usuario PUNTO M',
          email: currentUser.email,
          photo: currentUser.photoURL,
          uid: currentUser.uid
        });

        const userDocRef = doc(db, 'users', currentUser.uid);
        let assignedRole = isOwner ? 'admin' : 'client';

        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && !isOwner) {
            assignedRole = userDoc.data().role || 'client';
          }

          await setDoc(userDocRef, {
            name: currentUser.displayName,
            email: currentUser.email,
            role: assignedRole,
            lastLogin: new Date()
          }, { merge: true });
        } catch (e) {
          console.log("Firestore Auth Sync error:", e);
        }

        setUserRole(assignedRole);
      } else {
        setUser(null);
        setUserRole('client');
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeAuth();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error iniciando sesión:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch(() => {});
    setUser(null);
    setView('catalog');
  };

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

  // Función mejorada con extracción limpia de JSON
  const handleClientAiOrder = async () => {
    if (!clientPrompt.trim()) return;

    setIsAiOrdering(true);
    setAiOrderFeedback('');

    try {
      const catalogList = products.map(p => `- ID: ${p.id}, Nombre: ${p.name}, Precio: ${p.price}`).join('\n');

      const promptText = `Eres un asistente de compras de un mercado. El cliente ha escrito: "${clientPrompt}".
      
      Catálogo disponible:
      ${catalogList}

      Identifica qué productos desea y su cantidad. Si pide algo que no está en la lista, ponlo en notFound.
      DEVUELVE ÚNICAMENTE UN JSON VÁLIDO, sin bloques de código markdown, sin explicaciones, exactamente con esta estructura:
      {"found": [{"id": "...", "qty": 1}], "notFound": ["nombre"]}
      Si no hay nada, devuelve: {"found": [], "notFound": []}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Extrae la cadena JSON evitando errores por formato o comentarios extra de la IA
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleanJsonStr = jsonMatch ? jsonMatch[0] : '{}';
      const result = JSON.parse(cleanJsonStr);

      let feedbackMessages = [];

      if (result.found && Array.isArray(result.found) && result.found.length > 0) {
        result.found.forEach(req => {
          const productFound = products.find(p => p.id === req.id);
          if (productFound) {
            for (let i = 0; i < (req.qty || 1); i++) {
              addToCart(productFound);
            }
          }
        });
      }

      if (result.notFound && Array.isArray(result.notFound) && result.notFound.length > 0) {
        feedbackMessages.push(`⚠️ Los siguientes productos no los tenemos en existencia: ${result.notFound.join(', ')}.`);
      }

      if (result.found && result.found.length > 0) {
        feedbackMessages.unshift("✅ ¡Productos disponibles agregados al carrito!");
      } else if (feedbackMessages.length === 0) {
        feedbackMessages.push("No se pudieron identificar productos en tu mensaje.");
      }

      setAiOrderFeedback(feedbackMessages.join(' '));
      setClientPrompt('');

    } catch (error) {
      console.error("Error en IA de pedidos:", error);
      setAiOrderFeedback("Hubo un error al procesar tu pedido con la IA. Inténtalo de nuevo.");
    } finally {
      setIsAiOrdering(false);
    }
  };

  const handleProcessAiFileWithGemini = async () => {
    if (!aiFileText.trim()) {
      alert("Por favor pega el texto de la factura o inventario primero.");
      return;
    }

    setIsProcessingFile(true);
    setAiStatusMessage('🤖 Gemini IA está analizando el documento...');

    try {
      const promptText = `Analiza la siguiente lista de inventario o factura y extrae una lista JSON estricta de productos.
      Cada objeto debe tener exactamente las propiedades:
      - "name": nombre del producto (string)
      - "price": precio como número decimal (ejemplo: 4.50)
      - "category": categoría estimada (string, ejemplo: "Viveres", "Bebidas", "Limpieza")

      Texto del documento:
      """
      ${aiFileText}
      """

      Responde ÚNICAMENTE con la estructura JSON en un array, ejemplo: [{"name": "Arroz", "price": 3.50, "category": "Viveres"}] sin comentarios ni markdown extra.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      const cleanJsonStr = jsonMatch ? jsonMatch[0] : '[]';
      const extractedProducts = JSON.parse(cleanJsonStr);

      if (Array.isArray(extractedProducts) && extractedProducts.length > 0) {
        setAiStatusMessage(`📥 Guardando ${extractedProducts.length} productos en la base de datos Firestore...`);

        for (const item of extractedProducts) {
          await addDoc(collection(db, 'products'), {
            name: item.name || 'Producto Nuevo',
            price: parseFloat(item.price) || 0.00,
            category: item.category || 'General',
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
            createdAt: new Date()
          });
        }

        alert(`¡Éxito! Se analizaron y agregaron ${extractedProducts.length} productos a la base de datos Firestore de PUNTO M.`);
        setAiFileText('');
      } else {
        alert("La IA no encontró productos válidos con formato de nombre y precio.");
      }

    } catch (error) {
      console.error("Error al procesar con Gemini:", error);
      alert("Hubo un error al procesar el archivo con Gemini.");
    } finally {
      setIsProcessingFile(false);
      setAiStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      <header className="bg-[#0b6b38] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('catalog')}>
            <div className="bg-[#074825] px-4 py-1.5 rounded-lg border border-green-600 flex items-center">
              <span className="font-extrabold text-2xl tracking-widest text-white">PUNTO</span>
              <span className="h-3.5 w-3.5 bg-[#fbc02d] rounded-full inline-block ml-1"></span>
              <span className="font-extrabold text-2xl tracking-widest text-white ml-1">M</span>
            </div>
          </div>

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

      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
        {view === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* ASISTENTE DE PEDIDOS POR IA PARA CLIENTES */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
                <h3 className="font-bold text-sm text-green-900 mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-[#0b6b38]" /> Asistente de Pedidos IA
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Escribe lo que necesitas (ej: "Quiero 2 kilos de arroz y un jabón") y la IA agregará lo disponible al carrito y te avisará si algo no existe.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={clientPrompt}
                    onChange={e => setClientPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleClientAiOrder()}
                    placeholder="Escribe tu pedido aquí..."
                    className="flex-1 border p-2 rounded-lg text-xs focus:ring-2 focus:ring-[#0b6b38]"
                  />
                  <button 
                    onClick={handleClientAiOrder}
                    disabled={isAiOrdering}
                    className="bg-[#0b6b38] hover:bg-[#074825] disabled:bg-gray-400 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 transition"
                  >
                    <Send size={14} /> {isAiOrdering ? 'Procesando...' : 'Pedir'}
                  </button>
                </div>
                {aiOrderFeedback && (
                  <div className="mt-2.5 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg">
                    {aiOrderFeedback}
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-bold text-xl mb-4 text-gray-800 flex items-center justify-between">
                  <span>Catálogo de Productos (S/)</span>
                  <span className="text-xs font-normal text-gray-500">{products.length} ítems en tienda</span>
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
                          <span className="font-black text-green-800 text-base">S/ {Number(prod.price).toFixed(2)}</span>
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

            <div className="bg-white p-5 rounded-2xl shadow-md border flex flex-col h-fit">
              <h2 className="font-bold text-lg text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                <ShoppingBag className="text-[#0b6b38]" /> Carrito de Compras
              </h2>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  El carrito está vacío.
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border">
                      <div className="text-xs">
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-gray-500">S/ {Number(item.price).toFixed(2)} x {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-green-800">S/ {(item.price * item.qty).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between font-black text-lg text-gray-800 mb-4">
                  <span>Total a Pagar:</span>
                  <span className="text-[#0b6b38]">S/ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={() => setView('receipt')}
                  className="w-full bg-[#0b6b38] hover:bg-[#074825] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Generar Recibo de Compra
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'receipt' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
            <div className="text-center border-b pb-4 mb-4">
              <div className="inline-block bg-[#0b6b38] px-4 py-1 rounded text-white font-black text-xl mb-1">
                {companyHeader.name} <span className="text-[#fbc02d]">.</span>
              </div>
              <p className="text-xs font-mono text-gray-600">{companyHeader.rif}</p>
              <p className="text-xs text-gray-500">{companyHeader.address}</p>
              <p className="text-xs text-gray-500">Tel: {companyHeader.phone}</p>
            </div>

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
                    <td className="py-1 text-right">S/ {(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-dashed pt-3 text-right mb-6">
              <p className="text-sm font-bold">TOTAL:</p>
              <p className="text-2xl font-black text-[#0b6b38]">S/ {cartTotal.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <a 
                href={`https://wa.me/${companyHeader.phone.replace(/[^0-9]/g, '')}?text=Hola%20PUNTO%20M,%20confirmo%20mi%20pedido%20por%20S/%20${cartTotal.toFixed(2)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg text-center flex items-center justify-center gap-2 text-sm"
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

        {view === 'admin' && userRole === 'admin' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow border">
              <h2 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="text-[#0b6b38]" /> Panel de Administración PUNTO M
              </h2>

              <div className="bg-green-50 p-5 rounded-xl border border-green-200 mb-6">
                <h3 className="font-bold text-sm text-green-900 mb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#0b6b38]" /> Importador Inteligente Gemini IA
                </h3>
                <p className="text-xs text-green-800 mb-3">
                  Pega aquí el texto de tu factura o inventario. La IA extraerá los productos y **los guardará directamente en tu base de datos Firestore**.
                </p>
                <textarea 
                  rows="5"
                  value={aiFileText}
                  onChange={e => setAiFileText(e.target.value)}
                  placeholder="Ejemplo:
Arroz Extra 1kg - 4.50 S/
Aceite Vegetal 1L - 8.90 S/
Azúcar Rubia 1kg - 3.80 S/"
                  className="w-full border p-3 rounded-lg text-xs mb-3 focus:ring-2 focus:ring-[#0b6b38] bg-white"
                ></textarea>
                
                <button 
                  onClick={handleProcessAiFileWithGemini}
                  disabled={isProcessingFile}
                  className="bg-[#0b6b38] hover:bg-[#074825] disabled:bg-gray-400 text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-2 transition shadow"
                >
                  <Upload size={14} /> {isProcessingFile ? 'Analizando con Gemini...' : 'Analizar Documento y Actualizar Firestore'}
                </button>

                {aiStatusMessage && (
                  <p className="mt-3 text-xs font-bold text-green-900 animate-pulse bg-white p-2 rounded border border-green-300">
                    {aiStatusMessage}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Agregar Producto Manual</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nombre Producto"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="border p-2 rounded text-xs"
                  />
                  <input 
                    type="number" 
                    placeholder="Precio en S/"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="border p-2 rounded text-xs"
                  />
                  <input 
                    type="text" 
                    placeholder="URL Imagen"
                    value={newProduct.image}
                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                    className="border p-2 rounded text-xs"
                  />
                  <button 
                    onClick={async () => {
                      if (!newProduct.name || !newProduct.price) return;
                      await addDoc(collection(db, 'products'), {
                        name: newProduct.name,
                        price: parseFloat(newProduct.price),
                        category: 'Viveres',
                        image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
                        createdAt: new Date()
                      });
                      setNewProduct({ name: '', price: '', category: 'Viveres', image: '' });
                      alert("Producto guardado en Firestore.");
                    }}
                    className="bg-[#0b6b38] text-white font-bold p-2 rounded text-xs hover:bg-[#074825]"
                  >
                    Guardar Manual
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
