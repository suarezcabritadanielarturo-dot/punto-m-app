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
  Unlock,
  Users,
  Award,
  AlertCircle,
  RotateCcw as ReturnIcon,
  Banknote,
  ShieldCheck,
  UserCheck,
  QrCode
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

const BASE_PRODUCTS = [
  { name: 'Harina de Trigo 1kg', price: 4.50, category: 'Viveres', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300' },
  { name: 'Aceite Vegetal 1L', price: 8.90, category: 'Viveres', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300' },
  { name: 'Arroz Extra 1kg', price: 4.20, category: 'Viveres', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' },
  { name: 'Azúcar Rubia 1kg', price: 3.80, category: 'Viveres', image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client'); 
  const [isVipClient, setIsVipClient] = useState(false);
  const [view, setView] = useState('catalog'); 
  const [adminSubTab, setAdminSubTab] = useState('orders');
  
  const [products, setProducts] = useState(BASE_PRODUCTS.map((p, i) => ({ id: String(i + 1), ...p })));
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('Efectivo');
  const [paymentTiming, setPaymentTiming] = useState('Contra Entrega');
  const [creditTerm, setCreditTerm] = useState('7 dias');
  const [cashPayAmount, setCashPayAmount] = useState('');

  const [newPayTitle, setNewPayTitle] = useState('');
  const [newPayDesc, setNewPayDesc] = useState('');
  const [newPayImage, setNewPayImage] = useState('');

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

  const [productReturnModalOpen, setProductReturnModalOpen] = useState(false);
  const [productReturnOrderId, setProductReturnOrderId] = useState(null);
  const [returnedItemsSummary, setReturnedItemsSummary] = useState('');
  const [manualProductValue, setManualProductValue] = useState('');
  const [returnedProductsPhoto, setReturnedProductsPhoto] = useState('');

  const [baseChangeModalOpen, setBaseChangeModalOpen] = useState(false);
  const [baseChangeOrderId, setBaseChangeOrderId] = useState(null);
  const [baseChangeAmount, setBaseChangeAmount] = useState('');
  const [baseChangeProofPhoto, setBaseChangeProofPhoto] = useState('');

  const [receivedChangeModalOpen, setReceivedChangeModalOpen] = useState(false);
  const [receivedChangeOrderId, setReceivedChangeOrderId] = useState(null);
  const [receivedChangeAmount, setReceivedChangeAmount] = useState('');
  const [receivedChangeProofPhoto, setReceivedChangeProofPhoto] = useState('');

  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [changeOrderId, setChangeOrderId] = useState(null);
  const [changeAmountGiven, setChangeAmountGiven] = useState('');
  const [changeProofPhoto, setChangeProofPhoto] = useState('');

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundOrderId, setRefundOrderId] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundProofPhoto, setRefundProofPhoto] = useState('');

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

  const getMinAvailableTime = () => {
    if (!deliveryDate) return "10:00";
    const ordersOnDate = orders.filter(o => o.deliveryDate === deliveryDate && o.deliveryTime && !o.isCorrupt && o.status !== 'Cancelado' && o.status !== 'No se pudo entregar');
    if (ordersOnDate.length === 0) return "10:00";

    let latestTimeMinutes = 600;
    ordersOnDate.forEach(ord => {
      const [hours, minutes] = ord.deliveryTime.split(':').map(Number);
      const totalMins = hours * 60 + (minutes || 0);
      if (totalMins > latestTimeMinutes) {
        latestTimeMinutes = totalMins;
      }
    });

    const adjustedMinutes = latestTimeMinutes + 40;
    const finalHours = Math.floor(adjustedMinutes / 60);
    const finalMins = adjustedMinutes % 60;

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

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const dbUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(dbUsers);
    });

    const unsubscribePayMethods = onSnapshot(collection(db, 'paymentMethods'), (snapshot) => {
      const dbMethods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentMethodsList(dbMethods);
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
        let vipStatus = false;

        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            if (!isOwner) {
              assignedRole = userDoc.data().role || 'client';
            }
            vipStatus = userDoc.data().isVip || false;
          }
          await setDoc(userDocRef, {
            name: currentUser.displayName,
            email: currentUser.email,
            role: assignedRole,
            isVip: vipStatus,
            lastLogin: new Date()
          }, { merge: true });
        } catch (e) {
          console.log("Error Auth sync:", e);
        }
        setUserRole(assignedRole);
        setIsVipClient(vipStatus);

        if (assignedRole === 'chofer' || assignedRole === 'cajera' || assignedRole === 'encargado' || assignedRole === 'contabilidad') {
          setView('admin');
          setAdminSubTab('orders');
        }
      } else {
        setUser(null);
        setUserRole('client');
        setIsVipClient(false);
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribePayMethods();
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

  const handleToggleVip = async (targetUid, currentVipStatus) => {
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { isVip: !currentVipStatus });
      alert("✅ ¡Privilegio VIP actualizado con éxito!");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar privilegio.");
    }
  };

  const handleChangeUserRole = async (targetUid, newRole) => {
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { role: newRole });
      alert(`✅ ¡Rol actualizado a "${newRole.toUpperCase()}" con éxito!`);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar los roles del usuario.");
    }
  };

  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    if (!newPayTitle.trim() || !newPayDesc.trim()) {
      alert("⚠️ Por favor ingrese el título y la descripción del método de pago.");
      return;
    }

    try {
      await addDoc(collection(db, 'paymentMethods'), {
        title: newPayTitle,
        description: newPayDesc,
        image: newPayImage || '',
        createdAt: new Date()
      });
      setNewPayTitle('');
      setNewPayDesc('');
      setNewPayImage('');
      alert("✅ ¡Método de pago registrado con éxito!");
    } catch (err) {
      console.error(err);
      alert("Error al guardar método de pago.");
    }
  };

  const handleNewPayImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPayImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (!window.confirm("¿Estás seguro de eliminar este método de pago?")) return;
    try {
      await deleteDoc(doc(db, 'paymentMethods', methodId));
      alert("🗑️ Método eliminado correctamente.");
    } catch (err) {
      console.error(err);
    }
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
  const calculatedChange = cashPayAmount ? Math.max(0, parseFloat(cashPayAmount) - cartTotal) : 0;

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

    let creditDueDate = null;
    if (paymentPreference === 'Crédito') {
      const now = new Date();
      if (creditTerm === '7 dias') now.setDate(now.getDate() + 7);
      else if (creditTerm === '15 dias') now.setDate(now.getDate() + 15);
      else if (creditTerm === '1 mes') now.setMonth(now.getMonth() + 1);
      creditDueDate = now.toISOString();
    }

    const orderData = {
      clientUid: user.uid,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone: clientPhone,
      items: cart,
      approxTotal: cartTotal,
      total: cartTotal,
      originalTotal: cartTotal,
      cashPayAmount: paymentPreference === 'Efectivo' ? parseFloat(cashPayAmount || cartTotal) : 0,
      expectedChange: paymentPreference === 'Efectivo' ? calculatedChange : 0,
      hasExactAmount: false,
      location: clientLocation || null,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      paymentPreference: paymentPreference,
      paymentTiming: paymentTiming,
      creditTerm: paymentPreference === 'Crédito' ? creditTerm : '',
      creditDueDate: creditDueDate,
      status: 'Pendiente',
      isPaid: false,
      paymentMethod: '',
      invoicePhoto: '',
      cashPhoto: '',
      isCorrupt: false,
      corruptReason: '',
      corruptPhoto: '',
      returnedProductsList: [],
      returnedProductsPhoto: '',
      baseChangeRecord: null,
      receivedChangeRecord: null,
      changeGivenRecord: null,
      refundRecord: null,
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

  const handleReturnedProductsPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReturnedProductsPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBaseChangeProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBaseChangeProofPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleReceivedChangeProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceivedChangeProofPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChangeProofPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setChangeProofPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRefundProofPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefundProofPhoto(reader.result);
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

  const handleSaveProductReturn = async () => {
    const valueDeduction = parseFloat(manualProductValue);
    if (isNaN(valueDeduction) || valueDeduction <= 0) {
      alert("⚠️ Ingrese un valor total del producto válido.");
      return;
    }
    if (!returnedProductsPhoto) {
      alert("⚠️ Adjunte la foto de los productos devueltos.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', productReturnOrderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;
      const orderData = orderSnap.data();

      const currentTotal = Number(orderData.total || orderData.approxTotal || 0);
      const newTotal = Math.max(0, currentTotal - valueDeduction);

      await updateDoc(orderRef, {
        total: newTotal,
        returnedProductsList: [...(orderData.returnedProductsList || []), { summary: returnedItemsSummary || 'Producto devuelto', deduction: valueDeduction, date: new Date().toISOString() }],
        returnedProductsPhoto: returnedProductsPhoto
      });

      setProductReturnModalOpen(false);
      setProductReturnOrderId(null);
      setReturnedItemsSummary('');
      setManualProductValue('');
      setReturnedProductsPhoto('');
      alert("✅ ¡Devolución de producto registrada y total actualizado con éxito!");
    } catch (err) {
      console.error(err);
      alert("Error al registrar la devolución de productos.");
    }
  };

  const handleSaveBaseChange = async () => {
    const val = parseFloat(baseChangeAmount);
    if (isNaN(val) || val < 0) {
      alert("⚠️ Ingrese un monto de vuelto base válido.");
      return;
    }
    if (!baseChangeProofPhoto) {
      alert("⚠️ Adjunte la foto del dinero entregado como base.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', baseChangeOrderId);
      await updateDoc(orderRef, {
        baseChangeRecord: {
          amount: val,
          photo: baseChangeProofPhoto,
          date: new Date().toISOString()
        }
      });
      setBaseChangeModalOpen(false);
      setBaseChangeOrderId(null);
      setBaseChangeAmount('');
      setBaseChangeProofPhoto('');
      alert("✅ ¡Vuelto base entregado al repartidor registrado con éxito!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReceivedChange = async () => {
    const val = parseFloat(receivedChangeAmount);
    if (isNaN(val) || val < 0) {
      alert("⚠️ Ingrese un monto de vuelto recibido válido.");
      return;
    }
    if (!receivedChangeProofPhoto) {
      alert("⚠️ Adjunte la foto del dinero recibido.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', receivedChangeOrderId);
      await updateDoc(orderRef, {
        receivedChangeRecord: {
          amount: val,
          photo: receivedChangeProofPhoto,
          date: new Date().toISOString()
        }
      });
      setReceivedChangeModalOpen(false);
      setReceivedChangeOrderId(null);
      setReceivedChangeAmount('');
      setReceivedChangeProofPhoto('');
      alert("✅ ¡Vuelto recibido registrado con éxito!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveChangeGiven = async () => {
    const changeVal = parseFloat(changeAmountGiven);
    if (isNaN(changeVal) || changeVal < 0) {
      alert("⚠️ Ingrese un monto de vuelto válido.");
      return;
    }
    if (!changeProofPhoto) {
      alert("⚠️ Adjunte la foto del comprobante o recibo de vuelto.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', changeOrderId);
      await updateDoc(orderRef, {
        changeGivenRecord: {
          amount: changeVal,
          photo: changeProofPhoto,
          date: new Date().toISOString()
        }
      });

      setChangeModalOpen(false);
      setChangeOrderId(null);
      setChangeAmountGiven('');
      setChangeProofPhoto('');
      alert("✅ ¡Vuelto que el repartidor entregó registrado con éxito!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRefundRecord = async () => {
    const refVal = parseFloat(refundAmount);
    if (isNaN(refVal) || refVal <= 0) {
      alert("⚠️ Ingrese un monto de reembolso válido.");
      return;
    }
    if (!refundProofPhoto) {
      alert("⚠️ Adjunte la foto del comprobante de transferencia o pago digital.");
      return;
    }

    try {
      const orderRef = doc(db, 'orders', refundOrderId);
      await updateDoc(orderRef, {
        refundRecord: {
          amount: refVal,
          photo: refundProofPhoto,
          date: new Date().toISOString()
        }
      });

      setRefundModalOpen(false);
      setRefundOrderId(null);
      setRefundAmount('');
      setRefundProofPhoto('');
      alert("✅ ¡Reembolso registrado y publicado con éxito!");
    } catch (err) {
      console.error(err);
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
    }
  };

  const handleUnlockAndPayCorrupt = async (orderId) => {
    const confirmUnlock = window.confirm("🔓 ¿Deseas desbloquear a este cliente y registrar su pago como correcto?");
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
  
  const refundDebtOrders = orders.filter(o => {
    const finalTot = Number(o.total || o.approxTotal || 0);
    const origTot = Number(o.originalTotal || o.approxTotal || 0);
    const hasProductReturn = (o.returnedProductsList?.length || 0) > 0;
    const isDigitalOrCard = o.paymentPreference === 'Pago Digital' || o.paymentPreference === 'Tarjeta' || o.isPaid;
    return (hasProductReturn && origTot > finalTot && isDigitalOrCard && !o.refundRecord);
  });

  const myOrders = user ? orders.filter(o => o.clientUid === user.uid || o.clientEmail === user.email) : [];
  const clientBlockedOrder = myOrders.find(o => o.isCorrupt === true);

  const nowTime = new Date().getTime();
  const clientCreditOrders = myOrders.filter(o => o.paymentPreference === 'Crédito' && !o.isPaid && !o.isCorrupt && o.creditDueDate);
  
  let isInGracePeriod = false;
  let isStrictBlockedForMora = false;

  clientCreditOrders.forEach(ord => {
    const dueTime = new Date(ord.creditDueDate).getTime();
    const diffDays = (nowTime - dueTime) / (1000 * 60 * 60 * 24);
    if (diffDays > 0 && diffDays <= 10) {
      isInGracePeriod = true;
    } else if (diffDays > 10) {
      isStrictBlockedForMora = true;
    }
  });

  // Delimitación estricta de roles
  const isAdmin = userRole === 'admin';
  const isEncargado = userRole === 'encargado';
  const isChofer = userRole === 'chofer';
  const isCajera = userRole === 'cajera';
  const isContabilidad = userRole === 'contabilidad';
  const isSupervisor = userRole === 'supervisor';

  const isAdminOrManager = isAdmin || isEncargado || isContabilidad || isSupervisor || isChofer || isCajera;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      <header className="bg-[#0b6b38] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (isChofer || isCajera || isEncargado || isContabilidad) {
              setView('admin');
              setAdminSubTab('orders');
            } else {
              setView('catalog');
            }
          }}>
            <div className="bg-[#074825] px-4 py-1.5 rounded-lg border border-green-600 flex items-center">
              <span className="font-extrabold text-2xl tracking-widest text-white">PUNTO</span>
              <span className="h-3.5 w-3.5 bg-[#fbc02d] rounded-full inline-block ml-1"></span>
              <span className="font-extrabold text-2xl tracking-widest text-white ml-1">M</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (userRole === 'client' || isAdmin) && (
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
                    {isAdmin && <span className="bg-[#fbc02d] text-black text-[9px] px-1 rounded font-black">ADMIN</span>}
                    {isChofer && <span className="bg-cyan-400 text-black text-[9px] px-1 rounded font-black">CHOFER</span>}
                    {isCajera && <span className="bg-pink-400 text-black text-[9px] px-1 rounded font-black">CAJERA</span>}
                    {isEncargado && <span className="bg-indigo-400 text-black text-[9px] px-1 rounded font-black">ENCARGADO</span>}
                    {isContabilidad && <span className="bg-emerald-400 text-black text-[9px] px-1 rounded font-black">CONTABILIDAD</span>}
                    {isSupervisor && <span className="bg-purple-400 text-black text-[9px] px-1 rounded font-black">SUPERVISOR</span>}
                    {isVipClient && <span className="bg-amber-400 text-black text-[9px] px-1 rounded font-black">VIP</span>}
                  </p>
                  <p className="text-gray-300 text-[10px] truncate max-w-[120px]">{user.email}</p>
                </div>

                {isAdminOrManager && (
                  <button onClick={() => { setView('admin'); setAdminSubTab('orders'); }} title="Panel de Gestión" className="p-1.5 hover:bg-green-700 rounded-full text-[#fbc02d] transition">
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

            {(userRole === 'client' || isAdmin) && (
              <button onClick={() => setView('catalog')} className="relative bg-white text-[#0b6b38] p-2 rounded-full font-bold shadow hover:bg-gray-100">
                <ShoppingBag size={22} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-black">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
        {isInGracePeriod && !isAdmin && (
          <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl mb-6 shadow flex items-center gap-3">
            <AlertCircle className="text-amber-600 w-8 h-8 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-black text-amber-900 text-sm">⚠️ ¡Su cuenta está en mora, por favor pagar!</p>
              <p className="text-amber-700">Tiene facturas de crédito pendientes. Por favor realice el pago para evitar restricciones en su cuenta.</p>
            </div>
          </div>
        )}

        {(clientBlockedOrder || isStrictBlockedForMora) && !isAdmin ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl border text-center space-y-4 my-12">
            <div className="bg-red-100 text-red-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <h2 className="font-black text-xl text-red-700">¡Acceso Restringido / Incidencia de Pago!</h2>
            <p className="text-xs text-gray-600">
              {isStrictBlockedForMora ? "Su cuenta ha sido bloqueada por superar el tiempo límite de mora en sus créditos pendientes." : "Por favor comunicarse con este número, hubo un inconveniente con su pago."}
            </p>
            {clientBlockedOrder?.corruptReason && (
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
            {clientCreditOrders.map(ord => ord.invoicePhoto && (
              <div key={ord.id} className="bg-gray-50 p-2 rounded-xl border text-xs text-left flex justify-between items-center">
                <span>Factura Pendiente #{ord.id.slice(-6).toUpperCase()}</span>
                <button onClick={() => setPreviewImage(ord.invoicePhoto)} className="text-indigo-600 font-bold underline flex items-center gap-1">
                  <Eye size={12} /> Ver factura
                </button>
              </div>
            ))}
            <div className="pt-2">
              <a 
                href={`https://wa.me/584245719928?text=${encodeURIComponent(
                  `Hola, soy el cliente *${user?.name || 'Cliente'}* (Telf: ${clientBlockedOrder?.clientPhone || 'No registrado'}). Quisiera saber qué pasó con mi pago o mis créditos vencidos.`
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
            {view === 'catalog' && (userRole === 'client' || isAdmin) && (
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
                        <option value="Crédito">📋 Crédito (Exclusivo VIP)</option>
                      </select>

                      {paymentPreference === 'Efectivo' && (
                        <div className="space-y-1 bg-white p-2 rounded border">
                          <label className="font-bold text-gray-700 text-[10px]">¿Con cuánto va a pagar?</label>
                          <input 
                            type="number"
                            step="0.50"
                            value={cashPayAmount}
                            onChange={e => setCashPayAmount(e.target.value)}
                            placeholder={`Monto (Ej. ${Math.ceil(cartTotal / 10) * 10 || 10})`}
                            className="w-full border p-1 rounded text-xs font-bold text-green-800"
                          />
                        </div>
                      )}

                      {paymentPreference === 'Crédito' && (
                        (isVipClient || isAdmin) ? (
                          <div className="space-y-1 bg-white p-2 rounded border">
                            <label className="font-bold text-gray-700 text-[10px]">Plazo de Crédito:</label>
                            <select value={creditTerm} onChange={e => setCreditTerm(e.target.value)} className="w-full border p-1 rounded text-xs">
                              <option value="7 dias">Crédito a una semana (7 días)</option>
                              <option value="15 dias">Crédito a 15 días</option>
                              <option value="1 mes">Crédito a un mes</option>
                            </select>
                          </div>
                        ) : (
                          <div className="bg-amber-100 border border-amber-300 p-2 rounded text-[11px] text-amber-900 space-y-2">
                            <p className="font-bold">⚠️ Opción válida para cliente con contrato (VIP).</p>
                            <p>Comuníquese con nosotros si desea formar parte.</p>
                            <a 
                              href="https://wa.me/584245719928?text=Hola,%20deseo%20formar%20parte%20de%20los%20clientes%20VIP%20con%20contrato%20para%20acceder%20a%20créditos." 
                              target="_blank" 
                              rel="noreferrer"
                              className="block bg-green-600 text-white font-bold py-1 px-2 rounded text-center"
                            >
                              📞 Contactar para ser VIP
                            </a>
                          </div>
                        )
                      )}

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
                    
                    <button 
                      disabled={cart.length === 0 || (paymentPreference === 'Crédito' && !isVipClient && !isAdmin)} 
                      onClick={handleGenerateReceipt} 
                      className={`w-full font-bold py-3 rounded-xl shadow ${paymentPreference === 'Crédito' && !isVipClient && !isAdmin ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#0b6b38] text-white'}`}
                    >
                      Generar cálculo aproximado
                    </button>
                  </div>
                </div>
              </div>
            )}

            {view === 'tracking' && (userRole === 'client' || isAdmin) && (
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
                                <p className="text-xs text-gray-500">Pago: <strong>{order.paymentPreference} {order.creditTerm ? `(${order.creditTerm})` : ''}</strong></p>
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

                            {order.refundRecord && (
                              <div className="bg-purple-50 border-2 border-purple-300 p-4 rounded-2xl text-xs space-y-2">
                                <p className="font-black text-purple-900 flex items-center gap-1.5 text-sm">
                                  <Banknote size={18} className="text-purple-700" /> Devolución de Dinero / Reembolso Realizado
                                </p>
                                <p className="text-purple-800">
                                  Monto devuelto: <strong>S/ {Number(order.refundRecord.amount).toFixed(2)}</strong>
                                </p>
                                {order.refundRecord.photo && (
                                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-200">
                                    <span className="font-bold text-gray-700">Comprobante de Transferencia:</span>
                                    <button onClick={() => setPreviewImage(order.refundRecord.photo)} className="bg-purple-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow">
                                      <Eye size={14} /> Ver Comprobante
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                              <p className="font-bold text-gray-700">Productos:</p>
                              <p className="text-gray-600">{order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                              <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                                <span>Total a Pagar / Pagado:</span>
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

            {view === 'receipt' && (userRole === 'client' || isAdmin) && (
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
                      `💳 *Método de Pago:* ${paymentPreference} ${paymentPreference === 'Crédito' ? `(${creditTerm})` : ''}\n` +
                      (paymentPreference === 'Efectivo' ? `🪙 *Paga con:* S/ ${cashPayAmount || cartTotal}\n` : '') +
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

            {(view === 'admin' || isAdminOrManager) && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 gap-3">
                    <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                      <Settings className="text-[#0b6b38]" /> Panel de Gestión - PUNTO M ({userRole.toUpperCase()})
                    </h2>
                    
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button 
                          onClick={handleResetToFactorySettings}
                          disabled={isResetting}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow transition"
                        >
                          <RotateCcw size={14} /> {isResetting ? 'Restaurando...' : 'Restaurar Fábrica'}
                        </button>
                      )}

                      <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold gap-1 flex-wrap">
                        <button onClick={() => setAdminSubTab('orders')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'orders' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600'}`}>📦 Pedidos</button>
                        
                        {(isAdmin || isContabilidad) && (
                          <button onClick={() => setAdminSubTab('refunds')} className={`px-3 py-2 rounded-lg relative ${adminSubTab === 'refunds' ? 'bg-purple-700 text-white shadow' : 'text-gray-600'}`}>
                            🔄 Devoluciones
                            {refundDebtOrders.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                                {refundDebtOrders.length}
                              </span>
                            )}
                          </button>
                        )}

                        {(isAdmin || isContabilidad) && (
                          <button onClick={() => setAdminSubTab('corrupt')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'corrupt' ? 'bg-red-600 text-white shadow' : 'text-gray-600'}`}>
                            🚫 Corruptos ({corruptOrdersList.length})
                          </button>
                        )}

                        {(isAdmin || isContabilidad) && (
                          <button onClick={() => setAdminSubTab('accounting')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'accounting' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600'}`}>
                            📊 Contabilidad
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button onClick={() => setAdminSubTab('paymethods')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'paymethods' ? 'bg-cyan-700 text-white shadow' : 'text-gray-600'}`}>💳 Métodos de Pago y QR</button>
                            <button onClick={() => setAdminSubTab('users')} className={`px-3 py-2 rounded-lg ${adminSubTab === 'users' ? 'bg-[#0b6b38] text-white shadow' : 'text-gray-600'}`}>👥 Personal</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {adminSubTab === 'orders' && (
                    <div className="space-y-4">
                      {filteredOrders.map(order => {
                        const finalTotal = Number(order.total || order.approxTotal || 0);
                        const baseChange = Number(order.baseChangeRecord?.amount || 0);
                        const receivedChange = Number(order.receivedChangeRecord?.amount || 0);
                        const actualChangeGiven = Number(order.changeGivenRecord?.amount || 0);
                        const isCash = order.paymentPreference === 'Efectivo';
                        const cashCollected = isCash ? Number(order.cashPayAmount || finalTotal) : 0;
                        
                        const cashRetainedByCourier = isCash ? Math.max(0, cashCollected - actualChangeGiven) : 0;
                        const totalToStore = cashRetainedByCourier;

                        return (
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

                                <div className="flex flex-wrap items-center gap-3 pt-1 text-gray-700">
                                  <p className="flex items-center gap-1 font-bold">
                                    <Phone size={14} className="text-green-700" /> {order.clientPhone || 'Sin teléfono'}
                                  </p>
                                  {order.location && (
                                    <a href={order.location.mapUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline flex items-center gap-1">
                                      <MapPin size={14} /> Ver Ubicación GPS
                                    </a>
                                  )}
                                </div>

                                <p className="text-gray-500">Pago: <strong>{order.paymentPreference}</strong> {order.creditTerm ? `(${order.creditTerm})` : ''}</p>
                                
                                {isCash ? (
                                  <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 space-y-1 mt-1">
                                    <p className="text-blue-900 font-bold">🪙 Efectivo cobrado al cliente: S/ {cashCollected.toFixed(2)}</p>
                                    <p className="text-teal-900 font-bold">
                                      • Vuelto entregado al repartidor (Base): <strong>S/ {baseChange.toFixed(2)}</strong>
                                      {order.baseChangeRecord?.photo && (
                                        <button onClick={() => setPreviewImage(order.baseChangeRecord.photo)} className="ml-2 text-teal-700 underline font-normal inline-flex items-center gap-0.5">
                                          <Eye size={12} /> Ver foto [Base]
                                        </button>
                                      )}
                                    </p>
                                    <p className="text-amber-900 font-bold">
                                      • Vuelto Recibido: <strong>S/ {receivedChange.toFixed(2)}</strong>
                                      {order.receivedChangeRecord?.photo && (
                                        <button onClick={() => setPreviewImage(order.receivedChangeRecord.photo)} className="ml-2 text-amber-700 underline font-normal inline-flex items-center gap-0.5">
                                          <Eye size={12} /> Ver foto [Recibido]
                                        </button>
                                      )}
                                    </p>
                                    <p className="text-indigo-900 font-bold">
                                      • Vuelto que el repartidor entregó: <strong>S/ {actualChangeGiven.toFixed(2)}</strong>
                                      {order.changeGivenRecord?.photo && (
                                        <button onClick={() => setPreviewImage(order.changeGivenRecord.photo)} className="ml-2 text-indigo-700 underline font-normal inline-flex items-center gap-0.5">
                                          <Eye size={12} /> Ver foto [Entregado]
                                        </button>
                                      )}
                                    </p>
                                    <p className="text-green-900 font-black pt-1 border-t border-blue-200">
                                      💵 Total que debe entregar el repartidor a la tienda: <strong>S/ {totalToStore.toFixed(2)}</strong>
                                    </p>
                                    {cashRetainedByCourier > finalTotal && (
                                      <p className="text-red-600 font-bold pt-1">
                                        ⚠️ Alerta: El repartidor retuvo S/ {cashRetainedByCourier.toFixed(2)} pero el pedido final es S/ {finalTotal.toFixed(2)}. Hay un excedente de S/ {(cashRetainedByCourier - finalTotal).toFixed(2)} por devoluciones.
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200 space-y-1 mt-1">
                                    <p className="text-purple-900 font-bold">📱 Fue Pago Digital / Tarjeta</p>
                                    {order.cashPhoto ? (
                                      <button onClick={() => setPreviewImage(order.cashPhoto)} className="text-xs text-purple-700 underline font-bold flex items-center gap-1">
                                        <Eye size={12} /> Ver foto [Foto del Pago Digital]
                                      </button>
                                    ) : (
                                      <p className="text-gray-500 text-[10px]">Sin comprobante digital adjunto.</p>
                                    )}
                                  </div>
                                )}

                                <div className="mt-2 bg-gray-50 p-2.5 rounded-lg border">
                                  <p className="font-bold text-gray-700 mb-1">🛒 Lista de Productos Pedidos:</p>
                                  <ul className="space-y-0.5">
                                    {order.items?.map((item, idx) => (
                                      <li key={idx} className="text-gray-800 flex justify-between">
                                        <span>• {item.qty}x {item.name}</span>
                                        <span className="font-bold">S/ {(item.price * item.qty).toFixed(2)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {order.returnedProductsList?.length > 0 && (
                                  <div className="bg-amber-50 p-2 rounded border border-amber-200 space-y-1 mt-1">
                                    <p className="text-amber-800 font-bold">🔄 Productos Devueltos:</p>
                                    {order.returnedProductsList.map((r, idx) => (
                                      <p key={idx} className="text-gray-700">• {r.summary} (-S/ {r.deduction})</p>
                                    ))}
                                    {order.returnedProductsPhoto && (
                                      <button onClick={() => setPreviewImage(order.returnedProductsPhoto)} className="text-xs text-amber-700 underline font-bold flex items-center gap-1 mt-1">
                                        <Eye size={12} /> Ver foto [Foto del Producto Devuelto]
                                      </button>
                                    )}
                                  </div>
                                )}

                                <p className="font-bold text-green-800 text-xs mt-1">
                                  Total a Pagar Actualizado: S/ {finalTotal.toFixed(2)}
                                </p>
                                
                                {order.invoicePhoto && (
                                  <button onClick={() => setPreviewImage(order.invoicePhoto)} className="text-xs text-green-700 font-bold underline flex items-center gap-1 mt-1 cursor-pointer">
                                    <Eye size={14} /> Ver Factura Oficial Subida
                                  </button>
                                )}
                              </div>

                              {/* BOTÓN IMPRIMIR */}
                              <div className="flex flex-wrap items-center gap-2">
                                <button onClick={() => handlePrintOrder(order)} className="bg-gray-800 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <Printer size={14} /> Imprimir
                                </button>

                                {/* BOTONES DE CAMBIO DE ESTADO (SOLO CHOFER Y ADMIN) */}
                                {(isChofer || isAdmin) && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>

                            {/* BANDEJA DE ACCIONES SEGÚN EL ROL */}
                            {!isEncargado && (
                              <div className="bg-gray-50 p-3 rounded-xl border space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                  <div>
                                    <p className="font-bold text-gray-700">Acciones Permitidas para tu Rol ({userRole.toUpperCase()}):</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* ACCIONES EXCLUSIVAS DEL CHOFER */}
                                  {isChofer && (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setChangeOrderId(order.id);
                                          setChangeAmountGiven(order.changeGivenRecord?.amount || '');
                                          setChangeModalOpen(true);
                                        }}
                                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <Banknote size={14} /> Vuelto Entregado
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setProductReturnOrderId(order.id);
                                          setProductReturnModalOpen(true);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <ReturnIcon size={14} /> Dev. Producto
                                      </button>
                                    </>
                                  )}

                                  {/* ACCIONES DE CONTABILIDAD */}
                                  {(isContabilidad || isAdmin) && (
                                    <>
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
                                        <CreditCard size={14} /> {order.isPaid ? '✅ Pagado' : '💵 Registrar Pago'}
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setCorruptOrderId(order.id);
                                          setCorruptModalOpen(true);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <ShieldAlert size={14} /> Pago Corrupto / Bloquear
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setProductReturnOrderId(order.id);
                                          setProductReturnModalOpen(true);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <ReturnIcon size={14} /> Dev. Producto
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setInvoiceOrderId(order.id);
                                          setInvoiceModalOpen(true);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <Receipt size={14} /> Subir Factura
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setFinalAmountOrderId(order.id);
                                          setExactFinalAmount(order.total || '');
                                          setFinalAmountModalOpen(true);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <DollarSign size={14} /> Monto Definitivo
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setBaseChangeOrderId(order.id);
                                          setBaseChangeAmount(order.baseChangeRecord?.amount || '');
                                          setBaseChangeModalOpen(true);
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <Banknote size={14} /> Vuelto al Repartidor (Base)
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setReceivedChangeOrderId(order.id);
                                          setReceivedChangeAmount(order.receivedChangeRecord?.amount || '');
                                          setReceivedChangeModalOpen(true);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                      >
                                        <Banknote size={14} /> Vuelto Recibido
                                      </button>
                                    </>
                                  )}

                                  {/* ACCIONES ADICIONALES SOLO PARA ADMIN */}
                                  {isAdmin && (
                                    <button 
                                      onClick={() => {
                                        setChangeOrderId(order.id);
                                        setChangeAmountGiven(order.changeGivenRecord?.amount || '');
                                        setChangeModalOpen(true);
                                      }}
                                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                                    >
                                      <Banknote size={14} /> Vuelto Entregado
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                  {adminSubTab === 'paymethods' && isAdmin && (
                    <div className="space-y-6">
                      <div className="bg-cyan-50 border border-cyan-200 p-5 rounded-2xl space-y-4">
                        <h3 className="font-bold text-base text-cyan-900 flex items-center gap-2">
                          <QrCode size={20} className="text-cyan-700" /> Registrar Nuevo Método de Pago / Código QR
                        </h3>
                        <form onSubmit={handleSavePaymentMethod} className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-gray-700">Título / Nombre del Método (Ej. Yape / BCP / Transferencia): *</label>
                            <input 
                              type="text" 
                              value={newPayTitle} 
                              onChange={e => setNewPayTitle(e.target.value)} 
                              placeholder="Ej. Yape - 987654321" 
                              className="w-full border p-2 rounded-lg text-xs bg-white" 
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-700">Descripción / Información de la Cuenta: *</label>
                            <textarea 
                              rows="2" 
                              value={newPayDesc} 
                              onChange={e => setNewPayDesc(e.target.value)} 
                              placeholder="Ej. Titular: Juan Pérez, RUC/DNI: 12345678, Número: 987654321" 
                              className="w-full border p-2 rounded-lg text-xs bg-white" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700">Imagen / Código QR (Opcional):</label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="cursor-pointer bg-white border-2 border-dashed border-cyan-400 text-cyan-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-xs">
                                <Camera size={14} /> <span>Usar Cámara</span>
                                <input type="file" accept="image/*" capture="environment" onChange={handleNewPayImageUpload} className="hidden" />
                              </label>
                              <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-xs">
                                <Upload size={14} /> <span>Subir Teléfono</span>
                                <input type="file" accept="image/*" onChange={handleNewPayImageUpload} className="hidden" />
                              </label>
                            </div>
                            {newPayImage && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Imagen o QR cargado correctamente</p>}
                          </div>
                          <button type="submit" className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition">
                            💾 Registrar Método de Pago
                          </button>
                        </form>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-gray-800">💳 Métodos de Pago y Códigos QR Disponibles para Cobros:</h4>
                        {paymentMethodsList.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 text-sm">No hay métodos de pago registrados todavía.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {paymentMethodsList.map(method => (
                              <div key={method.id} className="border p-4 rounded-xl bg-white shadow-sm flex flex-col justify-between space-y-3">
                                <div className="space-y-1">
                                  <h5 className="font-black text-sm text-gray-900">{method.title}</h5>
                                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{method.description}</p>
                                  {method.image && (
                                    <button onClick={() => setPreviewImage(method.image)} className="mt-2 text-xs text-blue-600 underline font-bold flex items-center gap-1">
                                      <Eye size={12} /> Ver QR / Imagen Grande
                                    </button>
                                  )}
                                </div>
                                <button onClick={() => handleDeletePaymentMethod(method.id)} className="self-end bg-red-100 text-red-700 hover:bg-red-200 p-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <Trash2 size={14} /> Eliminar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'refunds' && (isAdmin || isContabilidad) && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-base text-purple-800 flex items-center gap-2">
                        <RefreshCw size={20} /> Gestión de Devolución de Dinero a Clientes
                      </h3>
                      <p className="text-xs text-gray-600">Aquí se muestran los pedidos donde hubo devolución de productos y el cliente pagó de forma digital o tarjeta, por lo que le quedamos debiendo dinero.</p>

                      {refundDebtOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm">No hay casos pendientes de devolución de dinero.</div>
                      ) : (
                        refundDebtOrders.map(order => {
                          const orig = Number(order.originalTotal || order.approxTotal || 0);
                          const current = Number(order.total || 0);
                          const debtAmount = orig - current;

                          return (
                            <div key={order.id} className="border border-purple-300 p-4 rounded-xl bg-purple-50 space-y-3 text-xs">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 gap-2">
                                <div>
                                  <p className="font-bold text-sm text-purple-900">{order.clientName} (Telf: {order.clientPhone})</p>
                                  <p className="text-purple-700 font-bold">Monto a devolver al cliente: S/ {debtAmount.toFixed(2)}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    setRefundOrderId(order.id);
                                    setRefundAmount(debtAmount.toFixed(2));
                                    setRefundModalOpen(true);
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow"
                                >
                                  💳 Realizar y Subir Reembolso
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="bg-white p-2.5 rounded-lg border">
                                  <p className="font-bold text-gray-700 mb-1">📦 [Foto del Producto Devuelto]</p>
                                  {order.returnedProductsPhoto ? (
                                    <button onClick={() => setPreviewImage(order.returnedProductsPhoto)} className="text-blue-600 underline font-bold flex items-center gap-1">
                                      <Eye size={12} /> Ver foto
                                    </button>
                                  ) : <span className="text-gray-400">Sin foto</span>}
                                </div>

                                <div className="bg-white p-2.5 rounded-lg border">
                                  <p className="font-bold text-gray-700 mb-1">📄 [Factura Asociada]</p>
                                  {order.invoicePhoto ? (
                                    <button onClick={() => setPreviewImage(order.invoicePhoto)} className="text-blue-600 underline font-bold flex items-center gap-1">
                                      <Eye size={12} /> Ver factura
                                    </button>
                                  ) : <span className="text-gray-400">Sin factura</span>}
                                </div>

                                <div className="bg-white p-2.5 rounded-lg border">
                                  <p className="font-bold text-gray-700 mb-1">💵 [Comprobante de Reembolso]</p>
                                  {order.refundRecord?.photo ? (
                                    <button onClick={() => setPreviewImage(order.refundRecord.photo)} className="text-purple-600 underline font-bold flex items-center gap-1">
                                      <Eye size={12} /> Ver comprobante pagado
                                    </button>
                                  ) : <span className="text-amber-600 font-bold">Pendiente de pago</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {adminSubTab === 'users' && isAdmin && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-[#0b6b38]" /> Gestión de Privilegios y Roles de Personal
                      </h3>
                      <p className="text-xs text-gray-600">Asigne o desactive los privilegios para otorgar los permisos correspondientes (Admin, Chofer, Cajera, Encargado, Contabilidad, Supervisor).</p>

                      <div className="space-y-4">
                        {usersList.map(u => {
                          const userOrders = orders.filter(o => o.clientEmail === u.email || o.clientUid === u.id);
                          const currentRole = u.role || 'client';

                          return (
                            <div key={u.id} className="border p-4 rounded-xl bg-white shadow-sm space-y-3">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-3">
                                <div>
                                  <p className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                    {u.name} ({u.email})
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                      currentRole === 'admin' ? 'bg-[#fbc02d] text-black' :
                                      currentRole === 'encargado' ? 'bg-indigo-600 text-white' :
                                      currentRole === 'cajera' ? 'bg-pink-600 text-white' :
                                      currentRole === 'chofer' ? 'bg-cyan-600 text-white' :
                                      currentRole === 'contabilidad' ? 'bg-emerald-600 text-white' :
                                      currentRole === 'supervisor' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                      {currentRole}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500">Estado VIP: {u.isVip ? '⭐ Cliente VIP con contrato' : 'Cliente Estándar'}</p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <select 
                                    value={currentRole} 
                                    onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                    className="border border-green-300 bg-green-50 p-2 rounded-xl text-xs font-bold text-green-900 shadow-sm"
                                  >
                                    <option value="client">👤 Cliente / Estándar</option>
                                    <option value="chofer">🚚 Chofer (Repartidor)</option>
                                    <option value="cajera">💵 Cajera (Pagos y Facturación)</option>
                                    <option value="encargado">👔 Encargado de Venta</option>
                                    <option value="contabilidad">📊 Contabilidad</option>
                                    <option value="supervisor">👁️ Supervisor</option>
                                    <option value="admin">⭐ Administrador Total</option>
                                  </select>

                                  <button 
                                    onClick={() => handleToggleVip(u.id, u.isVip)}
                                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow transition ${
                                      u.isVip ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    <Award size={14} /> {u.isVip ? 'Quitar VIP' : 'Hacer VIP'}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                  <p className="font-bold text-gray-700 mb-1">📦 Historial de Compras ({userOrders.length}):</p>
                                  {userOrders.length === 0 ? (
                                    <p className="text-gray-400">Sin compras registradas.</p>
                                  ) : (
                                    <div className="max-h-24 overflow-y-auto space-y-1">
                                      {userOrders.map(ord => (
                                        <div key={ord.id} className="flex justify-between border-b pb-1">
                                          <span>#{ord.id.slice(-6)} - S/ {Number(ord.total || ord.approxTotal).toFixed(2)}</span>
                                          <span className="font-bold text-green-700">{ord.status}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <p className="font-bold text-blue-900 mb-1">🔐 Permisos Asignados al Rol ({currentRole.toUpperCase()}):</p>
                                  <ul className="text-gray-700 space-y-1">
                                    {currentRole === 'admin' && <li>• Acceso total a todas las funciones, contabilidad y ajustes.</li>}
                                    {currentRole === 'encargado' && <li>• Visualización de lista de productos pedidos e impresión de comprobantes.</li>}
                                    {currentRole === 'cajera' && <li>• Subir factura, imprimir, registro de vuelto base y vuelto recibido del chofer.</li>}
                                    {currentRole === 'chofer' && <li>• Cambio de estado de entregas, registro de vuelto entregado y devoluciones.</li>}
                                    {currentRole === 'contabilidad' && <li>• Registrar pago, pago corrupto, devoluciones, facturas, monto definitivo, vuelto base y vuelto recibido del repartidor.</li>}
                                    {currentRole === 'supervisor' && <li>• Supervisión de entregas, logística y estado de pedidos.</li>}
                                    {currentRole === 'client' && <li>• Visualización de catálogo, generación de pedidos y seguimiento personal.</li>}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'corrupt' && (isAdmin || isContabilidad) && (
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
                              <p className="text-gray-600">Total a Pagar Actualizado: S/ {Number(order.total || order.approxTotal).toFixed(2)}</p>
                              {order.corruptPhoto && (
                                <button onClick={() => setPreviewImage(order.corruptPhoto)} className="text-blue-700 font-bold underline flex items-center gap-1 cursor-pointer">
                                  <Eye size={14} /> Ver Comprobante/Efectivo con Incidencia [Foto del Dinero]
                                </button>
                              )}
                              {order.invoicePhoto && (
                                <button onClick={() => setPreviewImage(order.invoicePhoto)} className="text-indigo-700 font-bold underline flex items-center gap-1 cursor-pointer mt-1">
                                  <Receipt size={14} /> Ver Factura Pendiente Asociada
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

                  {adminSubTab === 'accounting' && (isAdmin || isContabilidad) && (
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
                </div>
              </div>
            )}

            {/* MODALES */}
            {baseChangeModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-cyan-700 flex items-center gap-2">
                    <Banknote size={20} /> Vuelto al Repartidor (Base Inicial)
                  </h3>
                  <p className="text-xs text-gray-600">Ingrese el monto de dinero base que se le entrega al chofer para dar vuelto y adjunte o tome la foto:</p>

                  <input 
                    type="number"
                    step="0.01"
                    value={baseChangeAmount}
                    onChange={e => setBaseChangeAmount(e.target.value)}
                    placeholder="Ej. 20.00"
                    className="w-full border p-2.5 rounded-lg text-sm font-bold text-cyan-900"
                  />

                  <div className="space-y-1 bg-cyan-50 p-3 rounded-xl border border-cyan-200 text-xs">
                    <p className="font-bold text-cyan-900 flex items-center gap-1"><Camera size={14} /> Foto del Dinero / Vuelto Entregado: *</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="cursor-pointer bg-white border-2 border-dashed border-cyan-400 text-cyan-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Camera size={14} /> <span>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleBaseChangeProofUpload} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>Teléfono</span>
                        <input type="file" accept="image/*" onChange={handleBaseChangeProofUpload} className="hidden" />
                      </label>
                    </div>
                    {baseChangeProofPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Foto cargada correctamente</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setBaseChangeModalOpen(false); setBaseChangeOrderId(null); setBaseChangeAmount(''); setBaseChangeProofPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveBaseChange} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Vuelto Base</button>
                  </div>
                </div>
              </div>
            )}

            {receivedChangeModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-amber-700 flex items-center gap-2">
                    <Banknote size={20} /> Vuelto Recibido del Chofer
                  </h3>
                  <p className="text-xs text-gray-600">Ingrese el monto de vuelto recibido y adjunte la foto de comprobación:</p>

                  <input 
                    type="number"
                    step="0.01"
                    value={receivedChangeAmount}
                    onChange={e => setReceivedChangeAmount(e.target.value)}
                    placeholder="Ej. 10.00"
                    className="w-full border p-2.5 rounded-lg text-sm font-bold text-amber-900"
                  />

                  <div className="space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                    <p className="font-bold text-amber-900 flex items-center gap-1"><Camera size={14} /> Foto del Vuelto Recibido: *</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="cursor-pointer bg-white border-2 border-dashed border-amber-400 text-amber-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Camera size={14} /> <span>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleReceivedChangeProofUpload} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>Teléfono</span>
                        <input type="file" accept="image/*" onChange={handleReceivedChangeProofUpload} className="hidden" />
                      </label>
                    </div>
                    {receivedChangeProofPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Foto cargada correctamente</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setReceivedChangeModalOpen(false); setReceivedChangeOrderId(null); setReceivedChangeAmount(''); setReceivedChangeProofPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveReceivedChange} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Vuelto Recibido</button>
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
                  <p className="text-xs text-gray-600">Adjunte o tome la foto de la factura emitida para este pedido:</p>

                  <div className="space-y-1 bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-xs">
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="cursor-pointer bg-white border-2 border-dashed border-indigo-400 text-indigo-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Camera size={14} /> <span>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleInvoicePhotoUpload} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>Teléfono</span>
                        <input type="file" accept="image/*" onChange={handleInvoicePhotoUpload} className="hidden" />
                      </label>
                    </div>
                    {invoicePhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Factura cargada correctamente</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setInvoiceModalOpen(false); setInvoiceOrderId(null); setInvoicePhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveInvoice} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar y Facturar</button>
                  </div>
                </div>
              </div>
            )}

            {finalAmountModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-emerald-700 flex items-center gap-2">
                    <DollarSign size={20} /> Asignar Monto Definitivo
                  </h3>
                  <p className="text-xs text-gray-600">Ingrese el monto exacto definitivo tras pesar o verificar los productos:</p>

                  <input 
                    type="number"
                    step="0.01"
                    value={exactFinalAmount}
                    onChange={e => setExactFinalAmount(e.target.value)}
                    placeholder="Monto definitivo (Ej. 8.40)"
                    className="w-full border p-2.5 rounded-lg text-sm font-bold text-emerald-900"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setFinalAmountModalOpen(false); setFinalAmountOrderId(null); setExactFinalAmount(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveFinalAmount} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Monto</button>
                  </div>
                </div>
              </div>
            )}

            {corruptModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
                    <ShieldAlert size={20} /> Registrar Pago Corrupto / Bloquear Cliente
                  </h3>
                  <p className="text-xs text-gray-600">Indique el motivo por el cual el pago o billete presenta una incidencia y adjunte la foto:</p>

                  <textarea 
                    rows="3" 
                    value={corruptReason} 
                    onChange={e => setCorruptReason(e.target.value)} 
                    placeholder="Ej. Billete falso, transferencia no reflejada..." 
                    className="w-full border p-2.5 rounded-lg text-xs"
                  />

                  <div className="space-y-1 bg-red-50 p-3 rounded-xl border border-red-200 text-xs">
                    <p className="font-bold text-red-900 flex items-center gap-1"><Camera size={14} /> Evidencia:</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="cursor-pointer bg-white border-2 border-dashed border-red-400 text-red-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Camera size={14} /> <span>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleCorruptPhotoUpload} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>Teléfono</span>
                        <input type="file" accept="image/*" onChange={handleCorruptPhotoUpload} className="hidden" />
                      </label>
                    </div>
                    {corruptPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Evidencia cargada correctamente</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setCorruptModalOpen(false); setCorruptOrderId(null); setCorruptReason(''); setCorruptPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveCorruptPayment} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Bloquear y Registrar Incidencia</button>
                  </div>
                </div>
              </div>
            )}

            {changeModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-teal-700 flex items-center gap-2">
                    <Banknote size={20} /> Vuelto que el Repartidor Entregó (Real)
                  </h3>
                  <p className="text-xs text-gray-600">Ingrese el monto exacto de dinero que el repartidor entregó de vuelto al cliente y adjunte su foto:</p>

                  <input 
                    type="number"
                    step="0.01"
                    value={changeAmountGiven}
                    onChange={e => setChangeAmountGiven(e.target.value)}
                    placeholder="Ej. 5.00"
                    className="w-full border p-2.5 rounded-lg text-sm font-bold text-teal-900"
                  />

                  <div className="space-y-1 bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs">
                    <p className="font-bold text-teal-900 flex items-center gap-1"><Camera size={14} /> Foto del Vuelto Entregado: *</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="cursor-pointer bg-white border-2 border-dashed border-teal-400 text-teal-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Camera size={14} /> <span>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleChangeProofPhotoUpload} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>Teléfono</span>
                        <input type="file" accept="image/*" onChange={handleChangeProofPhotoUpload} className="hidden" />
                      </label>
                    </div>
                    {changeProofPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Foto cargada correctamente</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setChangeModalOpen(false); setChangeOrderId(null); setChangeAmountGiven(''); setChangeProofPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveChangeGiven} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Vuelto Entregado</button>
                  </div>
                </div>
              </div>
            )}

            {productReturnModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-amber-700 flex items-center gap-2">
                    <ReturnIcon size={20} /> Devolución Parcial de Productos
                  </h3>
                  <p className="text-xs text-gray-600">Escriba el detalle del producto devuelto y **ingrese manualmente el valor total** a descontar del pedido:</p>

                  <input 
                    type="text"
                    value={returnedItemsSummary}
                    onChange={e => setReturnedItemsSummary(e.target.value)}
                    placeholder="Descripción (Ej. 1x Harina de Trigo 1kg)"
                    className="w-full border p-2 rounded-lg text-xs"
                  />

                  <input 
                    type="number"
                    step="0.01"
                    value={manualProductValue}
                    onChange={e => setManualProductValue(e.target.value)}
                    placeholder="Valor total a descontar (Ej. 4.50)"
                    className="w-full border p-2 rounded-lg text-xs font-bold"
                  />

                  <div className="space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                    <p className="font-bold text-amber-900 flex items-center gap-1"><Camera size={14} /> [Foto del Producto Devuelto]: *</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="cursor-pointer bg-white border-2 border-dashed border-amber-400 text-amber-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Camera size={14} /> <span>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleReturnedProductsPhotoUpload} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>Teléfono</span>
                        <input type="file" accept="image/*" onChange={handleReturnedProductsPhotoUpload} className="hidden" />
                      </label>
                    </div>
                    {returnedProductsPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Foto cargada correctamente</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setProductReturnModalOpen(false); setProductReturnOrderId(null); setReturnedItemsSummary(''); setManualProductValue(''); setReturnedProductsPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveProductReturn} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Aplicar Descuento</button>
                  </div>
                </div>
              </div>
            )}

            {refundModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-purple-700 flex items-center gap-2">
                    <Banknote size={20} /> Realizar y Subir Reembolso al Cliente
                  </h3>
                  <p className="text-xs text-gray-600">Ingrese el monto devuelto y adjunte la foto del comprobante de transferencia:</p>

                  <input 
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    placeholder="Monto a devolver (Ej. 4.50)"
                    className="w-full border p-2.5 rounded-lg text-sm font-bold text-purple-900"
                  />

                  <div className="space-y-1 bg-purple-50 p-3 rounded-xl border border-purple-200 text-xs">
                    <p className="font-bold text-purple-900 flex items-center gap-1"><Camera size={14} /> Foto del Comprobante de Transferencia: *</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="cursor-pointer bg-white border-2 border-dashed border-purple-400 text-purple-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Camera size={14} /> <span>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleRefundProofPhotoUpload} className="hidden" />
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                        <Upload size={14} /> <span>Teléfono</span>
                        <input type="file" accept="image/*" onChange={handleRefundProofPhotoUpload} className="hidden" />
                      </label>
                    </div>
                    {refundProofPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Comprobante cargado correctamente</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setRefundModalOpen(false); setRefundOrderId(null); setRefundAmount(''); setRefundProofPhoto(''); }} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveRefundRecord} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow">Guardar Reembolso</button>
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
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setSelectedPayMethodAdmin('Efectivo')} className={`p-2.5 rounded-xl border font-bold text-xs ${selectedPayMethodAdmin === 'Efectivo' ? 'bg-green-600 text-white' : 'bg-gray-50'}`}>💵 Efectivo</button>
                    <button type="button" onClick={() => setSelectedPayMethodAdmin('Tarjeta')} className={`p-2.5 rounded-xl border font-bold text-xs ${selectedPayMethodAdmin === 'Tarjeta' ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>💳 Tarjeta</button>
                    <button type="button" onClick={() => setSelectedPayMethodAdmin('Pago Digital')} className={`p-2.5 rounded-xl border font-bold text-xs ${selectedPayMethodAdmin === 'Pago Digital' ? 'bg-purple-600 text-white' : 'bg-gray-50'}`}>📱 Digital</button>
                  </div>

                  {paymentMethodsList.length > 0 && (
                    <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200 space-y-2 max-h-40 overflow-y-auto">
                      <p className="font-bold text-cyan-900 text-xs flex items-center gap-1">
                        <QrCode size={14} /> Métodos de Pago y QR Disponibles:
                      </p>
                      {paymentMethodsList.map(m => (
                        <div key={m.id} className="bg-white p-2 rounded border text-xs space-y-1">
                          <p className="font-bold text-gray-800">{m.title}</p>
                          <p className="text-gray-600">{m.description}</p>
                          {m.image && (
                            <button onClick={() => setPreviewImage(m.image)} className="text-cyan-700 underline font-bold flex items-center gap-1">
                              <Eye size={12} /> Ver QR / Imagen
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPayMethodAdmin === 'Efectivo' && (
                    <div className="space-y-1 bg-green-50 p-2.5 rounded-xl border border-green-200 text-xs">
                      <p className="font-bold text-green-900 flex items-center gap-1"><Camera size={14} /> [Foto del Efectivo Recibido]: *</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <label className="cursor-pointer bg-white border-2 border-dashed border-green-400 text-green-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                          <Camera size={14} /> <span>Cámara</span>
                          <input type="file" accept="image/*" capture="environment" onChange={handleCashPhotoUpload} className="hidden" />
                        </label>
                        <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                          <Upload size={14} /> <span>Teléfono</span>
                          <input type="file" accept="image/*" onChange={handleCashPhotoUpload} className="hidden" />
                        </label>
                      </div>
                      {cashPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Foto lista</p>}
                    </div>
                  )}

                  {selectedPayMethodAdmin !== 'Efectivo' && (
                    <div className="space-y-1 bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-xs">
                      <p className="font-bold text-purple-900 flex items-center gap-1"><Camera size={14} /> [Foto del Pago Digital / Capture]:</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <label className="cursor-pointer bg-white border-2 border-dashed border-purple-400 text-purple-800 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                          <Camera size={14} /> <span>Cámara</span>
                          <input type="file" accept="image/*" capture="environment" onChange={handleCashPhotoUpload} className="hidden" />
                        </label>
                        <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 text-gray-700 font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-1">
                          <Upload size={14} /> <span>Teléfono</span>
                          <input type="file" accept="image/*" onChange={handleCashPhotoUpload} className="hidden" />
                        </label>
                      </div>
                      {cashPhoto && <p className="text-[10px] text-green-700 font-bold mt-1">✅ Capture listo</p>}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setPayModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleConfirmAdminPayment} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">Guardar Pago</button>
                  </div>
                </div>
              </div>
            )}

            {failModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-red-600">Motivo de No Entrega</h3>
                  <textarea rows="3" value={failReason} onChange={e => setFailReason(e.target.value)} placeholder="Motivo..." className="w-full border p-3 rounded-lg text-xs"></textarea>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setFailModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg text-xs">Cancelar</button>
                    <button onClick={handleSaveFailReason} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Guardar</button>
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
