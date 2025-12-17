import { useState } from 'react';
import { Shield, Lock, Cpu, Activity, Key, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [publicKey, setPublicKey] = useState<string>('');
  const [sharedSecret, setSharedSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const generateKeys = async () => {
    setLoading(true);
    try {
      addLog("Initializing Kyber-1024 Key Generation...");
      const res = await axios.post(`${API_URL}/api/quantum/keys`);
      setPublicKey(res.data.public_key);
      addLog("✅ KeyPair Generated Successfully.");
      addLog(`🔑 Public Key (truncated): ${res.data.public_key.substring(0, 32)}...`);
    } catch (err) {
      addLog("❌ Error generating keys");
    }
    setLoading(false);
  };

  const simulateHandshake = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      addLog("🔄 Simulating Client Encapsulation...");
      const encRes = await axios.post(`${API_URL}/api/quantum/encapsulate`, publicKey, { headers: { 'Content-Type': 'application/json' } });
      addLog("📦 Ciphertext created.");
      
      addLog("🔓 Decapsulating on Server...");
      const decRes = await axios.post(`${API_URL}/api/quantum/decapsulate`, { ciphertext: encRes.data.ciphertext });
      
      setSharedSecret(decRes.data.shared_secret);
      addLog("✅ Handshake Complete. Secure Channel Established.");
      addLog(`🔐 Shared Secret: ${decRes.data.shared_secret.substring(0, 32)}...`);
    } catch (err) {
      addLog("❌ Handshake failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-quantum-dark p-8 font-sans">
      <header className="flex items-center justify-between mb-12 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <Shield className="text-quantum-light w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-white">QS Security System</h1>
            <p className="text-gray-400 text-sm">Hybrid Post-Quantum Cryptography Testbed</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-quantum-success bg-green-900/20 px-3 py-1 rounded-full border border-green-900">
          <Activity size={16} />
          <span className="text-xs font-mono">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Cpu className="text-quantum-accent" /> Quantum Operations
            </h2>
            
            <div className="space-y-4">
              <button 
                onClick={generateKeys}
                disabled={loading}
                className="w-full bg-quantum-light/10 hover:bg-quantum-light/20 text-quantum-light border border-quantum-light/50 p-4 rounded-lg flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-3"><Key /> Generate Kyber-1024 Keys</span>
                {loading && <RefreshCw className="animate-spin" />}
              </button>

              <button 
                onClick={simulateHandshake}
                disabled={!publicKey || loading}
                className={`w-full p-4 rounded-lg flex items-center justify-between transition-all border ${!publicKey ? 'opacity-50 cursor-not-allowed bg-gray-800 border-gray-700' : 'bg-quantum-success/10 hover:bg-quantum-success/20 text-quantum-success border-quantum-success/50'}`}
              >
                <span className="flex items-center gap-3"><Lock /> Simulate Quantum Handshake</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-gray-400 text-sm mb-1">Algorithm</div>
              <div className="text-xl font-mono text-white">CRYSTALS-Kyber</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-gray-400 text-sm mb-1">Security Level</div>
              <div className="text-xl font-mono text-quantum-success">NIST Level 5</div>
            </div>
          </div>
        </div>

        {/* Terminal / Logs */}
        <div className="bg-black rounded-xl border border-gray-800 p-4 font-mono text-sm h-[500px] overflow-y-auto shadow-inner">
          <div className="text-gray-500 mb-2">root@quantum-server:~$ monitor_security_events</div>
          {logs.length === 0 && <div className="text-gray-600 italic">Waiting for operations...</div>}
          {logs.map((log, i) => (
            <div key={i} className="mb-1 text-green-400 border-l-2 border-green-900 pl-2">
              {log}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
