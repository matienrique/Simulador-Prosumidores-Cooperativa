
import React from 'react';
import { ProsumerStatus } from '../types';

interface Props {
  onSelect: (status: ProsumerStatus) => void;
  onBack: () => void;
}

const ProsumerScreen: React.FC<Props> = ({ onSelect, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-10 animate-fadeIn">
      <button 
        onClick={onBack}
        className="self-start text-slate-400 hover:text-slate-800 flex items-center transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Seleccione la opción correspondiente a su situación</h2>
        <p className="text-slate-500 text-lg"></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <button
          onClick={() => onSelect(ProsumerStatus.YES)}
          className="group flex flex-col items-center p-10 bg-white border-2 border-slate-200 rounded-3xl hover:border-emerald-500 hover:shadow-2xl transition-all duration-300"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-slate-800">Soy Prosumidor</span>
          <p className="text-sm text-slate-400 text-center mt-3">Genero energía renovable en el marco del Programa Prosumidores 4.0.</p>
        </button>

        <button
          onClick={() => onSelect(ProsumerStatus.NO)}
          className="group flex flex-col items-center p-10 bg-white border-2 border-slate-200 rounded-3xl hover:border-slate-800 hover:shadow-2xl transition-all duration-300"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-slate-800">No Soy Prosumidor</span>
          <p className="text-sm text-slate-400 text-center mt-3">Deseo conocer que potencia renovable puedo instalar y cuáles serían mis ahorros.</p>
        </button>
      </div>
    </div>
  );
};

export default ProsumerScreen;
