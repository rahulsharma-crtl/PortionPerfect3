
import React from 'react';
import { Loader2, Zap } from 'lucide-react';

const Spinner: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-emerald-600 animate-in fade-in zoom-in duration-300">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <Zap className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-stone-800">Quickly scaling portions...</h3>
      <p className="text-stone-500 mt-2 font-medium">Metric conversions in progress.</p>
    </div>
  );
};

export default Spinner;
