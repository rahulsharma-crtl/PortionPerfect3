import React, { useState } from 'react';
import { Store, Phone, Navigation, Tag, Send, Check, Loader2, PackageCheck, XCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { ShopProximity, ShoppingList, UserProfile, IncomingList, Ingredient } from '../types';
import { sendListToOwner, updateOrderItems } from '../services/sessionService';

interface NearbyShopsProps {
  shops: ShopProximity[];
  shoppingList?: ShoppingList | null;
  userProfile?: UserProfile | null;
  customerOrders?: IncomingList[];
}

const NearbyShops: React.FC<NearbyShopsProps> = ({ shops, shoppingList, userProfile, customerOrders = [] }) => {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  if (shops.length === 0) return null;

  const handleSendOrUpdate = async (shop: ShopProximity) => {
    if (!shoppingList || !userProfile) return;

    let relevantItems: Ingredient[] = [];
    if (shop.storeType === 'Supermarket') {
      relevantItems = [...shoppingList.VegetableShop, ...shoppingList.GroceryShop];
    } else if (shop.storeType === 'Vegetable & Fruits') {
      relevantItems = shoppingList.VegetableShop;
    } else if (shop.storeType === 'Grocery') {
      relevantItems = shoppingList.GroceryShop;
    }

    if (relevantItems.length === 0) {
      alert(`No relevant items for this ${shop.storeType} in your current list.`);
      return;
    }

    setSendingId(shop.phone);
    try {
      const activeOrder = customerOrders.find(o => o.shopPhone === shop.phone && o.status !== 'completed' && o.status !== 'rejected');
      
      if (activeOrder) {
        // Just update existing order
        const mergedItems = relevantItems.map(newItem => {
            const existing = activeOrder.items.find(oldItem => oldItem.name === newItem.name);
            const cleaned: any = { ...newItem };
            if (existing && existing.available !== undefined) cleaned.available = existing.available;
            return cleaned;
        });
        await updateOrderItems(activeOrder.id, mergedItems);
      } else {
        // Send new order
        await sendListToOwner(shop.phone, userProfile, relevantItems);
      }
      
      setSuccessId(shop.phone);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error("Failed to sync list:", err);
      alert("Failed to sync list. Please try again.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-6 px-2 border-t border-stone-200 pt-8">
        <Store className="w-5 h-5 text-emerald-600" />
        <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest">Recommended Nearby Vendors</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {shops.sort((a, b) => a.distance - b.distance).map((shop, idx) => {
          const isSending = sendingId === shop.phone;
          const isSuccess = successId === shop.phone;
          const hasShoppingList = !!shoppingList;
          
          const recentOrder = customerOrders.find(order => order.shopPhone === shop.phone && order.status !== 'completed' && order.status !== 'rejected');
          
          const items = recentOrder?.items || [];
          const availableItems = items.filter(i => i.available === true);
          const unavailableItems = items.filter(i => i.available === false);
          const pendingItems = items.filter(i => i.available === undefined);
          
          const isRejected = recentOrder?.status === 'rejected';
          const isPending = recentOrder?.status === 'pending';
          const isReady = recentOrder?.status === 'ready';
          
          const showLists = !!recentOrder && !isRejected;

          return (
            <div 
              key={idx} 
              className={`bg-white border rounded-2xl p-6 shadow-sm transition-all flex flex-col group relative overflow-hidden
                ${isRejected ? 'border-red-200 bg-red-50/10' : 'border-stone-200 hover:border-emerald-100'}
                ${isPending ? 'border-blue-200' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-stone-800 text-xl leading-tight mb-1">{shop.shopName}</h4>
                   <div className="flex items-center gap-2 text-stone-600 text-sm">
                    <Tag className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-bold uppercase text-[11px] tracking-wide text-stone-500">{shop.storeType}</span>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-tight flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" />
                  {shop.distance.toFixed(2)} km
                </span>
              </div>
              
              <div className="mb-6">
                 <div className="flex items-center gap-2 text-stone-600 text-sm bg-stone-50 w-fit px-3 py-1.5 rounded-lg border border-stone-100">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-mono text-stone-700 font-semibold">+91 {shop.phone}</span>
                </div>
              </div>

              {/* STATUS LISTS */}
              {showLists && (
                <div className="space-y-4 mb-6">
                  {/* AWAITING CONFIRMATION */}
                  {pendingItems.length > 0 && (
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-3 text-stone-500">
                        <HelpCircle className="w-4 h-4" />
                        <h5 className="font-bold text-xs uppercase tracking-widest">Awaiting Status</h5>
                      </div>
                      <ul className="space-y-2">
                        {pendingItems.map((item, i) => (
                          <li key={i} className="flex justify-between items-center text-[13px] bg-white px-3 py-2.5 rounded-lg border border-stone-100 shadow-sm">
                            <span className="text-stone-500 font-medium">{item.name}</span>
                            <span className="text-[11px] font-black text-stone-400 bg-stone-50 px-2.5 py-1 rounded">
                              {item.quantity} {item.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AVAILABLE SECTION */}
                  {availableItems.length > 0 && (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-3 text-emerald-800">
                        <PackageCheck className="w-4 h-4" />
                        <h5 className="font-bold text-xs uppercase tracking-widest">Available In Stock</h5>
                      </div>
                      <ul className="space-y-2">
                        {availableItems.map((item, i) => (
                          <li key={i} className="flex justify-between items-center text-[13px] bg-white px-3 py-2.5 rounded-lg border border-stone-100 shadow-sm">
                            <span className="text-stone-700 font-medium">{item.name}</span>
                            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                              {item.quantity} {item.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* NOT IN STOCK SECTION */}
                  {unavailableItems.length > 0 && (
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-4 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-3 text-red-800">
                        <XCircle className="w-4 h-4" />
                        <h5 className="font-bold text-xs uppercase tracking-widest">Not In Stock</h5>
                      </div>
                      <ul className="space-y-2">
                        {unavailableItems.map((item, i) => (
                          <li key={i} className="flex justify-between items-center text-[13px] bg-white px-3 py-2.5 rounded-lg border border-stone-100 shadow-sm">
                            <span className="text-stone-500 font-medium">{item.name}</span>
                            <span className="text-[11px] font-black text-red-500 bg-red-50 px-2.5 py-1 rounded">
                              {item.quantity} {item.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* READY BADGE */}
                  {isReady && (
                     <div className="mt-2 text-[10px] font-black text-emerald-600 flex items-center gap-1 justify-center bg-emerald-50 py-2 border border-emerald-100 rounded-lg uppercase tracking-tight">
                        <Check className="w-3.5 h-3.5" /> Shop marked order as READY
                     </div>
                  )}
                </div>
              )}

              {/* ACTION BUTTON */}
              {hasShoppingList && (
                <div className="mt-auto">
                    <button
                    onClick={() => handleSendOrUpdate(shop)}
                    disabled={isSending || isSuccess}
                    className={`w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border shadow-sm
                        ${isSuccess 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : isSending
                          ? 'bg-stone-100 border-stone-200 text-stone-400'
                          : recentOrder
                            ? 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
                            : 'bg-stone-800 border-stone-800 text-white hover:bg-stone-700 shadow-stone-200'
                        }
                    `}
                    >
                    {isSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isSuccess ? (
                        <Check className="w-3.5 h-3.5" />
                    ) : recentOrder ? (
                        <RefreshCw className="w-3.5 h-3.5" />
                    ) : (
                        <Send className="w-3.5 h-3.5" />
                    )}
                    {isSending ? 'Syncing...' : isSuccess ? 'Synced!' : recentOrder ? 'Update Active Order' : 'Send List to Shop'}
                    </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-[10px] text-stone-400 font-medium uppercase tracking-widest">
        Distances are calculated based on registered coordinates
      </p>
    </div>
  );
};

export default NearbyShops;