
import React, { useState, useEffect, useRef, useCallback } from "react";
import InputForm from "./components/InputForm";
import RecipeCard from "./components/RecipeCard";
import ShoppingList from "./components/ShoppingList";
import Spinner from "./components/Spinner";
import RoleSelection from "./components/RoleSelection";
import ShopOwnerDashboard from "./components/ShopOwnerDashboard";
import LoginForm from "./components/LoginForm";
import NearbyShops from "./components/NearbyShops";
import NotificationToast from "./components/NotificationToast";
import { generateRecipe } from "./services/geminiService";
import { syncSession, getAllOwners, listenToCustomerOrders, updateOrderItems } from "./services/sessionService";
import { RecipeFormData, RecipeResponse, ShoppingList as ShoppingListType, UserProfile, ShopProximity, IncomingList, AppNotification, Ingredient } from "./types";
import { AlertTriangle, BookOpen, ShoppingBag, LogOut, User } from "lucide-react";

const CUSTOMER_STORAGE_KEY = 'portionPerfect_customer';
const OWNER_STORAGE_KEY = 'portionPerfect_owner';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'customer' | 'owner' | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(OWNER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"recipe" | "shopping">("recipe");
  const [nearbyShops, setNearbyShops] = useState<ShopProximity[]>([]);
  const [customerOrders, setCustomerOrders] = useState<IncomingList[]>([]);
  
  const prevCustomerOrdersRef = useRef<IncomingList[]>([]);
  const isInitialCustomerMount = useRef(true);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { ...notif, id }]);
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const computeProximity = async () => {
      if (activeModule === 'customer' && customerProfile && customerProfile.lat && customerProfile.lng) {
        try {
          const owners = await getAllOwners();
          const calculations: ShopProximity[] = owners
            .filter(o => o.lat && o.lng)
            .map(owner => ({
              shopName: owner.shopName || "Unknown Shop",
              phone: owner.phone,
              storeType: owner.storeType || "General",
              distance: calculateDistance(customerProfile.lat!, customerProfile.lng!, owner.lat!, owner.lng!)
            }));
          
          setNearbyShops(calculations);
        } catch (err) {
          console.error("Proximity calculation failed", err);
        }
      }
    };
    computeProximity();
  }, [activeModule, customerProfile]);

  useEffect(() => {
    if (activeModule === 'customer' && customerProfile?.phone) {
       const unsubscribe = listenToCustomerOrders(customerProfile.phone, (orders) => {
         if (!isInitialCustomerMount.current) {
           orders.forEach(order => {
             const prevOrder = prevCustomerOrdersRef.current.find(p => p.id === order.id);
             if (prevOrder && prevOrder.status !== order.status) {
               if (order.status === 'ready') {
                 addNotification({
                   title: 'Order Ready!',
                   message: `Your list at ${order.shopPhone} has been prepared.`,
                   type: 'success'
                 });
               } else if (order.status === 'rejected') {
                 addNotification({
                   title: 'Order Not Accepted',
                   message: `A vendor was unable to fulfill your request.`,
                   type: 'error'
                 });
               }
             }
           });
         }
         isInitialCustomerMount.current = false;
         prevCustomerOrdersRef.current = orders;
         setCustomerOrders(orders);
       });
       return () => {
         unsubscribe();
         isInitialCustomerMount.current = true;
       };
    }
  }, [activeModule, customerProfile, addNotification]);

  const handleModuleSelect = (role: 'customer' | 'owner') => {
    setActiveModule(role);
  };

  const handleLogin = async (profile: UserProfile) => {
    await syncSession(profile);
    if (profile.role === 'customer') {
      setCustomerProfile(profile);
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(profile));
    } else {
      setOwnerProfile(profile);
      localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(profile));
    }
    addNotification({
      title: 'Welcome Back',
      message: `Successfully signed in as ${profile.name}.`,
      type: 'success'
    });
  };

  const handleLogout = () => {
    if (activeModule === 'customer') {
      setCustomerProfile(null);
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      setRecipeData(null);
      setNearbyShops([]);
      setCustomerOrders([]);
    } else if (activeModule === 'owner') {
      setOwnerProfile(null);
      localStorage.removeItem(OWNER_STORAGE_KEY);
    }
    setActiveModule(null);
  };

  const handleGoHome = () => {
    setActiveModule(null);
  };

  const handleCustomerFormSubmit = async (formData: RecipeFormData) => {
    if (!customerProfile) return;
    setLoading(true);
    setError(null);
    setActiveTab("recipe");
    try {
      const data = await generateRecipe(formData);
      setRecipeData(data);
    } catch (err: any) {
      setError("Failed to generate recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShoppingListChange = async (newList: ShoppingListType) => {
    if (recipeData) {
      setRecipeData({ ...recipeData, shoppingList: newList });
      
      const activeOrders = customerOrders.filter(o => o.status !== 'completed' && o.status !== 'rejected');
      
      for (const order of activeOrders) {
        const shop = nearbyShops.find(s => s.phone === order.shopPhone);
        if (!shop) continue;

        let itemsToUpdate: Ingredient[] = [];
        if (shop.storeType === 'Supermarket') {
          itemsToUpdate = [...newList.VegetableShop, ...newList.GroceryShop];
        } else if (shop.storeType === 'Vegetable & Fruits') {
          itemsToUpdate = newList.VegetableShop;
        } else if (shop.storeType === 'Grocery') {
          itemsToUpdate = newList.GroceryShop;
        }

        if (itemsToUpdate.length > 0) {
          const mergedItems = itemsToUpdate.map(newItem => {
            const existing = (order.items || []).find(oldItem => oldItem.name === newItem.name);
            const cleanedItem: any = { ...newItem };
            if (existing && existing.available !== undefined) {
              cleanedItem.available = existing.available;
            } else {
              delete cleanedItem.available;
            }
            return cleanedItem;
          });
          
          try {
            await updateOrderItems(order.id, mergedItems);
          } catch (e) {
            console.error("Failed to sync items for order", order.id, e);
          }
        }
      }
    }
  };

  const renderCustomerModule = () => {
    if (!customerProfile) {
      return (
        <LoginForm 
          role="customer" 
          onSubmit={handleLogin} 
          onBack={() => setActiveModule(null)} 
        />
      );
    }

    return (
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2 text-emerald-800 bg-emerald-50 w-fit px-4 py-2 rounded-full border border-emerald-100">
               <User className="w-4 h-4"/>
               <span className="font-medium text-sm">Welcome, {customerProfile.name}</span>
          </div>
        </div>

        <InputForm onSubmit={handleCustomerFormSubmit} isLoading={loading} />
        
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {loading && <Spinner />}
        
        {recipeData && !loading && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="flex justify-center mb-8 border-b border-stone-200">
              <nav className="-mb-px flex space-x-8">
                <button onClick={() => setActiveTab("recipe")} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === "recipe" ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"}`}>
                  <BookOpen className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === "recipe" ? "text-emerald-500" : "text-stone-400 group-hover:text-stone-500"}`} />
                  Recipe Details
                </button>
                <button onClick={() => setActiveTab("shopping")} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === "shopping" ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"}`}>
                  <ShoppingBag className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === "shopping" ? "text-emerald-500" : "text-stone-400 group-hover:text-stone-500"}`} />
                  Shopping List
                </button>
              </nav>
            </div>
            <div className="min-h-[400px]">
              {activeTab === "recipe" ? <RecipeCard data={recipeData} /> : <ShoppingList data={recipeData.shoppingList} onListChange={handleShoppingListChange} nearbyShops={nearbyShops} userProfile={customerProfile} />}
            </div>
          </div>
        )}

        {!loading && nearbyShops.length > 0 && (
          <NearbyShops 
            shops={nearbyShops} 
            shoppingList={recipeData?.shoppingList} 
            userProfile={customerProfile} 
            customerOrders={customerOrders}
          />
        )}
      </div>
    );
  };

  const renderOwnerModule = () => {
    if (!ownerProfile) {
      return (
        <LoginForm 
          role="owner" 
          onSubmit={handleLogin} 
          onBack={() => setActiveModule(null)} 
        />
      );
    }

    return <ShopOwnerDashboard profile={ownerProfile} onNotify={addNotification} />;
  };

  const showLogout = (activeModule === 'customer' && customerProfile) || (activeModule === 'owner' && ownerProfile);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
      
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div 
            className="font-black text-2xl tracking-tighter text-emerald-800 cursor-pointer hover:opacity-80 transition-all active:scale-95 flex items-center select-none" 
            onClick={handleGoHome}
            title="Return to Selection"
          >
            Portion<span className="text-emerald-600">Perfect</span>
          </div>
          
          <div className="flex items-center gap-3">
            {showLogout && (
              <button onClick={handleLogout} className="text-xs sm:text-sm font-black uppercase tracking-widest text-stone-500 hover:text-red-600 flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 pt-8">
        {!activeModule && (
          <RoleSelection 
            onSelect={handleModuleSelect} 
            customerName={customerProfile?.name}
            ownerName={ownerProfile?.name}
          />
        )}
        {activeModule === 'customer' && renderCustomerModule()}
        {activeModule === 'owner' && renderOwnerModule()}
      </main>
    </div>
  );
};

export default App;
