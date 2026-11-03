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
  PackageCheck,
  Camera,
  Receipt,
  ArrowLeft,
  ShieldAlert,
  Unlock
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
  const [view, setView] = useState('catalog'); 
  const [adminSubTab, setAdminSubTab] = useState('orders');
  
  const [products, setProducts] = useState(BASE_PRODUCTS.map((p, i) => ({ id: String(i + 1), ...p })));
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('Efectivo');
  const [paymentTiming, setPaymentTiming] = useState('Contra Entrega');

  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const [failModalOpen, setFailModalOpen] = useState(false);
  const [failOrderId, setFailOrderId] = useState(null);
  const [failReason, setFailReason] = useState('');

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payOrderId, setPayOrderId] = useState(null);
  const [selectedPayMethodAdmin, setSelectedPayMethodAdmin] = useState('');
  const [cashPhoto, setCashPhoto] = useState('');

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);
  const [invoicePhoto, setInvoicePhoto] = useState('');

  const [finalAmountModalOpen, setFinalAmountModalOpen] = useState(false);
  const [finalAmountOrderId, setFinalAmountOrderId] = useState(null);
  const [exactFinalAmount, setExactFinalAmount] = useState('');

  const [corruptModalOpen, setCorruptModalOpen] = useState(false);
  const [corruptOrderId, setCorruptOrderId] = useState(null);
  const [corruptReason, setCorruptReason] = useState('');
  const [corruptPhoto, setCorruptPhoto] = useState('');

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnProof, setReturnProof] = useState('');

  const [previewImage, setPreviewImage] = useState(null);

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

  const [clientPrompt, setClientPrompt] = useState('');
  const [isAiOrdering, setIsAiOrdering] = useState(false);
  const [aiOrderFeedback, setAiOrderFeedback] = useState('');

  const [clientLocation, setClientLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // FUNCIÓN PARA CALCULAR LA HORA MÍNIMA PERMITIDA (AÑADIENDO 40 MINUTOS SI HAY PEDIDOS CERCANOS)
  const getMinAvailableTime = () => {
    if (!deliveryDate) return "10:00";
    
    // Filtramos los pedidos activos para la fecha seleccionada
    const ordersOnDate = orders.filter(o => o.deliveryDate === deliveryDate && o.deliveryTime && !o.isCorrupt && o.status !== 'Cancelado' && o.status !== 'No se pudo entregar');
    if (ordersOnDate.length === 0) return "10:00";

    // Buscamos la hora más tardía agendada para ese día
    let latestTimeMinutes = 600; // 10:00 AM en minutos (10 * 60)
    ordersOnDate.forEach(ord => {
      const [hours, minutes] = ord.deliveryTime.split(':').map(Number);
      const totalMins = hours * 60 + (minutes || 0);
      if (totalMins > latestTimeMinutes) {
        latestTimeMinutes = totalMins;
      }
    });

    // Sumamos 40 minutos de margen por alta demanda
    const adjustedMinutes = latestTimeMinutes + 40;
    const finalHours = Math.floor(adjustedMinutes / 60);
    const finalMins = adjustedMinutes % 60;

    // Formateamos a HH:MM (limitado hasta las 19:00 / 7 PM)
    if (finalHours >= 19) return "19:00";
    const formattedH = String(finalHours).padStart(2, '0');
    const formattedM = String(finalMins).padStart(2, '0');
    return `${formattedH}:${formattedM}`;
  };

  const minTimeAllowed = getMinAvailableTime();

  const handleTimeChange = (e) => {
    const chosenTime = e.target.value;
    if (chosenTime < minTimeAllowed && minTimeAllowed !== "10:00") {
      alert(`⚠️ ¡Alta demanda en este horario!\n\nPara brindarle la mejor atención, hemos asignado un margen de 40 minutos adicionales respecto a los pedidos anteriores. La hora mínima disponible para su selección es a partir de las ${minTimeAllowed}.`);
      setDeliveryTime(minTimeAllowed);
    } else {
      setDeliveryTime(chosenTime);
    }
  };

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
      "⚠️ ¿Estás seguro de restablecer los valores de fábrica?\n\nEsta acción eliminará TODOS los pedidos actuales y restaurará el catálogo inicial."
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
        await addDoc(collection(db, 'products'), { ...baseProd, createdAt: new Date() });
      }

      setCart([]);
      setOrders([]);
      setCurrentOrderId(null);
      setManualCaptureSum('');
      setDayClosed(false);
      setClosedDayData(null);
      setSelectedClientFilter('all');
      alert("🔄 ¡Valores de fábrica restaurados con éxito!");
    } catch (error) {
      console.error("Error al restablecer:", error);
      alert("Hubo un error al restablecer la base de datos.");
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
    if (!navigator.geolocation) return;
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
      () => setLocationLoading(false)
    );
  };

  const handleGenerateReceipt = async () => {
    if (!user) {
      alert("⚠️ Debe iniciar sesión obligatoriamente.");
      handleLogin();
      return;
    }
    if (!clientPhone.trim()) {
      alert("⚠️ Ingrese su número de teléfono.");
      return;
    }
    if (!deliveryDate || !deliveryTime) {
      alert("⚠️ Seleccione fecha y hora.");
      return;
    }

    if (cart.length === 0) return;

    const orderData = {
      clientUid: user.uid,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone: clientPhone,
      items: cart,
      approxTotal: cartTotal,
      total: cartTotal,
      hasExactAmount: false,
      location: clientLocation || null,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      paymentPreference: paymentPreference,
      paymentTiming: paymentTiming,
      status: 'Pendiente',
      isPaid: false,
      paymentMethod: '',
      invoicePhoto: '',
      cashPhoto: '',
      isCorrupt: false,
      corruptReason: '',
      corruptPhoto: '',
      failReason: '',
      returnStatus: 'No aplica',
      returnProof: '',
      updatedAt: new Date()
    };

    try {
      if (currentOrderId) {
        const orderRef = doc(db, 'orders', currentOrderId);
        await updateDoc(orderRef, orderData);
      } else {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          createdAt: new Date()
        });
        setCurrentOrderId(docRef.id);
      }
      setWhatsappSent(false);
      setView('receipt');
    } catch (err) {
      console.error(err);
      setView('receipt');
    }
  };

  const handleInvoicePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setInvoicePhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCashPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCashPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCorruptPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCorruptPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleReturnProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReturnProof(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleClientAiOrder = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    if (!clientPrompt.trim()) return;

    setIsAiOrdering(true);
    try {
      const textLower = clientPrompt.toLowerCase();
      products.forEach(prod => {
        const prodNameLower = prod.name.toLowerCase();
        if (textLower.includes(prodNameLower.split(' ')[0])) {
          addToCart(prod);
        }
      });
      setAiOrderFeedback("✅ ¡Productos agregados al carrito!");
      setClientPrompt('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiOrdering(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, ...extraData });
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmAdminPayment = async () => {
    if (!selectedPayMethodAdmin) {
      alert("Selecciona la opción de pago.");
      return;
    }
    if (selectedPayMethodAdmin === 'Efectivo' && !cashPhoto) {
      alert("⚠️ Sube la foto del efectivo recibido.");
      return;
    }

    await handleUpdateOrderStatus(payOrderId, 'Pagado', {
      isPaid: true,
      paymentMethod: selectedPayMethodAdmin,
      cashPhoto: selectedPayMethodAdmin === 'Efectivo' ? cashPhoto : ''
    });

    setPayModalOpen(false);
    setPayOrderId(null);
    setCashPhoto('');
    setSelectedPayMethodAdmin('');
  };

  const handleSaveInvoice = async () => {
    if (!invoicePhoto) {
      alert("⚠️ Sube la foto o archivo de la factura.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', invoiceOrderId);
      await updateDoc(orderRef, {
        invoicePhoto: invoicePhoto,
        status: 'Facturado'
      });
      setInvoiceModalOpen(false);
      setInvoiceOrderId(null);
      setInvoicePhoto('');
      alert("✅ ¡Factura subida con éxito!");
    } catch (err) {
      console.error(err);
      alert("Error al subir la factura.");
    }
  };

  const handleSaveFinalAmount = async () => {
    const parsedAmount = parseFloat(exactFinalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("⚠️ Ingresa un monto definitivo válido.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', finalAmountOrderId);
      await updateDoc(orderRef, {
        total: parsedAmount,
        hasExactAmount: true
      });
      setFinalAmountModalOpen(false);
      setFinalAmountOrderId(null);
      setExactFinalAmount('');
      alert("✅ ¡Monto definitivo guardado con éxito!");
    } catch (err) {
      console.error(err);
      alert("Error al guardar el monto.");
    }
  };

  const handleSaveCorruptPayment = async () => {
    if (!corruptReason.trim()) {
      alert("⚠️ Especifique el motivo del pago corrupto.");
      return;
    }
    if (!corruptPhoto) {
      alert("⚠️ Suba la foto del pago o efectivo.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', corruptOrderId);
      await updateDoc(orderRef, {
        isCorrupt: true,
        corruptReason: corruptReason,
        corruptPhoto: corruptPhoto,
        status: 'Pago Corrupto'
      });
      setCorruptModalOpen(false);
      setCorruptOrderId(null);
      setCorruptReason('');
      setCorruptPhoto('');
      alert("🚫 Cliente bloqueado por Pago Corrupto registrado.");
    } catch (err) {
      console.error(err);
      alert("Error al registrar el pago corrupto.");
    }
  };

  const handleUnlockAndPayCorrupt = async (orderId) => {
    const confirmUnlock = window.confirm("🔓 ¿Deseas desbloquear a este cliente y registrar su pago como correcto? Esto devolverá el caso al historial normal.");
    if (!confirmUnlock) return;

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        isCorrupt: false,
        isPaid: true,
        status: 'Facturado'
      });
      alert("✅ ¡Cliente desbloqueado y pago registrado correctamente!");
    } catch (err) {
      console.error(err);
      alert("Error al desbloquear.");
    }
  };

  const handleSaveFailReason = async () => {
    if (!failReason.trim()) return;
    await handleUpdateOrderStatus(failOrderId, 'No se pudo entregar', { failReason: failReason, returnStatus: 'Pendiente Devolución' });
    setFailModalOpen(false);
    setFailOrderId(null);
    setFailReason('');
  };

  const handleSaveReturnProof = async () => {
    if (!returnProof) return;
    try {
      const orderRef = doc(db, 'orders', returnOrderId);
      await updateDoc(orderRef, { returnStatus: 'Devuelto', returnProof: returnProof });
      setReturnModalOpen(false);
      setReturnOrderId(null);
      setReturnProof('');
    } catch (err) {
      console.error(err);
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
          <p><strong>Método de Pago:</strong> ${orderToPrint.paymentPreference} (${orderToPrint.paymentTiming})</p>
          <p><strong>Estado de Pago:</strong> ${orderToPrint.isPaid ? 'Pagado' : 'Pendiente'}</p>
          <table><tbody>${itemsHtml}</tbody></table>
          <h3>Total: S/ ${Number(orderToPrint.total).toFixed(2)}</h3>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const paidOrders = orders.filter(o => (o.isPaid === true || o.status === 'Facturado' || o.status === 'Entregado') && !o.isCorrupt);
  const cashTotal = paidOrders.filter(o => o.paymentMethod === 'Efectivo').reduce((sum, o) => sum + Number(o.total || o.approxTotal || 0), 0);
  const captureOrders = paidOrders.filter(o => o.paymentMethod?.includes('Digital') || o.paymentMethod?.includes('Capture'));
  const captureSystemTotal = captureOrders.reduce((sum, o) => sum + Number(o.total || o.approxTotal || 0), 0);
  const manualCaptureParsed = parseFloat(manualCaptureSum) || 0;
  
  const returnOrders = orders.filter(o => o.status === 'No se pudo entregar');
  const totalRefunded = returnOrders.filter(o => o.returnStatus === 'Devuelto').reduce((sum, o) => sum + Number(o.total || o.approxTotal || 0), 0);
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
    alert("🔒 ¡Día cerrado!");
  };

  const uniqueClients = Array.from(new Set(orders.map(o => o.clientEmail || o.clientName))).filter(Boolean);
  const filteredOrders = selectedClientFilter === 'all' ? orders.filter(o => !o.isCorrupt) : orders.filter(o => !o.isCorrupt && (o.clientEmail === selectedClientFilter || o.clientName === selectedClientFilter));
  const corruptOrdersList = orders.filter(o => o.isCorrupt === true);
  const myOrders = user ? orders.filter(o => o.clientUid === user.uid || o.clientEmail === user.email) : [];
  
  const clientBlockedOrder = myOrders.find(o => o.isCorrupt === true);

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
              <button onClick={handleLogin} className="bg-[#fbc02d] text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400 transition shadow text-xs">
                <User size={16} /> Entrar con Google
              </button>
            )}

            <button onClick={() => setView('catalog')} className="relative bg-white text-[#0b6b38] p-2 rounded-full font-bold shadow hover:bg-gray-100">
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
        {clientBlockedOrder && userRole !== 'admin' ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl border text-center space-y-4 my-12">
            <div className="bg-red-100 text-red-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <h2 className="font-black text-xl text-red-700">¡Acceso Restringido / Incidencia de Pago!</h2>
            <p className="text-xs text-gray-600">
              Por favor comunicarse con este número, hubo un inconveniente con su pago.
            </p>
            {clientBlockedOrder.corruptReason && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-left">
                <p className="font-bold text-red-800">Motivo registrado:</p>
                <p className="text-gray-700">{clientBlockedOrder.corruptReason}</p>
                {clientBlockedOrder.corruptPhoto && (
                  <button onClick={() => setPreviewImage(clientBlockedOrder.corruptPhoto)} className="mt-2 text-xs text-blue-600 underline font-bold flex items-center gap-1 cursor-pointer">
                    <Eye size={14} /> Ver comprobante con incidencia
                  </button>
                )}
              </div>
            )}
            <div className="pt-2">
              <a 
                href={`https://wa.me/584245719928?text=${encodeURIComponent(
                  `Hola, soy el cliente *${user?.name || 'Cliente'}* (Telf: ${clientBlockedOrder.clientPhone || 'No registrado'}). Quisiera saber qué pasó con mi pago ya que me aparece una incidencia en la aplicación.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2 text-xs shadow transition"
              >
                <Phone size={16} /> Comunicarse por WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <>
            {view === 'catalog' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
                    <h3 className="font-bold text-sm text-green-900 mb-1 flex items-center gap-2">
                      <Sparkles size={16} className="text-[#0b6b38]" /> Asistente de Pedidos IA
                    </h3>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={clientPrompt}
                        onChange={e => setClientPrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleClientAiOrder()}
                        placeholder="Escribe tu pedido..."
                        className="flex-1 border p-2 rounded-lg text-xs"
                      />
                      <button onClick={handleClientAiOrder} disabled={isAiOrdering} className="bg-[#0b6b38] text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1">
                        <Send size={14} /> Pedir
                      </button>
                    </div>
                    {aiOrderFeedback && <div className="mt-2 text-xs bg-amber-50 border p-2 rounded-lg">{aiOrderFeedback}</div>}
                  </div>

                  <div>
                    <h2 className="font-bold text-xl mb-4 text-gray-800">Catálogo de Productos (S/)</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {products.map(prod => (
                        <div key={prod.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition flex flex-col justify-between">
                          <img src={prod.image} alt={prod.name} className="h-32 w-full object-cover" />
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">{prod.category}</span>
                              <h3 className="font-bold text-sm text-gray-800 mt-1">{prod.name}</h3>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="font-black text-green-800 text-base">S/ {Number(prod.price).toFixed(2)}</span>
                              <button onClick={() => addToCart(prod)} className="bg-[#0b6b38] text-white p-2 rounded-lg"><Plus size={16} /></button>
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
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] pr-1">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border">
                          <div className="text-xs">
                            <p className="font-bold text-gray-800">{item.name}</p>
                            <p className="text-gray-500">S/ {Number(item.price).toFixed(2)} x {item.qty}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-green-800">S/ {(item.price * item.qty).toFixed(2)}</span>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-500"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 mb-1">Teléfono: *</label>
                      <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Ej. +58 412..." className="w-full border p-2 rounded text-xs bg-white" />
                    </div>

                    <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-xs space-y-2">
                      <p className="font-bold text-blue-900 flex items-center gap-1"><CreditCard size={14} /> Método de Pago:</p>
                      <select value={paymentPreference} onChange={e => setPaymentPreference(e.target.value)} className="w-full border p-1.5 rounded text-xs bg-white">
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Tarjeta">💳 Tarjeta</option>
                        <option value="Pago Digital">📱 Pago Digital (Yape / Transferencia)</option>
                      </select>

                      <select value={paymentTiming} onChange={e => setPaymentTiming(e.target.value)} className="w-full border p-1.5 rounded text-xs bg-white">
                        <option value="Contra Entrega">🚚 Contra Entrega</option>
                        <option value="Instantáneo">⚡ Instantáneo</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg border text-xs space-y-2">
                      <p className="font-bold text-gray-700 flex items-center gap-1"><Calendar size={14} /> Entrega (10 AM - 7 PM): *</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" min={todayStr} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="border p-1 rounded text-xs bg-white" />
                        <input 
                          type="time" 
                          min={minTimeAllowed} 
                          max="19:00" 
                          value={deliveryTime} 
                          onChange={handleTimeChange} 
                          className="border p-1 rounded text-xs bg-white" 
                        />
                      </div>
                      {deliveryDate && (
                        <p className="text-[10px] text-amber-800 font-medium mt-1">
                          ⏰ Horario mínimo sugerido por alta demanda: <strong>{minTimeAllowed}</strong>
                        </p>
                      )}
                    </div>

                    <button onClick={handleGetLocation} disabled={locationLoading} className="w-full bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg text-xs flex items-center justify-center gap-2">
                      <MapPin size={15} /> {clientLocation ? '✅ Ubicación obtenida' : 'Compartir Ubicación'}
                    </button>

                    <div className="flex justify-between font-black text-sm text-gray-800">
                      <span>Total aproximado por compra:</span>
                      <span className="text-[#0b6b38] text-base">S/ {cartTotal.toFixed(2)}</span>
                    </div>
                    
                    <button disabled={cart.length === 0} onClick={handleGenerateReceipt} className="w-full bg-[#0b6b38] text-white font-bold py-3 rounded-xl shadow">
                      Generar cálculo aproximado
                    </button>
                  </div>
                </div>
              </div>
            )}

            {view === 'tracking' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow border">
                  <h2 className="font-bold text-xl text-gray-800 mb-2 flex items-center gap-2 border-b pb-3">
                    <Truck className="text-[#0b6b38]" /> Seguimiento de Mis Pedidos
                  </h2>

                  {myOrders.filter(o => !o.isCorrupt).length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No tienes pedidos activos.</div>
                  ) : (
                    <div className="space-y-6">
                      {myOrders.filter(o => !o.isCorrupt).map(order => {
                        let stepIndex = 1;
                        if (order.status === 'Facturado') stepIndex = 2;
                        if (order.status === 'Alistado') stepIndex = 3;
                        if (order.status === 'En Camino') stepIndex = 4;
                        if (order.status === 'Entregado') stepIndex = 5;
                        const isFailed = order.status === 'No se pudo entregar' || order.status === 'Cancelado';

                        return (
                          <div key={order.id} className="border rounded-2xl p-5 bg-white shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                              <div>
                                <p className="font-bold text-sm text-gray-800">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-gray-500">Pago: <strong>{order.paymentPreference} ({order.paymentTiming})</strong></p>
                              </div>
                              
                              <span className={`px-3 py-1 rounded-full font-black text-xs border ${
                                order.isPaid 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {order.isPaid ? '🟢 Pagado' : '🟡 Pendiente de Pago'}
                              </span>
                            </div>

                            {!isFailed && (
                              <div className="py-2">
                                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2">
                                  <span className={stepIndex >= 1 ? 'text-[#0b6b38]' : ''}>1. Registrado</span>
                                  <span className={stepIndex >= 2 ? 'text-blue-600' : ''}>2. Facturado</span>
                                  <span className={stepIndex >= 3 ? 'text-purple-600' : ''}>3. Alistado</span>
                                  <span className={stepIndex >= 4 ? 'text-indigo-600' : ''}>4. En Camino</span>
                                  <span className={stepIndex >= 5 ? 'text-green-600' : ''}>5. Entregado</span>
                                </div>
                                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(stepIndex / 5) * 100}%` }}></div>
                                </div>
                              </div>
                            )}

                            {order.invoicePhoto && (
                              <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-xs flex justify-between items-center">
                                <p className="font-bold text-green-900 flex items-center gap-1.5">
                                  <Receipt size={16} className="text-green-700" /> Factura Oficial Emitida
                                </p>
                                <button onClick={() => setPreviewImage(order.invoicePhoto)} className="bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow">
                                  <Eye size={14} /> Ver Factura
                                </button>
                              </div>
                            )}

                            <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                              <p className="font-bold text-gray-700">Productos:</p>
                              <p className="text-gray-600">{order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                              <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                                <span>{order.hasExactAmount ? 'Total a Pagar (Definitivo):' : 'Total Aproximado:'}</span>
                                <span className="text-green-800 text-sm">S/ {Number(order.total || order.approxTotal).toFixed(2)}</span>
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

            {view === 'receipt' && (
              <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-2xl border space-y-4">
                <div className="text-center border-b pb-3">
                  <div className="inline-block bg-[#0b6b38] px-4 py-1 rounded text-white font-black text-xl mb-1">PUNTO M</div>
                  <p className="text-xs text-gray-500">Tel: {companyHeader.phone}</p>
                  <p className="text-xs font-bold text-[#0b6b38] mt-2">Cliente: {user?.name} | Telf: {clientPhone}</p>
                  <p className="text-xs text-amber-700 font-medium mt-1">⚠️ Este es un cálculo aproximado. El monto definitivo se confirmará tras la facturación.</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border max-h-48 overflow-y-auto space-y-2">
                  <p className="text-xs font-bold text-gray-700 border-b pb-1">Detalle del Pedido:</p>
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span>{item.qty}x {item.name}</span>
                      <span className="font-bold text-green-800">S/ {(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-black text-xs text-gray-900">
                    <span>Total Aproximado:</span>
                    <span className="text-green-800">S/ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a 
                    href={`https://wa.me/584245719928?text=${encodeURIComponent(
                      `🛒 *NUEVO PEDIDO - PUNTO M*\n` +
                      `👤 *Cliente:* ${user ? user.name : 'Cliente'}\n` +
                      `📞 *Teléfono:* ${clientPhone}\n` +
                      `💳 *Método de Pago:* ${paymentPreference} (${paymentTiming})\n` +
                      `📅 *Entrega:* ${deliveryDate} a las ${deliveryTime}\n` +
                      `-----------------------------------\n` +
                      `📋 *Lista de Productos (Cantidades):*\n` + cart.map(i => `• ${i.qty}x ${i.name}`).join('\n') + `\n` +
                      `-----------------------------------\n` +
                      `🔗 *Presione aquí para ver el seguimiento de su pedido en la App:* \nhttps://punto-m-app.vercel.app`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setWhatsappSent(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2 text-xs shadow transition"
                  >
                    <Phone size={16} /> Enviar Pedido por WhatsApp
                  </a>

                  <button 
                    onClick={() => {
                      if (!whatsappSent) {
                        alert("⚠️ Por favor, envíe primero el pedido por WhatsApp para poder ver su seguimiento.");
                        return;
                      }
                      setCurrentOrderId(null);
                      setView('tracking');
                    }}
                    className={`w-full font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center gap-2 transition ${
                      whatsappSent ? 'bg-[#0b6b38] hover:bg-[#074825] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Truck size={16} /> Presione aquí para seguir su pedido
                  </button>

                  <button 
                    onClick={() => setView('catalog')}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <ArrowLeft size={14} /> Modificar pedido (Volver atrás)
                  </button>
                </div>
              </div>
            )}

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
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow transition"
                      >
                        <RotateCcw size={14} /> {isResetting ? 'Restaurando...' : 'Restaurar Fábrica'}
                      </button>

                      <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold gap-1">
                        <button onClick={() => setAdminSubTab('orders')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'orders' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600'}`}>📦 Pedidos</button>
                        <button onClick={() => setAdminSubTab('corrupt')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'corrupt' ? 'bg-red-600 text-white shadow' : 'text-gray-600'}`}>🚫 Pagos Corruptos ({corruptOrdersList.length})</button>
                        <button onClick={() => setAdminSubTab('accounting')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'accounting' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600'}`}>📊 Contabilidad</button>
                        <button onClick={() => setAdminSubTab('returns')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'returns' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600'}`}>🔄 Devoluciones</button>
                      </div>
                    </div>
                  </div>

                  {adminSubTab === 'orders' && (
                    <div className="space-y-4">
                      {filteredOrders.map(order => (
                        <div key={order.id} className="border p-4 rounded-xl bg-white shadow-sm flex flex-col justify-between gap-4">
                          
                          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center border-b pb-3">
                            <div className="space-y-1 text-xs flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-800">{order.clientName}</span>
                                <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-gray-100 border text-gray-700">{order.status}</span>
                                
                                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${
                                  order.isPaid ? 'bg-green-100 text-green-800 border-green-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                  {order.isPaid ? '🟢 Pagado' : '🟡 Pendiente'}
                                </span>
                              </div>
                              <p className="text-gray-500">📞 {order.clientPhone} | Pago: {order.paymentPreference} ({order.paymentTiming})</p>
                              <p className="text-gray-600">Items: {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                              <p className="font-bold text-green-800 text-xs">
                                {order.hasExactAmount ? 'Total Definitivo:' : 'Total Aproximado:'} S/ {Number(order.total || order.approxTotal).toFixed(2)}
                              </p>
                              
                              {order.invoicePhoto && (
                                <button onClick={() => setPreviewImage(order.invoicePhoto)} className="text-xs text-green-700 font-bold underline flex items-center gap-1 mt-1 cursor-pointer">
                                  <Eye size={14} /> Ver Factura Oficial Subida
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button onClick={() => handlePrintOrder(order)} className="bg-gray-800 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Printer size={14} /> Imprimir
                              </button>

                              <button onClick={() => handleUpdateOrderStatus(order.id, 'Alistado')} className="bg-purple-600 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                <PackageCheck size={14} /> Alistado
                              </button>

                              <button onClick={() => handleUpdateOrderStatus(order.id, 'En Camino')} className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Truck size={14} /> En Camino
                              </button>

                              <button onClick={() => handleUpdateOrderStatus(order.id, 'Entregado')} className="bg-green-600 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                <CheckCircle size={14} /> Entregado
                              </button>

                              <button onClick={() => { setFailOrderId(order.id); setFailModalOpen(true); }} className="bg-amber-600 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                <AlertTriangle size={14} /> No entregado
                              </button>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="text-xs">
                              <p className="font-bold text-gray-700">Gestión Administrativa:</p>
                              <p className="text-gray-500">Registra el pago, sube la factura, define el monto o reporta pago corrupto.</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button 
                                onClick={() => {
                                  setPayOrderId(order.id);
                                  setSelectedPayMethodAdmin(order.paymentPreference || 'Efectivo');
                                  setPayModalOpen(true);
                                }}
                                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow ${
                                  order.isPaid ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                <CreditCard size={14} /> {order.isPaid ? '✅ Pago Registrado' : '💵 Registrar Pago'}
                              </button>

                              <button 
                                onClick={() => {
                                  setInvoiceOrderId(order.id);
                                  setInvoiceModalOpen(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                              >
                                <Receipt size={14} /> {order.invoicePhoto ? '🔄 Cambiar Factura' : '📄 Subir Factura'}
                              </button>

                              <button 
                                onClick={() => {
                                  setFinalAmountOrderId(order.id);
                                  setExactFinalAmount(order.total || order.approxTotal || '');
                                  setFinalAmountModalOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                              >
                                <DollarSign size={14} /> Ingresar monto a pagar
                              </button>

                              <button 
                                onClick={() => {
                                  setCorruptOrderId(order.id);
                                  setCorruptModalOpen(true);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                              >
                                <ShieldAlert size={14} /> Pago Corrupto
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {adminSubTab === 'corrupt' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-base text-red-700 flex items-center gap-2">
                        <ShieldAlert size={20} /> Clientes con Pagos Corruptos y Bloqueados
                      </h3>
                      {corruptOrdersList.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm">No hay registros de pagos corruptos.</div>
                      ) : (
                        corruptOrdersList.map(order => (
                          <div key={order.id} className="border border-red-300 p-4 rounded-xl bg-red-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-gray-900">{order.clientName} (Telf: {order.clientPhone})</p>
                              <p className="text-red-700 font-bold">⚠️ Motivo: {order.corruptReason}</p>
                              <p className="text-gray-600">Total: S/ {Number(order.total || order.approxTotal).toFixed(2)}</p>
                              {order.corruptPhoto && (
                                <button onClick={() => setPreviewImage(order.corruptPhoto)} className="text-blue-700 font-bold underline flex items-center gap-1 cursor-pointer">
                                  <Eye size={14} /> Ver Comprobante/Efectivo con Incidencia
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleUnlockAndPayCorrupt(order.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow"
                              >
                                <Unlock size={14} /> Desbloquear y Registrar Pago Correcto
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {adminSubTab === 'accounting' && (
                    <div className="space-y-6">
                      <div className="bg-green-50 border p-5 rounded-2xl flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-lg text-green-900">Resumen Contable Diario</h3>
                          <p className="text-xs text-green-800">Efectivo registrado con foto y pagos digitales.</p>
                        </div>
                        <button onClick={handleCloseDay} disabled={dayClosed} className="bg-red-600 text-white font-black px-5 py-3 rounded-xl text-xs flex items-center gap-2">
                          <Lock size={16} /> {dayClosed ? 'Día Cerrado' : 'Cerrar Día'}
                        </button>
                      </div>

                      <div className="bg-[#0b6b38] text-white p-6 rounded-2xl shadow flex justify-between items-center">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-green-200 font-bold">Sumatoria Total Final del Día</p>
                          <p className="text-3xl font-black mt-1">S/ {grandTotalDay.toFixed(2)}</p>
                        </div>
                        <DollarSign size={40} className="text-[#fbc02d]" />
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'returns' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-base text-gray-800">Devoluciones</h3>
                      {returnOrders.map(order => (
                        <div key={order.id} className="border border-red-200 p-4 rounded-xl bg-red-50 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{order.clientName}</p>
                            <p className="text-red-700 font-bold">⚠️ Motivo: {order.failReason}</p>
                          </div>
                          <button onClick={() => { setReturnOrderId(order.id); setReturnModalOpen(true); }} className="bg-red-600 text-white font-bold px-3 py-2 rounded-lg">
                            Subir Capture Devolución
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {corruptModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-red-700 flex items-center gap-2">
                    <ShieldAlert size={20} /> Registrar Pago Corrupto / Incidencia
                  </h3>
                  <p className="text-xs text-gray-600">Especifique el motivo por el cual el pago es corrupto o inválido y suba la foto correspondiente:</p>

                  <textarea 
                    rows="3" 
                    value={corruptReason} 
                    onChange={e => setCorruptReason(e.target.value)} 
                    placeholder="Ej. Billete falso, transferencia no reportada, comprobante adulterado..." 
                    className="w-full border p-2.5 rounded-lg text-xs"
                  ></textarea>

                  <div className="space-y-1 bg-red-50 p-3 rounded-xl border border-red-200 text-xs">
                    <p className="font-bold text-red-900 flex items-center gap-1"><Camera size={14} /> Subir Foto del Pago / Efectivo Corrupto: *</p>
                    <label className="cursor-pointer bg-white border-2 border-dashed border-red-400 text-gray-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                      <Upload size={14} /> <span>{corruptPhoto ? '✅ Foto cargada' : 'Seleccionar foto'}</span>
                      <input type="file" accept="image/*" onChange={handleCorruptPhotoUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setCorruptModalOpen(false); setCorruptOrderId(null); setCorruptReason(''); setCorruptPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveCorruptPayment} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Bloquear y Registrar</button>
                  </div>
                </div>
              </div>
            )}

            {payModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-blue-700 flex items-center gap-2">
                    <CreditCard size={20} /> Registrar Cobro y Marcar Pagado
                  </h3>
                  <p className="text-xs text-gray-600">Selecciona el método de pago recibido:</p>

                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setSelectedPayMethodAdmin('Efectivo')} className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 ${selectedPayMethodAdmin === 'Efectivo' ? 'bg-green-600 text-white shadow' : 'bg-gray-50'}`}>
                      💵 Efectivo
                    </button>
                    <button type="button" onClick={() => setSelectedPayMethodAdmin('Tarjeta')} className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 ${selectedPayMethodAdmin === 'Tarjeta' ? 'bg-blue-600 text-white shadow' : 'bg-gray-50'}`}>
                      💳 Tarjeta
                    </button>
                    <button type="button" onClick={() => setSelectedPayMethodAdmin('Pago Digital')} className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 ${selectedPayMethodAdmin === 'Pago Digital' ? 'bg-purple-600 text-white shadow' : 'bg-gray-50'}`}>
                      📱 Digital
                    </button>
                  </div>

                  {selectedPayMethodAdmin === 'Efectivo' && (
                    <div className="space-y-1 bg-green-50 p-2.5 rounded-xl border border-green-200 text-xs">
                      <p className="font-bold text-green-900 flex items-center gap-1"><Camera size={14} /> Foto del Efectivo Recibido: *</p>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-green-400 text-gray-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>{cashPhoto ? '✅ Foto de efectivo lista' : 'Tomar foto del dinero'}</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleCashPhotoUpload} className="hidden" />
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setPayModalOpen(false); setPayOrderId(null); setCashPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleConfirmAdminPayment} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Pago</button>
                  </div>
                </div>
              </div>
            )}

            {invoiceModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-indigo-700 flex items-center gap-2">
                    <Receipt size={20} /> Subir Factura Oficial
                  </h3>
                  <p className="text-xs text-gray-600">Sube la foto o archivo de la factura que el cliente podrá visualizar en su seguimiento:</p>

                  <div className="space-y-1 bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-xs">
                    <p className="font-bold text-indigo-900 flex items-center gap-1"><Receipt size={14} /> Seleccionar Factura: *</p>
                    <label className="cursor-pointer bg-white border-2 border-dashed border-indigo-400 text-gray-800 font-bold py-3 px-3 rounded-lg flex items-center justify-center gap-1">
                      <Upload size={16} /> <span>{invoicePhoto ? '✅ Factura cargada (Cambiar)' : 'Elegir foto de la factura'}</span>
                      <input type="file" accept="image/*" onChange={handleInvoicePhotoUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setInvoiceModalOpen(false); setInvoiceOrderId(null); setInvoicePhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveInvoice} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Factura</button>
                  </div>
                </div>
              </div>
            )}

            {finalAmountModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-emerald-700 flex items-center gap-2">
                    <DollarSign size={20} /> Ingresar Monto Definitivo a Pagar
                  </h3>
                  <p className="text-xs text-gray-600">Escribe el monto exacto de la factura para actualizar el total final que verá el cliente:</p>
                  
                  <input 
                    type="number"
                    step="0.01"
                    value={exactFinalAmount}
                    onChange={e => setExactFinalAmount(e.target.value)}
                    placeholder="Ej. 25.50"
                    className="w-full border p-2 rounded-lg text-sm font-bold"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setFinalAmountModalOpen(false); setFinalAmountOrderId(null); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveFinalAmount} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Monto</button>
                  </div>
                </div>
              </div>
            )}

            {failModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-red-600">Motivo de No Entrega</h3>
                  <textarea rows="3" value={failReason} onChange={e => setFailReason(e.target.value)} placeholder="Escribe el motivo..." className="w-full border p-3 rounded-lg text-xs"></textarea>
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
                  <h3 className="font-bold text-base text-green-700">Devolución de Dinero</h3>
                  <label className="cursor-pointer bg-gray-100 border-2 border-dashed border-gray-300 text-xs font-bold py-3 px-3 rounded-xl flex flex-col items-center justify-center">
                    <Upload size={18} /> {returnProof ? '✅ Capture listo' : 'Subir capture'}
                    <input type="file" accept="image/*" onChange={handleReturnProofUpload} className="hidden" />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setReturnModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveReturnProof} className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-xs font-bold">Confirmar</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
            <div className="bg-white p-4 rounded-2xl max-w-lg w-full shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center max-h-[70vh] overflow-auto">
                <img src={previewImage} alt="Comprobante" className="max-w-full rounded-lg object-contain" />
              </div>
              <button onClick={() => setPreviewImage(null)} className="w-full bg-gray-800 text-white font-bold py-2 rounded-lg text-xs cursor-pointer">Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
