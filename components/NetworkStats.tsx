import React from 'react';
import { AccessLog, AccessStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface NetworkStatsProps {
  logs: AccessLog[];
}

export const NetworkStats: React.FC<NetworkStatsProps> = ({ logs }) => {
  // Calculate stats
  const grantedCount = logs.filter(l => l.status === AccessStatus.GRANTED).length;
  const deniedCount = logs.filter(l => l.status === AccessStatus.DENIED).length;
  
  // Time series mock - group by minute (mocked for demo visual)
  const dataByTime = logs.slice(-20).map((log, i) => ({
    name: i.toString(), 
    status: log.status === AccessStatus.GRANTED ? 1 : -1
  }));

  const pieData = [
    { name: 'Granted', value: grantedCount },
    { name: 'Denied', value: deniedCount },
  ];

  const COLORS = ['#22d3ee', '#ef4444'];

  // Fix: Prepare data for BarChart with a numeric value for the bar height
  const recentLogs = logs.slice(-15).map(l => ({
    ...l,
    value: 1
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
        <h3 className="text-slate-300 font-bold mb-4 text-sm uppercase tracking-wider">Access Traffic Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-6 mt-2">
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-sm text-slate-400">Granted: {grantedCount}</span>
            </div>
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-slate-400">Denied: {deniedCount}</span>
            </div>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
        <h3 className="text-slate-300 font-bold mb-4 text-sm uppercase tracking-wider">Recent Access Events</h3>
        <div className="h-64">
           {/* Using a simplified bar chart to represent stream of events */}
           <ResponsiveContainer width="100%" height="100%">
            {/* Fix: Pass formatted data to BarChart and remove invalid 'data' prop from Bar */}
            <BarChart data={recentLogs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" tick={false} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as AccessLog;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2 rounded shadow-xl text-xs">
                        <p className="text-cyan-400 font-bold">{data.userId}</p>
                        <p className="text-slate-400">{data.ipAddress}</p>
                        <p className={data.status === 'GRANTED' ? 'text-green-400' : 'text-red-400'}>
                          {data.status}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value">
                {recentLogs.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.status === AccessStatus.GRANTED ? '#22d3ee' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};