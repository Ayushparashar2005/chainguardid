import React from 'react';
import { Block } from '../types';
import { Link, Box, Hash, Clock } from 'lucide-react';

interface BlockchainVisualizerProps {
  chain: Block[];
}

export const BlockchainVisualizer: React.FC<BlockchainVisualizerProps> = ({ chain }) => {
  return (
    <div className="space-y-6 overflow-x-auto pb-4">
      <div className="flex items-start space-x-4 min-w-max px-4">
        {chain.map((block, idx) => (
          <div key={block.hash} className="flex items-center">
            {/* Block Card */}
            <div className="w-80 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg hover:shadow-cyan-900/20 transition-all duration-300 relative group">
              <div className="absolute -top-3 -right-3 bg-cyan-900 text-cyan-100 text-xs font-bold px-2 py-1 rounded-full border border-cyan-500">
                Block #{block.index}
              </div>
              
              <div className="flex items-center space-x-2 mb-3 text-cyan-400">
                <Box size={20} />
                <span className="font-mono text-sm font-bold">BLOCK HEADER</span>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nonce</span>
                  <span>{block.nonce}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Previous Hash</span>
                  <div className="truncate bg-slate-950 p-1 rounded border border-slate-800 text-[10px]">
                    {block.previousHash}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Hash</span>
                  <div className="truncate bg-slate-950 p-1 rounded border border-slate-800 text-[10px] text-cyan-600">
                    {block.hash}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 mt-2">
                  <div className="flex items-center space-x-1 text-slate-300">
                    <Clock size={12} />
                    <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500">{block.data.length} Transactions</span>
                  </div>
                </div>
              </div>
              
              {/* Hover detail overlay */}
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col overflow-hidden">
                <h4 className="text-cyan-400 font-bold text-sm mb-2">Transactions</h4>
                <div className="overflow-y-auto flex-1 space-y-2 text-xs scrollbar-thin">
                  {block.data.length === 0 ? (
                    <p className="text-slate-600 italic">Empty Block</p>
                  ) : (
                    block.data.map(tx => (
                      <div key={tx.id} className="border-b border-slate-800 pb-1">
                        <div className="flex justify-between">
                          <span className={tx.status === 'GRANTED' ? 'text-green-500' : 'text-red-500'}>
                            {tx.status}
                          </span>
                          <span className="text-slate-500">{tx.ipAddress}</span>
                        </div>
                        <div className="text-slate-400 truncate">{tx.userId}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Link Connector */}
            {idx < chain.length - 1 && (
              <div className="mx-2 text-slate-600 animate-pulse">
                <Link size={24} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
