'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CreditCard, Truck, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, ShoppingBag, Tag, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { MOCK_PROMO_CODES } from '@/lib/mockData';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  
  const hasBooks = cart.some(item => item.type === 'book');
  const hasCourses = cart.some(item => item.type === 'course');
  const onlyCourses = hasCourses && !hasBooks;

  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [loading, setLoading] = useState(false);
  const [shippingData, setShippingData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cod'>('card');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [cardErrors, setCardErrors] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'discover' | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, amount: number } | null>(null);

  useEffect(() => {
    if (user) {
      setShippingData(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (onlyCourses && step === 'shipping') {
      setStep('payment');
    }
  }, [onlyCourses, step]);

  const detectCardType = (number: string): 'visa' | 'mastercard' | 'amex' | 'discover' | null => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return null;
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (value: string): string => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
  };

  const validateCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    if (!cleaned) return '';
    if (cleaned.length < 13) return 'Card number is too short';
    if (cleaned.length > 16) return 'Card number is too long';
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) return 'Invalid card number';
    return '';
  };

  const validateExpiry = (value: string): string => {
    if (!value) return '';
    const match = value.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return 'Use MM/YY format';
    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);
    if (month < 1 || month > 12) return 'Invalid month';
    const now = new Date();
    const expiry = new Date(year, month);
    if (expiry < now) return 'Card has expired';
    return '';
  };

  const validateCVV = (value: string): string => {
    if (!value) return '';
    const isAmex = cardType === 'amex';
    if (value.length < (isAmex ? 4 : 3)) return 'CVV is too short';
    if (value.length > (isAmex ? 4 : 3)) return 'CVV is too long';
    return '';
  };

  const validateCardName = (value: string): string => {
    if (!value.trim()) return 'Cardholder name is required';
    if (value.trim().length < 2) return 'Name is too short';
    return '';
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    const type = detectCardType(value);
    setCardType(type);
    setCardData(prev => ({ ...prev, number: formatted }));
    const error = validateCardNumber(formatted);
    setCardErrors(prev => ({ ...prev, number: error }));
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    setCardData(prev => ({ ...prev, expiry: formatted }));
    const error = validateExpiry(formatted);
    setCardErrors(prev => ({ ...prev, expiry: error }));
  };

  const handleCVVChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, cardType === 'amex' ? 4 : 3);
    setCardData(prev => ({ ...prev, cvv: cleaned }));
    const error = validateCVV(cleaned);
    setCardErrors(prev => ({ ...prev, cvv: error }));
  };

  const handleCardNameChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z\s]/g, '');
    setCardData(prev => ({ ...prev, name: cleaned }));
    setCardErrors(prev => ({ ...prev, name: cleaned.trim() ? '' : 'Cardholder name is required' }));
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    const found = MOCK_PROMO_CODES.find(p => p.code.toUpperCase() === promoCode.trim().toUpperCase());
    if (found) {
      let discountAmount = 0;
      if (found.type === 'fixed') {
        discountAmount = found.discount;
      } else {
        discountAmount = totalPrice * found.discount;
      }
      setAppliedDiscount({ code: found.code, amount: discountAmount });
      toast.success(`Promo code ${found.code} applied!`);
    } else {
      toast.error('Invalid promo code');
    }
  };

  const finalTotal = totalPrice - (appliedDiscount?.amount || 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (paymentMethod === 'card') {
      const nameError = validateCardName(cardData.name);
      const numberError = validateCardNumber(cardData.number);
      const expiryError = validateExpiry(cardData.expiry);
      const cvvError = validateCVV(cardData.cvv);
      
      if (nameError || numberError || expiryError || cvvError) {
        toast.error('Please fix card details errors');
        return;
      }
      
      if (!cardData.name.trim() || !cardData.number.trim() || !cardData.expiry.trim() || !cardData.cvv.trim()) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    setLoading(true);

    // Prepare order payload for API
    const hasOnlyCourses = cart.every(item => item.type === 'course');
    const orderPayload = {
      payment_method: paymentMethod,
      items: cart.filter(item => item.type === 'book' || item.type === 'course').map(item => ({
        type: item.type,
        book_id: item.type === 'book' && item.bookId ? parseInt(item.bookId) : null,
        course_id: item.type === 'course' && item.courseId ? parseInt(item.courseId) : null,
        quantity: item.quantity || 1,
        price: item.price,
        format: (item as any).format || 'physical',
      })),
      ...(hasOnlyCourses ? {
        // Course-only order: minimal required fields
        shipping_address: 'N/A - Course Enrollment',
        city: 'N/A',
        phone: (user as any).phone || '0000000000',
      } : {
        // Mixed order: include shipping details
        shipping_address: shippingData.address,
        city: shippingData.city,
        state: (shippingData as any).state || 'N/A',
        postal_code: shippingData.zipCode,
        phone: shippingData.phone,
      }),
    };

    console.log('[Checkout] Sending order to API:', orderPayload);

    const token = localStorage.getItem('auth_token');
    console.log('[Checkout] Token present:', !!token, 'Token prefix:', token ? token.substring(0, 10) + '...' : 'none');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      console.log('[Checkout] Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('[Checkout] JSON response:', responseData);
      } else {
        const text = await response.text();
        console.error('[Checkout] Non-JSON response body:', JSON.stringify(text.slice(0, 1000)));
        toast.error('Server returned an unexpected response. Check console for details.');
      }
      
      if (!response.ok) {
        console.error('[Checkout] API Error:', response.status, responseData);
        console.error('[Checkout] Response message:', responseData?.message || '(no message)');
        console.error('[Checkout] Full payload:', JSON.stringify(orderPayload));
        toast.error(responseData?.message || `Order failed (${response.status})`);
        setLoading(false);
        return;
      }

      console.log('[Checkout] Order saved successfully:', responseData);
    } catch (error) {
      console.error('[Checkout] Fetch/parse error:', error);
      toast.error('Network error — could not reach the server');
      setLoading(false);
      return;
    }

    // Also save to localStorage for immediate use
    setTimeout(() => {
      const orderData = {
        id: `LMN-${Math.floor(Math.random() * 1000000)}`,
        userId: user.uid,
        items: cart,
        total: finalTotal,
        status: hasOnlyCourses ? 'completed' : 'pending',
        paymentMethod,
        shippingAddress: hasOnlyCourses ? null : shippingData,
        createdAt: new Date().toISOString(),
        discount: appliedDiscount,
        type: hasOnlyCourses ? 'course-enrollment' : 'mixed',
      };

      const existingOrders = JSON.parse(localStorage.getItem('lumina_orders') || '[]');
      localStorage.setItem('lumina_orders', JSON.stringify([orderData, ...existingOrders]));

      clearCart();
      setStep('success');
      try { window.dispatchEvent(new Event('orders-changed')); } catch (err) {}
      setLoading(false);
    }, 1500);
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 mb-6">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <div className="flex gap-4">
          <Link href="/shop" className="text-orange-600 font-bold hover:underline">Go back to shop</Link>
          <Link href="/courses" className="text-orange-600 font-bold hover:underline">Browse courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-center gap-8 mb-12">
        {[
          { id: 'shipping', label: 'Shipping', icon: Truck },
          { id: 'payment', label: 'Payment', icon: CreditCard },
          { id: 'success', label: 'Confirmation', icon: CheckCircle2 },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              step === s.id ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : 
              (i < (step === 'payment' ? 1 : step === 'success' ? 2 : 0) ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")
            )}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-sm font-bold uppercase tracking-widest hidden md:block",
              step === s.id ? "text-gray-900" : "text-gray-400"
            )}>{s.label}</span>
            {i < 2 && <div className="w-12 h-px bg-gray-100 hidden md:block"></div>}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!onlyCourses && step === 'shipping' && (
          <motion.div
            key="shipping"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            <div className="lg:col-span-8 space-y-8">
              <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-bold text-gray-900">Shipping Information</h2>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">Profile Linked</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      value={shippingData.fullName}
                      readOnly
                      className="w-full p-4 bg-gray-100 border border-transparent rounded-2xl text-gray-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      value={shippingData.email}
                      readOnly
                      className="w-full p-4 bg-gray-100 border border-transparent rounded-2xl text-gray-500 cursor-not-allowed outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Street Address</label>
                    <input 
                      type="text" 
                      value={shippingData.address}
                      onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">City</label>
                    <input 
                      type="text" 
                      value={shippingData.city}
                      onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zip Code</label>
                    <input 
                      type="text" 
                      value={shippingData.zipCode}
                      onChange={(e) => setShippingData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <input 
                      type="tel" 
                      value={shippingData.phone}
                      onChange={(e) => setShippingData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="01XXXXXXXXX"
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Link href="/cart" className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Cart</span>
                </Link>
                <button 
                  onClick={() => {
                    if (!shippingData.address.trim() || !shippingData.city.trim() || !shippingData.zipCode.trim() || !shippingData.phone.trim()) {
                      toast.error('Please fill in all shipping details');
                      return;
                    }
                    setStep('payment');
                  }}
                  className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <OrderSummary 
                cart={cart} 
                totalPrice={totalPrice} 
                promoCode={promoCode} 
                setPromoCode={setPromoCode} 
                handleApplyPromo={handleApplyPromo}
                appliedDiscount={appliedDiscount}
                finalTotal={finalTotal}
              />
            </div>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            <div className="lg:col-span-8 space-y-8">
              <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900">Payment Method</h2>
                {onlyCourses && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <GraduationCap className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Course enrollment — no shipping required. Access will be available immediately after payment.</p>
                  </div>
                )}
                <div className="space-y-4">
                  {[
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Secure payment with Stripe' },
                    { id: 'paypal', label: 'PayPal', icon: ShoppingBag, desc: 'Fast and secure checkout' },
                    { id: 'cod', label: 'Cash on Delivery', icon: Truck, desc: 'Pay when you receive your books' },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={cn(
                        "w-full flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left",
                        paymentMethod === method.id ? "border-orange-600 bg-orange-50/30" : "border-gray-100 hover:border-orange-200"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        paymentMethod === method.id ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-400"
                      )}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        paymentMethod === method.id ? "border-orange-600" : "border-gray-200"
                      )}>
                        {paymentMethod === method.id && <div className="w-3 h-3 bg-orange-600 rounded-full"></div>}
                      </div>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cardholder Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={cardData.name}
                        onChange={(e) => handleCardNameChange(e.target.value)}
                        className={cn(
                          "w-full p-4 bg-white border rounded-2xl outline-none transition-all",
                          cardErrors.name ? "border-red-200 focus:border-red-500/20 focus:ring-2 focus:ring-red-500/10" : "border-gray-100 focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10"
                        )} 
                      />
                      {cardErrors.name && <p className="text-xs text-red-500 mt-1">{cardErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Card Number</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="**** **** **** ****" 
                          value={cardData.number}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          maxLength={19}
                          className={cn(
                            "w-full p-4 pr-16 bg-white border rounded-2xl outline-none transition-all",
                            cardErrors.number ? "border-red-200 focus:border-red-500/20 focus:ring-2 focus:ring-red-500/10" : "border-gray-100 focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10"
                          )} 
                        />
                        {cardType && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {cardType === 'visa' && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">VISA</span>}
                            {cardType === 'mastercard' && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">MC</span>}
                            {cardType === 'amex' && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">AMEX</span>}
                            {cardType === 'discover' && <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">DISC</span>}
                          </div>
                        )}
                      </div>
                      {cardErrors.number && <p className="text-xs text-red-500 mt-1">{cardErrors.number}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          value={cardData.expiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          maxLength={5}
                          className={cn(
                            "w-full p-4 bg-white border rounded-2xl outline-none transition-all",
                            cardErrors.expiry ? "border-red-200 focus:border-red-500/20 focus:ring-2 focus:ring-red-500/10" : "border-gray-100 focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10"
                          )} 
                        />
                        {cardErrors.expiry && <p className="text-xs text-red-500 mt-1">{cardErrors.expiry}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CVV</label>
                        <input 
                          type="text" 
                          placeholder={cardType === 'amex' ? '****' : '***'} 
                          value={cardData.cvv}
                          onChange={(e) => handleCVVChange(e.target.value)}
                          maxLength={cardType === 'amex' ? 4 : 3}
                          className={cn(
                            "w-full p-4 bg-white border rounded-2xl outline-none transition-all",
                            cardErrors.cvv ? "border-red-200 focus:border-red-500/20 focus:ring-2 focus:ring-red-500/10" : "border-gray-100 focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10"
                          )} 
                        />
                        {cardErrors.cvv && <p className="text-xs text-red-500 mt-1">{cardErrors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                {!onlyCourses ? (
                  <button 
                    onClick={() => setStep('shipping')}
                    className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Shipping</span>
                  </button>
                ) : (
                  <Link href="/cart" className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Cart</span>
                  </Link>
                )}
                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="px-12 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <OrderSummary 
                cart={cart} 
                totalPrice={totalPrice} 
                promoCode={promoCode} 
                setPromoCode={setPromoCode} 
                handleApplyPromo={handleApplyPromo}
                appliedDiscount={appliedDiscount}
                finalTotal={finalTotal}
              />
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center py-20 space-y-8"
          >
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            {onlyCourses ? (
              <>
                <h1 className="font-serif text-5xl font-bold text-gray-900">Enrollment Confirmed!</h1>
                <p className="text-xl text-gray-500">Thank you for enrolling. You now have access to your courses. Check your email at <span className="text-gray-900 font-bold">{shippingData.email}</span> for details.</p>
              </>
            ) : (
              <>
                <h1 className="font-serif text-5xl font-bold text-gray-900">Order Confirmed!</h1>
                <p className="text-xl text-gray-500">Thank you for your purchase. We've sent a confirmation email to <span className="text-gray-900 font-bold">{shippingData.email}</span>.</p>
              </>
            )}
            <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Order Number</span>
                <span className="text-gray-900 font-bold">#LMN-{Math.floor(Math.random() * 1000000)}</span>
              </div>
              {onlyCourses ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">Access</span>
                  <span className="text-green-600 font-bold">Available Now</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">Estimated Delivery</span>
                  <span className="text-gray-900 font-bold">3-5 Business Days</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/profile" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all">
                View Order History
              </Link>
              <Link href="/shop" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderSummary({ 
  cart, 
  totalPrice, 
  promoCode, 
  setPromoCode, 
  handleApplyPromo,
  appliedDiscount,
  finalTotal
}: { 
  cart: any[], 
  totalPrice: number,
  promoCode: string,
  setPromoCode: (v: string) => void,
  handleApplyPromo: () => void,
  appliedDiscount: { code: string, amount: number } | null,
  finalTotal: number
}) {
  return (
    <div className="sticky top-24 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-orange-900/5 space-y-8">
      <h3 className="text-2xl font-serif font-bold text-gray-900">Order Summary</h3>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {cart.map(item => (
          <div key={item.bookId || item.courseId} className="flex gap-4">
            <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 relative">
              <img src={item.coverUrl} className="w-full h-full object-cover" />
              {item.type === 'course' && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              {item.type === 'course' && (
                <p className="text-[10px] text-orange-600 font-semibold">Course</p>
              )}
            </div>
            <p className="text-sm font-bold text-gray-900">৳{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-gray-100 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Promo Code</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter code" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 p-3 bg-gray-50 border border-transparent rounded-xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none text-sm"
            />
            <button 
              type="button"
              onClick={handleApplyPromo}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-gray-50">
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Subtotal</span>
            <span className="font-bold text-gray-900">৳{totalPrice.toFixed(2)}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-green-600 text-sm">
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Discount ({appliedDiscount.code})</span>
              </div>
              <span className="font-bold">-${appliedDiscount.amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Shipping</span>
            <span className="text-green-600 font-bold uppercase text-xs tracking-widest">Free</span>
          </div>
          <div className="pt-4 flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">৳{finalTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
