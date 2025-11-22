import { Block, AccessLog, AccessStatus } from '../types';

export interface ThreatReport {
  generatedAt: number;
  overallThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  anomalies: Anomaly[];
  stats: {
    totalScanned: number;
    suspiciousCount: number;
    uniqueIPs: number;
  };
}

export interface Anomaly {
  id: string;
  entity: string; // IP or UserID
  type: 'BRUTE_FORCE' | 'HIGH_VELOCITY' | 'POLICY_VIOLATION' | 'SUSPICIOUS_USER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  timestamp: number;
  count: number;
}

// Configuration for the heuristic engine
const THRESHOLDS = {
  HIGH_VELOCITY_COUNT: 5, // Requests per minute to trigger velocity warning
  BRUTE_FORCE_FAILURES: 3, // Consecutive failures to trigger brute force
  CRITICAL_SCORE: 75,
  HIGH_SCORE: 50,
  MEDIUM_SCORE: 25
};

export const runHeuristicAnalysis = (chain: Block[]): ThreatReport => {
  const now = Date.now();
  const timeWindow = 60 * 1000 * 5; // Look at last 5 minutes of data for velocity
  
  // 1. Flatten and Filter Data
  const allLogs: AccessLog[] = chain.flatMap(block => block.data);
  const recentLogs = allLogs.filter(log => log.timestamp > now - timeWindow);
  
  const anomalies: Anomaly[] = [];
  let riskScore = 0;

  // Group by IP and User
  const ipActivity: Record<string, AccessLog[]> = {};
  const userActivity: Record<string, AccessLog[]> = {};

  recentLogs.forEach(log => {
    if (!ipActivity[log.ipAddress]) ipActivity[log.ipAddress] = [];
    ipActivity[log.ipAddress].push(log);

    if (!userActivity[log.userId]) userActivity[log.userId] = [];
    userActivity[log.userId].push(log);
  });

  // 2. Analyze IP Patterns (Velocity & Brute Force)
  Object.entries(ipActivity).forEach(([ip, logs]) => {
    // Sort logs by time
    logs.sort((a, b) => a.timestamp - b.timestamp);

    // Check Velocity
    if (logs.length > THRESHOLDS.HIGH_VELOCITY_COUNT) {
      anomalies.push({
        id: `vel-${ip}-${now}`,
        entity: ip,
        type: 'HIGH_VELOCITY',
        severity: 'MEDIUM',
        description: `Unusual traffic volume: ${logs.length} requests in short window.`,
        timestamp: logs[logs.length - 1].timestamp,
        count: logs.length
      });
      riskScore += 10;
    }

    // Check Brute Force (High failure rate)
    const failures = logs.filter(l => l.status === AccessStatus.DENIED);
    if (failures.length >= THRESHOLDS.BRUTE_FORCE_FAILURES) {
      anomalies.push({
        id: `bf-${ip}-${now}`,
        entity: ip,
        type: 'BRUTE_FORCE',
        severity: 'HIGH',
        description: `Potential Brute Force: ${failures.length} failed access attempts.`,
        timestamp: failures[failures.length - 1].timestamp,
        count: failures.length
      });
      riskScore += 25;
    }
  });

  // 3. Analyze User Patterns
  Object.entries(userActivity).forEach(([userId, logs]) => {
    // Check for multiple IPs for single user (Impossible Travel / Account Sharing)
    const uniqueIPs = new Set(logs.map(l => l.ipAddress));
    if (uniqueIPs.size > 2) {
      anomalies.push({
        id: `usr-${userId}-${now}`,
        entity: userId,
        type: 'SUSPICIOUS_USER',
        severity: 'MEDIUM',
        description: `Account accessed from ${uniqueIPs.size} distinct IPs recently.`,
        timestamp: logs[logs.length - 1].timestamp,
        count: uniqueIPs.size
      });
      riskScore += 15;
    }
  });

  // 4. Calculate Overall Threat Level
  let threatLevel: ThreatReport['overallThreatLevel'] = 'LOW';
  if (riskScore > THRESHOLDS.CRITICAL_SCORE) threatLevel = 'CRITICAL';
  else if (riskScore > THRESHOLDS.HIGH_SCORE) threatLevel = 'HIGH';
  else if (riskScore > THRESHOLDS.MEDIUM_SCORE) threatLevel = 'MEDIUM';

  return {
    generatedAt: now,
    overallThreatLevel: threatLevel,
    score: Math.min(riskScore, 100),
    anomalies: anomalies.sort((a, b) => (a.severity === 'HIGH' ? -1 : 1)),
    stats: {
      totalScanned: allLogs.length,
      suspiciousCount: anomalies.length,
      uniqueIPs: Object.keys(ipActivity).length
    }
  };
};