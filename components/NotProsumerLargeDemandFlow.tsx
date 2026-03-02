
import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber } from '../services/calculatorService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  onBack: () => void;
}

enum FiscalCondition {
  RI = 'Responsable inscripto',
  RI_AGENTE = 'Responsable inscripto agente percepción',
  EXENTO = 'Exento'
}

interface LocalFormData {
  fiscalCondition: FiscalCondition | '';
  pvPower: number | "";
  consPico: number | "";
  consResto: number | "";
  consValle: number | "";
  cargoComercial: number | "";
  cargoCapPico: number | "";
  cargoCapFueraPico: number | "";
  cargoCapPotencia: number | "";
  tarifaPico: number | "";
  tarifaRestoSin: number | "";
  precioUnitarioResto: number | "";
  tarifaValle: number | "";
  recargoFactorPotencia: number | "";
  cuotaCAP: number | "";
  subtotalGeneralInput: number | "";
  totalInput: number | "";
}

const NotProsumerLargeDemandFlow: React.FC<Props> = ({ onBack }) => {
  const [showResults, setShowResults] = useState(false);
  const [showAux, setShowAux] = useState(false);

  // Variables Internas Obligatorias
  const AUTOCONSUMO_ESTIMADO = 0.76;
  const TARIFA_RECON_COOP = 71.56;
  const TARIFA_RECON_GSF = -27.61;

  const [formData, setFormData] = useState<LocalFormData>({
    fiscalCondition: '',
    pvPower: "",
    consPico: "",
    consResto: "",
    consValle: "",
    cargoComercial: "",
    cargoCapPico: "",
    cargoCapFueraPico: "",
    cargoCapPotencia: "",
    tarifaPico: "",
    tarifaRestoSin: "",
    precioUnitarioResto: "",
    tarifaValle: "",
    recargoFactorPotencia: "",
    cuotaCAP: "",
    subtotalGeneralInput: "",
    totalInput: "",
  });

  const fiscalInfo = useMemo(() => {
    switch (formData.fiscalCondition) {
      case FiscalCondition.RI:
        return { iva: 0.27, perc: 0.03, label: "IVA aplicable: 27% | Percepción: 3%" };
      case FiscalCondition.RI_AGENTE:
        return { iva: 0.27, perc: 0, label: "IVA aplicable: 27%" };
      case FiscalCondition.EXENTO:
        return { iva: 0.21, perc: 0, label: "IVA aplicable: 21%" };
      default:
        return { iva: 0, perc: 0, label: "" };
    }
  }, [formData.fiscalCondition]);

  const parse = (val: number | ""): number => (val === "" ? 0 : Number(val));
  const safeDiv = (a: number, b: number): number => (b === 0 ? 0 : a / b);

  const results = useMemo(() => {
    // 4.1 SUBTOTAL BÁSICO SIN
    const subtotalBasicoSin = 
      parse(formData.cargoComercial) +
      parse(formData.cargoCapPico) +
      parse(formData.cargoCapFueraPico) +
      parse(formData.cargoCapPotencia) +
      parse(formData.tarifaPico) +
      parse(formData.tarifaRestoSin) +
      parse(formData.tarifaValle) +
      parse(formData.recargoFactorPotencia);

    // 4.2 GENERACIÓN / RECIBIDA
    const energiaGenerada = (parse(formData.pvPower) * 2148) / 12;
    const energiaRecibida = energiaGenerada * (1 - AUTOCONSUMO_ESTIMADO);

    // 4.3 TARIFA RESTO CON
    const energiaRestoCon = parse(formData.consResto) - energiaGenerada + energiaRecibida;
    const tarifaRestoCon = energiaRestoCon * parse(formData.precioUnitarioResto);

    // 4.4 RECONOCIMIENTO COOPERATIVA (Interno)
    const reconCoop = TARIFA_RECON_COOP * energiaRecibida;

    // 4.5 SUBTOTAL BÁSICO CON
    const subtotalBasicoCon = 
      parse(formData.cargoComercial) +
      parse(formData.cargoCapPico) +
      parse(formData.cargoCapFueraPico) +
      parse(formData.cargoCapPotencia) +
      parse(formData.tarifaPico) +
      tarifaRestoCon +
      parse(formData.tarifaValle) +
      parse(formData.recargoFactorPotencia) -
      reconCoop;

    // 4.6 IMPUESTOS CON
    const impuestosCon = (subtotalBasicoCon * 0.03) + (fiscalInfo.iva * (subtotalBasicoCon + parse(formData.cuotaCAP)));

    // 4.7 SUBTOTAL GENERAL CON
    const subtotalGeneralCon = subtotalBasicoCon + impuestosCon;

    // 4.8 RECONOCIMIENTO GSF (Interno)
    const reconGSF = Math.abs (TARIFA_RECON_GSF * energiaGenerada);

    // 4.9 TOTAL CON
    const totalCon = (subtotalBasicoCon + impuestosCon - reconGSF) * (1 + fiscalInfo.perc);

    // 5. RESULTADOS / AHORROS
    const ahorroTotal = parse(formData.totalInput) - totalCon;
    const ahorroAutoconsumo = subtotalBasicoSin - subtotalBasicoCon - reconCoop;
    const ahorroImpuestos = (parse(formData.subtotalGeneralInput) - subtotalBasicoSin) - impuestosCon;
    const ahorroReconocimientos = reconCoop + reconGSF;

    // 6. IMPACTO AMBIENTAL
    const co2Evitado = energiaGenerada * 0.2306;
    const arboles = co2Evitado / (10/12);

    return {
      subtotalBasicoSin,
      energiaGenerada,
      energiaRecibida,
      tarifaRestoCon,
      reconCoop,
      subtotalBasicoCon,
      impuestosCon,
      subtotalGeneralCon,
      reconGSF,
      totalCon,
      ahorroTotal,
      ahorroAutoconsumo,
      ahorroImpuestos,
      ahorroReconocimientos,
      co2Evitado,
      arboles
    };
  }, [formData, fiscalInfo]);

  const handleInputChange = (field: keyof LocalFormData, value: string) => {
    if (field === 'fiscalCondition') {
      setFormData(prev => ({ ...prev, [field]: value as FiscalCondition }));
    } else {
      const parsed = value === "" ? "" : parseFloat(value);
      setFormData(prev => ({ ...prev, [field]: parsed }));
    }
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

      pdf.save('resultados-gran-demanda.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  const inputClass = "w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all bg-white shadow-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tight";
  const sectionClass = "bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn";
  const subTitleClass = "text-md font-black text-purple-600 uppercase tracking-widest border-l-4 border-purple-500 pl-4 mb-4 mt-8";

  if (showResults) {
    const savingsTotal = Math.max(0.0001, results.ahorroTotal);
    const pAuto = Math.max(0, (results.ahorroAutoconsumo / savingsTotal) * 100);
    const pImp = Math.max(0, (results.ahorroImpuestos / savingsTotal) * 100);
    const pRec = Math.max(0, (results.ahorroReconocimientos / savingsTotal) * 100);

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
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Resultados Gran Demanda</h2>
          </div>
        </div>

        <div className="text-center bg-purple-50 p-4 rounded-2xl border border-purple-100">
          <p className="text-xs font-black text-purple-800 uppercase tracking-widest">Potencia maxima de instalacion</p>
          <p className="text-2xl font-black text-purple-600">{Number(formData.pvPower).toFixed(2)} kW</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Factura Sin Programa</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(parse(formData.totalInput))}</p>
          </div>
          <div className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] p-6 rounded-3xl shadow-xl text-center text-white">
            <p className="text-purple-100 text-[10px] font-black uppercase mb-1 tracking-widest">Factura Con Prosumidores 4.0</p>
            <p className="text-3xl font-bold">{formatCurrency(results.totalCon)}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <h3 className="text-xl font-black text-slate-800 mb-8 uppercase italic tracking-tighter">
            AHORRO TOTAL ESTIMADO: {formatCurrency(results.ahorroTotal)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium italic">Ahorro por autoconsumo</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroAutoconsumo)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium italic">Ahorro por impuestos</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroImpuestos)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium italic">Ahorro por reconocimientos</span>
                <span className="font-bold text-slate-800">{formatCurrency(results.ahorroReconocimientos)}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 36 36" className="w-44 h-44 drop-shadow-md">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#9333ea" strokeWidth="3" strokeDasharray={`${Math.round(pAuto)}, 100`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray={`${Math.round(pImp)}, 100`} strokeDashoffset={`-${Math.round(pAuto)}`} />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${Math.round(pRec)}, 100`} strokeDashoffset={`-${Math.round(pAuto + pImp)}`} />
              </svg>
              <div className="mt-4 flex gap-4 text-[9px] font-black uppercase text-slate-400">
                <span className="flex items-center"><div className="w-2 h-2 bg-purple-600 mr-1"></div> {Math.round(pAuto)}% Auto.</span>
                <span className="flex items-center"><div className="w-2 h-2 bg-blue-600 mr-1"></div> {Math.round(pImp)}% Imp.</span>
                <span className="flex items-center"><div className="w-2 h-2 bg-emerald-500 mr-1"></div> {Math.round(pRec)}% Rec.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 italic">Eficiencia Energética</h3>
            <div className="space-y-4">
              <div>
                <p className="flex justify-between text-[10px] font-bold mb-1 uppercase"><span>Porcentaje de autoconsumo</span> <span>{Math.round(safeDiv(results.energiaGenerada - results.energiaRecibida, results.energiaGenerada) * 100)}%</span></p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-purple-600 h-full" style={{width: `${safeDiv(results.energiaGenerada - results.energiaRecibida, results.energiaGenerada) * 100}%`}}></div></div>
              </div>
              <div>
                <p className="flex justify-between text-[10px] font-bold mb-1 uppercase"><span>Porcentaje de generación con respecto al consumo</span> <span>{Math.round(safeDiv(results.energiaGenerada, (parse(formData.consPico) + parse(formData.consResto) + parse(formData.consValle))) * 100)}%</span></p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{width: `${safeDiv(results.energiaGenerada, (parse(formData.consPico) + parse(formData.consResto) + parse(formData.consValle))) * 100}%`}}></div></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 italic">Impacto Ambiental Positivo</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-slate-500 text-[8px] font-black uppercase mb-1">CO2 Evitado (Mes)</p>
                <p className="text-xl font-bold text-purple-400">{(results.co2Evitado).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kg</span></p>
              </div>
              <div>
                <p className="text-slate-500 text-[8px] font-black uppercase mb-1">Árboles eq.</p>
                <p className="text-xl font-bold text-emerald-400">{Math.ceil(results.arboles)}</p>
              </div>
            </div>
          </div>
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

      <div className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest italic">Simulación No Prosumidor - Gran Demanda</span>
        </div>
      </div>

      {/* Condición Fiscal */}
      <div className={sectionClass}>
        <h3 className="text-lg font-black text-purple-600 border-b pb-2 mb-4 italic uppercase tracking-tighter">CONDICIÓN FISCAL</h3>
        <div>
          <label className={labelClass}>¿Cuál es tu condición fiscal? *</label>
          <select 
            className={inputClass} 
            value={formData.fiscalCondition} 
            onChange={(e) => handleInputChange('fiscalCondition', e.target.value)}
          >
            <option value="">Seleccione condición fiscal...</option>
            {Object.values(FiscalCondition).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {formData.fiscalCondition && (
            <div className="mt-4 bg-purple-50 p-6 rounded-2xl border border-purple-100 animate-fadeIn">
              <p className="text-[11px] font-black text-purple-700 uppercase tracking-widest">{fiscalInfo.label}</p>
              <p className="text-[11px] font-black text-purple-500 uppercase tracking-widest mt-1">Autoconsumo estimado aplicado: 35%</p>
            </div>
          )}
        </div>
      </div>

      {/* Potencia / Consumos */}
      <div className={sectionClass}>
        <h3 className="text-lg font-black text-purple-600 border-b pb-2 mb-4 italic uppercase tracking-tighter">POTENCIA Y CONSUMO (kWh)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Potencia de la instalación fotovoltaica (kW)</label>
            <input type="number" step="any" className={inputClass} value={formData.pvPower} onChange={(e) => handleInputChange('pvPower', e.target.value)} placeholder="Ej: 50" />
          </div>
          <div>
            <label className={labelClass}>Consumo Horario pico (kWh)</label>
            <input type="number" step="any" className={inputClass} value={formData.consPico} onChange={(e) => handleInputChange('consPico', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Consumo Horario resto (kWh)</label>
            <input type="number" step="any" className={inputClass} value={formData.consResto} onChange={(e) => handleInputChange('consResto', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Consumo Horario valle (kWh)</label>
            <input type="number" step="any" className={inputClass} value={formData.consValle} onChange={(e) => handleInputChange('consValle', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Importes */}
      <div className={sectionClass}>
        <h3 className="text-lg font-black text-purple-600 border-b pb-2 mb-4 italic uppercase tracking-tighter">DETALLE DE IMPORTES ($)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className={labelClass}>Cargo Comercial</label><input type="number" className={inputClass} value={formData.cargoComercial} onChange={(e) => handleInputChange('cargoComercial', e.target.value)} /></div>
          <div><label className={labelClass}>Cargo Cap. Suministro horario pico</label><input type="number" className={inputClass} value={formData.cargoCapPico} onChange={(e) => handleInputChange('cargoCapPico', e.target.value)} /></div>
          <div><label className={labelClass}>Cargo Cap. Suministro horario fuera de pico</label><input type="number" className={inputClass} value={formData.cargoCapFueraPico} onChange={(e) => handleInputChange('cargoCapFueraPico', e.target.value)} /></div>
          <div><label className={labelClass}>Cargo Cap. potencia adquirida</label><input type="number" className={inputClass} value={formData.cargoCapPotencia} onChange={(e) => handleInputChange('cargoCapPotencia', e.target.value)} /></div>
          <div><label className={labelClass}>Tarifa eléctrica horario pico</label><input type="number" className={inputClass} value={formData.tarifaPico} onChange={(e) => handleInputChange('tarifaPico', e.target.value)} /></div>
          <div><label className={labelClass}>Tarifa eléctrica resto, sin prosumidor</label><input type="number" className={inputClass} value={formData.tarifaRestoSin} onChange={(e) => handleInputChange('tarifaRestoSin', e.target.value)} /></div>
          <div><label className={labelClass}>Precio unitario resto ($/kWh)</label><input type="number" step="any" className={inputClass} value={formData.precioUnitarioResto} onChange={(e) => handleInputChange('precioUnitarioResto', e.target.value)} /></div>
          <div><label className={labelClass}>Tarifa eléctrica horario valle</label><input type="number" className={inputClass} value={formData.tarifaValle} onChange={(e) => handleInputChange('tarifaValle', e.target.value)} /></div>
          <div><label className={labelClass}>Recargo por factor de potencia</label><input type="number" className={inputClass} value={formData.recargoFactorPotencia} onChange={(e) => handleInputChange('recargoFactorPotencia', e.target.value)} /></div>
          <div><label className={labelClass}>Cuota de Alumbrado Público C.A.P</label><input type="number" className={inputClass} value={formData.cuotaCAP} onChange={(e) => handleInputChange('cuotaCAP', e.target.value)} /></div>
          <div><label className={labelClass}>Subtotal General de la Factura ($)</label><input type="number" className={inputClass} value={formData.subtotalGeneralInput} onChange={(e) => handleInputChange('subtotalGeneralInput', e.target.value)} /></div>
          <div className="md:col-span-2">
            <label className={`${labelClass} text-purple-600`}>TOTAL A PAGAR DE LA FACTURA ($) *</label>
            <input type="number" className={`${inputClass} border-purple-600 bg-purple-50 font-black text-xl`} value={formData.totalInput} onChange={(e) => handleInputChange('totalInput', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-10">
        <button 
          onClick={() => {
            if (!formData.fiscalCondition || parse(formData.totalInput) <= 0) {
              alert("Por favor complete la condición fiscal y el total a pagar.");
              return;
            }
            setShowResults(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-black py-6 px-20 rounded-full shadow-2xl transition-all uppercase tracking-widest text-lg"
        >
          Calcular
        </button>
      </div>
    </div>
  );
};

export default NotProsumerLargeDemandFlow;
