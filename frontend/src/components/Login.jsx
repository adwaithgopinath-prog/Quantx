import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060810] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#141720] border border-white/5 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold uppercase tracking-widest font-[Syne]">Quant<span className="text-[#C9A84C]">X</span></h1>
          <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-mono">Institutional Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e2333] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#C9A84C]/50 outline-none transition-all"
              placeholder="name@institution.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 ml-1">Secure Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e2333] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#C9A84C]/50 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#C9A84C] hover:bg-[#d4b765] text-black font-bold uppercase text-xs tracking-[0.2em] py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(201,168,76,0.2)] active:scale-95"
          >
            Authenticate
          </button>
        </form>

        <p className="text-center text-gray-600 text-[10px] uppercase tracking-widest mt-8 font-mono">
          New terminal? <Link to="/register" className="text-[#C9A84C] hover:underline">Request Credentials</Link>
        </p>
      </motion.div>
    </div>
  );
}
