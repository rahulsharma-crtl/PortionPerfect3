
import React from 'react';
import { ChefHat, Store, ArrowRight, UserCheck } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: 'customer' | 'owner') => void;
  customerName?: string;
  ownerName?: string;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect, customerName, ownerName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-emerald-900 mb-4 tracking-tight">
          Portion<span className="text-emerald-600">Perfect</span>
        </h1>
        <p className="text-stone-500 text-lg max-w-md mx-auto leading-relaxed">
          Your precision culinary partner. Select a portal to continue.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
        {/* Customer Button */}
        <button
          onClick={() => onSelect('customer')}
          className={`group relative flex flex-col items-center p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 text-center
            ${customerName ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-stone-200 hover:border-emerald-500 hover:-translate-y-1'}
          `}
        >
          <div className={`p-5 rounded-full mb-6 transition-transform shadow-inner
            ${customerName ? 'bg-emerald-100 text-emerald-700 scale-110' : 'bg-emerald-50 text-emerald-600 group-hover:scale-110'}
          `}>
            {customerName ? <UserCheck className="w-12 h-12" /> : <ChefHat className="w-12 h-12" />}
          </div>
          
          <h3 className="text-2xl font-bold text-stone-800 mb-2">
            {customerName ? 'Customer Portal' : "I'm a Customer"}
          </h3>
          
          {customerName ? (
             <p className="text-emerald-600 font-medium mb-1">Signed in as {customerName}</p>
          ) : (
             <p className="text-stone-500 text-base leading-relaxed mb-4">
               Generate recipes & shopping lists.
             </p>
          )}

          <div className={`mt-auto px-6 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2
            ${customerName 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
              : 'bg-stone-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'}
          `}>
            {customerName ? 'Continue Cooking' : 'Start Cooking'} <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Owner Button */}
        <button
          onClick={() => onSelect('owner')}
          className={`group relative flex flex-col items-center p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 text-center
            ${ownerName ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-stone-200 hover:border-blue-500 hover:-translate-y-1'}
          `}
        >
           <div className={`p-5 rounded-full mb-6 transition-transform shadow-inner
            ${ownerName ? 'bg-blue-100 text-blue-700 scale-110' : 'bg-blue-50 text-blue-600 group-hover:scale-110'}
          `}>
            {ownerName ? <UserCheck className="w-12 h-12" /> : <Store className="w-12 h-12" />}
          </div>

          <h3 className="text-2xl font-bold text-stone-800 mb-2">
            {ownerName ? 'Shop Portal' : "I'm a Shop Owner"}
          </h3>

          {ownerName ? (
             <p className="text-blue-600 font-medium mb-1">Signed in as {ownerName}</p>
          ) : (
             <p className="text-stone-500 text-base leading-relaxed mb-4">
               Manage orders & shop details.
             </p>
          )}

          <div className={`mt-auto px-6 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2
            ${ownerName 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'bg-stone-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white'}
          `}>
            {ownerName ? 'Manage Shop' : 'Enter Shop'} <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;
