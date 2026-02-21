/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  Search,
  Printer,
  Smartphone,
  Coffee,
  Flame,
  Cookie,
  CheckCircle2,
  X,
  Camera,
  Upload,
  Edit2,
  Save,
  History,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from './lib/supabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---
interface CategorySelectProps {
  value: string;
  categories: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ value, categories, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCategories = categories
    .filter(c => c !== 'All')
    .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cat: string) => {
    onChange(cat);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setIsOpen(false);
  };

  if (isAddingNew) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            autoFocus
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
            placeholder="Ketik kategori baru..."
            value={newCategory}
            onChange={(e) => {
              setNewCategory(e.target.value);
              onChange(e.target.value);
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAddingNew(false);
            setNewCategory('');
            onChange(categories.filter(c => c !== 'All')[0] || '');
          }}
          className="p-3 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 transition-colors"
          title="Batal"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between hover:bg-zinc-100/50 transition-colors text-left"
      >
        <span className={cn(!value && "text-zinc-400")}>
          {value || placeholder || "Pilih Kategori"}
        </span>
        <ChevronDown size={18} className={cn("text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-2 border-b border-zinc-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border-none rounded-lg text-sm focus:ring-0"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors",
                    value === cat ? "bg-black text-white font-medium" : "hover:bg-zinc-100 text-zinc-700"
                  )}
                >
                  {cat}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-zinc-400 text-xs">
                Tidak ada kategori ditemukan
              </div>
            )}
            
            <div className="p-1 mt-1 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-sm text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2"
              >
                <Plus size={14} />
                + Tambah Kategori Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

// --- Types ---
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

interface SalesData {
  date: string;
  total: number;
}

interface TopProductData {
  name: string;
  total_quantity: number;
}

// --- Components ---

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-black text-white shadow-lg shadow-black/20" 
        : "text-zinc-500 hover:bg-zinc-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'Seblak': return <Flame size={18} />;
    case 'Topping': return <Plus size={18} />;
    case 'Minuman': return <Coffee size={18} />;
    case 'Pulsa':
    case 'Quota': return <Smartphone size={18} />;
    case 'Snack': return <Cookie size={18} />;
    case 'Service': return <Printer size={18} />;
    default: return <Package size={18} />;
  }
};

const ImageUpload = ({ value, onChange }: { value: string | null, onChange: (val: string) => void }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        onChange(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-zinc-100 rounded-2xl overflow-hidden border-2 border-dashed border-zinc-200 flex items-center justify-center">
        {value ? (
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-zinc-400 flex flex-col items-center gap-2">
            <ImageIcon size={48} />
            <p className="text-xs font-medium">Belum ada gambar</p>
          </div>
        )}
        
        {isCameraOpen && (
          <div className="absolute inset-0 bg-black z-10">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button type="button" onClick={capturePhoto} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg">
                <Camera size={24} />
              </button>
              <button type="button" onClick={stopCamera} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-sm font-bold transition-colors"
        >
          <Upload size={18} /> Galeri
        </button>
        <button 
          type="button"
          onClick={startCamera}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-sm font-bold transition-colors"
        >
          <Camera size={18} /> Kamera
        </button>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'analysis' | 'history'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Cart Info State
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away'>('Dine In');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Seblak',
    price: 0,
    stock: -1,
    image_url: null
  });

  // Analytics State
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [configError, setConfigError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['All', ...cats];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const fetchProducts = React.useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setProducts(data || []);
      setConfigError(null);
    } catch (err) {
      console.error('Failed to fetch products', err);
      const msg = (err as Error).message;
      if (msg.includes('Supabase credentials') || msg.includes('VITE_SUPABASE_URL')) {
        setConfigError(msg);
      }
    }
  }, []);

  const fetchHistory = React.useCallback(async () => {
    try {
      const { data: transactions, error: tError } = await getSupabase()
        .from('transactions')
        .select(`
          *,
          items:transaction_items(*)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (tError) throw tError;
      setHistoryData(transactions || []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  }, []);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      // Fetch sales by date
      const { data: sales, error: sError } = await getSupabase()
        .from('transactions')
        .select('timestamp, total_amount');
      
      if (sError) throw sError;

      // Group by date
      const groupedSales = (sales || []).reduce((acc: any, curr) => {
        const date = new Date(curr.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + curr.total_amount;
        return acc;
      }, {});

      const formattedSales = Object.entries(groupedSales).map(([date, total]) => ({
        date,
        total: total as number
      })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

      setSalesData(formattedSales);

      // Fetch top products
      const { data: items, error: iError } = await getSupabase()
        .from('transaction_items')
        .select('product_name, quantity');
      
      if (iError) throw iError;

      const groupedProducts = (items || []).reduce((acc: any, curr) => {
        acc[curr.product_name] = (acc[curr.product_name] || 0) + curr.quantity;
        return acc;
      }, {});

      const formattedProducts = Object.entries(groupedProducts).map(([name, total_quantity]) => ({
        name,
        total_quantity: total_quantity as number
      })).sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10);

      setTopProducts(formattedProducts);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    if (activeTab === 'analysis') {
      fetchAnalytics();
    }
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchProducts, fetchHistory, fetchAnalytics]);

  // Realtime Subscriptions
  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch (e) {
      return;
    }

    const channel = supabase
      .channel('realtime-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchHistory();
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts, fetchHistory, fetchAnalytics]);

  const addToCart = (product: Product) => {
    if (product.stock !== -1 && product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        // Check stock
        if (delta > 0 && item.stock !== -1 && newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert("Mohon isi nama pemesan!");
      return;
    }

    const total = cartTotal;
    const paid = typeof amountPaid === 'number' ? amountPaid : total;
    
    if (paymentMethod === 'Cash' && paid < total) {
      alert("Jumlah bayar kurang!");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Transaction
      const { data: transaction, error: tError } = await getSupabase()
        .from('transactions')
        .insert({
          total_amount: total,
          customer_name: customerName,
          order_type: orderType,
          amount_paid: paid,
          change_amount: Math.max(0, paid - total),
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (tError) throw tError;

      // 2. Create Transaction Items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: iError } = await getSupabase()
        .from('transaction_items')
        .insert(transactionItems);

      if (iError) throw iError;

      // 3. Update Stock
      for (const item of cart) {
        if (item.stock !== -1) {
          const { error: sError } = await getSupabase()
            .from('products')
            .update({ stock: item.stock - item.quantity })
            .eq('id', item.id);
          
          if (sError) console.error(`Failed to update stock for product ${item.id}`, sError);
        }
      }

      setCart([]);
      setCustomerName('');
      setOrderType('Dine In');
      setAmountPaid('');
      setPaymentMethod('Cash');
      setShowSuccess(true);
      fetchProducts();
      fetchHistory();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Checkout failed', err);
      alert("Checkout gagal: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsProcessing(true);
    try {
      const { error } = await getSupabase()
        .from('products')
        .update({
          name: editingProduct.name,
          category: editingProduct.category,
          price: editingProduct.price,
          stock: editingProduct.stock,
          image_url: editingProduct.image_url
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Update failed", err);
      alert("Update gagal: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const { error } = await getSupabase()
        .from('products')
        .insert(newProduct);

      if (error) throw error;
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        category: 'Seblak',
        price: 0,
        stock: -1,
        image_url: null
      });
      fetchProducts();
    } catch (err) {
      console.error("Create failed", err);
      alert("Tambah produk gagal: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    
    try {
      const { error } = await getSupabase()
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProducts();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Hapus produk gagal: " + (err as Error).message);
    }
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-zinc-200">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <Package size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Konfigurasi Diperlukan</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Aplikasi ini memerlukan koneksi ke Supabase untuk menyimpan data produk dan transaksi.
            </p>
          </div>
          <div className="bg-zinc-50 p-4 rounded-2xl text-left border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Langkah Penyiapan:</p>
            <ol className="text-xs text-zinc-600 space-y-2 list-decimal list-inside font-medium">
              <li>Buka dashboard Supabase Anda</li>
              <li>Salin <span className="text-black font-bold">Project URL</span> dan <span className="text-black font-bold">Anon Key</span></li>
              <li>Tambahkan ke Environment Variables di AI Studio</li>
            </ol>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Cek Lagi & Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-zinc-900 font-sans">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-zinc-200 z-40 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kedai 578</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Sync</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <TabButton 
            active={activeTab === 'pos'} 
            onClick={() => setActiveTab('pos')} 
            icon={ShoppingCart} 
            label="Penjualan" 
          />
          <TabButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
            icon={Package} 
            label="Stok & Menu" 
          />
          <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')} 
            icon={BarChart3} 
            label="Analisa" 
          />
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={History} 
            label="Riwayat" 
          />
        </div>
      </nav>

      <main className="pt-28 pb-12 px-8 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'pos' && (
            <motion.div 
              key="pos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-12 gap-8"
            >
              {/* Products Section */}
              <div className="col-span-8 space-y-6">
                <div className="sticky top-20 bg-[#F5F5F4]/80 backdrop-blur-md z-30 py-6 -mx-4 px-4 border-b border-zinc-200/50 flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Cari produk atau layanan..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                          selectedCategory === cat 
                            ? "bg-zinc-900 text-white border-zinc-900" 
                            : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 pt-4">
                  {filteredProducts.map(product => (
                    <motion.button
                      layout
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock !== -1 && product.stock <= 0}
                      className={cn(
                        "group bg-white border border-zinc-200 rounded-[32px] text-left transition-all hover:shadow-xl hover:shadow-black/5 hover:border-zinc-400 overflow-hidden flex flex-col h-full",
                        product.stock !== -1 && product.stock <= 0 && "opacity-50 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className="relative w-full aspect-square bg-zinc-100 overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <CategoryIcon category={product.category} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                          <div className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-zinc-900 shadow-sm">
                            <CategoryIcon category={product.category} />
                          </div>
                          {product.stock !== -1 && (
                            <span className={cn(
                              "text-[9px] font-black px-2 py-1 rounded-full uppercase shadow-sm",
                              product.stock < 10 ? "bg-red-500 text-white" : "bg-green-500 text-white"
                            )}>
                              {product.stock}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-zinc-900 text-sm mb-0.5 line-clamp-1">{product.name}</h3>
                        <p className="text-[10px] font-medium text-zinc-400 mb-3">{product.category}</p>
                        <div className="mt-auto flex justify-between items-center">
                          <span className="text-base font-black">{formatCurrency(product.price)}</span>
                          <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors border border-zinc-100">
                            <Plus size={14} />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Cart Section */}
              <div className="col-span-4">
                <div className="bg-zinc-200/50 border border-zinc-200 rounded-[40px] p-6 sticky top-20 flex flex-col h-[calc(100vh-120px)] shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <h2 className="text-xl font-black tracking-tight">Keranjang</h2>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.print()}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-zinc-100 shadow-sm hover:bg-zinc-50 transition-all text-zinc-400 hover:text-black"
                        title="Print Struk"
                      >
                        <Printer size={14} />
                      </button>
                      <span className="bg-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border border-zinc-100">{cart.length} Item</span>
                    </div>
                  </div>

                  {/* Scrollable Item List - Expanded space */}
                  <div className="flex-1 overflow-y-auto -mx-3 px-3 mb-4 min-h-0 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1 block">Daftar Pesanan</label>
                      {cart.map(item => (
                        <div key={item.id} className="flex gap-3 p-4 rounded-[28px] bg-white border border-zinc-100 shadow-sm hover:border-zinc-300 transition-all group">
                          <div className="flex-1">
                            <h4 className="font-bold text-xs text-zinc-900 group-hover:text-black transition-colors line-clamp-1">{item.name}</h4>
                            <p className="text-[10px] font-black text-zinc-400">{formatCurrency(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-xl p-1 shadow-inner">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white hover:shadow-md rounded-lg transition-all text-zinc-400 hover:text-black">
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white hover:shadow-md rounded-lg transition-all text-zinc-400 hover:text-black">
                                <Plus size={12} />
                              </button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {cart.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <ShoppingCart size={32} className="opacity-20" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Keranjang Kosong</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inputs Section - Shifted down and more compact */}
                  <div className="shrink-0 space-y-4 mb-4 pt-8 border-t border-zinc-200/30">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5 block">Nama Pemesan</label>
                        <input 
                          type="text" 
                          placeholder="Nama pelanggan..."
                          className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-[18px] text-xs font-bold focus:outline-none focus:ring-4 focus:ring-black/5 shadow-sm transition-all placeholder:text-zinc-300"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5 block">Tipe</label>
                          <div className="flex gap-1 p-0.5 bg-white border border-zinc-200 rounded-[18px] shadow-sm">
                            <button 
                              onClick={() => setOrderType('Dine In')}
                              className={cn(
                                "flex-1 py-1.5 rounded-[14px] text-[8px] font-black uppercase tracking-wider transition-all",
                                orderType === 'Dine In' ? "bg-black text-white shadow-md shadow-black/20" : "text-zinc-400 hover:text-zinc-600"
                              )}
                            >
                              Dine In
                            </button>
                            <button 
                              onClick={() => setOrderType('Take Away')}
                              className={cn(
                                "flex-1 py-1.5 rounded-[14px] text-[8px] font-black uppercase tracking-wider transition-all",
                                orderType === 'Take Away' ? "bg-black text-white shadow-md shadow-black/20" : "text-zinc-400 hover:text-zinc-600"
                              )}
                            >
                              Take Away
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5 block">Metode</label>
                          <div className="relative">
                            <select 
                              value={paymentMethod}
                              onChange={(e) => {
                                setPaymentMethod(e.target.value);
                                if (e.target.value !== 'Cash') setAmountPaid(cartTotal);
                              }}
                              className="w-full appearance-none px-4 py-2.5 bg-white border border-zinc-200 rounded-[18px] text-[8px] font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-black/5 shadow-sm pr-8"
                            >
                              {['Cash', 'QRIS', 'Transfer', 'Shopee Pay', 'Dana', 'Lainnya'].map(method => (
                                <option key={method} value={method}>{method}</option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400" size={12} />
                          </div>
                        </div>
                      </div>

                      {paymentMethod === 'Cash' && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5 block">Bayar</label>
                            <input 
                              type="number" 
                              placeholder="Rp 0"
                              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-[18px] text-xs font-black focus:outline-none focus:ring-4 focus:ring-black/5 shadow-sm"
                              value={amountPaid}
                              onChange={(e) => setAmountPaid(e.target.value === '' ? '' : parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5 block">Kembali</label>
                            <div className="w-full px-4 py-2.5 bg-zinc-100 border border-transparent rounded-[18px] text-xs font-black text-zinc-900 shadow-inner">
                              {formatCurrency(Math.max(0, (typeof amountPaid === 'number' ? amountPaid : 0) - cartTotal))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Section - Reduced by 20% */}
                  <div className="shrink-0 mt-auto pt-4 border-t-2 border-zinc-300/50 space-y-3">
                    <div className="flex justify-between items-center text-zinc-400 text-[9px] font-black uppercase tracking-[0.3em]">
                      <span>Subtotal</span>
                      <span className="text-zinc-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black tracking-tight mb-1">Total</span>
                      <span className="text-3xl font-black tracking-tighter leading-none">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || isProcessing}
                      className={cn(
                        "w-full py-4 rounded-[24px] font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.97] group",
                        cart.length === 0 || isProcessing 
                          ? "bg-zinc-200 text-zinc-400 shadow-none cursor-not-allowed" 
                          : "bg-black text-white hover:bg-zinc-800 shadow-black/20"
                      )}
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Bayar Sekarang</span>
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="sticky top-20 bg-[#F5F5F4]/80 backdrop-blur-md z-30 py-6 -mx-8 px-8 border-b border-zinc-200/50 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Stok & Menu</h2>
                  <p className="text-zinc-500 text-sm">Kelola ketersediaan produk dan layanan Anda berdasarkan kategori.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-zinc-200 flex items-center gap-2 shadow-sm">
                    <Package className="text-zinc-400" size={18} />
                    <span className="font-bold text-sm">{products.length} Produk Terdaftar</span>
                  </div>
                  <button 
                    onClick={() => setIsAddingProduct(true)}
                    className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
                  >
                    <Plus size={20} /> Tambah Produk
                  </button>
                </div>
              </div>

              <div className="space-y-16 pt-4">
                {categories.filter(c => c !== 'All').map(category => {
                  const categoryProducts = products.filter(p => p.category === category);
                  if (categoryProducts.length === 0) return null;

                  return (
                    <div key={category} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-900">
                          <CategoryIcon category={category} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">{category}</h3>
                        <div className="h-px flex-1 bg-zinc-200"></div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{categoryProducts.length} ITEM</span>
                      </div>

                      <div className="flex gap-6 overflow-x-auto pb-8 px-2 -mx-2 scrollbar-hide">
                        {categoryProducts.map(product => (
                          <div 
                            key={product.id}
                            className="min-w-[240px] max-w-[240px] bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group flex flex-col"
                          >
                            <div className="relative aspect-square bg-zinc-100 overflow-hidden">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                  <ImageIcon size={32} />
                                </div>
                              )}
                              <div className="absolute top-3 right-3">
                                {product.stock !== -1 && (
                                  <span className={cn(
                                    "text-[9px] font-black px-2 py-1 rounded-full uppercase shadow-sm",
                                    product.stock < 10 ? "bg-red-500 text-white" : "bg-green-500 text-white"
                                  )}>
                                    {product.stock}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col bg-white">
                              <h4 className="font-bold text-zinc-900 text-sm mb-1 line-clamp-1">{product.name}</h4>
                              <p className="text-lg font-black mb-5">{formatCurrency(product.price)}</p>
                              <div className="mt-auto flex gap-2">
                                <button 
                                  onClick={() => setEditingProduct(product)}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-2xl text-[11px] font-bold transition-all"
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="w-10 h-10 flex items-center justify-center bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-2xl transition-all border border-zinc-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Penjualan Hari Ini</p>
                  <h3 className="text-3xl font-black">
                    {formatCurrency(salesData.find(s => s.date === new Date().toISOString().split('T')[0])?.total || 0)}
                  </h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Transaksi</p>
                  <h3 className="text-3xl font-black">{salesData.length} Hari Aktif</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Produk Terlaris</p>
                  <h3 className="text-3xl font-black truncate">{topProducts[0]?.name || '-'}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Tren Penjualan (30 Hari Terakhir)</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#A1A1AA' }}
                          tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#A1A1AA' }}
                          tickFormatter={(val) => `Rp${val/1000}k`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(val: number) => [formatCurrency(val), 'Penjualan']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#000" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Produk Terpopuler</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fontWeight: 600, fill: '#18181B' }}
                          width={120}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8f8f8' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="total_quantity" fill="#000" radius={[0, 8, 8, 0]} barSize={24}>
                          {topProducts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#000' : '#71717A'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="sticky top-20 bg-[#F5F5F4]/80 backdrop-blur-md z-30 py-6 -mx-8 px-8 border-b border-zinc-200/50 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Riwayat Penjualan</h2>
                  <p className="text-zinc-500 text-sm">Daftar transaksi terbaru di Kedai 578.</p>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl border border-zinc-200 flex items-center gap-2 shadow-sm">
                  <Clock className="text-zinc-400" size={18} />
                  <span className="font-bold text-sm">{historyData.length} Transaksi Terakhir</span>
                </div>
              </div>

              <div className="space-y-4">
                {historyData.length === 0 ? (
                  <div className="bg-white p-20 rounded-[40px] border border-zinc-200 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center">
                      <History size={40} />
                    </div>
                    <p className="font-bold uppercase tracking-widest opacity-50">Belum ada riwayat transaksi</p>
                  </div>
                ) : (
                  historyData.map((transaction) => (
                    <div key={transaction.id} className="bg-white rounded-[32px] border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="p-6 flex flex-wrap items-center justify-between gap-6 border-b border-zinc-50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                            <Clock size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-black text-lg">#{transaction.id}</span>
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                {new Date(transaction.timestamp).toLocaleString('id-ID', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-900">{transaction.customer_name || 'Pelanggan Umum'}</span>
                              <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{transaction.order_type}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Metode</p>
                            <span className="px-3 py-1 bg-zinc-50 rounded-full text-[10px] font-black uppercase tracking-wider border border-zinc-100">
                              {transaction.payment_method}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Total</p>
                            <span className="text-xl font-black tracking-tighter">{formatCurrency(transaction.total_amount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-50/50 p-6">
                        <div className="flex flex-wrap gap-3">
                          {transaction.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white px-4 py-2 rounded-2xl border border-zinc-100 flex items-center gap-3 shadow-sm">
                              <span className="w-6 h-6 bg-zinc-50 rounded-lg flex items-center justify-center text-[10px] font-black">
                                {item.quantity}x
                              </span>
                              <span className="text-xs font-bold text-zinc-700">{item.product_name}</span>
                              <span className="text-[10px] font-black text-zinc-400">{formatCurrency(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {(editingProduct || isAddingProduct) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingProduct(null);
                setIsAddingProduct(false);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xl font-bold">{isAddingProduct ? 'Tambah Produk Baru' : 'Edit Produk'}</h3>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddingProduct(false);
                  }} 
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={isAddingProduct ? handleCreateProduct : handleUpdateProduct} className="p-6 space-y-6">
                <ImageUpload 
                  value={isAddingProduct ? newProduct.image_url : editingProduct?.image_url || null} 
                  onChange={(val) => {
                    if (isAddingProduct) setNewProduct({ ...newProduct, image_url: val });
                    else if (editingProduct) setEditingProduct({ ...editingProduct, image_url: val });
                  }} 
                />

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Nama Produk</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={isAddingProduct ? newProduct.name : editingProduct?.name || ''}
                      onChange={(e) => {
                        if (isAddingProduct) setNewProduct({ ...newProduct, name: e.target.value });
                        else if (editingProduct) setEditingProduct({ ...editingProduct, name: e.target.value });
                      }}
                    />
                  </div>

                  {(isAddingProduct || editingProduct) && (
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Kategori</label>
                      <CategorySelect 
                        value={isAddingProduct ? newProduct.category : editingProduct?.category || ''}
                        categories={categories}
                        placeholder="Pilih atau ketik kategori baru..."
                        onChange={(val) => {
                          if (isAddingProduct) setNewProduct({ ...newProduct, category: val });
                          else if (editingProduct) setEditingProduct({ ...editingProduct, category: val });
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Harga (Rp)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                        value={isAddingProduct ? newProduct.price : editingProduct?.price || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (isAddingProduct) setNewProduct({ ...newProduct, price: val });
                          else if (editingProduct) setEditingProduct({ ...editingProduct, price: val });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Stok</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          disabled={isAddingProduct ? false : editingProduct?.stock === -1}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50"
                          value={isAddingProduct ? (newProduct.stock === -1 ? '' : newProduct.stock) : (editingProduct?.stock === -1 ? '' : editingProduct?.stock || 0)}
                          placeholder={(isAddingProduct ? (newProduct.stock === -1 ? 'Unlimited' : '') : (editingProduct?.stock === -1 ? 'Unlimited' : ''))}
                          onChange={(e) => {
                            const val = e.target.value === '' ? -1 : parseInt(e.target.value);
                            if (isAddingProduct) setNewProduct({ ...newProduct, stock: val });
                            else if (editingProduct) setEditingProduct({ ...editingProduct, stock: val });
                          }}
                        />
                        {isAddingProduct && (
                          <button 
                            type="button"
                            onClick={() => setNewProduct({ ...newProduct, stock: newProduct.stock === -1 ? 0 : -1 })}
                            className={cn(
                              "px-3 rounded-xl text-[10px] font-bold border transition-all",
                              newProduct.stock === -1 ? "bg-black text-white border-black" : "bg-white text-zinc-500 border-zinc-200"
                            )}
                          >
                            INF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddingProduct(false);
                    }}
                    className="flex-1 py-3 border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} /> {isAddingProduct ? 'Tambah Produk' : 'Simpan Perubahan'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="font-black text-lg">Transaksi Berhasil!</p>
              <p className="text-xs text-green-100 font-bold uppercase tracking-widest">Data penjualan telah diperbarui.</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="ml-4 p-4 bg-white text-green-600 rounded-2xl hover:bg-green-50 transition-all shadow-lg flex items-center gap-2 font-black text-xs uppercase tracking-wider"
            >
              <Printer size={18} />
              Print Struk
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
