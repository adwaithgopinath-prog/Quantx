import React from 'react';

export default function TickerStrip() {
  const instruments = [
    { s: 'RELIANCE', p: '2987.50', c: '+1.2%' },
    { s: 'TCS', p: '4120.00', c: '-0.5%' },
    { s: 'HDFCBANK', p: '1432.10', c: '+0.8%' },
    { s: 'INFY', p: '1650.30', c: '+2.1%' },
    { s: 'ICICIBANK', p: '1080.45', c: '-1.1%' },
    { s: 'SBI', p: '760.20', c: '+3.4%' },
    { s: 'AAPL', p: '178.50', c: '+0.4%' },
    { s: 'MSFT', p: '415.20', c: '+1.5%' },
    { s: 'TSLA', p: '202.10', c: '-2.3%' },
    { s: 'NVDA', p: '880.60', c: '+4.2%' },
    { s: 'BTC', p: '71000.00', c: '+5.6%' },
    { s: 'ETH', p: '3800.50', c: '+4.1%' },
    // duplicates for seamless scroll
    { s: 'RELIANCE', p: '2987.50', c: '+1.2%' },
    { s: 'TCS', p: '4120.00', c: '-0.5%' },
    { s: 'HDFCBANK', p: '1432.10', c: '+0.8%' },
    { s: 'INFY', p: '1650.30', c: '+2.1%' },
  ];

  return (
    <div className="fixed top-[60px] left-0 z-[90] w-full bg-[var(--color-gold)] text-[#060810] border-y border-[var(--color-gold-light)] overflow-hidden h-[32px] flex items-center">
       <div className="animate-ticker py-2">
         {instruments.map((item, i) => (
            <div key={i} className="flex gap-2 items-center mx-6 font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
               <span>{item.s}</span>
               <span>{item.p}</span>
               <span className={item.c.startsWith('+') ? 'text-green-900 border border-green-900/30 px-1 rounded' : 'text-red-900 border border-red-900/30 px-1 rounded'}>
                 {item.c}
               </span>
               <span className="mx-4 text-black/20">|</span>
            </div>
         ))}
       </div>
    </div>
  );
}
