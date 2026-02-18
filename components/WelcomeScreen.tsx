
import React from 'react';
import { ProsumerStatus } from '../types';

interface Props {
  onSelect: (status: ProsumerStatus) => void;
}

const WelcomeScreen: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800">Bienvenidos</h2>
        <p className="text-slate-600 max-w-md">Seleccione su situación actual respecto al programa de prosumidores para comenzar con la simulación de ahorro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => onSelect(ProsumerStatus.YES)}
          className="group flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800">Soy Prosumidor</span>
          <p className="text-sm text-slate-500 text-center mt-2">Ya cuento con instalación de energía renovable inyectando a la red.</p>
        </button>

        <button
          onClick={() => onSelect(ProsumerStatus.NO)}
          className="group flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-800 hover:shadow-xl transition-all duration-300"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800">No Soy Prosumidor</span>
          <p className="text-sm text-slate-500 text-center mt-2">Aún no formo parte del programa pero quiero ver mis ahorros potenciales.</p>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
