
import React, { useState, useMemo } from 'react';
import { FixedCharge, EnergyBand } from '../types';
import { formatCurrency, formatNumber } from '../services/calculatorService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  onBack: () => void;
}

interface LocalFormData {
  energyGenerated: number | "";
  energyInjected: number | "";
  energyDelivered: number | "";
  fixedCharges: FixedCharge[];
  environmentalBenefit: number | "";
  energyBands: EnergyBand[];
  subtotalEnergyElectric: number | "";
  totalToPay: number | "";
  subtotalTaxes: number | "";
}

const CommercialProsumerFlow: React.FC<Props> = ({ onBack }) => {
  const [showResults, setShowResults] = useState(false);
  const [showAux, setShowAux] = useState(true);
  const [showFullLog, setShowFullLog] = useState(true);
  
  const [formData, setFormData] = useState<LocalFormData>({
    energyGenerated: "",
    energyInjected: "",
    energyDelivered: "",
    fixedCharges: [{ id: '1', amount: "" }],
    environmentalBenefit: "",
    energyBands: [{ id: '1', kwh: "", amount: "" }],
    subtotalEnergyElectric: "",
    totalToPay: "",
    subtotalTaxes: "",
  });

  // Constante específica para usuario comercial
  const PROP_IMP_SIN_PROS_COMERCIAL = 0.0285;

  const parse = (val: number | ""): number => (val === "" ? 0 : Number(val));
  const safeDiv = (a: number, b: number): number => (b === 0 ? 0 : a / b);

  const results = useMemo(() => {
    const X = parse(formData.energyGenerated);
    const I = parse(formData.energyInjected);
    const C = parse(formData.energyDelivered);
    const totalToPay = parse(formData.totalToPay);
    const subtotalImp = parse(formData.subtotalTaxes);
    const subtotalEnergy = parse(formData.subtotalEnergyElectric);
    const recon = parse(formData.environmentalBenefit);

    const autoconsumo = Math.max(0, X - I);
    
    const n = formData.energyBands.length;
    const penultimaBandaKwh = n >= 2 ? parse(formData.energyBands[n - 2].kwh) : 0;
    const sumaImportesHastaPenultima = n >= 2 
      ? formData.energyBands.slice(0, -1).reduce((acc, b) => acc + parse(b.amount), 0) 
      : 0;
    
    const kwhUltimaBandaCon = Math.max(0.0001, C - penultimaBandaKwh);
    const kwhUltimaBandaSin = kwhUltimaBandaCon + autoconsumo;
    
    const propImpCon = safeDiv(subtotalImp, totalToPay);
    const sumaCargosFijos = formData.fixedCharges.reduce((acc, f) => acc + parse(f.amount), 0);
    const lastBand = formData.energyBands[n - 1];
    const precioUltimaBanda = safeDiv(parse(lastBand.amount), kwhUltimaBandaCon);

    const subtotalEnergySin = sumaCargosFijos + sumaImportesHastaPenultima + (precioUltimaBanda * kwhUltimaBandaSin);
    
    const taxFactor = 1 - (propImpCon);
    const totalAPagarSin = safeDiv(subtotalEnergySin, taxFactor);

    const ahorroTotal = totalAPagarSin - totalToPay;
    const ahorroAutoconsumo = subtotalEnergySin - subtotalEnergy;
    const ahorroImpuestos = totalAPagarSin - subtotalEnergySin - subtotalImp;
    const ahorroReconocimientos = recon;

    const eficienciaAuto = safeDiv(autoconsumo, X) * 100;
    const eficienciaIny = safeDiv(I, X) * 100;

    const co2Evitado = X * 0.2306;
    const arboles = co2Evitado / (10/12);

    return {
      autoconsumo,
      kwhUltimaBandaCon,
      propImpCon,
      kwhUltimaBandaSin,
      subtotalEnergySin,
      totalAPagarSin,
      ahorroTotal,
      ahorroAutoconsumo,
      ahorroImpuestos,
      ahorroReconocimientos,
      eficienciaAuto,
      eficienciaIny,
      co2Evitado,
      arboles,
      X, I, C, totalToPay, subtotalImp, subtotalEnergy, recon
    };
  }, [formData]);

  const handleInputChange = (field: keyof LocalFormData, value: string) => {
    const parsed = value === "" ? "" : Math.max(0, parseFloat(value));
    setFormData(prev => ({ ...prev, [field]: parsed }));
  };

  const updateList = (list: 'fixedCharges' | 'energyBands', id: string, field: string, value: string) => {
    let parsed: number | "" = "";
    if (value !== "") {
      const val = parseFloat(value);
      if (!isNaN(val)) {
        parsed = list === 'fixedCharges' ? val : Math.max(0, val);
      }
    }
    setFormData(prev => ({
      ...prev,
      [list]: prev[list].map((item: any) => item.id === id ? { ...item, [field]: parsed } : item)
    }));
  };

  const addItem = (list: 'fixedCharges' | 'energyBands') => {
    const newItem = list === 'fixedCharges' 
      ? { id: Date.now().toString(), amount: "" } 
      : { id: Date.now().toString(), kwh: "", amount: "" };
    setFormData(prev => ({ ...prev, [list]: [...prev[list], newItem] }));
  };

  const removeItem = (list: 'fixedCharges' | 'energyBands', id: string) => {
    if (list === 'energyBands' && formData.energyBands.length <= 1) return;
    setFormData(prev => ({ ...prev, [list]: prev[list].filter((item: any) => item.id !== id) }));
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('results-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('resultados-prosumidor-comercial.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  const inputClass = "w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight";
  const sectionClass = "bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6";

  if (showResults) {
    const savingsTotal = Math.max(0.0001, results.ahorroAutoconsumo + results.ahorroImpuestos + results.ahorroReconocimientos);
    const pAuto = (results.ahorroAutoconsumo / savingsTotal) * 100;
    const pImp = (results.ahorroImpuestos / savingsTotal) * 100;
    const pRec = (results.ahorroReconocimientos / savingsTotal) * 100;

    return (
      <div id="results-content" className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowResults(false)} className="text-slate-500 hover:text-slate-800 flex items-center font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Editar Datos
          </button>
          <div className="flex items-center gap-4">
            <button onClick={handleDownloadPDF} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Guardar PDF
            </button>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Resultados Comerciales</h2>
          </div>
        </div>

        {/* Totales Principales al Inicio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total a pagar sin Prosumidores 4.0</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(results.totalAPagarSin)}</p>
          </div>
          <div className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] p-8 rounded-3xl shadow-xl text-center text-white">
            <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">Total a pagar con Prosumidores 4.0</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(results.totalToPay)}</p>
          </div>
        </div>

        {/* Desglose de Ahorros */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center italic">
            <span className="w-2 h-6 bg-emerald-600 rounded mr-3"></span>
            Ahorro Total: {formatCurrency(results.ahorroTotal)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium italic">Ahorro por autoconsumo</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroAutoconsumo)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium italic">Ahorro por impuestos</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroImpuestos)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600 font-medium italic">Ahorro por reconocimientos</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroReconocimientos)}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 36 36" className="w-40 h-40 drop-shadow-lg">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${pAuto}, 100`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${pImp}, 100`} strokeDashoffset={`-${pAuto}`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${pRec}, 100`} strokeDashoffset={`-${pAuto + pImp}`} />
              </svg>
            </div>
          </div>
        </div>

        {/* Impacto Ambiental Extendido */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a3 3 0 013 3V16.5m-3-12.5A9 9 0 113.055 11z" /></svg>
          </div>
          <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-6">Impacto Ambiental Positivo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-1">
              <p className="text-slate-500 text-[10px] font-black uppercase">Energía Generada</p>
              <p className="text-2xl font-bold">{formatNumber(results.X)} <span className="text-sm font-normal text-slate-400 tracking-tighter">kWh</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-[10px] font-black uppercase">CO₂ evitado en el presente mes</p>
              <p className="text-2xl font-bold text-emerald-400">{formatNumber(results.co2Evitado)} <span className="text-sm font-normal text-slate-400 tracking-tighter">kg</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-[10px] font-black uppercase">Árboles equivalentes</p>
              <p className="text-2xl font-bold text-blue-400">{Math.ceil(results.arboles)} <span className="text-sm font-normal text-slate-400 tracking-tighter">unidades</span></p>
            </div>
          </div>
        </div>

        {/* Sección de Cálculos Detallados - Hidden as requested */}
        <div className="mt-12 border-t border-slate-200 pt-8 hidden">
          <button 
            onClick={() => setShowAux(!showAux)} 
            className="flex items-center text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 transition-transform duration-300 ${showAux ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Cálculos Auxiliares
          </button>
          
          {showAux && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-fadeIn">
              {Object.entries(results).map(([key, value]) => (
                <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{key}</span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {typeof value === 'number' ? formatNumber(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => setShowFullLog(!showFullLog)} 
            className="flex items-center text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 transition-transform duration-300 ${showFullLog ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Registro Completo de Cálculos
          </button>

          {showFullLog && (
            <div className="mt-4 bg-slate-900 p-6 rounded-2xl overflow-hidden shadow-inner animate-fadeIn">
              <div className="overflow-x-auto">
                <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed">
                  {JSON.stringify({ results, formData }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-20">
      <button onClick={onBack} className="text-slate-400 hover:text-slate-800 flex items-center font-bold transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Volver a Categorías
      </button>

      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Calculadora Comercial</h2>
        <p className="text-emerald-600 font-bold text-sm">Cooperativa Eléctrica • Programa Prosumidores 4.0</p>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-emerald-600 border-b pb-2 mb-4 italic">DETALLE DE SU CONSUMO</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className={labelClass}>Energía Generada (X)</label><input type="number" step="any" className={inputClass} value={formData.energyGenerated} onChange={(e) => handleInputChange('energyGenerated', e.target.value)} placeholder="kWh" /></div>
          <div><label className={labelClass}>Energía Inyectada (I)</label><input type="number" step="any" className={inputClass} value={formData.energyInjected} onChange={(e) => handleInputChange('energyInjected', e.target.value)} placeholder="kWh" /></div>
          <div><label className={labelClass}>Energía Entregada (C)</label><input type="number" step="any" className={inputClass} value={formData.energyDelivered} onChange={(e) => handleInputChange('energyDelivered', e.target.value)} placeholder="kWh" /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-emerald-600 border-b pb-2 mb-4 italic">DETALLE DE SU FACTURA</h3>
        
        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargos fijos</p>
          {formData.fixedCharges.map((f, i) => (
            <div key={f.id} className="flex gap-4 items-center animate-fadeIn">
              <input type="number" step="any" className={inputClass} value={f.amount} onChange={(e) => updateList('fixedCharges', f.id, 'amount', e.target.value)} placeholder={`Importe Cargo Fijo #${i+1} ($)`} />
              <button onClick={() => removeItem('fixedCharges', f.id)} className="p-2 text-red-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
          <button onClick={() => addItem('fixedCharges')} className="text-emerald-600 font-bold text-sm hover:underline">+ Agregar Cargo Fijo</button>
        </div>

        <div className="pt-4 border-t">
          <label className={labelClass}>Reconocimiento beneficio ambiental / Reconocimiento Gobierno de Santa Fe ($)</label>
          <input type="number" step="any" className={inputClass} value={formData.environmentalBenefit} onChange={(e) => handleInputChange('environmentalBenefit', e.target.value)} placeholder="Importe en ARS" />
        </div>

        <div className="pt-4 border-t space-y-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bandas de energía</p>
          {formData.energyBands.map((b, i) => (
            <div key={b.id} className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
              <div className="col-span-2 flex justify-between items-center">
                <div className="text-[10px] font-black uppercase text-slate-400">Banda #{i+1}</div>
                {formData.energyBands.length > 1 && (
                  <button onClick={() => removeItem('energyBands', b.id)} className="p-1 text-red-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                )}
              </div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Energía (kWh)</label><input type="number" step="any" className={inputClass} value={b.kwh} onChange={(e) => updateList('energyBands', b.id, 'kwh', e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Importe ($)</label><input type="number" step="any" className={inputClass} value={b.amount} onChange={(e) => updateList('energyBands', b.id, 'amount', e.target.value)} /></div>
            </div>
          ))}
          <button onClick={() => addItem('energyBands')} className="text-emerald-600 font-bold text-sm hover:underline">+ Agregar Banda</button>
          <p className="text-[10px] text-slate-400 italic leading-relaxed border-l-4 border-emerald-200 pl-4 py-1">
            Si tu factura muestra un rango de valores en la Banda de energía, ingresá el valor máximo del rango. Si aparece un único número, ingresá ese mismo valor.
          </p>
        </div>

        <div className="pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className={labelClass}>Subtotal Energía Eléctrica ($)</label><input type="number" step="any" className={inputClass} value={formData.subtotalEnergyElectric} onChange={(e) => handleInputChange('subtotalEnergyElectric', e.target.value)} /></div>
          <div><label className={labelClass}>TOTAL A PAGAR ($) *</label><input type="number" step="any" className={`${inputClass} border-emerald-500 bg-emerald-50 font-black`} value={formData.totalToPay} onChange={(e) => handleInputChange('totalToPay', e.target.value)} /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-emerald-600 border-b pb-2 mb-4 italic">IMPUESTOS/GRAVÁMENES</h3>
        <div><label className={labelClass}>Subtotal Impuestos Energía Eléctrica ($)</label><input type="number" step="any" className={inputClass} value={formData.subtotalTaxes} onChange={(e) => handleInputChange('subtotalTaxes', e.target.value)} /></div>
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={() => setShowResults(true)} className="bg-red-600 hover:bg-red-700 text-white font-black py-5 px-16 rounded-full shadow-2xl hover:shadow-red-200 transition-all duration-300 transform hover:-translate-y-1 uppercase tracking-widest text-lg">
          Calcular Ahorro
        </button>
      </div>
    </div>
  );
};

export default CommercialProsumerFlow;
