
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

const App: React.FC = () => {
  const [step, setStep] = useState<number>(1);
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
    setStep(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 text-white py-6 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Programa Prosumidores 4.0
          </h1>
          <p className="text-slate-300 text-sm mt-1 uppercase tracking-wider font-semibold">
            Gestión de Ahorro Energético
          </p>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-4 py-12 w-full">
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

      <footer className="py-6 text-center text-slate-400 text-xs border-t border-slate-200">
        &copy; 2025 Programa Prosumidores 4.0 - Santa Fe
      </footer>
    </div>
  );
};

export default App;
