
import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Store, MapPin, ArrowRight, Tag, Loader2, CheckCircle2, Sparkles, Navigation, Map } from 'lucide-react';
import { UserProfile } from '../types';
import { getProfileByPhone } from '../services/sessionService';

interface LoginFormProps {
  role: 'customer' | 'owner';
  onSubmit: (profile: UserProfile) => void;
  onBack: () => void;
}

const STORE_TYPES = [
  "Grocery",
  "Vegetable & Fruits",
  "Supermarket"
];

const LoginForm: React.FC<LoginFormProps> = ({ role, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    shopName: '',
    location: '',
    storeType: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined
  });

  const [isChecking, setIsChecking] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const fetchedPhoneRef = useRef<string | null>(null);

  // Auto-fill logic when phone hits 10 digits
  useEffect(() => {
    const checkPhone = async () => {
      if (formData.phone.length === 10 && formData.phone !== fetchedPhoneRef.current) {
        setIsChecking(true);
        try {
          const existingProfile = await getProfileByPhone(formData.phone, role);
          if (existingProfile) {
            setFormData(prev => ({
              ...prev,
              name: existingProfile.name || prev.name,
              shopName: existingProfile.shopName || prev.shopName,
              location: existingProfile.location || prev.location,
              storeType: existingProfile.storeType || prev.storeType,
              lat: existingProfile.lat,
              lng: existingProfile.lng
            }));
            setIsExistingUser(true);
            fetchedPhoneRef.current = formData.phone;
          } else {
            setIsExistingUser(false);
            fetchedPhoneRef.current = formData.phone;
          }
        } catch (error) {
          console.error("Error checking phone:", error);
        } finally {
          setIsChecking(false);
        }
      } else if (formData.phone.length < 10) {
        setIsExistingUser(false);
        fetchedPhoneRef.current = null;
      }
    };

    checkPhone();
  }, [formData.phone, role]);

  /**
   * Geocodes a text address to coordinates using Nominatim API
   */
  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
    return null;
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setFormData(prev => ({ ...prev, location: data.display_name }));
          } else {
            setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          }
        } catch (err) {
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetecting(false);
        alert("Could not detect location. Please enter manually.");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.phone.length !== 10 || !formData.location) return;
    if (role === 'owner' && (!formData.shopName || !formData.storeType)) return;

    let finalLat = formData.lat;
    let finalLng = formData.lng;

    // If coordinates are missing, attempt to geocode the location string
    if (!finalLat || !finalLng) {
      setIsGeocoding(true);
      const coords = await geocodeAddress(formData.location);
      if (coords) {
        finalLat = coords.lat;
        finalLng = coords.lng;
      }
      setIsGeocoding(false);
    }

    const profile: UserProfile = {
      role,
      name: formData.name,
      phone: formData.phone,
      location: formData.location,
      lat: finalLat,
      lng: finalLng,
      ...(role === 'owner' && {
        shopName: formData.shopName,
        storeType: formData.storeType
      })
    };

    onSubmit(profile);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      setFormData({ ...formData, phone: numericValue });
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ 
      ...formData, 
      location: e.target.value,
      // Reset lat/lng if they manually edit the text, 
      // ensuring we re-geocode on submit if they change the city
      lat: undefined,
      lng: undefined
    });
  };

  const isFormValid = () => {
    const basicValid = formData.name.trim() !== '' && formData.phone.length === 10 && formData.location.trim() !== '';
    if (role === 'customer') return basicValid;
    return basicValid && formData.shopName.trim() !== '' && formData.storeType !== '';
  };

  const themeColor = role === 'owner' ? 'blue' : 'emerald';

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className={`p-8 text-center bg-${themeColor}-600 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              {role === 'owner' ? 'Shop Owner Profile' : 'Customer Profile'}
            </h2>
            <p className="text-white/80 text-sm font-medium">
              {role === 'owner' ? 'Precision management for your store' : 'Scale your cooking with precision'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest">
                Phone Number
              </label>
              {isExistingUser && (
                <span className={`text-[10px] font-bold text-${themeColor}-600 flex items-center gap-1 animate-in fade-in`}>
                  <Sparkles className="w-3 h-3" /> Profile Found
                </span>
              )}
            </div>
            <div className="relative">
              <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${formData.phone.length === 10 ? `text-${themeColor}-500` : 'text-stone-400'}`} />
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                className={`w-full pl-12 pr-12 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 outline-none transition-all focus:ring-4 focus:ring-${themeColor}-500/10 focus:border-${themeColor}-500 focus:bg-white font-medium`}
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isChecking && <Loader2 className={`w-5 h-5 text-${themeColor}-400 animate-spin`} />}
                {isExistingUser && !isChecking && <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
              </div>
            </div>
          </div>

          <div className="space-y-6 transition-all duration-500">
            <div>
              <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 outline-none transition-all focus:ring-4 focus:ring-${themeColor}-500/10 focus:border-${themeColor}-500 focus:bg-white font-medium`}
                  required
                />
              </div>
            </div>

            {role === 'owner' && (
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest mb-2">
                    Shop Name
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      placeholder="e.g. Krishna General Store"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white font-medium`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest mb-2">
                    Store Category
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <select
                      value={formData.storeType}
                      onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none font-medium"
                      required
                    >
                      <option value="" disabled>Select category</option>
                      {STORE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest mb-2">
                {role === 'owner' ? 'Shop Location' : 'Delivery/City Location'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={handleLocationChange}
                  placeholder="e.g. Bandra West, Mumbai"
                  className={`w-full pl-12 pr-24 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 outline-none transition-all focus:ring-4 focus:ring-${themeColor}-500/10 focus:border-${themeColor}-500 focus:bg-white font-medium`}
                  required
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all
                    ${isDetecting ? 'bg-stone-200 text-stone-400' : `bg-${themeColor}-100 text-${themeColor}-700 hover:bg-${themeColor}-200`}
                  `}
                >
                  {isDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                  {isDetecting ? 'Detecting...' : 'Detect'}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-stone-400 font-medium italic">
                Tip: Be specific (e.g. "Bandra West, Mumbai") for accurate distance calculation.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button
              type="submit"
              disabled={!isFormValid() || isChecking || isGeocoding}
              className={`
                w-full py-4 px-6 rounded-2xl text-lg font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]
                ${!isFormValid() || isChecking || isGeocoding ? 'bg-stone-300 cursor-not-allowed shadow-none' : role === 'owner' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}
              `}
            >
              {isGeocoding ? (
                <>
                  <Map className="w-5 h-5 animate-bounce" /> Verifying Location...
                </>
              ) : (
                <>
                  {isExistingUser ? 'Continue to App' : 'Create My Profile'} 
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              className="text-stone-400 text-xs font-bold hover:text-stone-600 transition-colors py-2 uppercase tracking-widest text-center"
            >
              Change Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
