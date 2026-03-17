
import React, { useState } from 'react';
import { 
  DistributionType, 
  ProsumerStatus, 
  UserCategory,
  AppState
} from './types';
import DistributionScreen from './components/DistributionScreen';
import ProsumerScreen from './components/ProsumerScreen';
import CategorySelectionScreen from './components/CategorySelectionScreen';
import ResidentialProsumerFlow from './components/ResidentialProsumerFlow';
import CommercialProsumerFlow from './components/CommercialProsumerFlow';
import IndustrialProsumerFlow from './components/IndustrialProsumerFlow';
import NotProsumerResidentialFlow from './components/NotProsumerResidentialFlow';
import NotProsumerCommercialFlow from './components/NotProsumerCommercialFlow';
import NotProsumerIndustrialFlow from './components/NotProsumerIndustrialFlow';
import LargeDemandProsumerFlow from './components/LargeDemandProsumerFlow';
import NotProsumerLargeDemandFlow from './components/NotProsumerLargeDemandFlow';

import { logoProsumidores, logoMinprod } from './components/Logos';

const App: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [state, setState] = useState<AppState>({
    distribution: null,
    prosumerStatus: null,
    category: null
  });

  const handleDistributionSelect = (dist: DistributionType) => {
    setState(prev => ({ ...prev, distribution: dist }));
    setStep(2);
  };

  const handleProsumerSelect = (status: ProsumerStatus) => {
    setState(prev => ({ ...prev, prosumerStatus: status }));
    setStep(3);
  };

  const handleCategorySelect = (category: UserCategory) => {
    setState(prev => ({ ...prev, category }));
    if (state.prosumerStatus === ProsumerStatus.YES) {
      if (category === UserCategory.RESIDENTIAL) {
        setStep(4);
      } else if (category === UserCategory.COMMERCIAL) {
        setStep(5);
      } else if (category === UserCategory.INDUSTRIAL) {
        setStep(6);
      } else if (category === UserCategory.LARGE_DEMAND) {
        setStep(10);
      } else {
        alert(`Has seleccionado: ${category}. Este flujo específico está en desarrollo.`);
      }
    } else {
      if (category === UserCategory.RESIDENTIAL) {
        setStep(7);
      } else if (category === UserCategory.COMMERCIAL) {
        setStep(8);
      } else if (category === UserCategory.INDUSTRIAL) {
        setStep(9);
      } else if (category === UserCategory.LARGE_DEMAND) {
        setStep(11);
      } else {
        alert(`Has seleccionado: ${category}. El flujo para No Prosumidores para esta categoría está en desarrollo.`);
      }
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] text-white py-6 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-xl md:text-2xl font-bold text-center flex items-center justify-center gap-10">
            <img src={logoProsumidores} alt="Prosumidores" className="h-8 md:h-12 w-auto" />
            <span>Simulador Prosumidores</span>
            <img src={logoMinprod} alt="Gobierno de Santa Fe" className="h-12 md:h-16 w-auto" />
          </h1>
          <p className="text-slate-300 text-sm mt-1 uppercase tracking-wider font-semibold">
            
          </p>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-4 py-12 w-full">
        {step === 0 && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-2xl shadow-sm mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-amber-400 p-2 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Aviso Importante</h2>
              </div>
              
              <div className="space-y-4 text-slate-700 leading-relaxed text-sm md:text-base">
                <p>
                  Este Simulador de Facturas es una herramienta pensada para ayudarte a visualizar los ahorros obtenidos por medio de tu sistema de generación renovable conectado a la red eléctrica. Los resultados deben interpretarse como una estimación orientativa, útil para visualizar de manera simple y rápida los beneficios económicos y ambientales, en caso de que ya sea un Prosumidor o estés interesado en adherir a Prosumidores 4.0.  

                </p>
                <p>
                  Los importes calculados pueden presentar variaciones debido a posibles actualizaciones tarifarias y modificaciones en los esquemas de incentivos en relación al período de facturación simulado.

                </p>
                <p className="font-medium">
                  La información proporcionada por el simulador tiene carácter informativo y no reviste condición de liquidación oficial ni genera derecho adquirido alguno, debiendo considerarse como una herramienta de apoyo para la toma de decisiones.

                </p>
              </div>

              <div className="mt-10 flex justify-center">
                <button 
                  onClick={() => setStep(1)}
                  className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <DistributionScreen onSelect={handleDistributionSelect} />
        )}

        {step === 2 && (
          <ProsumerScreen 
            onSelect={handleProsumerSelect} 
            onBack={handleBack} 
          />
        )}

        {step === 3 && (
          <CategorySelectionScreen 
            onSelect={handleCategorySelect} 
            onBack={handleBack} 
          />
        )}

        {step === 4 && (
          <ResidentialProsumerFlow 
            onBack={() => setStep(3)} 
          />
        )}

        {step === 5 && (
          <CommercialProsumerFlow 
            onBack={() => setStep(3)} 
          />
        )}

        {step === 6 && (
          <IndustrialProsumerFlow 
            onBack={() => setStep(3)} 
          />
        )}

        {step === 7 && (
          <NotProsumerResidentialFlow 
            onBack={() => setStep(3)} 
          />
        )}

        {step === 8 && (
          <NotProsumerCommercialFlow 
            onBack={() => setStep(3)} 
          />
        )}

        {step === 9 && (
          <NotProsumerIndustrialFlow 
            onBack={() => setStep(3)} 
          />
        )}

        {step === 10 && (
          <LargeDemandProsumerFlow 
            onBack={() => setStep(3)} 
          />
        )}

        {step === 11 && (
          <NotProsumerLargeDemandFlow 
            onBack={() => setStep(3)} 
          />
        )}
      </main>

      <footer className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] text-white py-12 px-4 mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Left side: Contact */}
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-black text-white uppercase text-xs tracking-[0.2em] mb-2 italic">Secretaría de Energía</p>
                <p className="text-sm leading-relaxed text-white/90">Francisco Miguens 260. Torre 2. Piso 4.</p>
                <p className="text-sm leading-relaxed text-white/90">Ciudad de Santa Fe</p>
              </div>
            </div>

            {/* Right side: Phone & Email */}
            <div className="space-y-4 md:text-right">
              <div className="flex items-center md:justify-end space-x-3">
                <span className="text-sm font-medium text-white/90">Cel: (0342) 4505882 | Interno 1303</span>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center md:justify-end space-x-3">
                <span className="text-sm font-medium text-white/90">secretariadeenergiasantafe@gmail.com</span>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/20 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 italic">&copy; 2026 Gobierno de Santa Fe</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
