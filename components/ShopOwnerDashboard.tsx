
import React, { useState, useEffect, useRef } from 'react';
import { Store, MapPin, Tag, ShoppingCart, Clock, PackageCheck, Check, XCircle, Play, X } from 'lucide-react';
import { UserProfile, IncomingList, AppNotification, Ingredient } from '../types';
import { listenToIncomingLists, updateOrderStatus, updateOrderItems } from '../services/sessionService';

interface ShopOwnerDashboardProps {
  profile: UserProfile;
  onNotify: (notif: Omit<AppNotification, 'id'>) => void;
}

const ShopOwnerDashboard: React.FC<ShopOwnerDashboardProps> = ({ profile, onNotify }) => {
  const [orders, setOrders] = useState<IncomingList[]>([]);
  const hiddenOrderIdsRef = useRef<Set<string>>(new Set());
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (!profile.phone) return;

    const cachedOrdersKey = `orders_${profile.phone}`;
    const cached = localStorage.getItem(cachedOrdersKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const initialFiltered = parsed.filter((o: IncomingList) => !hiddenOrderIdsRef.current.has(o.id));
        setOrders(initialFiltered);
        prevOrderIdsRef.current = new Set(initialFiltered.map((o: any) => o.id));
      } catch (e) {
        console.error("Failed to parse cached orders");
      }
    }

    const unsubscribe = listenToIncomingLists(profile.phone, (incomingOrders) => {
      const filteredOrders = incomingOrders.filter(
        o => !hiddenOrderIdsRef.current.has(o.id)
      );
      
      // Notify for new incoming orders
      if (!isInitialMount.current) {
        filteredOrders.forEach(order => {
          if (!prevOrderIdsRef.current.has(order.id) && order.status === 'pending') {
            onNotify({
              title: 'New Order Received',
              message: `${order.customerName} has sent a new shopping list.`,
              type: 'info'
            });
          }
        });
      }

      isInitialMount.current = false;
      prevOrderIdsRef.current = new Set(filteredOrders.map(o => o.id));
      setOrders(filteredOrders);
      localStorage.setItem(cachedOrdersKey, JSON.stringify(filteredOrders));
    });

    return () => unsubscribe();
  }, [profile.phone, onNotify]);

  const handleUpdateStatus = async (e: React.MouseEvent, orderId: string, newStatus: 'accepted' | 'rejected' | 'ready' | 'completed') => {
    e.stopPropagation();
    e.preventDefault();

    if (newStatus === 'rejected' || newStatus === 'completed') {
      hiddenOrderIdsRef.current.add(orderId);
      setOrders(prevOrders => {
        const updated = prevOrders.filter(o => o.id !== orderId);
        const cachedOrdersKey = `orders_${profile.phone}`;
        localStorage.setItem(cachedOrdersKey, JSON.stringify(updated));
        return updated;
      });
    } else {
      setOrders(prevOrders => prevOrders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
    }

    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const toggleItemAvailability = async (order: IncomingList, itemIndex: number) => {
    if (order.status === 'pending' || order.status === 'completed' || order.status === 'rejected') return;

    const updatedItems = [...order.items];
    const currentItem = updatedItems[itemIndex];
    
    /** 
     * Three-state toggle logic:
     * undefined (Not checked) -> true (Available)
     * true (Available) -> false (Not Available)
     * false (Not Available) -> true (Available)
     */
    let nextState: boolean;
    if (currentItem.available === undefined) {
      nextState = true;
    } else if (currentItem.available === true) {
      nextState = false;
    } else {
      nextState = true;
    }

    updatedItems[itemIndex] = {
      ...currentItem,
      available: nextState
    };

    setOrders(prevOrders => prevOrders.map(o => 
        o.id === order.id ? { ...o, items: updatedItems } : o
    ));

    await updateOrderItems(order.id, updatedItems);
  };

  const visibleOrders = orders.filter(o => 
    o.status !== 'completed' && o.status !== 'rejected' && !hiddenOrderIdsRef.current.has(o.id)
  );
  
  const pendingOrders = visibleOrders.filter(o => o.status === 'pending');
  const activeOrders = visibleOrders.filter(o => o.status === 'accepted' || o.status === 'ready');

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
              {profile.shopName}
            </h1>
            <div className="flex flex-wrap justify-center gap-4 text-blue-100 text-sm font-medium">
              <span className="flex items-center gap-1.5 bg-black/10 px-4 py-1.5 rounded-full">
                <Tag className="w-4 h-4" /> {profile.storeType}
              </span>
              <span className="flex items-center gap-1.5 bg-black/10 px-4 py-1.5 rounded-full max-w-[200px] truncate">
                <MapPin className="w-4 h-4 flex-shrink-0" /> {profile.location}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-black text-stone-800">Incoming Orders</h2>
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
              {pendingOrders.length} New
            </span>
          </div>
          
          <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <p className="font-medium">Accept orders to start processing. Click items to toggle: <strong>Available</strong> (Green) or <strong>Unavailable</strong> (Red).</p>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-300 shadow-sm">
                <PackageCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-400">No active orders</h3>
              <p className="text-stone-400 text-sm">New orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {[...pendingOrders, ...activeOrders].map((order) => (
                <div 
                  key={order.id} 
                  className={`bg-white border rounded-2xl p-6 transition-all shadow-sm group relative
                    ${order.status === 'pending' ? 'border-blue-200 ring-4 ring-blue-500/5' : 'border-stone-100 hover:border-emerald-200'}
                    ${order.status === 'accepted' ? 'border-l-4 border-l-emerald-500' : ''}
                  `}
                >
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-lg text-stone-800 leading-tight">{order.customerName}</h4>
                        {order.status === 'pending' && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">New</span>
                        )}
                        {order.status === 'accepted' && (
                            <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Processing</span>
                        )}
                         {order.status === 'ready' && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ready</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 font-mono font-medium mt-0.5">+91 {order.customerPhone}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                       {order.status === 'pending' && (
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => handleUpdateStatus(e, order.id, 'rejected')}
                             className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
                             title="Reject Order"
                           >
                             <XCircle className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Reject</span>
                           </button>
                           <button 
                             onClick={(e) => handleUpdateStatus(e, order.id, 'accepted')}
                             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-200 flex items-center gap-1"
                           >
                             <Play className="w-3 h-3 fill-current" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Accept Order</span>
                           </button>
                         </div>
                       )}

                       {order.status === 'accepted' && (
                         <button 
                           onClick={(e) => handleUpdateStatus(e, order.id, 'ready')}
                           className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-sm shadow-emerald-200"
                         >
                           Mark Ready
                         </button>
                       )}

                       {order.status === 'ready' && (
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => handleUpdateStatus(e, order.id, 'completed')}
                             className="bg-stone-800 hover:bg-black text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-sm"
                           >
                             Mark Delivered
                           </button>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {order.items.map((item, idx) => {
                      const isInteractive = order.status === 'accepted' || order.status === 'ready';
                      const isAvailable = item.available === true;
                      const isUnavailable = item.available === false;
                      const isUnchecked = item.available === undefined;

                      return (
                        <div 
                            key={idx} 
                            onClick={() => toggleItemAvailability(order, idx)}
                            className={`px-3 py-2 rounded-lg flex justify-between items-center border transition-all select-none
                            ${isInteractive ? 'cursor-pointer hover:border-stone-400' : 'cursor-default opacity-80'}
                            ${isAvailable ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500/20' : ''}
                            ${isUnavailable ? 'bg-red-50 border-red-200 ring-1 ring-red-500/20' : ''}
                            ${isUnchecked ? 'bg-white border-stone-200' : ''}
                            `}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all
                                    ${isAvailable ? 'bg-emerald-500 border-emerald-500' : ''}
                                    ${isUnavailable ? 'bg-red-500 border-red-500' : ''}
                                    ${isUnchecked ? 'bg-white border-stone-300' : ''}
                                    ${!isInteractive ? 'opacity-50' : ''}
                                `}>
                                    {isAvailable && <Check className="w-2.5 h-2.5 text-white" />}
                                    {isUnavailable && <X className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className={`text-sm font-medium truncate 
                                    ${isAvailable ? 'text-emerald-900' : ''}
                                    ${isUnavailable ? 'text-red-900' : ''}
                                    ${isUnchecked ? 'text-stone-500' : ''}
                                `}>
                                    {item.name}
                                </span>
                            </div>
                            <span className={`text-xs font-black 
                                ${isAvailable ? 'text-emerald-700' : ''}
                                ${isUnavailable ? 'text-red-700' : ''}
                                ${isUnchecked ? 'text-stone-400' : ''}
                            `}>
                                {item.quantity} {item.unit}
                            </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        Ordered {order.timestamp?.toDate ? order.timestamp.toDate().toLocaleTimeString() : 'Recently'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopOwnerDashboard;
