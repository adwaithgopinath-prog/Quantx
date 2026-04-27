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

  // Remove forcing of .NS since symbols may be global (e.g. AAPL) or crypto (e.g. BTC)
  const setSymbolWithSuffix = (sym) => {
    if (typeof sym !== 'string') return;
    setActiveSymbol(sym);
  };

  return (
    <SymbolContext.Provider value={{ activeSymbol, setActiveSymbol: setSymbolWithSuffix }}>
      {children}
    </SymbolContext.Provider>
  );
};
