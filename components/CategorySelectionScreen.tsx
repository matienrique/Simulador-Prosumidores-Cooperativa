
import React from 'react';
import { UserCategory } from '../types';

interface Props {
  onSelect: (category: UserCategory) => void;
  onBack: () => void;
}

const CategorySelectionScreen: React.FC<Props> = ({ onSelect, onBack }) => {
  const categories = [
    {
      id: UserCategory.RESIDENTIAL,
      title: "Usuario Residencial",
      desc: "Consumo hogareño estándar.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: "blue"
    },
    {
      id: UserCategory.COMMERCIAL,
      title: "Usuario Comercial",
      desc: "Locales de venta al público y oficinas.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: "emerald"
    },
    {
      id: UserCategory.INDUSTRIAL,
      title: "Usuario Industrial",
      desc: "Pequeñas y medianas industrias.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.31a2 2 0 01-1.782 0l-.691-.31a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-1.091 1.091a2 2 0 000 2.828l1.091 1.091a2 2 0 001.022.547l2.387.477a6 6 0 003.86-.517l.691-.31a2 2 0 011.782 0l.691.31a6 6 0 003.86.517l2.387-.477a2 2 0 001.022-.547l1.091-1.091a2 2 0 000-2.828l-1.091-1.091z" />
        </svg>
      ),
      color: "orange"
    },
    {
      id: UserCategory.LARGE_DEMAND,
      title: "Usuario Gran Demanda",
      desc: "Consumos intensivos de alta tensión.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "purple"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald': return "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500";
      case 'orange': return "bg-orange-50 text-orange-600 group-hover:bg-orange-500";
      case 'purple': return "bg-purple-50 text-purple-600 group-hover:bg-purple-500";
      default: return "bg-blue-50 text-blue-600 group-hover:bg-blue-500";
    }
  };

  const getBorderClasses = (color: string) => {
    switch (color) {
      case 'emerald': return "hover:border-emerald-500";
      case 'orange': return "hover:border-orange-500";
      case 'purple': return "hover:border-purple-500";
      default: return "hover:border-blue-500";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-10 animate-fadeIn">
      <button 
        onClick={onBack}
        className="self-start text-slate-400 hover:text-slate-800 flex items-center transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Categoría de Usuario</h2>
        <p className="text-slate-500 text-lg">Seleccione el perfil que mejor describa su unidad de consumo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`group flex flex-col items-center p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-sm transition-all duration-300 ${getBorderClasses(cat.color)} hover:shadow-xl hover:-translate-y-1`}
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${getColorClasses(cat.color)} group-hover:text-white`}>
              {cat.icon}
            </div>
            <span className="text-xl font-bold text-slate-800 text-center mb-2">{cat.title}</span>
            <p className="text-xs text-slate-400 text-center leading-relaxed">{cat.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelectionScreen;
