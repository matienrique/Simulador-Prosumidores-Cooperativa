
import React from 'react';
import { DistributionType } from '../types';

interface Props {
  onSelect: (dist: DistributionType) => void;
}

const DistributionScreen: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-10 animate-fadeIn">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Bienvenido</h2>
        <p className="text-slate-500 text-lg max-w-xl">
          Mediante el siguiente simulador podrás estimar los ahorros económicos en tu factura eléctrica o calcular qué potencia de energía renovable podés instalar por formar parte del Programa Prosumidores 4.0
        </p>
        <p className="text-slate-400 text-sm">
          <a 
            href="https://docs.google.com/document/d/1j169YY3rtR4osTqPNUCRyxFYro9--mpeBuYOc8-TtzQ/edit?tab=t.0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            Podés consultar el manual de usuario cliqueando aquí
          </a>
        </p>
      </div>

      <div className="w-full max-w-md">
        <button
          onClick={() => onSelect(DistributionType.COOPERATIVA)}
          className="w-full group relative flex flex-col items-center p-10 bg-white border-2 border-slate-200 rounded-3xl hover:border-blue-600 hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          
          <span className="text-2xl font-bold text-slate-800">Soy usuario de</span>
          <span className="text-2xl font-black text-blue-600">Cooperativa Eléctrica</span>
          <p className="text-sm text-slate-400 text-center mt-4">Acceda al simulador específico para sistemas cooperativos.</p>
        </button>
      </div>
    </div>
  );
};

export default DistributionScreen;
