
import React, { useState } from 'react';
import { FormData, UserType, FixedCharge, EnergyBand } from '../types';

interface Props {
  initialData: FormData;
  onSubmit: (data: FormData) => void;
  onBack: () => void;
}

const SmallDemandForm: React.FC<Props> = ({ initialData, onSubmit, onBack }) => {
  const [data, setData] = useState<FormData>(initialData);
  const [showFixedCharges, setShowFixedCharges] = useState(false);
  const [showEnergyBands, setShowEnergyBands] = useState(true);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let finalValue: number | "" = "";
    if (value !== "") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        // All fields except fixed charges (handled elsewhere) should be non-negative
        finalValue = Math.max(0, parsed);
      }
    }
    setData(prev => ({ ...prev, [field]: finalValue }));
  };

  const addFixedCharge = () => {
    const newCharge: FixedCharge = { id: Date.now().toString(), amount: "" };
    setData(prev => ({ ...prev, fixedCharges: [...prev.fixedCharges, newCharge] }));
  };

  const removeFixedCharge = (id: string) => {
    setData(prev => ({ ...prev, fixedCharges: prev.fixedCharges.filter(c => c.id !== id) }));
  };

  const updateFixedCharge = (id: string, value: string) => {
    setData(prev => ({
      ...prev,
      fixedCharges: prev.fixedCharges.map(c => 
        c.id === id ? { 
          ...c, 
          // Fixed charges can be negative
          amount: value === "" ? "" : parseFloat(value) 
        } : c
      )
    }));
  };

  const addEnergyBand = () => {
    const newBand: EnergyBand = { id: Date.now().toString(), kwh: "", amount: "" };
    setData(prev => ({ ...prev, energyBands: [...prev.energyBands, newBand] }));
  };

  const removeEnergyBand = (id: string) => {
    if (data.energyBands.length > 1) {
      setData(prev => ({ ...prev, energyBands: prev.energyBands.filter(b => b.id !== id) }));
    }
  };

  const updateEnergyBand = (id: string, field: 'kwh' | 'amount', value: string) => {
    setData(prev => ({
      ...prev,
      energyBands: prev.energyBands.map(b => 
        b.id === id ? { 
          ...b, 
          [field]: value === "" ? "" : Math.max(0, parseFloat(value)) 
        } : b
      )
    }));
  };

  const validateAndSubmit = () => {
    const totalToPayVal = data.totalToPay === "" ? 0 : Number(data.totalToPay);
    if (totalToPayVal <= 0) {
      alert("El TOTAL A PAGAR debe ser mayor a 0 para realizar el cálculo.");
      return;
    }
    onSubmit(data);
  };

  const inputClass = "w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";
  const sectionClass = "bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4";
  const h3Class = "text-lg font-bold text-slate-800 border-b pb-2 mb-4";

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className="text-right">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">Paso 3 de 4</span>
        </div>
      </div>

      {/* User Category */}
      <div className={sectionClass}>
        <div>
          <label className={labelClass}>Tipo de Usuario</label>
          <select 
            className={inputClass}
            value={data.userType || ''}
            onChange={(e) => setData(prev => ({ ...prev, userType: e.target.value as UserType }))}
          >
            <option value={UserType.RESIDENTIAL}>Residencial</option>
            <option value={UserType.COMMERCIAL}>Comercial</option>
            <option value={UserType.INDUSTRIAL}>Industrial</option>
          </select>
        </div>
      </div>

      {/* Consumption Details */}
      <div className={sectionClass}>
        <h3 className={h3Class}>DETALLE DE SU CONSUMO (kWh)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Energía Generada (X)</label>
            <input 
              type="number" 
              step="any"
              placeholder="0.00"
              className={inputClass}
              value={data.energyGenerated}
              onChange={(e) => handleInputChange('energyGenerated', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Energía Inyectada (I)</label>
            <input 
              type="number" 
              step="any"
              placeholder="0.00"
              className={inputClass}
              value={data.energyInjected}
              onChange={(e) => handleInputChange('energyInjected', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Energía Entregada (C)</label>
            <input 
              type="number" 
              step="any"
              placeholder="0.00"
              className={inputClass}
              value={data.energyDelivered}
              onChange={(e) => handleInputChange('energyDelivered', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className={sectionClass}>
        <h3 className={h3Class}>DETALLE DE SU FACTURA</h3>
        
        {/* Fixed Charges Section */}
        <div className="border rounded-lg overflow-hidden mb-4">
          <button 
            type="button"
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            onClick={() => setShowFixedCharges(!showFixedCharges)}
          >
            <span className="font-semibold text-slate-700">Cargos fijos</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showFixedCharges ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFixedCharges && (
            <div className="p-4 space-y-3 bg-white border-t">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Importe ($)</div>
              {data.fixedCharges.map((charge) => (
                <div key={charge.id} className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Importe ($)"
                    className={`${inputClass} flex-1`}
                    value={charge.amount}
                    onChange={(e) => updateFixedCharge(charge.id, e.target.value)}
                  />
                  <button 
                    onClick={() => removeFixedCharge(charge.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                    title="Eliminar cargo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button 
                onClick={addFixedCharge}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center"
              >
                + Agregar Cargo
              </button>
            </div>
          )}
        </div>

        {/* Energy Recognition */}
        <div className="mb-6">
          <label className={labelClass}>Reconocimiento por beneficio ambiental ($)</label>
          <input 
            type="number" 
            step="any"
            placeholder="0.00"
            className={inputClass}
            value={data.environmentalBenefit}
            onChange={(e) => handleInputChange('environmentalBenefit', e.target.value)}
          />
        </div>

        {/* Energy Bands Section */}
        <div className="border rounded-lg overflow-hidden">
          <button 
            type="button"
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            onClick={() => setShowEnergyBands(!showEnergyBands)}
          >
            <span className="font-semibold text-slate-700">Bandas de Energía</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showEnergyBands ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showEnergyBands && (
            <div className="p-4 space-y-3 bg-white border-t">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400 uppercase">
                <span>Energía (kWh)</span>
                <span>Importe ($)</span>
              </div>
              {data.energyBands.map((band) => (
                <div key={band.id} className="flex gap-2 items-center">
                  <input 
                    type="number"
                    step="any"
                    placeholder="kWh"
                    className={inputClass}
                    value={band.kwh}
                    onChange={(e) => updateEnergyBand(band.id, 'kwh', e.target.value)}
                  />
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Importe"
                    className={inputClass}
                    value={band.amount}
                    onChange={(e) => updateEnergyBand(band.id, 'amount', e.target.value)}
                  />
                  <button 
                    onClick={() => removeEnergyBand(band.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                    title="Eliminar banda"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button 
                onClick={addEnergyBand}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center"
              >
                + Agregar Banda
              </button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className={labelClass}>Subtotal Energía Eléctrica ($)</label>
            <input 
              type="number" 
              step="any"
              placeholder="0.00"
              className={inputClass}
              value={data.subtotalEnergyElectric}
              onChange={(e) => handleInputChange('subtotalEnergyElectric', e.target.value)}
            />
          </div>
          <div>
            <label className={`${labelClass} text-blue-700`}>TOTAL A PAGAR ($) *</label>
            <input 
              type="number" 
              step="any"
              placeholder="0.00"
              className={`${inputClass} border-blue-300 bg-blue-50 font-bold`}
              value={data.totalToPay}
              onChange={(e) => handleInputChange('totalToPay', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Taxes Section */}
      <div className={sectionClass}>
        <h3 className={h3Class}>IMPUESTOS / GRAVÁMENES</h3>
        <div>
          <label className={labelClass}>Subtotal Impuestos/Gravámenes Energía Eléctrica ($)</label>
          <input 
            type="number" 
            step="any"
            placeholder="0.00"
            className={inputClass}
            value={data.subtotalTaxes}
            onChange={(e) => handleInputChange('subtotalTaxes', e.target.value)}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={validateAndSubmit}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 uppercase tracking-widest text-lg"
        >
          Calcular
        </button>
      </div>
    </div>
  );
};

export default SmallDemandForm;
