
import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Leaf,
  Trash2,
  Plus,
  Check,
  Store,
  Send,
  Loader2,
} from "lucide-react";
import { ShoppingList as ShoppingListType, Ingredient, ShopProximity, UserProfile } from "../types";
import { sendListToOwner } from "../services/sessionService";

interface ShoppingListProps {
  data: ShoppingListType;
  onListChange: (newList: ShoppingListType) => void;
  nearbyShops: ShopProximity[];
  userProfile: UserProfile;
}

interface CategoryColumnProps {
  categoryKey: keyof ShoppingListType;
  title: string;
  items: Ingredient[];
  icon: React.ElementType;
  colorClass: string;
  nearbyShops: ShopProximity[];
  userProfile: UserProfile;
  onUpdate: (
    category: keyof ShoppingListType,
    index: number,
    newQuantity: number
  ) => void;
  onDelete: (category: keyof ShoppingListType, index: number) => void;
  onAdd: (category: keyof ShoppingListType, item: Ingredient) => void;
}

const CategoryColumn: React.FC<CategoryColumnProps> = ({
  categoryKey,
  title,
  items,
  icon: Icon,
  colorClass,
  nearbyShops,
  userProfile,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("g");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Filter shops based on category
  const relevantShops = nearbyShops.filter(shop => {
    if (categoryKey === 'VegetableShop') return shop.storeType === 'Vegetable & Fruits';
    if (categoryKey === 'GroceryShop') return shop.storeType === 'Grocery' || shop.storeType === 'Supermarket';
    return false;
  }).sort((a, b) => a.distance - b.distance);

  const handleSendToList = async (shop: ShopProximity) => {
    if (items.length === 0) return;
    setIsSending(true);
    try {
      await sendListToOwner(shop.phone, userProfile, items);
      setSendSuccess(shop.shopName);
      setTimeout(() => setSendSuccess(null), 3000);
    } catch (err) {
      console.error("Send failed", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAdd = () => {
    if (!newName.trim()) return;
    onAdd(categoryKey, {
      name: newName.trim(),
      quantity: parseFloat(newQty) || 0,
      unit: newUnit.trim() || "g",
    });
    setIsAdding(false);
    setNewName("");
    setNewQty("");
    setNewUnit("g");
  };

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className={`p-4 flex items-center justify-between border-b border-stone-200 ${colorClass}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-lg text-stone-800">{title}</h4>
        </div>
      </div>
      
      <ul className="p-3 space-y-2 flex-grow">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="group flex items-center justify-between p-3 rounded-lg bg-white border border-stone-100 shadow-sm hover:border-emerald-200 transition-all"
          >
            <span className="text-stone-700 font-medium text-base flex-grow pr-2">
              {item.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <input
                  type="number"
                  className="w-20 px-2 py-1.5 text-center text-sm font-bold text-stone-800 bg-stone-50 border border-stone-200 rounded focus:border-emerald-500 outline-none"
                  value={item.quantity === 0 ? "" : item.quantity}
                  onChange={(e) => onUpdate(categoryKey, idx, parseFloat(e.target.value) || 0)}
                />
                <span className="text-xs text-stone-500 ml-1.5 font-mono w-8 truncate">
                  {item.unit}
                </span>
              </div>
              <button
                onClick={() => onDelete(categoryKey, idx)}
                className="text-stone-300 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Dispatch Section */}
      {items.length > 0 && relevantShops.length > 0 && (
        <div className="p-3 bg-white border-t border-stone-200">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
            <Send className="w-3 h-3" /> Send to Nearby Shop
          </div>
          <div className="flex flex-wrap gap-2">
            {relevantShops.slice(0, 2).map((shop, idx) => (
              <button
                key={idx}
                onClick={() => handleSendToList(shop)}
                disabled={isSending || !!sendSuccess}
                className={`flex-1 text-[11px] font-black py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2
                  ${sendSuccess === shop.shopName ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}
                `}
              >
                {sendSuccess === shop.shopName ? <Check className="w-3 h-3" /> : (isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Store className="w-3 h-3" />)}
                {sendSuccess === shop.shopName ? 'Sent!' : shop.shopName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-t border-stone-200 bg-stone-100/50">
        {isAdding ? (
          <div className="bg-white p-3 rounded-lg shadow-sm border border-stone-200">
            <input
              autoFocus
              className="w-full text-sm p-2 mb-2 border rounded bg-stone-800 text-white"
              placeholder="Item name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <input type="number" className="w-20 text-sm p-2 border rounded bg-stone-800 text-white" placeholder="Qty" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
              <input className="w-20 text-sm p-2 border rounded bg-stone-800 text-white" placeholder="Unit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
              <button onClick={handleSaveAdd} className="ml-auto p-2 bg-emerald-500 text-white rounded"><Check className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-stone-500 hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-stone-300"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>
    </div>
  );
};

const ShoppingList: React.FC<ShoppingListProps> = ({ data, onListChange, nearbyShops, userProfile }) => {
  const [listState, setListState] = useState<ShoppingListType>(data);

  useEffect(() => {
    setListState(data);
  }, [data]);

  const handleUpdateQuantity = (category: keyof ShoppingListType, index: number, newQuantity: number) => {
    const newState = { ...listState, [category]: listState[category].map((item, i) => i === index ? { ...item, quantity: newQuantity } : item) };
    setListState(newState);
    onListChange(newState);
  };

  const handleDeleteItem = (category: keyof ShoppingListType, index: number) => {
    const newState = { ...listState, [category]: listState[category].filter((_, i) => i !== index) };
    setListState(newState);
    onListChange(newState);
  };

  const handleAddItem = (category: keyof ShoppingListType, item: Ingredient) => {
    const newState = { ...listState, [category]: [...listState[category], item] };
    setListState(newState);
    onListChange(newState);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 md:p-8 relative">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 border-b border-stone-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Shopping List</h2>
            <p className="text-stone-500 text-sm">Review and customize your purchase needs.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategoryColumn
          categoryKey="VegetableShop"
          title="Vegetable Shop"
          items={listState.VegetableShop}
          icon={Leaf}
          colorClass="bg-green-50 border-green-200 text-green-800"
          nearbyShops={nearbyShops}
          userProfile={userProfile}
          onUpdate={handleUpdateQuantity}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
        />
        <CategoryColumn
          categoryKey="GroceryShop"
          title="Grocery Shop"
          items={listState.GroceryShop}
          icon={Store}
          colorClass="bg-amber-50 border-amber-200 text-amber-800"
          nearbyShops={nearbyShops}
          userProfile={userProfile}
          onUpdate={handleUpdateQuantity}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
        />
      </div>
    </div>
  );
};

export default ShoppingList;
