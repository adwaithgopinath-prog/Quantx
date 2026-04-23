import React, { createContext, useContext, useState, useEffect } from 'react';

const SymbolContext = createContext();

export const useSymbol = () => {
  const context = useContext(SymbolContext);
  if (!context) {
    throw new Error('useSymbol must be used within a SymbolProvider');
  }
  return context;
};

export const SymbolProvider = ({ children }) => {
  const [activeSymbol, setActiveSymbol] = useState('RELIANCE.NS');

  // Handle case where symbol might be passed without .NS
  const setSymbolWithSuffix = (sym) => {
    if (typeof sym !== 'string') return;
    const formatted = sym.endsWith('.NS') ? sym : `${sym.toUpperCase()}.NS`;
    setActiveSymbol(formatted);
  };

  return (
    <SymbolContext.Provider value={{ activeSymbol, setActiveSymbol: setSymbolWithSuffix }}>
      {children}
    </SymbolContext.Provider>
  );
};
