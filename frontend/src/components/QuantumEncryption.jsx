import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Key, Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw, Fingerprint, Cpu, Timer, LogIn } from 'lucide-react';

function generateFakeKey(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateEncryptionLog() {
  const events = [
    'SESSION_KEY_ROTATED', 'ZK_PROOF_VERIFIED', 'ORDER_PAYLOAD_ENCRYPTED',
    'AES-256-GCM: OK', 'RSA-4096 SIGNATURE: VALID', 'TLS 1.3 HANDSHAKE',
    'MFA_TOKEN_ISSUED', 'STORAGE_SEALED', 'AUDIT_LOG_COMMITTED',
    'ENTROPY_POOL_REFRESHED',
  ];
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    event: events[Math.floor(Math.random() * events.length)],
    ts: new Date(Date.now() - i * 12000).toLocaleTimeString('en-IN', { hour12: false }),
    status: Math.random() > 0.05 ? 'OK' : 'WARN',
  }));
}

function HexMatrix() {
  const [chars, setChars] = useState(() =>
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setChars(prev => {
        const next = [...prev];
        for (let i = 0; i < 4; i++) {
          next[Math.floor(Math.random() * next.length)] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        }
        return next;
      });
    }, 150);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-mono text-[9px] text-[#00e676] opacity-20 grid grid-cols-8 gap-1 select-none leading-4">
      {chars.map((c, i) => <span key={i}>{c}</span>)}
    </div>
  );
}

function SessionTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className="font-mono text-[#00e676]">{m}:{s}</span>;
}

export default function QuantumEncryption() {
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Alpha Vantage', key: generateFakeKey(32), visible: false, status: 'ACTIVE' },
    { id: 2, name: 'Polygon.io', key: generateFakeKey(40), visible: false, status: 'ACTIVE' },
    { id: 3, name: 'OpenAI GPT-4', key: generateFakeKey(51), visible: false, status: 'ACTIVE' },
    { id: 4, name: 'PRAW Reddit', key: generateFakeKey(27), visible: false, status: 'INACTIVE' },
  ]);
  const [encLog] = useState(generateEncryptionLog());
  const [mfaStep, setMfaStep] = useState(0);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState(false);
  const [sessionStart] = useState(Date.now() - 12 * 60 * 1000);
  const [rotatingKey, setRotatingKey] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(30 * 60);

  const toggleKeyVisibility = (id) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, visible: !k.visible } : k));
  };

  const rotateKey = (id) => {
    setRotatingKey(id);
    setTimeout(() => {
      setApiKeys(prev => prev.map(k => k.id === id ? { ...k, key: generateFakeKey(k.key.length) } : k));
      setRotatingKey(null);
    }, 800);
  };

  const handleMFA = () => {
    if (mfaCode.length === 6) {
      setMfaSuccess(true);
    }
  };

  // Countdown session timer
  useEffect(() => {
    const id = setInterval(() => setSessionExpiry(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const securityChecks = [
    { label: 'End-to-End Encryption', status: 'ACTIVE', icon: Lock, color: '#00e676' },
    { label: 'Zero-Knowledge Proof', status: 'VERIFIED', icon: Fingerprint, color: '#00e676' },
    { label: 'TLS 1.3 Transport', status: 'SECURE', icon: Shield, color: '#00e676' },
    { label: 'AES-256-GCM Storage', status: 'SEALED', icon: Cpu, color: '#00e676' },
    { label: 'Multi-Factor Auth', status: mfaSuccess ? 'PASSED' : 'PENDING', icon: Key, color: mfaSuccess ? '#00e676' : '#ff9800' },
    { label: 'Session Security', status: sessionExpiry > 0 ? 'LIVE' : 'EXPIRED', icon: Timer, color: sessionExpiry > 300 ? '#00e676' : '#ff9800' },
  ];

  const expM = Math.floor(sessionExpiry / 60).toString().padStart(2, '0');
  const expS = (sessionExpiry % 60).toString().padStart(2, '0');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00e676]/10 border border-[#00e676]/30 rounded-lg flex items-center justify-center">
            <Lock size={18} className="text-[#00e676]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white font-[Space_Grotesk]">Quantum Encryption Layer</h2>
            <p className="text-[10px] text-[#8a9ab5] font-mono">E2E · ZK-Proofs · AES-256 · MFA · Secure Session</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#00e676]/10 border border-[#00e676]/30 rounded-lg text-[9px] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
            <span className="text-[#00e676]">SECURE SESSION</span>
          </div>
          <div className="px-3 py-2 bg-[#0d0f12] border border-[#1e2333] rounded-lg text-[9px] font-mono">
            <span className="text-[#8a9ab5]">EXPIRES: </span>
            <span className={sessionExpiry < 300 ? 'text-[#ff9800]' : 'text-[#00e676]'}>{expM}:{expS}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Security Status */}
        <div className="xl:col-span-4 space-y-4">
          {/* Security Checks */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <HexMatrix />
            </div>
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield size={12} className="text-[#00e676]" /> Security Status
              </div>
              <div className="space-y-3">
                {securityChecks.map((check, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#0d0f12] rounded-lg border border-[#1e2333]">
                    <div className="flex items-center gap-2">
                      <check.icon size={14} style={{ color: check.color }} />
                      <span className="text-[10px] text-white font-bold">{check.label}</span>
                    </div>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded"
                      style={{ color: check.color, background: `${check.color}20`, border: `1px solid ${check.color}30` }}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Timer size={12} className="text-[#ff9800]" /> Session Details
            </div>
            <div className="space-y-3">
              {[
                { label: 'Session Duration', val: <SessionTimer startTime={sessionStart} /> },
                { label: 'IP Address', val: '192.168.*.***' },
                { label: 'Device', val: 'Chrome / Windows' },
                { label: 'Encryption', val: 'AES-256-GCM' },
                { label: 'Key Derivation', val: 'PBKDF2-SHA256' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[#1e2333]/50 pb-2">
                  <span className="text-[9px] text-[#8a9ab5] font-bold uppercase">{item.label}</span>
                  <span className="text-[10px] text-white font-mono">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: API Key Manager + MFA */}
        <div className="xl:col-span-5 space-y-4">
          {/* API Key Manager */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Key size={12} className="text-[var(--color-gold)]" /> Encrypted API Key Vault
            </div>
            <div className="space-y-3">
              {apiKeys.map(k => (
                <div key={k.id} className={`p-4 rounded-lg border ${k.status === 'ACTIVE' ? 'border-[#1e2333]' : 'border-[#ff4444]/20 opacity-60'} bg-[#0d0f12]`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${k.status === 'ACTIVE' ? 'bg-[#00e676]' : 'bg-[#ff4444]'}`} />
                      <span className="text-xs font-bold text-white">{k.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${k.status === 'ACTIVE' ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#ff4444]/20 text-[#ff4444]'}`}>{k.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#141720] rounded border border-[#1e2333] p-2">
                    <code className="flex-1 text-[9px] font-mono text-[#8a9ab5] truncate">
                      {k.visible ? k.key : '•'.repeat(Math.min(k.key.length, 32))}
                    </code>
                    <button onClick={() => toggleKeyVisibility(k.id)} className="text-[#8a9ab5] hover:text-white transition-colors">
                      {k.visible ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => rotateKey(k.id)} disabled={rotatingKey === k.id}
                      className="text-[#8a9ab5] hover:text-[var(--color-gold)] transition-colors">
                      <RefreshCw size={12} className={rotatingKey === k.id ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MFA Panel */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Fingerprint size={12} className="text-[#a855f7]" /> Multi-Factor Authentication
            </div>
            {mfaSuccess ? (
              <div className="flex items-center gap-3 p-4 bg-[#00e676]/5 border border-[#00e676]/20 rounded-lg">
                <CheckCircle size={20} className="text-[#00e676]" />
                <div>
                  <div className="text-xs font-bold text-[#00e676]">MFA Verified Successfully</div>
                  <div className="text-[9px] text-[#8a9ab5] font-mono mt-0.5">Session elevated to Level 2 clearance</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-[#8a9ab5] font-mono">Enter the 6-digit TOTP code from your authenticator app to unlock advanced features.</p>
                <div className="flex gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex-1 h-10 bg-[#0d0f12] border border-[#1e2333] rounded-lg flex items-center justify-center text-sm font-bold text-[#00e676] font-mono">
                      {mfaCode[i] || ''}
                    </div>
                  ))}
                </div>
                <input type="text" maxLength={6} value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-[#0d0f12] border border-[#1e2333] text-white font-mono text-sm p-3 rounded-lg focus:outline-none focus:border-[#a855f7] transition-colors text-center tracking-[0.5em]"
                  placeholder="000000" />
                <button onClick={handleMFA} disabled={mfaCode.length !== 6}
                  className="w-full py-3 bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7] rounded-lg text-xs font-bold uppercase hover:bg-[#a855f7]/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  <LogIn size={14} /> VERIFY TOKEN
                </button>
                <p className="text-[8px] text-[#8a9ab5] text-center font-mono opacity-60">Tip: type any 6 digits for demo</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Encryption Log */}
        <div className="xl:col-span-3">
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 h-full">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu size={12} className="text-[#00e676]" /> Encryption Audit Log
            </div>
            <div className="space-y-2 font-mono text-[9px]">
              {encLog.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 p-2 rounded border border-[#1e2333]/50 bg-[#0d0f12]">
                  <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${entry.status === 'OK' ? 'bg-[#00e676]' : 'bg-[#ff9800]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">{entry.event}</div>
                    <div className="text-[#8a9ab5] flex justify-between">
                      <span>{entry.ts}</span>
                      <span className={entry.status === 'OK' ? 'text-[#00e676]' : 'text-[#ff9800]'}>{entry.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-[#0d0f12] border border-[#1e2333] rounded-lg">
              <div className="text-[8px] text-[#8a9ab5] font-bold uppercase mb-2">Encryption Metrics</div>
              <div className="space-y-1.5 text-[9px] font-mono">
                <div className="flex justify-between"><span className="text-[#8a9ab5]">Algorithm</span><span className="text-[#00e676]">AES-256-GCM</span></div>
                <div className="flex justify-between"><span className="text-[#8a9ab5]">Key Size</span><span className="text-[#00e676]">256-bit</span></div>
                <div className="flex justify-between"><span className="text-[#8a9ab5]">ZK Scheme</span><span className="text-[#00e676]">Groth16</span></div>
                <div className="flex justify-between"><span className="text-[#8a9ab5]">Rotations/hr</span><span className="text-[#00e676]">12</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
