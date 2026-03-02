
import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber } from '../services/calculatorService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  onBack: () => void;
}

enum FiscalCondition {
  RI = 'Responsable Inscripto',
  RI_AGENTE = 'Responsable Inscripto Agente Percepción',
  EXENTO = 'Exento'
}

interface LocalFormData {
  // Fiscal
  fiscalCondition: FiscalCondition | '';
  // Pesos
  cargoComercial: number | "";
  cargoCapPico: number | "";
  cargoCapFueraPico: number | "";
  cargoCapPotenciaAdquirida: number | "";
  tarifaPico: number | "";
  tarifaResto: number | "";
  tarifaValle: number | "";
  bonifFactorPotencia: number | "";
  reconCoopRenovable: number | "";
  subtotalBasico: number | "";
  subtotalGeneral: number | "";
  reconGSFPymes: number | "";
  totalAPagar: number | "";
  ley12692: number | "";
  // Energía Entregada
  entregadaPico: number | "";
  entregadaResto: number | "";
  entregadaValle: number | "";
  // Generación
  generadaPico: number | "";
  generadaResto: number | "";
  generadaValle: number | "";
  // Energía Recibida
  recibidaPico: number | "";
  recibidaResto: number | "";
  recibidaValle: number | "";
}

const LargeDemandProsumerFlow: React.FC<Props> = ({ onBack }) => {
  const [showResults, setShowResults] = useState(false);
  const [showAux, setShowAux] = useState(false);

  const [formData, setFormData] = useState<LocalFormData>({
    fiscalCondition: '',
    cargoComercial: "",
    cargoCapPico: "",
    cargoCapFueraPico: "",
    cargoCapPotenciaAdquirida: "",
    tarifaPico: "",
    tarifaResto: "",
    tarifaValle: "",
    bonifFactorPotencia: "",
    reconCoopRenovable: "",
    subtotalBasico: "",
    subtotalGeneral: "",
    reconGSFPymes: "",
    totalAPagar: "",
    ley12692: "",
    entregadaPico: "",
    entregadaResto: "",
    entregadaValle: "",
    generadaPico: "",
    generadaResto: "",
    generadaValle: "",
    recibidaPico: "",
    recibidaResto: "",
    recibidaValle: "",
  });

  const fiscalInfo = useMemo(() => {
    switch (formData.fiscalCondition) {
      case FiscalCondition.RI:
        return { iva: 0.27, perc: 0.03, label: "IVA: 27% | Percepción: 3%" };
      case FiscalCondition.RI_AGENTE:
        return { iva: 0.27, perc: 0, label: "IVA: 27% | Percepción: 0%" };
      case FiscalCondition.EXENTO:
        return { iva: 0.21, perc: 0, label: "IVA: 21% | Percepción: 0%" };
      default:
        return { iva: 0, perc: 0, label: "" };
    }
  }, [formData.fiscalCondition]);

  const parse = (val: number | ""): number => (val === "" ? 0 : Number(val));
  const safeDiv = (a: number, b: number): number => (b === 0 ? 0 : a / b);

  const results = useMemo(() => {
    // 1. Consumos
    const consumoPico = parse(formData.entregadaPico) + parse(formData.generadaPico) - parse(formData.recibidaPico);
    const consumoResto = parse(formData.entregadaResto) + parse(formData.generadaResto) - parse(formData.recibidaResto);
    const consumoValle = parse(formData.entregadaValle) + parse(formData.generadaValle) - parse(formData.recibidaValle);

    // 2. Precio unitario resto
    const precioUnitarioResto = safeDiv(parse(formData.tarifaResto), parse(formData.entregadaResto));

    // 3. Tarifa resto sin pros
    const tarifaRestoSinPros = precioUnitarioResto * consumoResto;

    // 4. Subtotal Básico sin pros
    const subtotalBasicoSinPros = 
      parse(formData.cargoComercial) +
      parse(formData.cargoCapPico) +
      parse(formData.cargoCapFueraPico) +
      parse(formData.cargoCapPotenciaAdquirida) +
      parse(formData.tarifaPico) +
      tarifaRestoSinPros +
      parse(formData.bonifFactorPotencia) +
      parse(formData.tarifaValle);

    // 5. Impuestos sin pros
    const impuestosSinPros = subtotalBasicoSinPros * (0.03 + fiscalInfo.iva) + parse(formData.ley12692);

    // 6. Subtotal General SIN
    const subtotalGeneralSin = subtotalBasicoSinPros + impuestosSinPros;

    // 7. TOTAL FACTURA sin prosumidores
    const totalFacturaSinPros = (subtotalBasicoSinPros + impuestosSinPros) * (1 + fiscalInfo.perc);

    // 8. Ahorros
    const ahorroTotal = totalFacturaSinPros - parse(formData.totalAPagar);
    const ahorroAutoconsumo = subtotalBasicoSinPros - (parse(formData.subtotalBasico) - parse(formData.reconCoopRenovable));
    const impuestosConPros = parse(formData.subtotalGeneral) - parse(formData.subtotalBasico);
    const ahorroImpuestos = impuestosSinPros - impuestosConPros;
    const ahorroReconocimientos = Math.abs (parse(formData.reconCoopRenovable) + parse(formData.reconGSFPymes));

    // 9. Impacto Ambiental
    const energiaGeneradaTotal = parse(formData.generadaPico) + parse(formData.generadaResto) + parse(formData.generadaValle);
    const co2Evitado = energiaGeneradaTotal * 0.2306;
    const arboles = safeDiv(co2Evitado, (10/12));

    return {
      consumoPico, consumoResto, consumoValle,
      precioUnitarioResto, tarifaRestoSinPros,
      subtotalBasicoSinPros, impuestosSinPros, subtotalGeneralSin,
      totalFacturaSinPros, ahorroTotal, ahorroAutoconsumo, ahorroImpuestos,
      ahorroReconocimientos, energiaGeneradaTotal, co2Evitado, arboles
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

      pdf.save('resultados-prosumidor-gran-demanda.pdf');
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
    const pAuto = (results.ahorroAutoconsumo / savingsTotal) * 100;
    const pImp = (results.ahorroImpuestos / savingsTotal) * 100;
    const pRec = (results.ahorroReconocimientos / savingsTotal) * 100;

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
            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Resultados Gran Demanda</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Factura sin Programa Prosumidores</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(results.totalFacturaSinPros)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Factura como Prosumidor</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(parse(formData.totalAPagar))}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] p-6 rounded-3xl shadow-xl text-center text-white mt-6">
            <p className="text-purple-100 text-[10px] font-black uppercase mb-1">Ahorro mensual estimado</p>
            <p className="text-3xl font-bold">{formatCurrency(results.ahorroTotal)}</p>
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

        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-center">
          <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 italic">Impacto Ambiental Positivo</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-slate-500 text-[8px] font-black uppercase mb-1">Generada Total</p><p className="text-xl font-bold">{results.energiaGeneradaTotal.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kWh</span></p></div>
            <div><p className="text-slate-500 text-[8px] font-black uppercase mb-1">CO₂ evitado en el presente mes</p><p className="text-xl font-bold text-purple-400">{(results.co2Evitado).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kg</span></p></div>
            <div><p className="text-slate-500 text-[8px] font-black uppercase mb-1">Árboles equivalentes</p><p className="text-xl font-bold text-emerald-400">{Math.ceil(results.arboles)}</p></div>
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

      <div className="bg-gradient-to-r from-[#FF5F6D] to-[#B83AF3] p-6 rounded-3xl text-white flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest italic">Soy Prosumidor - Gran Demanda</span>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-purple-600 border-b pb-2 mb-4 italic uppercase tracking-tighter">CONDICIÓN FISCAL</h3>
        <div>
          <label className={labelClass}>¿Cuál es tu condición fiscal? *</label>
          <select 
            className={inputClass} 
            value={formData.fiscalCondition} 
            onChange={(e) => handleInputChange('fiscalCondition', e.target.value)}
          >
            <option value="">Seleccione...</option>
            {Object.values(FiscalCondition).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {formData.fiscalCondition && (
            <div className="mt-3 bg-purple-50 p-4 rounded-xl border border-purple-100 text-[10px] font-black text-purple-700 uppercase tracking-widest animate-fadeIn">
              {fiscalInfo.label}
            </div>
          )}
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-lg font-black text-purple-600 border-b pb-2 mb-4 italic uppercase tracking-tighter">IMPORTES DE LA FACTURA ($)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className={labelClass}>Cuota de servicio (Cargo Comercial)</label><input type="number" className={inputClass} value={formData.cargoComercial} onChange={(e) => handleInputChange('cargoComercial', e.target.value)} /></div>
          <div><label className={labelClass}>Cargo Cap. Suministro horario pico</label><input type="number" className={inputClass} value={formData.cargoCapPico} onChange={(e) => handleInputChange('cargoCapPico', e.target.value)} /></div>
          <div><label className={labelClass}>Cargo Cap. Suministro fuera de pico</label><input type="number" className={inputClass} value={formData.cargoCapFueraPico} onChange={(e) => handleInputChange('cargoCapFueraPico', e.target.value)} /></div>
          <div><label className={labelClass}>Cargo Cap. potencia adquirida</label><input type="number" className={inputClass} value={formData.cargoCapPotenciaAdquirida} onChange={(e) => handleInputChange('cargoCapPotenciaAdquirida', e.target.value)} /></div>
          <div><label className={labelClass}>Tarifa eléctrica horario pico</label><input type="number" className={inputClass} value={formData.tarifaPico} onChange={(e) => handleInputChange('tarifaPico', e.target.value)} /></div>
          <div><label className={labelClass}>Tarifa eléctrica horario resto</label><input type="number" className={inputClass} value={formData.tarifaResto} onChange={(e) => handleInputChange('tarifaResto', e.target.value)} /></div>
          <div><label className={labelClass}>Tarifa eléctrica horario valle</label><input type="number" className={inputClass} value={formData.tarifaValle} onChange={(e) => handleInputChange('tarifaValle', e.target.value)} /></div>
          <div><label className={labelClass}>Bonificación por factor de potencia</label><input type="number" className={inputClass} value={formData.bonifFactorPotencia} onChange={(e) => handleInputChange('bonifFactorPotencia', e.target.value)} /></div>
          <div><label className={labelClass}>Reconocimiento Cooperativa a energía renovable recibida</label><input type="number" className={inputClass} value={formData.reconCoopRenovable} onChange={(e) => handleInputChange('reconCoopRenovable', e.target.value)} /></div>
          <div><label className={labelClass}>Subtotal Básico</label><input type="number" className={inputClass} value={formData.subtotalBasico} onChange={(e) => handleInputChange('subtotalBasico', e.target.value)} /></div>
          <div><label className={labelClass}>Subtotal General</label><input type="number" className={inputClass} value={formData.subtotalGeneral} onChange={(e) => handleInputChange('subtotalGeneral', e.target.value)} /></div>
          <div><label className={labelClass}>Reconocimiento GSF a energía renovable generada a PYMES</label><input type="number" className={inputClass} value={formData.reconGSFPymes} onChange={(e) => handleInputChange('reconGSFPymes', e.target.value)} /></div>
          <div><label className={labelClass}>Ley N° 12692 ($)</label><input type="number" className={inputClass} value={formData.ley12692} onChange={(e) => handleInputChange('ley12692', e.target.value)} /></div>
          <div className="md:col-span-2"><label className={`${labelClass} text-purple-600`}>TOTAL A PAGAR *</label><input type="number" className={`${inputClass} border-purple-600 bg-purple-50 font-black text-xl`} value={formData.totalAPagar} onChange={(e) => handleInputChange('totalAPagar', e.target.value)} /></div>
        </div>

        <h4 className={subTitleClass}>ENERGÍA ENTREGADA POR LA COOP. AL USUARIO (kWh)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className={labelClass}>Horario pico</label><input type="number" className={inputClass} value={formData.entregadaPico} onChange={(e) => handleInputChange('entregadaPico', e.target.value)} /></div>
          <div><label className={labelClass}>Horario resto</label><input type="number" className={inputClass} value={formData.entregadaResto} onChange={(e) => handleInputChange('entregadaResto', e.target.value)} /></div>
          <div><label className={labelClass}>Horario valle</label><input type="number" className={inputClass} value={formData.entregadaValle} onChange={(e) => handleInputChange('entregadaValle', e.target.value)} /></div>
        </div>

        <h4 className={subTitleClass}>GENERACIÓN RENOVABLE (kWh)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className={labelClass}>Horario pico</label><input type="number" className={inputClass} value={formData.generadaPico} onChange={(e) => handleInputChange('generadaPico', e.target.value)} /></div>
          <div><label className={labelClass}>Horario resto</label><input type="number" className={inputClass} value={formData.generadaResto} onChange={(e) => handleInputChange('generadaResto', e.target.value)} /></div>
          <div><label className={labelClass}>Horario valle</label><input type="number" className={inputClass} value={formData.generadaValle} onChange={(e) => handleInputChange('generadaValle', e.target.value)} /></div>
        </div>

        <h4 className={subTitleClass}>ENERGÍA RECIBIDA POR LA COOP. (kWh)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className={labelClass}>Horario pico</label><input type="number" className={inputClass} value={formData.recibidaPico} onChange={(e) => handleInputChange('recibidaPico', e.target.value)} /></div>
          <div><label className={labelClass}>Horario resto</label><input type="number" className={inputClass} value={formData.recibidaResto} onChange={(e) => handleInputChange('recibidaResto', e.target.value)} /></div>
          <div><label className={labelClass}>Horario valle</label><input type="number" className={inputClass} value={formData.recibidaValle} onChange={(e) => handleInputChange('recibidaValle', e.target.value)} /></div>
        </div>
      </div>

      <div className="flex justify-center pt-10">
        <button 
          onClick={() => {
            if (!formData.fiscalCondition || parse(formData.totalAPagar) <= 0) {
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

export default LargeDemandProsumerFlow;
