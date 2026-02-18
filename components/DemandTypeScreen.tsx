
import React from 'react';
import { DemandType } from '../types';

interface Props {
  onSelect: (type: DemandType) => void;
  onBack: () => void;
}

const DemandTypeScreen: React.FC<Props> = ({ onSelect, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn">
      <button 
        onClick={onBack}
        className="self-start text-slate-500 hover:text-slate-800 flex items-center transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800">Tipo de Usuario</h2>
        <p className="text-slate-600 max-w-md">Categorice su consumo eléctrico para ajustar los parámetros de la tarifa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => onSelect(DemandType.SMALL)}
          className="group flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-green-500 hover:shadow-xl transition-all duration-300"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800 text-center">Soy usuario de Pequeña Demanda</span>
          <p className="text-sm text-slate-500 text-center mt-2">Usuarios residenciales o pequeños locales comerciales.</p>
        </button>

        <button
          onClick={() => onSelect(DemandType.LARGE)}
          className="group flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-xl transition-all duration-300"
        >
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800 text-center">Soy usuario de Gran Demanda</span>
          <p className="text-sm text-slate-500 text-center mt-2">Industrias o comercios de gran escala con consumos elevados.</p>
        </button>
      </div>
    </div>
  );
};

export default DemandTypeScreen;
