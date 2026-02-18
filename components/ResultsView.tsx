
import React, { useState } from 'react';
import { CalculationResults, FormData } from '../types';
import { formatCurrency, formatNumber } from '../services/calculatorService';

interface Props {
  results: CalculationResults;
  formData: FormData;
  onRestart: () => void;
  onBack: () => void;
}

const ResultsView: React.FC<Props> = ({ results, formData, onRestart, onBack }) => {
  const [showAux, setShowAux] = useState(false);
  const [showFullLog, setShowFullLog] = useState(false);

  const cardClass = "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm";
  const labelClass = "text-sm text-slate-500 font-medium";

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Resultados del Cálculo</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 flex items-center font-semibold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Formulario
          </button>
          <button 
            onClick={onRestart}
            className="text-slate-500 hover:text-slate-800 flex items-center font-semibold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nueva Simulación
          </button>
        </div>
      </div>

      {/* Main Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardClass}>
          <p className={labelClass}>Factura con Prosumidores 4.0</p>
          <p className="text-2xl font-bold text-slate-600">{formatCurrency(Number(formData.totalToPay))}</p>
        </div>
        <div className={cardClass}>
          <p className={labelClass}>Factura sin Prosumidores 4.0</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(results.totalAPagarSin)}</p>
        </div>
        <div className={`${cardClass} bg-green-50 border-green-200`}>
          <p className="text-sm text-green-700 font-bold uppercase tracking-wider">Ahorro Mensual</p>
          <p className="text-3xl font-extrabold text-green-600">{formatCurrency(results.ahorroTotal)}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className={cardClass}>
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <span className="w-1 h-6 bg-blue-600 rounded mr-3"></span>
          Desglose de Ahorro Mensual Estimado
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-slate-600">Ahorro por autoconsumo</span>
            <span className="font-bold text-slate-800">{formatCurrency(results.ahorroAutoconsumo)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-slate-600">Ahorro por impuestos</span>
            <span className="font-bold text-slate-800">{formatCurrency(results.ahorroImpuestos)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-slate-600">Ahorro por reconocimientos</span>
            <span className="font-bold text-slate-800">{formatCurrency(results.ahorroReconocimientos)}</span>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="text-lg font-bold text-slate-800">Ahorro Final Programa</span>
            <span className="text-lg font-black text-green-600">{formatCurrency(results.ahorroTotal)}</span>
          </div>
        </div>
      </div>

      {/* Efficiency & Environmental */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-tight">Eficiencia Energética</h3>
          <div className="space-y-4">
            <div>
              <p className={labelClass}>Energía Autoconsumida / Generada</p>
              <div className="w-full bg-slate-100 rounded-full h-4 mt-1">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, results.eficienciaAutoconsumo)}%` }}
                ></div>
              </div>
              <p className="text-right text-sm font-bold mt-1 text-blue-600">{Math.round(results.eficienciaAutoconsumo)}%</p>
            </div>
            <div>
              <p className={labelClass}>Energía Inyectada / Generada</p>
              <div className="w-full bg-slate-100 rounded-full h-4 mt-1">
                <div 
                  className="bg-emerald-500 h-4 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, results.eficienciaInyeccion)}%` }}
                ></div>
              </div>
              <p className="text-right text-sm font-bold mt-1 text-emerald-600">{Math.round(results.eficienciaInyeccion)}%</p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} bg-slate-900 text-white`}>
          <h3 className="text-lg font-bold mb-4 flex items-center text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a3 3 0 013 3V16.5m-3-12.5A9 9 0 113.055 11z" />
            </svg>
            IMPACTO AMBIENTAL POSITIVO
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Energía Generada</p>
                <p className="text-2xl font-bold">{formatNumber(Number(formData.energyGenerated))} <span className="text-sm font-normal text-slate-400">kWh</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter">CO2 Evitado</p>
                <p className="text-2xl font-bold text-green-400">{formatNumber(results.co2Evitado)} <span className="text-sm font-normal text-slate-400">kg/mes</span></p>
              </div>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-center space-x-4">
              <div className="text-3xl">🌳</div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Equivalente a</p>
                <p className="text-lg font-bold">{Math.ceil(results.arbolesEquivalentes)} árboles plantados / mes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Calculations */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button 
          onClick={() => setShowAux(!showAux)}
          className="w-full p-4 flex items-center justify-between font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>CÁLCULOS AUXILIARES</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${showAux ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAux && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 border-t text-sm bg-slate-50">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 italic">kWh de última banda con:</span>
              <span className="font-mono font-semibold">{formatNumber(results.kWhUltimaBandaCon)} kWh</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 italic">kWh de última banda sin:</span>
              <span className="font-mono font-semibold">{formatNumber(results.kWhUltimaBandaSin)} kWh</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 italic">Prop. Impuestos / Total Coop Con:</span>
              <span className="font-mono font-semibold">{formatNumber(results.proporcionImpuestosTotalCon * 100)} %</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 italic">Autoconsumo:</span>
              <span className="font-mono font-semibold">{formatNumber(results.autoconsumo)} kWh</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 italic">Subtotal Energía Eléc. Coop,Sin:</span>
              <span className="font-mono font-semibold">{formatCurrency(results.subtotalEnergySin)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 italic">Factura sin Prosumidores 4.0:</span>
              <span className="font-mono font-semibold">{formatCurrency(results.totalAPagarSin)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Full Calculation Log */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button 
          onClick={() => setShowFullLog(!showFullLog)}
          className="w-full p-4 flex items-center justify-between font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <span>Ver todos los cálculos (Variables Internas)</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${showFullLog ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showFullLog && (
          <div className="p-6 border-t bg-slate-900 text-green-400 font-mono text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap space-y-2">
{`// CONFIGURACIÓN DE ENTRADA
- Tipo Usuario: ${formData.userType}
- Prop. Impuestos/Total Sin Pros (Ref): ${results.propSinPros.toFixed(4)}

// VALORES DE CONSUMO
- Energía Generada (X): ${formData.energyGenerated} kWh
- Energía Inyectada (I): ${formData.energyInjected} kWh
- Energía Entregada (C): ${formData.energyDelivered} kWh

// VARIABLES INTERMEDIAS
- Autoconsumo (X - I): ${results.autoconsumo.toFixed(2)} kWh
- kWh de última banda con: ${results.kWhUltimaBandaCon.toFixed(2)} kWh
- kWh de última banda sin: ${results.kWhUltimaBandaSin.toFixed(2)} kWh
- Prop. Impuestos Total Con: ${results.proporcionImpuestosTotalCon.toFixed(4)}

// RESULTADOS FINALES
- Subtotal Energía Sin: ${results.subtotalEnergySin.toFixed(4)}
- Factura sin Prosumidores 4.0: ${results.totalAPagarSin.toFixed(4)}
- Factura con Prosumidores 4.0: ${parseVal(formData.totalToPay).toFixed(4)}
- Ahorro Total: ${results.ahorroTotal.toFixed(4)}
- Ahorro Autoconsumo: ${results.ahorroAutoconsumo.toFixed(4)}
- Ahorro Impuestos: ${results.ahorroImpuestos.toFixed(4)}
- Ahorro Reconocimientos: ${results.ahorroReconocimientos.toFixed(4)}`}
            </pre>
          </div>
        )}
      </div>

      <div className="text-center pt-6">
        <p className="text-slate-400 text-xs italic">Los valores presentados son estimaciones basadas en los parámetros de la Cooperativa Eléctrica y el Programa Prosumidores 4.0 de la provincia de Santa Fe.</p>
      </div>
    </div>
  );
};

// Local utility for logging
const parseVal = (val: number | ""): number => {
  if (val === "" || isNaN(Number(val))) return 0;
  return Number(val);
};

export default ResultsView;
