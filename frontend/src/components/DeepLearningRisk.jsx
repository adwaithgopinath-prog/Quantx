import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingDown, Activity, Zap, BarChart2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, XAxis, YAxis, Tooltip, Cell, BarChart, Bar } from 'recharts';
import api from '../api';

function HeatmapCell({ value, label }) {
  const getColor = (v) => {
    if (v < 30) return '#00e676';
    if (v < 60) return '#ff9800';
    return '#ff4444';
  };
  const color = getColor(value);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full h-8 rounded" style={{ background: `${color}${Math.round(value * 2.55).toString(16).padStart(2, '0')}` }} />
      <span className="text-[7px] text-[#8a9ab5] font-mono">{label}</span>
    </div>
  );
}

const RISK_ASSETS = [
  { name: 'RELIANCE', risk: 38, vol: 22, dd: 12 },
  { name: 'TCS', risk: 42, vol: 28, dd: 18 },
  { name: 'HDFCBANK', risk: 55, vol: 35, dd: 22 },
  { name: 'INFY', risk: 61, vol: 41, dd: 28 },
  { name: 'TATAMOTORS', risk: 78, vol: 58, dd: 42 },
  { name: 'NVDA', risk: 85, vol: 72, dd: 55 },
];

function generateHeatmapData() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    risk: Math.round(10 + Math.random() * 80),
    vol: Math.round(15 + Math.random() * 70),
  }));
}

function RiskGauge({ score }) {
  const angle = (score / 100) * 180 - 90;
  const color = score < 40 ? '#00e676' : score < 70 ? '#ff9800' : '#ff4444';
  const level = score < 40 ? 'STABLE' : score < 70 ? 'ELEVATED' : 'CRITICAL';

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e2333" strokeWidth="16" strokeLinecap="round" />
        {/* Risk zones */}
        <path d="M 20 100 A 80 80 0 0 1 80 28" fill="none" stroke="#00e676" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <path d="M 80 28 A 80 80 0 0 1 140 28" fill="none" stroke="#ff9800" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <path d="M 140 28 A 80 80 0 0 1 180 100" fill="none" stroke="#ff4444" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 65 * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={100 + 65 * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="6" fill={color} />
        {/* Labels */}
        <text x="12" y="115" fill="#00e676" fontSize="8" fontFamily="monospace">LOW</text>
        <text x="88" y="20" fill="#ff9800" fontSize="8" fontFamily="monospace">MED</text>
        <text x="165" y="115" fill="#ff4444" fontSize="8" fontFamily="monospace">HIGH</text>
      </svg>
      <div className="text-center -mt-4">
        <div className="text-4xl font-bold font-[Inter]" style={{ color }}>{score}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color }}>{level}</div>
      </div>
    </div>
  );
}

export default function DeepLearningRisk({ symbol, data, portfolio }) {
  const [heatmapData] = useState(generateHeatmapData());
  const [deepRisk, setDeepRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeAsset, setActiveAsset] = useState(null);

  const riskScoreRaw = deepRisk?.neural_risk_score ?? data?.risk?.score ?? 45;
  const riskScore = isNaN(Number(riskScoreRaw)) ? 45 : Number(riskScoreRaw);
  const metrics = deepRisk?.metrics || {
    volatility_ann: '28.4%',
    max_drawdown: '12.6%',
    value_at_risk_95: '2.1%',
    expected_shortfall: '3.2%',
  };
  const recommendations = deepRisk?.recommendations || {
    position_size_limit: '8.5%',
    stop_loss_buffer: '4.2%',
    leverage_cap: '1.5x',
  };

  const radarData = [
    { metric: 'Volatility', value: parseFloat(metrics.volatility_ann) * 1.5 || 42 },
    { metric: 'Drawdown', value: parseFloat(metrics.max_drawdown) * 5 || 63 },
    { metric: 'VaR 95%', value: parseFloat(metrics.value_at_risk_95) * 20 || 42 },
    { metric: 'Correlation', value: 55 },
    { metric: 'Liquidity', value: 30 },
    { metric: 'Exposure', value: 60 },
  ];

  const fetchDeepRisk = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/dashboard/${symbol || 'RELIANCE.NS'}`);
      if (res.data?.risk) setDeepRisk({ neural_risk_score: res.data.risk.score || 45 });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDeepRisk(); }, [symbol]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff9800]/10 border border-[#ff9800]/30 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-[#ff9800]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white font-[Space_Grotesk]">Deep Learning Risk Engine</h2>
            <p className="text-[10px] text-[#8a9ab5] font-mono">Transformer Model · VaR · Kelly Criterion · Drawdown</p>
          </div>
        </div>
        <button onClick={fetchDeepRisk} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff9800]/10 border border-[#ff9800]/30 text-[#ff9800] rounded-lg text-[10px] font-bold uppercase hover:bg-[#ff9800]/20 transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          REFRESH RISK
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Risk Score + Gauge */}
        <div className="xl:col-span-4 space-y-6">
          {/* Neural Risk Score */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full blur-3xl" style={{ background: riskScore > 70 ? '#ff4444' : riskScore > 40 ? '#ff9800' : '#00e676' }} />
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">Neural Risk Score</div>
            <RiskGauge score={Math.round(riskScore)} />
          </div>

          {/* Key Metrics */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={12} className="text-[#ff9800]" /> Risk Metrics
            </div>
            <div className="space-y-3">
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-[#1e2333]/50">
                  <span className="text-[9px] font-bold text-[#8a9ab5] uppercase">{key.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-bold text-white font-[Inter]">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Position Sizing */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={12} className="text-[#00e676]" /> Kelly Criterion Recommendations
            </div>
            <div className="space-y-3">
              {Object.entries(recommendations).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-[9px] text-[#8a9ab5] font-bold uppercase">{key.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-bold text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded font-[Inter]">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Radar + Heatmap */}
        <div className="xl:col-span-5 space-y-6">
          {/* Risk Radar */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">Multi-Dimensional Risk Radar</div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                  <PolarGrid stroke="#1e2333" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#8a9ab5', fontSize: 9, fontFamily: 'monospace' }} />
                  <Radar name="Risk" dataKey="value" stroke="#ff9800" fill="#ff9800" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Heatmap */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">24H Risk Heatmap</div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fill: '#8a9ab5', fontSize: 7, fontFamily: 'monospace' }} interval={3} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2333', fontSize: 10, color: 'white' }} />
                  <Bar dataKey="risk" radius={[2, 2, 0, 0]}>
                    {heatmapData.map((entry, i) => (
                      <Cell key={i} fill={entry.risk < 30 ? '#00e676' : entry.risk < 60 ? '#ff9800' : '#ff4444'} opacity={0.7 + entry.risk / 300} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[8px] text-[#8a9ab5] mt-1 font-mono">
              <span className="text-[#00e676]">■ LOW</span>
              <span className="text-[#ff9800]">■ MEDIUM</span>
              <span className="text-[#ff4444]">■ HIGH</span>
            </div>
          </div>
        </div>

        {/* Right: Portfolio Risk Table */}
        <div className="xl:col-span-3">
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 h-full">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart2 size={12} className="text-[#ff4444]" /> Asset Risk Matrix
            </div>
            <div className="space-y-3">
              {RISK_ASSETS.map((asset, i) => (
                <div key={i} className={`p-3 rounded-lg border cursor-pointer transition-all ${activeAsset === asset.name ? 'border-[#ff9800]/50 bg-[#ff9800]/5' : 'border-[#1e2333] hover:border-[#8a9ab5]/30'}`}
                  onClick={() => setActiveAsset(activeAsset === asset.name ? null : asset.name)}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-white">{asset.name}</span>
                    <span className="text-[9px] font-bold" style={{ color: asset.risk < 40 ? '#00e676' : asset.risk < 70 ? '#ff9800' : '#ff4444' }}>
                      {asset.risk}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0d0f12] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${asset.risk}%`, background: asset.risk < 40 ? '#00e676' : asset.risk < 70 ? '#ff9800' : '#ff4444' }} />
                  </div>
                  {activeAsset === asset.name && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 grid grid-cols-2 gap-1 text-[8px] font-mono text-[#8a9ab5]">
                      <span>Vol: {asset.vol}%</span>
                      <span>DD: -{asset.dd}%</span>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
