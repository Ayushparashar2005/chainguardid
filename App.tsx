import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Database, 
  Users, 
  AlertTriangle, 
  Play, 
  Lock, 
  Server,
  Terminal
} from 'lucide-react';
import { AccessLog, AccessStatus, Block, GENESIS_HASH, ViewState } from './types';
import { BlockchainVisualizer } from './components/BlockchainVisualizer';
import { NetworkStats } from './components/NetworkStats';
import { analyzeSecurityLogs } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

// --- Utility Functions for Simulation ---

const generateHash = async (str: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const mockUsers = [
  { id: 'sys_admin_01', name: 'System Admin', role: 'ADMIN', authorized: true },
  { id: 'net_eng_04', name: 'Network Engineer', role: 'USER', authorized: true },
  { id: 'guest_user_a', name: 'Guest A', role: 'GUEST', authorized: false },
  { id: 'unknown_proxy', name: 'Unknown', role: 'GUEST', authorized: false },
];

const mockIPs = [
  '192.168.1.10', '10.0.0.55', '172.16.254.1', '45.22.11.90', '203.0.113.42'
];

const MAX_BLOCK_SIZE = 5;

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [chain, setChain] = useState<Block[]>([]);
  const [pendingLogs, setPendingLogs] = useState<AccessLog[]>([]);
  const [allLogs, setAllLogs] = useState<AccessLog[]>([]);
  const [isMining, setIsMining] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Identity Verification Portal State
  const [verifyUserId, setVerifyUserId] = useState('');
  const [verifyResult, setVerifyResult] = useState<{status: string, msg: string} | null>(null);

  // Initialize Genesis Block
  useEffect(() => {
    const initChain = async () => {
      const genesisBlock: Block = {
        index: 0,
        timestamp: Date.now(),
        data: [],
        previousHash: "0",
        hash: GENESIS_HASH,
        nonce: 0
      };
      setChain([genesisBlock]);
    };
    initChain();
  }, []);

  // Mining / Block Creation Logic
  const mineBlock = useCallback(async () => {
    if (pendingLogs.length === 0 || isMining) return;
    
    setIsMining(true);
    const previousBlock = chain[chain.length - 1];
    const logsToMine = pendingLogs.slice(0, MAX_BLOCK_SIZE);
    
    // Simple Proof of Work simulation (just finding a hash starting with '0')
    // In a real app, this would be much harder
    let nonce = 0;
    let hash = '';
    let found = false;
    
    const blockDataString = JSON.stringify(logsToMine) + previousBlock.hash + Date.now();
    
    // Simulate calculation delay for effect
    await new Promise(r => setTimeout(r, 800));

    while (!found && nonce < 10000) {
       hash = await generateHash(blockDataString + nonce);
       // For demo, just accept any hash to be fast, or require one '0'
       if (hash.startsWith('0')) {
         found = true;
       } else {
         nonce++;
       }
    }

    const newBlock: Block = {
      index: chain.length,
      timestamp: Date.now(),
      data: logsToMine,
      previousHash: previousBlock.hash,
      hash: hash,
      nonce: nonce
    };

    setChain(prev => [...prev, newBlock]);
    setPendingLogs(prev => prev.slice(logsToMine.length));
    setIsMining(false);
  }, [chain, pendingLogs, isMining]);

  // Auto-mine if pending logs exist
  useEffect(() => {
    if (pendingLogs.length > 0 && !isMining) {
        // Auto mine every 3 seconds if there is data
        const timer = setTimeout(() => {
            mineBlock();
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [pendingLogs, isMining, mineBlock]);

  const addAccessLog = (log: AccessLog) => {
    setPendingLogs(prev => [log, ...prev]);
    setAllLogs(prev => [log, ...prev]);
  };

  const handleSimulateTraffic = () => {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const randomIP = mockIPs[Math.floor(Math.random() * mockIPs.length)];
      // 10% chance of a "brute force" or weird attempt simulation
      const isSuspicious = Math.random() < 0.1;
      
      const status = (randomUser.authorized && !isSuspicious) ? AccessStatus.GRANTED : AccessStatus.DENIED;
      
      const newLog: AccessLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        userId: isSuspicious ? 'unknown_attacker' : randomUser.id,
        ipAddress: randomIP,
        action: 'NETWORK_LOGIN',
        status: status,
        signature: 'sig_' + Math.random().toString(36).substring(7)
      };
      
      // Add slight delay for realism
      setTimeout(() => addAccessLog(newLog), i * 500);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const user = mockUsers.find(u => u.id === verifyUserId);
    const isAuthorized = user?.authorized || false;
    
    const newLog: AccessLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        userId: verifyUserId || 'anonymous',
        ipAddress: '127.0.0.1',
        action: 'MANUAL_PORTAL_LOGIN',
        status: isAuthorized ? AccessStatus.GRANTED : AccessStatus.DENIED,
        signature: 'portal_' + Date.now()
    };

    addAccessLog(newLog);
    setVerifyResult({
        status: isAuthorized ? 'SUCCESS' : 'FAILURE',
        msg: isAuthorized ? 'Identity Verified. Access Granted.' : 'Identity Verification Failed. Access Denied.'
    });
    setVerifyUserId('');
    
    // Clear result after 3s
    setTimeout(() => setVerifyResult(null), 3000);
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    const report = await analyzeSecurityLogs(chain);
    setAiAnalysis(report);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <ShieldCheck className="text-cyan-400" size={28} />
          <h1 className="text-xl font-bold tracking-tight text-white">ChainGuard<span className="text-cyan-400">ID</span></h1>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setView('DASHBOARD')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'DASHBOARD' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-900' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setView('BLOCKCHAIN')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'BLOCKCHAIN' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-900' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Database size={20} />
            <span>Blockchain Explorer</span>
          </button>
          <button 
            onClick={() => setView('VERIFY')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'VERIFY' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-900' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={20} />
            <span>Identity Portal</span>
          </button>
          <button 
            onClick={() => setView('AI_ANALYSIS')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'AI_ANALYSIS' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-900' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <AlertTriangle size={20} />
            <span>AI Threat Analysis</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs">
                <div className="flex justify-between text-slate-500 mb-2">
                    <span>Network Status</span>
                    <span className="flex items-center text-green-400">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                        Online
                    </span>
                </div>
                <div className="flex justify-between text-slate-500">
                    <span>Chain Height</span>
                    <span className="text-white font-mono">{chain.length}</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-lg font-medium text-slate-200">
                {view === 'DASHBOARD' && 'Network Overview'}
                {view === 'BLOCKCHAIN' && 'Immutable Audit Log'}
                {view === 'VERIFY' && 'Access Control Portal'}
                {view === 'AI_ANALYSIS' && 'Intelligent Threat Detection'}
            </h2>
            
            <div className="flex items-center space-x-4">
                <button 
                    onClick={handleSimulateTraffic}
                    disabled={isMining}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play size={16} className="text-cyan-400" />
                    <span>Simulate Traffic</span>
                </button>
            </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            
            {view === 'DASHBOARD' && (
                <div className="max-w-6xl mx-auto animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Server size={64} />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Total Access Logs</p>
                            <h3 className="text-3xl font-bold text-white mt-2">{allLogs.length}</h3>
                            <div className="mt-2 text-xs text-cyan-400"> recorded on-chain</div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Lock size={64} />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Security Violations</p>
                            <h3 className="text-3xl font-bold text-red-400 mt-2">
                                {allLogs.filter(l => l.status === AccessStatus.DENIED).length}
                            </h3>
                            <div className="mt-2 text-xs text-slate-400">blocked attempts</div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Database size={64} />
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Pending Block</p>
                            <h3 className="text-3xl font-bold text-cyan-400 mt-2">{pendingLogs.length}</h3>
                            <div className="mt-2 text-xs text-slate-400">transactions in mempool</div>
                        </div>
                    </div>

                    <NetworkStats logs={allLogs} />

                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-200">Live Access Feed</h3>
                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Real-time</span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
                            {allLogs.length === 0 && (
                                <div className="p-8 text-center text-slate-600">
                                    No activity detected. Click "Simulate Traffic" to generate logs.
                                </div>
                            )}
                            {allLogs.map((log) => (
                                <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-lg ${log.status === 'GRANTED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {log.status === 'GRANTED' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{log.userId}</p>
                                            <p className="text-xs text-slate-500 font-mono">{log.ipAddress}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${log.status === 'GRANTED' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                            {log.status}
                                        </span>
                                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'BLOCKCHAIN' && (
                <div className="h-full flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Blockchain Ledger</h2>
                        <p className="text-slate-400">Visual representation of the immutable access log chain.</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-slate-950/50 border border-slate-800 rounded-xl p-4 overflow-hidden relative">
                        {/* Background grid effect */}
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.2 }}></div>
                        
                        <div className="relative w-full overflow-x-auto">
                            <BlockchainVisualizer chain={chain} />
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="bg-slate-900 p-4 rounded border border-slate-800">
                             <h4 className="text-xs text-slate-500 uppercase">Consensus Mechanism</h4>
                             <p className="text-slate-300 font-mono mt-1">Proof of Work (Simulated)</p>
                         </div>
                         <div className="bg-slate-900 p-4 rounded border border-slate-800">
                             <h4 className="text-xs text-slate-500 uppercase">Hash Algorithm</h4>
                             <p className="text-slate-300 font-mono mt-1">SHA-256</p>
                         </div>
                         <div className="bg-slate-900 p-4 rounded border border-slate-800">
                             <h4 className="text-xs text-slate-500 uppercase">Difficulty Target</h4>
                             <p className="text-slate-300 font-mono mt-1">0x0... (1 leading zero)</p>
                         </div>
                    </div>
                </div>
            )}

            {view === 'VERIFY' && (
                <div className="max-w-2xl mx-auto mt-10">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-800 text-center bg-slate-900">
                            <div className="mx-auto w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center mb-4 border border-cyan-900">
                                <Users size={32} className="text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Identity Verification Portal</h2>
                            <p className="text-slate-400 mt-2">Secure entry point for network resources.</p>
                        </div>
                        
                        <div className="p-8">
                            <form onSubmit={handleManualVerify} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">User ID / Badge Code</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Terminal size={18} className="text-slate-500" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={verifyUserId}
                                            onChange={(e) => setVerifyUserId(e.target.value)}
                                            className="block w-full pl-10 bg-slate-950 border border-slate-700 rounded-lg py-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                                            placeholder="e.g. sys_admin_01"
                                            autoComplete='off'
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Try: <span className="font-mono text-slate-400">sys_admin_01</span> or <span className="font-mono text-slate-400">guest_user_a</span></p>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={!verifyUserId}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-900/50 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:scale-100"
                                >
                                    Verify Identity & Log Access
                                </button>
                            </form>

                            {verifyResult && (
                                <div className={`mt-6 p-4 rounded-lg border flex items-start space-x-3 animate-fadeIn ${
                                    verifyResult.status === 'SUCCESS' 
                                        ? 'bg-green-900/20 border-green-900 text-green-200' 
                                        : 'bg-red-900/20 border-red-900 text-red-200'
                                }`}>
                                    {verifyResult.status === 'SUCCESS' ? <ShieldCheck className="mt-1" /> : <AlertTriangle className="mt-1" />}
                                    <div>
                                        <h4 className="font-bold">{verifyResult.status === 'SUCCESS' ? 'Access Granted' : 'Access Denied'}</h4>
                                        <p className="text-sm opacity-80">{verifyResult.msg}</p>
                                        <p className="text-xs mt-2 opacity-60 font-mono">Transaction logged to memory pool.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {view === 'AI_ANALYSIS' && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-white">AI Threat Analysis</h2>
                            <p className="text-slate-400">Powered by Gemini 2.5 Flash</p>
                        </div>
                        <button
                            onClick={runAIAnalysis}
                            disabled={isAnalyzing || chain.length <= 1}
                            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-900/40 disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <span className="animate-pulse">Analyzing Chain...</span>
                            ) : (
                                <>
                                    <Server size={18} />
                                    <span>Run Security Audit</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 min-h-[400px] relative">
                        {!aiAnalysis && !isAnalyzing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <ShieldCheck size={64} className="mb-4 opacity-20" />
                                <p>No analysis generated yet.</p>
                                <p className="text-sm">Generate some traffic, wait for blocks, then run the audit.</p>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-purple-400 font-mono animate-pulse">Reading Blockchain Data...</p>
                            </div>
                        )}

                        {aiAnalysis && (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
