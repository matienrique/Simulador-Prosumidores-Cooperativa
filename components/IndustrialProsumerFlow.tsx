
import React, { useState, useMemo } from 'react';
import { FixedCharge, EnergyBand } from '../types';
import { formatCurrency, formatNumber } from '../services/calculatorService';

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

const IndustrialProsumerFlow: React.FC<Props> = ({ onBack }) => {
  const [showResults, setShowResults] = useState(false);
  const [showAux, setShowAux] = useState(false);
  const [showFullLog, setShowFullLog] = useState(false);
  
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

  // Constante específica para usuario industrial
  const PROP_IMP_SIN_PROS_INDUSTRIAL = 0.0605;

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
    
    const taxFactor = 1 - (propImpCon - PROP_IMP_SIN_PROS_INDUSTRIAL);
    const totalAPagarSin = safeDiv(subtotalEnergySin, taxFactor);

    const ahorroTotal = totalAPagarSin - totalToPay;
    const ahorroAutoconsumo = subtotalEnergySin - subtotalEnergy;
    const ahorroImpuestos = totalAPagarSin - subtotalEnergySin - subtotalImp;
    const ahorroReconocimientos = recon;

    const eficienciaAuto = safeDiv(autoconsumo, X) * 100;
    const eficienciaIny = safeDiv(I, X) * 100;

    const co2Evitado = autoconsumo * 0.041;
    const arboles = safeDiv(co2Evitado, (10/12));

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
      X, I, C, totalToPay, subtotalImp, subtotalEnergy, recon,
      penultimaBandaKwh, sumaImportesHastaPenultima, sumaCargosFijos,
      precioUltimaBanda, taxFactor
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

  const inputClass = "w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight";
  const sectionClass = "bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6";

  if (showResults) {
    const savingsTotal = Math.max(0.0001, results.ahorroAutoconsumo + results.ahorroImpuestos + results.ahorroReconocimientos);
    const pAuto = (results.ahorroAutoconsumo / savingsTotal) * 100;
    const pImp = (results.ahorroImpuestos / savingsTotal) * 100;
    const pRec = (results.ahorroReconocimientos / savingsTotal) * 100;

    return (
      <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowResults(false)} className="text-slate-500 hover:text-slate-800 flex items-center font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Editar Datos
          </button>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Resultados Industriales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Total a pagar sin Prosumidores 4.0</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(results.totalAPagarSin)}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-200 shadow-sm text-center">
            <p className="text-orange-700 text-[10px] font-black uppercase mb-1">Total a pagar con Prosumidores 4.0</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(results.totalToPay)}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
            <span className="w-2 h-6 bg-orange-500 rounded mr-3"></span>
            RESUMEN DE AHORRO
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
              <div className="flex justify-between items-center pt-2">
                <span className="font-black text-slate-800 uppercase text-sm">Ahorro Total</span>
                <span className="font-black text-emerald-600 text-xl">{formatCurrency(results.ahorroTotal)}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 36 36" className="w-44 h-44 drop-shadow-md">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray={`${pAuto}, 100`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${pImp}, 100`} strokeDashoffset={`-${pAuto}`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${pRec}, 100`} strokeDashoffset={`-${pAuto + pImp}`} />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl">
          <h3 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] mb-8">Impacto Ambiental Positivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Energía Generada</p>
              <p className="text-2xl font-bold">{formatNumber(results.X)} <span className="text-xs text-slate-400 font-normal">kWh</span></p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Cantidad de CO2 evitadas en el presente mes</p>
              <p className="text-2xl font-bold text-orange-400">{formatNumber(results.co2Evitado)} <span className="text-xs text-slate-400 font-normal">kg</span></p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Equivalente a árboles plantados</p>
              <p className="text-2xl font-bold text-emerald-400">{Math.ceil(results.arboles)} <span className="text-xs text-slate-400 font-normal">u.</span></p>
            </div>
          </div>
        </div>

        {/* Accordion AUXILIARY */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
          <button onClick={() => setShowAux(!showAux)} className="w-full p-6 flex items-center justify-between font-black text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs">
            <span>CÁLCULOS AUXILIARES</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${showAux ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showAux && (
            <div className="p-8 border-t bg-slate-50 space-y-3 text-xs font-mono text-slate-500">
              <div className="flex justify-between border-b pb-1"><span>Autoconsumo Coop,Con:</span> <span>{formatNumber(results.autoconsumo)} kWh</span></div>
              <div className="flex justify-between border-b pb-1"><span>kWh de última banda Coop,Con:</span> <span>{formatNumber(results.kwhUltimaBandaCon)} kWh</span></div>
              <div className="flex justify-between border-b pb-1"><span>Proporción Impuestos / Total, Coop Con:</span> <span>{results.propImpCon.toFixed(4)}</span></div>
              <div className="flex justify-between border-b pb-1"><span>kWh de última banda Coop, Sin:</span> <span>{formatNumber(results.kwhUltimaBandaSin)} kWh</span></div>
              <div className="flex justify-between border-b pb-1"><span>Subtotal Energía Eléctrica Coop, Sin:</span> <span>{formatCurrency(results.subtotalEnergySin)}</span></div>
              <div className="flex justify-between border-b pb-1"><span>TOTAL A PAGAR, Coop,Sin:</span> <span>{formatCurrency(results.totalAPagarSin)}</span></div>
              <div className="flex justify-between pt-2 text-slate-900 font-bold"><span>Ahorro total por contar con el programa:</span> <span>{formatCurrency(results.ahorroTotal)}</span></div>
            </div>
          )}
        </div>

        {/* Accordion: TODOS LOS CÁLCULOS (Variables Internas) */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
          <button onClick={() => setShowFullLog(!showFullLog)} className="w-full p-6 flex items-center justify-between font-bold text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]">
            <span>Ver todos los cálculos (Lógica Interna)</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${showFullLog ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFullLog && (
            <div className="p-8 border-t bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto leading-relaxed">
              <pre className="whitespace-pre-wrap">
{`// --- CONFIGURACIÓN INDUSTRIAL ---
- Proporción Impuestos Sin Pros (K): ${PROP_IMP_SIN_PROS_INDUSTRIAL}
- Factor CO2 Industrial: 0.041

// --- VARIABLES DE ENTRADA ---
- Energía Generada (X): ${results.X} kWh
- Energía Inyectada (I): ${results.I} kWh
- Energía Entregada (C): ${results.C} kWh
- Total a Pagar Actual: ${formatCurrency(results.totalToPay)}
- Subtotal Impuestos: ${formatCurrency(results.subtotalImp)}

// --- PROCESO DE CÁLCULO ---
1. Autoconsumo (X - I): ${results.autoconsumo.toFixed(2)} kWh
2. Penúltima Banda kWh: ${results.penultimaBandaKwh} kWh
3. kWh Última Banda Con (C - Penúltima): ${results.kwhUltimaBandaCon.toFixed(2)} kWh
4. kWh Última Banda Sin (L3 + Autoconsumo): ${results.kwhUltimaBandaSin.toFixed(2)} kWh
5. Precio Unitario Última Banda: ${results.precioUltimaBanda.toFixed(4)} $/kWh
6. Suma Cargos Fijos: ${results.sumaCargosFijos.toFixed(2)}
7. Suma Importes hasta Penúltima: ${results.sumaImportesHastaPenultima.toFixed(2)}
8. Subtotal Energía Sin (6 + 7 + (5 * 4)): ${results.subtotalEnergySin.toFixed(2)}
9. Prop. Impuestos Con (Impuestos / Total): ${results.propImpCon.toFixed(4)}
10. Factor de Ajuste Tax (1 - (PropCon - PropSin)): ${results.taxFactor.toFixed(4)}
11. TOTAL A PAGAR SIN PROS (8 / 10): ${results.totalAPagarSin.toFixed(2)}

// --- IMPACTO ---
- Ahorro Bruto: ${results.ahorroTotal.toFixed(2)}
- CO2 Evitado (Autoconsumo * 0.041): ${results.co2Evitado.toFixed(2)} kg
- Árboles (CO2 / 0.833): ${results.arboles.toFixed(1)} unidades`}
              </pre>
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
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Calculadora Industrial</h2>
        <p className="text-orange-600 font-bold text-sm tracking-widest uppercase">Cooperativa Eléctrica • Programa Prosumidores 4.0</p>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-orange-600 border-b pb-2 mb-4 italic">DETALLE DE SU CONSUMO</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className={labelClass}>Energía Generada (X)</label><input type="number" step="any" className={inputClass} value={formData.energyGenerated} onChange={(e) => handleInputChange('energyGenerated', e.target.value)} placeholder="kWh" /></div>
          <div><label className={labelClass}>Energía Inyectada (I)</label><input type="number" step="any" className={inputClass} value={formData.energyInjected} onChange={(e) => handleInputChange('energyInjected', e.target.value)} placeholder="kWh" /></div>
          <div><label className={labelClass}>Energía Entregada (C)</label><input type="number" step="any" className={inputClass} value={formData.energyDelivered} onChange={(e) => handleInputChange('energyDelivered', e.target.value)} placeholder="kWh" /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-orange-600 border-b pb-2 mb-4 italic">DETALLE DE SU FACTURA</h3>
        
        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargos fijos</p>
          {formData.fixedCharges.map((f, i) => (
            <div key={f.id} className="flex gap-4 items-center animate-fadeIn">
              <input type="number" step="any" className={inputClass} value={f.amount} onChange={(e) => updateList('fixedCharges', f.id, 'amount', e.target.value)} placeholder={`Importe Cargo Fijo #${i+1} ($)`} />
              <button onClick={() => removeItem('fixedCharges', f.id)} className="p-2 text-red-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
          <button onClick={() => addItem('fixedCharges')} className="text-orange-600 font-bold text-sm hover:underline tracking-tight">+ Agregar Cargo Fijo</button>
        </div>

        <div className="pt-4 border-t">
          <label className={labelClass}>Reconocimiento beneficio ambiental ($)</label>
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
          <button onClick={() => addItem('energyBands')} className="text-orange-600 font-bold text-sm hover:underline tracking-tight">+ Agregar Banda</button>
        </div>

        <div className="pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className={labelClass}>Subtotal Energía Eléctrica ($)</label><input type="number" step="any" className={inputClass} value={formData.subtotalEnergyElectric} onChange={(e) => handleInputChange('subtotalEnergyElectric', e.target.value)} /></div>
          <div><label className={labelClass}>TOTAL A PAGAR ($) *</label><input type="number" step="any" className={`${inputClass} border-orange-500 bg-orange-50 font-black`} value={formData.totalToPay} onChange={(e) => handleInputChange('totalToPay', e.target.value)} /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-orange-600 border-b pb-2 mb-4 italic">IMPUESTOS/GRAVÁMENES</h3>
        <div><label className={labelClass}>Subtotal Impuestos Energía Eléctrica ($)</label><input type="number" step="any" className={inputClass} value={formData.subtotalTaxes} onChange={(e) => handleInputChange('subtotalTaxes', e.target.value)} /></div>
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={() => setShowResults(true)} className="bg-red-600 hover:bg-red-700 text-white font-black py-5 px-16 rounded-full shadow-2xl hover:shadow-red-200 transition-all duration-300 transform hover:-translate-y-1 uppercase tracking-widest text-lg">
          Calcular
        </button>
      </div>
    </div>
  );
};

export default IndustrialProsumerFlow;
