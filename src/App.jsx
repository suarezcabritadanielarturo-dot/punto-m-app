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
  Send,
  MapPin,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  History,
  Image as ImageIcon,
  Calendar,
  AlertTriangle,
  Eye,
  DollarSign,
  PieChart,
  RefreshCw,
  Lock,
  RotateCcw,
  Truck,
  PackageCheck
} from 'lucide-react';
import { auth, googleProvider, db, signInWithPopup, signOut } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';

// API Key de Google Gemini
const GEMINI_API_KEY = "AQ.Ab8RN6I6YA6ngJ0jFh7QWo6Fusf2aHbSLp3vbMahAu5WrUJu4A"; 

const BASE_PRODUCTS = [
  { name: 'Harina de Trigo 1kg', price: 4.50, category: 'Viveres', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300' },
  { name: 'Aceite Vegetal 1L', price: 8.90, category: 'Viveres', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300' },
  { name: 'Arroz Extra 1kg', price: 4.20, category: 'Viveres', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' },
  { name: 'Azúcar Rubia 1kg', price: 3.80, category: 'Viveres', image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client'); 
  const [view, setView] = useState('catalog'); // 'catalog', 'tracking', 'receipt', 'admin'
  const [adminSubTab, setAdminSubTab] = useState('orders');
  
  const [products, setProducts] = useState(BASE_PRODUCTS.map((p, i) => ({ id: String(i + 1), ...p })));
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');
  
  // Datos del cliente para el pedido
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Modales
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [failOrderId, setFailOrderId] = useState(null);
  const [failReason, setFailReason] = useState('');

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payOrderId, setPayOrderId] = useState(null);
  const [paymentProof, setPaymentProof] = useState('');

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnProof, setReturnProof] = useState('');

  const [previewImage, setPreviewImage] = useState(null);

  // Contabilidad / Cierre de día manual
  const [manualCaptureSum, setManualCaptureSum] = useState('');
  const [dayClosed, setDayClosed] = useState(false);
  const [closedDayData, setClosedDayData] = useState(null);

  const [companyHeader] = useState({
    name: 'PUNTO M',
    rif: 'RUC 20123456789',
    address: 'Av. Principal 123, Lima',
    phone: '+58 424 5719928',
    footerMessage: '¡Gracias por su compra en PUNTO M! Conservar comprobante.'
  });

  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Viveres', image: '' });
  const [aiFileText, setAiFileText] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  const [clientPrompt, setClientPrompt] = useState('');
  const [isAiOrdering, setIsAiOrdering] = useState(false);
  const [aiOrderFeedback, setAiOrderFeedback] = useState('');

  const [clientLocation, setClientLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const dbProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (dbProducts.length > 0) setProducts(dbProducts);
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const dbOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      dbOrders.sort((a, b) => {
        const timeA = `${a.deliveryDate || ''} ${a.deliveryTime || ''}`;
        const timeB = `${b.deliveryDate || ''} ${b.deliveryTime || ''}`;
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setOrders(dbOrders);
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
          console.log("Error Auth sync:", e);
        }
        setUserRole(assignedRole);
      } else {
        setUser(null);
        setUserRole('client');
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeAuth();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch(() => {});
    setUser(null);
    setView('catalog');
  };

  const handleResetToFactorySettings = async () => {
    const confirmReset = window.confirm(
      "⚠️ ¿Estás seguro de que deseas restaurar los valores de fábrica?\n\nEsta acción eliminará TODOS los pedidos registrados, capturas de pago y restablecerá el catálogo."
    );

    if (!confirmReset) return;

    setIsResetting(true);

    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      for (const orderDoc of ordersSnapshot.docs) {
        await deleteDoc(doc(db, 'orders', orderDoc.id));
      }

      const productsSnapshot = await getDocs(collection(db, 'products'));
      for (const prodDoc of productsSnapshot.docs) {
        await deleteDoc(doc(db, 'products', prodDoc.id));
      }

      for (const baseProd of BASE_PRODUCTS) {
        await addDoc(collection(db, 'products'), {
          ...baseProd,
          createdAt: new Date()
        });
      }

      setCart([]);
      setOrders([]);
      setManualCaptureSum('');
      setDayClosed(false);
      setClosedDayData(null);
      setSelectedClientFilter('all');

      alert("🔄 ¡Los valores de fábrica han sido restaurados con éxito!");
    } catch (error) {
      console.error("Error restaurando valores:", error);
      alert("Hubo un problema al intentar reiniciar la base de datos.");
    } finally {
      setIsResetting(false);
    }
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setClientLocation({
          lat: latitude,
          lng: longitude,
          mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error("Error GPS:", error);
        alert("No se pudo obtener la ubicación.");
        setLocationLoading(false);
      }
    );
  };

  const handleGenerateReceipt = async () => {
    if (!user) {
      alert("⚠️ Debe iniciar sesión obligatoriamente antes de realizar un pedido.");
      handleLogin();
      return;
    }
    if (!clientPhone.trim()) {
      alert("⚠️ Por favor ingrese su número de teléfono de contacto para la entrega.");
      return;
    }
    if (!deliveryDate || !deliveryTime) {
      alert("⚠️ Por favor seleccione la fecha y hora preferida de entrega.");
      return;
    }

    const selectedDateObj = new Date(deliveryDate + 'T00:00:00');
    const todayObj = new Date(new Date().toDateString());
    if (selectedDateObj < todayObj) {
      alert("⚠️ No puedes seleccionar una fecha anterior a la actual.");
      return;
    }

    const [hours, minutes] = deliveryTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const openMinutes = 10 * 60; 
    const closeMinutes = 19 * 60; 

    if (totalMinutes < openMinutes || totalMinutes > closeMinutes) {
      alert("⚠️ El horario de atención de la tienda es de 10:00 AM a 7:00 PM. Por favor selecciona una hora dentro de este rango.");
      return;
    }

    if (deliveryDate === todayStr) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (totalMinutes < currentMinutes) {
        alert("⚠️ No puedes seleccionar una hora que ya ha pasado el día de hoy.");
        return;
      }
    }

    if (cart.length === 0) return;

    const newOrderData = {
      clientUid: user.uid,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone: clientPhone,
      items: cart,
      total: cartTotal,
      location: clientLocation || null,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      status: 'Pendiente',
      paymentMethod: '',
      paymentProof: '',
      failReason: '',
      returnStatus: 'No aplica',
      returnProof: '',
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, 'orders'), newOrderData);
      setView('receipt');
    } catch (err) {
      console.error("Error creando pedido:", err);
      setView('receipt');
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReturnProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReturnProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClientAiOrder = async () => {
    if (!user) {
      alert("⚠️ Debes iniciar sesión con Google para usar el Asistente.");
      handleLogin();
      return;
    }
    if (!clientPrompt.trim()) return;

    setIsAiOrdering(true);
    setAiOrderFeedback('');

    try {
      const textLower = clientPrompt.toLowerCase();
      let foundAny = false;
      let notFoundItems = [];
      let feedbackMessages = [];

      products.forEach(prod => {
        const prodNameLower = prod.name.toLowerCase();
        const mainKeyword = prodNameLower.split(' ')[0];
        if (textLower.includes(mainKeyword) || textLower.includes(prodNameLower)) {
          addToCart(prod);
          foundAny = true;
        }
      });

      const stopWords = ['de', 'kg', '1kg', '1l', 'litro', 'kilos', 'un', 'una', 'quiero', 'dame', 'por', 'favor', 'y', 'el', 'la', 'los', 'las'];
      const userWords = textLower.split(/[\s,]+/);

      userWords.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
          const matchExists = products.some(p => p.name.toLowerCase().includes(word));
          if (!matchExists && !notFoundItems.includes(word)) {
            notFoundItems.push(word);
          }
        }
      });

      if (foundAny) feedbackMessages.push("✅ ¡Productos disponibles agregados al carrito!");
      if (notFoundItems.length > 0) feedbackMessages.push(`⚠️ No tenemos en existencia: ${notFoundItems.join(', ')}.`);
      if (!foundAny && notFoundItems.length === 0) feedbackMessages.push("No se pudieron identificar productos.");

      setAiOrderFeedback(feedbackMessages.join(' '));
      setClientPrompt('');
    } catch (error) {
      console.error("Error en IA:", error);
      setAiOrderFeedback("Hubo un error al procesar tu pedido.");
    } finally {
      setIsAiOrdering(false);
    }
  };

  const handleProcessAiFileWithGemini = async () => {
    if (!aiFileText.trim()) {
      alert("Pega el texto de inventario primero.");
      return;
    }
    setIsProcessingFile(true);
    setAiStatusMessage('🤖 Gemini IA está analizando...');

    try {
      const promptText = `Analiza la lista y extrae JSON estricta de productos:
      [{"name": "...", "price": 0.0, "category": "..."}]
      Texto: """${aiFileText}"""`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      const cleanJsonStr = jsonMatch ? jsonMatch[0] : '[]';
      const extractedProducts = JSON.parse(cleanJsonStr);

      if (Array.isArray(extractedProducts) && extractedProducts.length > 0) {
        for (const item of extractedProducts) {
          await addDoc(collection(db, 'products'), {
            name: item.name || 'Nuevo',
            price: parseFloat(item.price) || 0,
            category: item.category || 'General',
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
            createdAt: new Date()
          });
        }
        alert(`¡Se agregaron ${extractedProducts.length} productos!`);
        setAiFileText('');
      } else {
        alert("La IA no encontró productos válidos.");
      }
    } catch (error) {
      console.error("Error IA:", error);
      alert("Error procesando archivo.");
    } finally {
      setIsProcessingFile(false);
      setAiStatusMessage('');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, ...extraData });
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  };

  const handlePayCash = async () => {
    await handleUpdateOrderStatus(payOrderId, 'Pagado', { paymentMethod: 'Efectivo', paymentProof: '' });
    setPayModalOpen(false);
    setPayOrderId(null);
  };

  const handlePayCapture = async () => {
    if (!paymentProof) {
      alert("Selecciona el capture de pago.");
      return;
    }
    await handleUpdateOrderStatus(payOrderId, 'Pagado', { paymentMethod: 'Transferencia / Capture', paymentProof: paymentProof });
    setPayModalOpen(false);
    setPayOrderId(null);
    setPaymentProof('');
  };

  const handleSaveFailReason = async () => {
    if (!failReason.trim()) {
      alert("Escribe el motivo.");
      return;
    }
    await handleUpdateOrderStatus(failOrderId, 'No se pudo entregar', { failReason: failReason, returnStatus: 'Pendiente Devolución' });
    setFailModalOpen(false);
    setFailOrderId(null);
    setFailReason('');
  };

  const handleSaveReturnProof = async () => {
    if (!returnProof) {
      alert("Sube el capture de la devolución.");
      return;
    }
    try {
      const orderRef = doc(db, 'orders', returnOrderId);
      await updateDoc(orderRef, { returnStatus: 'Devuelto', returnProof: returnProof });
      setReturnModalOpen(false);
      setReturnOrderId(null);
      setReturnProof('');
    } catch (err) {
      console.error("Error guardando devolución:", err);
    }
  };

  const handlePrintOrder = (orderToPrint) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = orderToPrint.items ? orderToPrint.items.map(item => 
      `<tr>
        <td style="padding: 4px; border-bottom: 1px solid #ddd;">${item.qty}x</td>
        <td style="padding: 4px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 4px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${(item.price * item.qty).toFixed(2)}</td>
      </tr>`
    ).join('') : '';

    printWindow.document.write(`
      <html>
        <head><title>Pedido PUNTO M</title></head>
        <body style="font-family: Arial; padding: 20px; font-size: 12px;">
          <h2>PUNTO M - RUC 20123456789</h2>
          <p><strong>Cliente:</strong> ${orderToPrint.clientName} (${orderToPrint.clientPhone || 'Sin teléfono'})</p>
          <p><strong>Horario de Entrega:</strong> ${orderToPrint.deliveryDate} a las ${orderToPrint.deliveryTime}</p>
          <p><strong>Estado:</strong> ${orderToPrint.status}</p>
          <table><tbody>${itemsHtml}</tbody></table>
          <h3>Total: S/ ${Number(orderToPrint.total).toFixed(2)}</h3>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const paidOrders = orders.filter(o => o.status === 'Pagado' || o.status === 'Alistado' || o.status === 'En Camino' || o.status === 'Entregado');
  const cashTotal = paidOrders.filter(o => o.paymentMethod === 'Efectivo').reduce((sum, o) => sum + Number(o.total), 0);
  const captureOrders = paidOrders.filter(o => o.paymentMethod === 'Transferencia / Capture');
  const captureSystemTotal = captureOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const manualCaptureParsed = parseFloat(manualCaptureSum) || 0;
  
  const returnOrders = orders.filter(o => o.status === 'No se pudo entregar');
  const totalRefunded = returnOrders
    .filter(o => o.returnStatus === 'Devuelto')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const grandTotalDay = cashTotal + manualCaptureParsed - totalRefunded;

  const handleCloseDay = () => {
    setDayClosed(true);
    setClosedDayData({
      date: new Date().toLocaleDateString(),
      totalClients: uniqueClients.length,
      cashTotal,
      captureTotal: manualCaptureParsed || captureSystemTotal,
      totalRefunded,
      grandTotal: grandTotalDay
    });
    alert("🔒 ¡Día cerrado con éxito! Los datos han sido consolidados.");
  };

  const uniqueClients = Array.from(new Set(orders.map(o => o.clientEmail || o.clientName))).filter(Boolean);
  const filteredOrders = selectedClientFilter === 'all' ? orders : orders.filter(o => (o.clientEmail === selectedClientFilter || o.clientName === selectedClientFilter));
  
  // Pedidos pertenecientes al cliente logueado
  const myOrders = user ? orders.filter(o => o.clientUid === user.uid || o.clientEmail === user.email) : [];

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
            {/* BOTÓN SEGUIMIENTO DE PEDIDOS PARA CLIENTES */}
            {user && (
              <button 
                onClick={() => setView('tracking')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${view === 'tracking' ? 'bg-[#fbc02d] text-black shadow' : 'bg-[#074825] hover:bg-green-700 text-white'}`}
              >
                <Truck size={16} /> 
                <span className="hidden sm:inline">Seguimiento</span>
                {myOrders.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {myOrders.length}
                  </span>
                )}
              </button>
            )}

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
                className="bg-[#fbc02d] text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400 transition shadow text-xs"
              >
                <User size={16} /> Entrar con Google
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
        {/* VISTA 1: CATÁLOGO DE PRODUCTOS */}
        {view === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
                <h3 className="font-bold text-sm text-green-900 mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-[#0b6b38]" /> Asistente de Pedidos IA
                </h3>
                <p className="text-xs text-gray-600 mb-2">Escribe lo que necesitas y la IA agregará lo disponible al carrito.</p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={clientPrompt}
                    onChange={e => setClientPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleClientAiOrder()}
                    placeholder={user ? "Escribe tu pedido aquí..." : "Inicia sesión para pedir con la IA..."}
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
                <div className="py-12 text-center text-gray-400 text-sm">El carrito está vacío.</div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
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

              <div className="mt-4 pt-3 border-t space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                    <Phone size={12} className="text-[#0b6b38]" /> Teléfono de contacto (Entrega): *
                  </label>
                  <input 
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="Ej. +58 412..."
                    className="w-full border p-2 rounded text-xs bg-white focus:ring-2 focus:ring-[#0b6b38]"
                  />
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg border text-xs space-y-2">
                  <p className="font-bold text-gray-700 flex items-center gap-1">
                    <Calendar size={14} className="text-[#0b6b38]" /> Entrega (Horario: 10:00 AM - 7:00 PM): *
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      min={todayStr}
                      value={deliveryDate} 
                      onChange={e => setDeliveryDate(e.target.value)} 
                      className="border p-1 rounded text-xs bg-white" 
                    />
                    <input 
                      type="time" 
                      min="10:00" 
                      max="19:00"
                      value={deliveryTime} 
                      onChange={e => setDeliveryTime(e.target.value)} 
                      className="border p-1 rounded text-xs bg-white" 
                    />
                  </div>
                </div>

                <div>
                  <button 
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                    className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition"
                  >
                    <MapPin size={15} /> {locationLoading ? 'Obteniendo GPS...' : clientLocation ? '✅ Ubicación obtenida' : 'Compartir mi Ubicación Actual'}
                  </button>
                </div>

                <div className="flex justify-between font-black text-sm text-gray-800">
                  <span>Total aproximado a pagar:</span>
                  <span className="text-[#0b6b38] text-base">S/ {cartTotal.toFixed(2)}</span>
                </div>
                
                <button 
                  disabled={cart.length === 0}
                  onClick={handleGenerateReceipt}
                  className="w-full bg-[#0b6b38] hover:bg-[#074825] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Generar Recibo y Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: SEGUIMIENTO DE PEDIDOS PARA EL CLIENTE */}
        {view === 'tracking' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
              <h2 className="font-bold text-xl text-gray-800 mb-2 flex items-center gap-2 border-b pb-3">
                <Truck className="text-[#0b6b38]" /> Seguimiento de Mis Pedidos
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Consulta el estado de preparación y despacho de tus pedidos en tiempo real.
              </p>

              {myOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border">
                  <ShoppingBag size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-600">No tienes pedidos activos actualmente.</p>
                  <button onClick={() => setView('catalog')} className="mt-3 bg-[#0b6b38] text-white px-4 py-2 rounded-lg text-xs font-bold">
                    Ir al Catálogo a Comprar
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myOrders.map(order => {
                    // Mapeo de avance de estados (0 a 100%)
                    let stepIndex = 1;
                    if (order.status === 'Pagado') stepIndex = 2;
                    if (order.status === 'Alistado') stepIndex = 3;
                    if (order.status === 'En Camino') stepIndex = 4;
                    if (order.status === 'Entregado') stepIndex = 5;
                    const isFailed = order.status === 'No se pudo entregar' || order.status === 'Cancelado';

                    return (
                      <div key={order.id} className="border rounded-2xl p-5 bg-white shadow-sm space-y-4 hover:border-green-300 transition">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                          <div>
                            <p className="font-bold text-sm text-gray-800">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-gray-500">Entrega programada: <strong>{order.deliveryDate}</strong> a las <strong>{order.deliveryTime}</strong></p>
                          </div>
                          <span className={`px-3 py-1 rounded-full font-black text-xs ${
                            order.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            order.status === 'Pagado' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            order.status === 'Alistado' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            order.status === 'En Camino' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                            order.status === 'Entregado' ? 'bg-green-100 text-green-800 border border-green-300' :
                            'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* LÍNEA DE TIEMPO Y PROGRESO DE ESTADO */}
                        {!isFailed ? (
                          <div className="py-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-2">
                              <span className={stepIndex >= 1 ? 'text-[#0b6b38]' : ''}>1. Registrado</span>
                              <span className={stepIndex >= 2 ? 'text-blue-600' : ''}>2. Pagado</span>
                              <span className={stepIndex >= 3 ? 'text-purple-600' : ''}>3. Alistado</span>
                              <span className={stepIndex >= 4 ? 'text-indigo-600' : ''}>4. En Camino</span>
                              <span className={stepIndex >= 5 ? 'text-green-600' : ''}>5. Entregado</span>
                            </div>

                            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  stepIndex === 5 ? 'bg-green-600' :
                                  stepIndex === 4 ? 'bg-indigo-600' :
                                  stepIndex === 3 ? 'bg-purple-600' :
                                  stepIndex === 2 ? 'bg-blue-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${(stepIndex / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800">
                            <p className="font-bold">⚠️ El pedido no pudo ser entregado o fue cancelado.</p>
                            {order.failReason && <p className="mt-1">Motivo: {order.failReason}</p>}
                            {order.returnStatus && <p className="mt-1 font-bold">Estado de reembolso: {order.returnStatus}</p>}
                          </div>
                        )}

                        {/* DETALLES DE ITEMS */}
                        <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-gray-700">Productos comprados:</p>
                          <p className="text-gray-600">{order.items ? order.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Sin detalle'}</p>
                          <div className="flex justify-between items-center border-t pt-2 mt-2 font-bold text-gray-800">
                            <span>Monto Total:</span>
                            <span className="text-green-800 text-sm">S/ {Number(order.total).toFixed(2)}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA 3: RECIBO */}
        {view === 'receipt' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
            <div className="text-center border-b pb-4 mb-4">
              <div className="inline-block bg-[#0b6b38] px-4 py-1 rounded text-white font-black text-xl mb-1">
                {companyHeader.name} <span className="text-[#fbc02d]">.</span>
              </div>
              <p className="text-xs font-mono text-gray-600">{companyHeader.rif}</p>
              <p className="text-xs text-gray-500">Tel: {companyHeader.phone}</p>
              <p className="text-xs font-bold text-[#0b6b38] mt-2">Cliente: {user?.name} | Telf: {clientPhone}</p>
              <p className="text-xs text-gray-600 mt-1">Horario Atención Tienda: 10:00 AM - 7:00 PM</p>
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
              <p className="text-xs text-gray-500 font-bold">TOTAL APROXIMADO A PAGAR:</p>
              <p className="text-2xl font-black text-[#0b6b38]">S/ {cartTotal.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <a 
                href={`https://wa.me/584245719928?text=${encodeURIComponent(
                  `🛒 *NUEVO PEDIDO - PUNTO M*\n` +
                  `👤 *Cliente:* ${user ? user.name : 'Cliente'}\n` +
                  `📞 *Teléfono:* ${clientPhone}\n` +
                  `📅 *Entrega:* ${deliveryDate} a las ${deliveryTime} (Horario tienda 10am-7pm)\n` +
                  `-----------------------------------\n` +
                  `📋 *Detalle:*\n` + cart.map(i => `• ${i.qty}x ${i.name} - S/ ${(i.price * i.qty).toFixed(2)}`).join('\n') + `\n` +
                  `-----------------------------------\n` +
                  `💰 *Total:* S/ ${cartTotal.toFixed(2)}\n` +
                  (clientLocation ? `📍 *Ubicación:*\n${clientLocation.mapUrl}` : '')
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-center flex items-center justify-center gap-2 text-sm shadow transition"
              >
                <Phone size={18} /> Enviar Pedido por WhatsApp (+58 424-5719928)
              </a>
              <button onClick={() => setView('tracking')} className="w-full bg-[#0b6b38] text-white font-bold py-2.5 rounded-lg text-sm shadow">
                Ver Seguimiento de mi Pedido
              </button>
              <button onClick={() => setView('catalog')} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm">
                Volver al Catálogo
              </button>
            </div>
          </div>
        )}

        {/* VISTA 4: PANEL ADMIN CON NUEVOS BOTONES (ALISTADO Y EN CAMINO) */}
        {view === 'admin' && userRole === 'admin' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 gap-3">
                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <Settings className="text-[#0b6b38]" /> Panel de Administración PUNTO M
                </h2>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleResetToFactorySettings}
                    disabled={isResetting}
                    className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow transition"
                  >
                    <RotateCcw size={14} /> {isResetting ? 'Restaurando...' : 'Restaurar Valores de Fábrica'}
                  </button>

                  <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold gap-1">
                    <button 
                      onClick={() => setAdminSubTab('orders')}
                      className={`px-3 py-2 rounded-lg transition ${adminSubTab === 'orders' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                      📦 Pedidos
                    </button>
                    <button 
                      onClick={() => setAdminSubTab('accounting')}
                      className={`px-3 py-2 rounded-lg transition ${adminSubTab === 'accounting' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                      📊 Contabilidad
                    </button>
                    <button 
                      onClick={() => setAdminSubTab('returns')}
                      className={`px-3 py-2 rounded-lg transition ${adminSubTab === 'returns' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                      🔄 Devoluciones ({orders.filter(o => o.status === 'No se pudo entregar').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* PESTAÑA 1 ADMIN: PEDIDOS CON CAMBIOS DE ESTADO */}
              {adminSubTab === 'orders' && (
                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                      <History size={18} className="text-[#0b6b38]" /> Historial e Ítems por Cliente
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">Filtrar Cliente:</span>
                      <select 
                        value={selectedClientFilter} 
                        onChange={e => setSelectedClientFilter(e.target.value)}
                        className="border p-1.5 rounded text-xs bg-gray-50 focus:ring-2 focus:ring-[#0b6b38]"
                      >
                        <option value="all">Todos ({orders.length})</option>
                        {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg text-center">No hay pedidos registrados.</p>
                  ) : (
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                      {filteredOrders.map(order => (
                        <div key={order.id} className="border p-4 rounded-xl bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:border-green-300 transition">
                          <div className="space-y-1 text-xs flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-800">{order.clientName}</span>
                              <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                                order.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                order.status === 'Pagado' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                order.status === 'Alistado' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                order.status === 'En Camino' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                                order.status === 'Completado' || order.status === 'Entregado' ? 'bg-green-100 text-green-800 border border-green-300' : 
                                'bg-red-100 text-red-800 border border-red-300'
                              }`}>{order.status}</span>
                            </div>
                            <p className="text-gray-500">📞 Telf: {order.clientPhone || 'No registrado'} | Email: {order.clientEmail || 'N/A'}</p>
                            <p className="text-gray-700 font-bold flex items-center gap-1">
                              <Calendar size={12} className="text-[#0b6b38]" /> Entrega: {order.deliveryDate} a las {order.deliveryTime}
                            </p>
                            <p className="text-gray-600 font-medium">Items: {order.items ? order.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Sin detalle'}</p>
                            <p className="font-bold text-green-800 text-xs">Total aprox: S/ {Number(order.total).toFixed(2)}</p>
                            
                            {order.paymentMethod && <p className="text-blue-700 font-semibold text-[11px]">💳 Pago: {order.paymentMethod}</p>}
                            {order.paymentProof && (
                              <button onClick={() => setPreviewImage(order.paymentProof)} className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1 mt-1">
                                <Eye size={14} /> Ver Capture de Pago
                              </button>
                            )}
                            {order.failReason && <p className="text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-200 mt-1">⚠️ No entrega: {order.failReason}</p>}
                          </div>

                          {/* BOTONES DE CAMBIO DE ESTADO (ALISTADO Y EN CAMINO) */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => handlePrintOrder(order)} className="bg-gray-800 hover:bg-black text-white p-2 rounded-lg text-xs flex items-center gap-1 font-bold">
                              <Printer size={14} /> Imprimir
                            </button>
                            
                            {order.status === 'Pendiente' && (
                              <button onClick={() => { setPayOrderId(order.id); setPayModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                <CreditCard size={14} /> Marcar Pagado
                              </button>
                            )}

                            {(order.status === 'Pagado' || order.status === 'Pendiente') && (
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'Alistado')}
                                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1"
                                title="Marcar como Alistado para entrega"
                              >
                                <PackageCheck size={14} /> Alistado
                              </button>
                            )}

                            {(order.status === 'Pagado' || order.status === 'Alistado') && (
                              <button 
                                onClick={() => handleUpdateOrderStatus(order.id, 'En Camino')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1"
                                title="Marcar como En Camino"
                              >
                                <Truck size={14} /> En Camino
                              </button>
                            )}

                            {(order.status === 'Pagado' || order.status === 'Alistado' || order.status === 'En Camino') && (
                              <>
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'Entregado')} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <CheckCircle size={14} /> Entregado
                                </button>
                                <button onClick={() => { setFailOrderId(order.id); setFailModalOpen(true); }} className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <AlertTriangle size={14} /> No se pudo entregar
                                </button>
                              </>
                            )}

                            {order.status !== 'Entregado' && order.status !== 'Cancelado' && order.status !== 'No se pudo entregar' && (
                              <button onClick={() => handleUpdateOrderStatus(order.id, 'Cancelado')} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                <XCircle size={14} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA CONTABILIDAD */}
              {adminSubTab === 'accounting' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h3 className="font-black text-lg text-green-900 flex items-center gap-2">
                        <PieChart size={22} className="text-[#0b6b38]" /> Resumen Contable Diario
                      </h3>
                      <p className="text-xs text-green-800 mt-1">Cálculo de ingresos en efectivo, captures y deducción de devoluciones.</p>
                    </div>

                    <button 
                      onClick={handleCloseDay}
                      disabled={dayClosed}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow transition"
                    >
                      <Lock size={16} /> {dayClosed ? 'Día Cerrado' : 'Cerrar Día'}
                    </button>
                  </div>

                  {dayClosed && closedDayData && (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl text-xs text-amber-900 space-y-1">
                      <p className="font-bold text-sm">🔒 Cierre de Día Realizado ({closedDayData.date})</p>
                      <p>• Clientes atendidos: {closedDayData.totalClients}</p>
                      <p>• Total Efectivo: S/ {closedDayData.cashTotal.toFixed(2)}</p>
                      <p>• Total Captures: S/ {closedDayData.captureTotal.toFixed(2)}</p>
                      <p>• Total Restado por Devoluciones: - S/ {closedDayData.totalRefunded.toFixed(2)}</p>
                      <p className="font-black text-base text-green-800 mt-2">Gran Total Final del Día: S/ {closedDayData.grandTotal.toFixed(2)}</p>
                    </div>
                  )}

                  <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
                    <h4 className="font-bold text-sm text-gray-800">Compras y Pagos Organizados por Clientes</h4>
                    {paidOrders.length === 0 ? (
                      <p className="text-xs text-gray-400">No hay pagos registrados hoy.</p>
                    ) : (
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {uniqueClients.map(client => {
                          const clientOrders = paidOrders.filter(o => o.clientEmail === client || o.clientName === client);
                          if (clientOrders.length === 0) return null;
                          const clientTotal = clientOrders.reduce((sum, o) => sum + Number(o.total), 0);
                          return (
                            <div key={client} className="bg-white p-3 rounded-lg border text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-800">{clientOrders[0].clientName} ({client})</p>
                                <p className="text-gray-500">{clientOrders.length} pedido(s) pagados | Métodos: {clientOrders.map(o => o.paymentMethod).join(', ')}</p>
                              </div>
                              <span className="font-black text-green-800 text-sm">S/ {clientTotal.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-4 rounded-xl bg-white space-y-2 text-xs">
                      <p className="font-bold text-gray-700">💵 Total Pagos en Efectivo:</p>
                      <p className="text-xl font-black text-green-700">S/ {cashTotal.toFixed(2)}</p>
                    </div>

                    <div className="border p-4 rounded-xl bg-white space-y-2 text-xs">
                      <p className="font-bold text-gray-700">📥 Sumatoria Manual de Captures de Pago:</p>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          step="0.01"
                          value={manualCaptureSum}
                          onChange={e => setManualCaptureSum(e.target.value)}
                          placeholder="Ingrese monto total de captures..."
                          className="border p-2 rounded flex-1 text-xs bg-gray-50"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">Sistema automático por capture: S/ {captureSystemTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-[#0b6b38] text-white p-6 rounded-2xl shadow flex justify-between items-center">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-green-200 font-bold">Sumatoria Total Final del Día</p>
                      <p className="text-3xl font-black mt-1">S/ {grandTotalDay.toFixed(2)}</p>
                      {totalRefunded > 0 && <p className="text-xs text-amber-200 mt-1">(Incluye -S/ {totalRefunded.toFixed(2)} restados por devoluciones)</p>}
                    </div>
                    <DollarSign size={40} className="text-[#fbc02d]" />
                  </div>
                </div>
              )}

              {/* PESTAÑA DEVOLUCIONES */}
              {adminSubTab === 'returns' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                    <RefreshCw size={18} className="text-red-600" /> Pedidos No Entregados y Gestión de Devoluciones
                  </h3>

                  {returnOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg text-center">No hay devoluciones registradas.</p>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto">
                      {returnOrders.map(order => (
                        <div key={order.id} className="border border-red-200 p-4 rounded-xl bg-red-50 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                          <div className="space-y-1 text-xs flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-800">{order.clientName}</span>
                              <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${order.returnStatus === 'Devuelto' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {order.returnStatus || 'Pendiente Devolución'}
                              </span>
                            </div>
                            <p className="text-red-700 font-bold">⚠️ Motivo: {order.failReason}</p>
                            <p className="text-gray-600">Monto a devolver: <strong>S/ {Number(order.total).toFixed(2)}</strong></p>
                            
                            {order.returnProof && (
                              <button onClick={() => setPreviewImage(order.returnProof)} className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1 mt-1">
                                <Eye size={14} /> Ver Capture del Reembolso Enviado
                              </button>
                            )}
                          </div>

                          <div>
                            {order.returnStatus !== 'Devuelto' ? (
                              <button 
                                onClick={() => { setReturnOrderId(order.id); setReturnModalOpen(true); }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow flex items-center gap-1"
                              >
                                <CreditCard size={14} /> Marcar como Devuelto y Subir Capture
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg border border-green-300">
                                ✅ Dinero Devuelto (Restado del día)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-green-50 p-5 rounded-xl border border-green-200 mt-8 mb-6">
                <h3 className="font-bold text-sm text-green-900 mb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#0b6b38]" /> Importador Inteligente Gemini IA
                </h3>
                <textarea 
                  rows="3"
                  value={aiFileText}
                  onChange={e => setAiFileText(e.target.value)}
                  placeholder="Pega el texto de inventario..."
                  className="w-full border p-2 rounded-lg text-xs mb-2 bg-white"
                ></textarea>
                <button onClick={handleProcessAiFileWithGemini} disabled={isProcessingFile} className="bg-[#0b6b38] text-white font-bold px-4 py-2 rounded-lg text-xs">
                  {isProcessingFile ? 'Analizando...' : 'Analizar e Importar'}
                </button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Agregar Producto Manual</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <input type="text" placeholder="Nombre" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="border p-2 rounded text-xs" />
                  <input type="number" placeholder="Precio S/" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="border p-2 rounded text-xs" />
                  <input type="text" placeholder="URL Imagen" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="border p-2 rounded text-xs" />
                  <button onClick={async () => {
                    if (!newProduct.name || !newProduct.price) return;
                    await addDoc(collection(db, 'products'), {
                      name: newProduct.name, price: parseFloat(newProduct.price), category: 'Viveres', image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300', createdAt: new Date()
                    });
                    setNewProduct({ name: '', price: '', category: 'Viveres', image: '' });
                    alert("Guardado.");
                  }} className="bg-[#0b6b38] text-white font-bold p-2 rounded text-xs">Guardar</button>
                </div>
                <label className="cursor-pointer bg-gray-200 text-gray-800 text-xs font-bold py-1.5 px-3 rounded inline-flex items-center gap-1">
                  <ImageIcon size={14} /> Subir imagen desde PC
                  <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                </label>
              </div>

            </div>
          </div>
        )}

        {payModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-blue-700 flex items-center gap-2"><CreditCard size={20} /> Registrar Pago</h3>
              <button onClick={handlePayCash} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-xs shadow">💵 Pagó en Efectivo</button>
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-bold text-gray-700">Subir Capture:</p>
                <label className="cursor-pointer bg-gray-100 border-2 border-dashed border-gray-300 text-xs font-bold py-3 px-3 rounded-xl flex flex-col items-center justify-center">
                  <Upload size={18} /> {paymentProof ? '✅ Capture seleccionado' : 'Seleccionar imagen'}
                  <input type="file" accept="image/*" onChange={handlePaymentProofUpload} className="hidden" />
                </label>
                {paymentProof && <button onClick={handlePayCapture} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs shadow mt-2">📤 Guardar con Capture</button>}
              </div>
              <button onClick={() => { setPayModalOpen(false); setPaymentProof(''); }} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-xs">Cancelar</button>
            </div>
          </div>
        )}

        {failModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-red-600 flex items-center gap-2"><AlertTriangle size={20} /> Explicación de No Entrega</h3>
              <textarea rows="3" value={failReason} onChange={e => setFailReason(e.target.value)} placeholder="Motivo..." className="w-full border p-3 rounded-lg text-xs"></textarea>
              <div className="flex justify-end gap-2">
                <button onClick={() => setFailModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg text-xs">Cancelar</button>
                <button onClick={handleSaveFailReason} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {returnModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-green-700 flex items-center gap-2"><RefreshCw size={20} /> Devolución de Dinero</h3>
              <p className="text-xs text-gray-600">Sube el capture del reembolso enviado al cliente para restarlo automáticamente del día:</p>
              <label className="cursor-pointer bg-gray-100 border-2 border-dashed border-gray-300 text-xs font-bold py-3 px-3 rounded-xl flex flex-col items-center justify-center">
                <Upload size={18} /> {returnProof ? '✅ Capture de devolución listo' : 'Subir capture de transferencia de devolución'}
                <input type="file" accept="image/*" onChange={handleReturnProofUpload} className="hidden" />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setReturnModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg text-xs">Cancelar</button>
                <button onClick={handleSaveReturnProof} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Confirmar Devolución</button>
              </div>
            </div>
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
            <div className="bg-white p-4 rounded-2xl max-w-lg w-full shadow-2xl relative space-y-3">
              <div className="flex justify-center max-h-[70vh] overflow-auto">
                <img src={previewImage} alt="Comprobante" className="max-w-full rounded-lg object-contain" />
              </div>
              <button onClick={() => setPreviewImage(null)} className="w-full bg-gray-800 text-white font-bold py-2 rounded-lg text-xs">Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
