
import React, { useState, useMemo } from 'react';
import { FixedCharge, EnergyBand } from '../types';
import { formatCurrency, formatNumber } from '../services/calculatorService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  onBack: () => void;
}

enum FiscalStatus {
  RI = 'Responsable Inscripto',
  CF = 'Consumidor Final',
  MONO = 'Monotributo',
  NC = 'Sujeto no Categorizado',
  EXENTO = 'Exento'
}

interface LocalFormData {
  knowsPower: 'si' | 'no' | null;
  contractedPower: number | "";
  knowsAverage: 'si' | 'no' | null;
  averageConsumption: number | "";
  monthlyTable: number[];
  currentMonthConsumption: number | "";
  fiscalStatus: FiscalStatus | '';
  fixedCharges: FixedCharge[];
  energyBands: EnergyBand[];
  subtotalEnergySin: number | "";
  subtotalTaxesSin: number | "";
  totalToPaySin: number | "";
}

const NotProsumerIndustrialFlow: React.FC<Props> = ({ onBack }) => {
  const [showResults, setShowResults] = useState(false);
  const [showAux, setShowAux] = useState(true);
  const [showFullLog, setShowFullLog] = useState(true);
  const [showFixedCharges, setShowFixedCharges] = useState(false);

  // VARIABLES ESPECÍFICAS PARA USUARIO INDUSTRIAL
  const Autoconsumo_estimado = 0.90;
  const TARIFA_GSF = 39.2;

  const [formData, setFormData] = useState<LocalFormData>({
    knowsPower: 'no',
    contractedPower: "",
    knowsAverage: 'no',
    averageConsumption: "",
    monthlyTable: Array(12).fill(0),
    currentMonthConsumption: "",
    fiscalStatus: '',
    fixedCharges: [{ id: '1', amount: "" }],
    energyBands: [{ id: '1', kwh: "", amount: "" }],
    subtotalEnergySin: "",
    subtotalTaxesSin: "",
    totalToPaySin: "",
  });

  const parse = (val: number | string | ""): number => {
    if (val === "" || val === null || val === undefined) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  
  const safeDiv = (a: number, b: number): number => (b === 0 ? 0 : a / b);

  // Lógica Fiscal
  const fiscalData = useMemo(() => {
    switch (formData.fiscalStatus) {
      case FiscalStatus.RI: return { iva: 0.27, perc: 0.03, label: "IVA: 27% | Percepción: 3%" };
      case FiscalStatus.CF: return { iva: 0.21, perc: 0, label: "IVA: 21% | Percepción: 0%" };
      case FiscalStatus.MONO: return { iva: 0.27, perc: 0, label: "IVA: 27% | Percepción: 0%" };
      case FiscalStatus.NC: return { iva: 0.27, perc: 0.135, label: "IVA: 27% | Percepción: 13,5%" };
      case FiscalStatus.EXENTO: return { iva: 0.21, perc: 0, label: "IVA: 21% | Percepción: 0%" };
      default: return { iva: 0, perc: 0, label: "" };
    }
  }, [formData.fiscalStatus]);

  // Cálculos de Resultados
  const results = useMemo(() => {
    const currentCons = parse(formData.currentMonthConsumption);
    
    // 1. TOTAL [kWh]
    let TOTAL = 0;
    if (formData.knowsPower === 'si') {
      TOTAL = currentCons;
    } else {
      if (formData.knowsAverage === 'si') {
        TOTAL = parse(formData.averageConsumption);
      } else if (formData.knowsAverage === 'no') {
        TOTAL = formData.monthlyTable.reduce((acc, v) => acc + v, 0);
      }
    }

    // 2. Estimación potencia máxima
    let maxPower = 0;
    if (formData.knowsPower === 'si') {
      maxPower = parse(formData.contractedPower);
    } else {
      maxPower = TOTAL / 1629.1;
    }

    // 3. Generación promedio
    const genPromedio = (maxPower * 1629.1) / 12;

    // 4. Energía Generada (EG)
    const EG = Math.ceil(genPromedio);

    // 5. Energía Recibida (ER)
    const ER = genPromedio * (1 - Autoconsumo_estimado);

    // 6. Autoconsumo (autoconsumoKwh)
    const autoconsumoKwh = EG - ER;

    // 7. Energía Entregada (EE)
    const EE = currentCons - EG + ER;

    // 8. Lógica de Bandas
    const n = formData.energyBands.length;
    const lastBand = formData.energyBands[n - 1];
    const prevBand = n >= 2 ? formData.energyBands[n - 2] : null;

    // REGLA: "Ultima banda" siempre toma la energía de la banda anterior (penúltima).
    // Si solo hay una banda, se usa esa banda como referencia base.
    let ultimaBandaKwhValue = n >= 2 ? parse(prevBand?.kwh) : parse(formData.energyBands[0]?.kwh);

    // VARIABLE: kWh de última banda, SIN
    // kWhUltimaBandaSin = TOTAL - Última banda
    const kwhUltimaBandaSin = Math.max(0.0001, currentCons - ultimaBandaKwhValue);
    
    const precioUltimaBanda = safeDiv(parse(lastBand?.amount), kwhUltimaBandaSin);

    const sumaCargosFijos = formData.fixedCharges.reduce((acc, f) => acc + parse(f.amount), 0);
    
    const sumaImportesHastaPenultima = n >= 2 
      ? formData.energyBands.slice(0, -1).reduce((acc, b) => acc + parse(b.amount), 0) 
      : 0;

    const subtotalEnergyCon = sumaCargosFijos + sumaImportesHastaPenultima + (precioUltimaBanda * (kwhUltimaBandaSin - autoconsumoKwh));

    // 9. Subtotal Impuestos con
    const subtotalEnergySin = parse(formData.subtotalEnergySin);
    const subtotalTaxesSin = parse(formData.subtotalTaxesSin);
    
    // Cálculo de impuestos afectado por la Situación Fiscal (iva)
    const subtotalTaxesCon = subtotalTaxesSin - (subtotalEnergySin - subtotalEnergyCon) * fiscalData.iva;

    // 10. Reconocimiento GSF
    const reconGSF = TARIFA_GSF * ER;

    // 11. Total Energía, con
    const totalEnergiaCon = subtotalEnergyCon + subtotalTaxesCon - reconGSF;

    // 12. TOTAL FACTURA (Con Percepciones según Situación Fiscal)
    const totalToPaySin = parse(formData.totalToPaySin);
    const totalFacturaCon = totalEnergiaCon * (1 + fiscalData.perc);

    // Ahorros
    const ahorroTotal = totalToPaySin - totalFacturaCon;
    const ahorroAutoconsumo = subtotalEnergySin - subtotalEnergyCon;
    const ahorroImpuestos = subtotalTaxesSin - subtotalTaxesCon;
    const ahorroReconocimientos = reconGSF;

    return {
      TOTAL, maxPower, genPromedio, EG, ER, autoconsumoKwh, EE,
      subtotalEnergyCon, subtotalTaxesCon, reconGSF, totalEnergiaCon, totalFacturaCon,
      ahorroTotal, ahorroAutoconsumo, ahorroImpuestos, ahorroReconocimientos,
      totalToPaySin, kwhUltimaBandaSin, subtotalEnergySin, subtotalTaxesSin,
      precioUltimaBanda, sumaImportesHastaPenultima, ultimaBandaKwhValue
    };
  }, [formData, fiscalData]);

  // Se corrige para que NO use parseFloat en campos de texto (Situación Fiscal)
  const handleInputChange = (field: keyof LocalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateList = (list: 'fixedCharges' | 'energyBands', id: string, field: string, value: string) => {
    const val = value === "" ? "" : parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [list]: prev[list].map((item: any) => item.id === id ? { ...item, [field]: val } : item)
    }));
  };

  const addItem = (list: 'fixedCharges' | 'energyBands') => {
    const newItem = list === 'fixedCharges' 
      ? { id: Date.now().toString(), amount: "" } 
      : { id: Date.now().toString(), kwh: "", amount: "" };
    setFormData(prev => ({ ...prev, [list]: [...prev[list], newItem] }));
  };

  const removeItem = (list: 'fixedCharges' | 'energyBands', id: string) => {
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

      pdf.save('resultados-industrial.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  const inputClass = "w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all bg-white shadow-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight";
  const sectionClass = "bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6";

  if (showResults) {
    const totalAhorroVal = Math.max(0.0001, results.ahorroTotal);
    const pAuto = (results.ahorroAutoconsumo / totalAhorroVal) * 100;
    const pImp = (results.ahorroImpuestos / totalAhorroVal) * 100;
    const pRec = (results.ahorroReconocimientos / totalAhorroVal) * 100;

    return (
      <div id="results-content" className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-20">
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
            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Resultados Industriales</h2>
          </div>
        </div>

        <div className="text-center bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <p className="text-xs font-black text-orange-800 uppercase tracking-widest">Potencia maxima de instalacion</p>
          <p className="text-2xl font-black text-orange-600">{results.maxPower.toFixed(2)} kW</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Factura Sin Programa</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(results.totalToPaySin)}</p>
          </div>
          <div className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] p-6 rounded-3xl shadow-xl text-center text-white">
            <p className="text-orange-100 text-[10px] font-black uppercase mb-1 tracking-widest">Factura Con Prosumidores 4.0</p>
            <p className="text-3xl font-bold">{formatCurrency(results.totalFacturaCon)}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <h3 className="text-xl font-black text-slate-800 mb-8 uppercase italic tracking-tighter">
            AHORRO TOTAL ESTIMADO: {formatCurrency(results.ahorroTotal)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-slate-600 font-medium italic">Ahorro por autoconsumo</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroAutoconsumo)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-slate-600 font-medium italic">Ahorro por impuestos</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroImpuestos)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-slate-600 font-medium italic">Ahorro por reconocimientos</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroReconocimientos)}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 36 36" className="w-44 h-44 drop-shadow-md">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ea580c" strokeWidth="3" strokeDasharray={`${Math.round(pAuto)}, 100`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray={`${Math.round(pImp)}, 100`} strokeDashoffset={`-${Math.round(pAuto)}`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${Math.round(pRec)}, 100`} strokeDashoffset={`-${Math.round(pAuto + pImp)}`} />
              </svg>
              <div className="mt-4 flex gap-4 text-[9px] font-black uppercase text-slate-400">
                <span className="flex items-center"><div className="w-2 h-2 bg-orange-600 mr-1"></div> {Math.round(pAuto)}% Auto.</span>
                <span className="flex items-center"><div className="w-2 h-2 bg-blue-600 mr-1"></div> {Math.round(pImp)}% Imp.</span>
                <span className="flex items-center"><div className="w-2 h-2 bg-emerald-500 mr-1"></div> {Math.round(pRec)}% GSF</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 italic">Eficiencia Energética</h3>
            <div className="space-y-4">
              <div>
                <p className="flex justify-between text-[10px] font-bold mb-1 uppercase"><span>Porcentaje de autoconsumo</span> <span>{Math.round(safeDiv(results.autoconsumoKwh, results.EG) * 100)}%</span></p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-orange-600 h-full" style={{width: `${safeDiv(results.autoconsumoKwh, results.EG) * 100}%`}}></div></div>
              </div>
              <div>
                <p className="flex justify-between text-[10px] font-bold mb-1 uppercase"><span>Porcentaje de generación con respecto al consumo</span> <span>{Math.round(safeDiv(results.EG, (results.EG + results.EE - results.ER)) * 100)}%</span></p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{width: `${safeDiv(results.EG, (results.EG + results.EE - results.ER)) * 100}%`}}></div></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-4 italic">Impacto Ambiental Positivo</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-slate-500 text-[8px] font-black uppercase mb-1">Generada</p><p className="text-xl font-bold">{results.EG} <span className="text-[10px] font-normal text-slate-400">kWh</span></p></div>
              <div><p className="text-slate-500 text-[8px] font-black uppercase mb-1">CO2 Evitado</p><p className="text-xl font-bold text-orange-400">{(results.EG * 0.2306).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kg</span></p></div>
              <div><p className="text-slate-500 text-[8px] font-black uppercase mb-1">Árboles eq.</p><p className="text-xl font-bold text-emerald-400">{Math.ceil((results.EG * 0.2306) / (10/12))}</p></div>
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
      <button onClick={onBack} className="text-slate-400 hover:text-slate-800 flex items-center font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>

      <div className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] p-6 rounded-3xl text-white flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.31a2 2 0 01-1.782 0l-.691-.31a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-1.091 1.091a2 2 0 000 2.828l1.091 1.091a2 2 0 001.022.547l2.387.477a6 6 0 003.86-.517l.691-.31a2 2 0 011.782 0l.691.31a6 6 0 003.86.517l2.387-.477a2 2 0 001.022-.547l1.091-1.091a2 2 0 000-2.828l-1.091-1.091z" /></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest italic">Simulación Industrial</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-orange-200 tracking-tighter">Autoconsumo estimado</p>
          <p className="text-2xl font-black">90%</p>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-orange-600 border-b pb-2 mb-4 italic uppercase tracking-tighter">HISTORIA DE CONSUMO DE ENERGÍA</h3>
        
        <div className="space-y-8">
          <div className="animate-fadeIn overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-4 text-left font-black text-slate-400 uppercase tracking-widest">Mes</th><th className="p-4 text-left font-black text-slate-400 uppercase tracking-widest">Consumo [kWh]</th></tr></thead>
              <tbody className="bg-white">
                {formData.monthlyTable.map((val, idx) => (
                  <tr key={idx} className="border-t border-slate-50">
                    <td className="p-4 font-black text-slate-500">{idx + 1}</td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" 
                        value={val === 0 ? "" : val} 
                        onChange={(e) => { 
                          const nt = [...formData.monthlyTable]; 
                          nt[idx] = e.target.value === "" ? 0 : parseFloat(e.target.value); 
                          setFormData(p => ({ ...p, monthlyTable: nt })); 
                        }} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 italic leading-relaxed border-l-4 border-orange-200 pl-4 py-1">
            Si tu factura tiene consumos bimestrales, completa las primeras 6 casillas con dichos valores y deja vacías las demás.
          </p>

          {(formData.knowsPower !== null) && (
            <div className="pt-6 border-t border-slate-100 animate-fadeIn">
              <label className={labelClass}>Consumo de energía del presente mes [kWh] *</label>
              <input type="number" step="any" className={`${inputClass} font-black`} value={formData.currentMonthConsumption} onChange={(e) => handleInputChange('currentMonthConsumption', e.target.value)} />
              <p className="mt-2 text-[10px] font-bold text-slate-400 mt-2 font-bold uppercase italic leading-relaxed border-l-4 border-orange-200 pl-4 py-1">
                Este valor corresponde al consumo registrado por su medidor en el período actual. Puede encontrarlo detallado en su factura eléctrica.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-orange-600 border-b pb-2 mb-4 italic uppercase tracking-tighter">DETALLE DE SU FACTURA</h3>
        
        <div className="space-y-6">
          <div>
            <label className={labelClass}>¿Cuál es su situación fiscal? *</label>
            <select className={inputClass} value={formData.fiscalStatus} onChange={(e) => handleInputChange('fiscalStatus', e.target.value)}>
              <option value="">Seleccione situación fiscal...</option>
              {Object.values(FiscalStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {formData.fiscalStatus && <div className="mt-3 bg-orange-50 p-4 rounded-xl border border-orange-100 text-[10px] font-black text-orange-700 uppercase tracking-widest animate-fadeIn">{fiscalData.label}</div>}
          </div>

          <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <button onClick={() => setShowFixedCharges(!showFixedCharges)} className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 font-black uppercase text-xs tracking-widest text-slate-600 transition-all">
              <span>Cargos fijos</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showFixedCharges ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showFixedCharges && (
              <div className="p-8 space-y-4 bg-white border-t animate-fadeIn">
                {formData.fixedCharges.map((f, i) => (
                  <div key={f.id} className="flex gap-4 items-center">
                    <input type="number" step="any" className={inputClass} value={f.amount} onChange={(e) => updateList('fixedCharges', f.id, 'amount', e.target.value)} placeholder={`Cargo #${i+1} ($)`} />
                    <button onClick={() => removeItem('fixedCharges', f.id)} className="text-red-400 hover:text-red-600 p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                ))}
                <button onClick={() => addItem('fixedCharges')} className="text-orange-600 font-black text-xs uppercase tracking-widest">+ Agregar Cargo</button>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Bandas de energía</p>
            {formData.energyBands.map((b, i) => (
              <div key={b.id} className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 relative shadow-inner animate-fadeIn">
                <div className="col-span-2 flex justify-between items-center text-[10px] font-black uppercase text-slate-400"><span>Banda #{i+1}</span><button onClick={() => removeItem('energyBands', b.id)} className="text-red-400 hover:text-red-600 p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Energía (kWh)</label><input type="number" step="any" className={inputClass} value={b.kwh} onChange={(e) => updateList('energyBands', b.id, 'kwh', e.target.value)} /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Importe ($)</label><input type="number" step="any" className={inputClass} value={b.amount} onChange={(e) => updateList('energyBands', b.id, 'amount', e.target.value)} /></div>
              </div>
            ))}
            <button onClick={() => addItem('energyBands')} className="text-orange-600 font-black text-xs uppercase tracking-widest">+ Agregar Banda</button>
            <p className="text-[10px] text-slate-400 italic leading-relaxed border-l-4 border-orange-200 pl-4 py-1">
              Si tu factura muestra un rango de valores en la Banda de energía, ingresá el valor máximo del rango. Si aparece un único número, ingresá ese mismo valor.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div><label className={labelClass}>Subtotal Energía Eléctrica ($)</label><input type="number" step="any" className={inputClass} value={formData.subtotalEnergySin} onChange={(e) => handleInputChange('subtotalEnergySin', e.target.value)} /></div>
            <div><label className={labelClass}>Subtotal Impuestos Sin ($)</label><input type="number" step="any" className={inputClass} value={formData.subtotalTaxesSin} onChange={(e) => handleInputChange('subtotalTaxesSin', e.target.value)} /></div>
            <div className="md:col-span-2"><label className={`${labelClass} text-orange-600`}>TOTAL A PAGAR ($) *</label><input type="number" step="any" className={`${inputClass} border-orange-600 bg-orange-50 font-black text-xl shadow-inner`} value={formData.totalToPaySin} onChange={(e) => handleInputChange('totalToPaySin', e.target.value)} /></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-10 pb-20">
        <button 
          onClick={() => {
            if (!formData.fiscalStatus || parse(formData.totalToPaySin) <= 0 || parse(formData.currentMonthConsumption) <= 0) {
              alert("Por favor complete situación fiscal, consumo mensual y total a pagar.");
              return;
            }
            setShowResults(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          className="bg-red-600 hover:bg-red-700 text-white font-black py-6 px-20 rounded-full shadow-2xl hover:shadow-red-200 transition-all duration-300 transform hover:-translate-y-2 uppercase tracking-widest text-lg"
        >
          Calcular
        </button>
      </div>
    </div>
  );
};

export default NotProsumerIndustrialFlow;
