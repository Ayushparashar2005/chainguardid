import { GoogleGenAI } from "@google/genai";
import { AccessLog, Block } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSecurityLogs = async (recentBlocks: Block[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API Key not found. Please configure the environment.";
  }

  // Flatten the last few blocks to get recent logs
  const logsToAnalyze: AccessLog[] = recentBlocks
    .flatMap(block => block.data)
    .slice(-50); // Analyze last 50 logs

  if (logsToAnalyze.length === 0) {
    return "No logs available for analysis.";
  }

  const prompt = `
    You are a Cyber Security Specialist AI. Analyze the following network access logs from a blockchain-based identity system.
    
    Logs:
    ${JSON.stringify(logsToAnalyze.map(l => ({
      time: new Date(l.timestamp).toISOString(),
      user: l.userId,
      ip: l.ipAddress,
      status: l.status,
      reason: l.reason,
      action: l.action
    })), null, 2)}

    Task:
    1. Identify any suspicious patterns (e.g., repeated denied access, multiple IPs for one user, brute force attempts).
    2. Analyze the "reason" for denials to see if existing firewall rules are effective.
    3. Verify if there are any anomalies in access times or user roles.
    4. Provide a concise security summary and specific recommendations (e.g., "Block IP 10.0.0.55").
    5. Keep the tone professional, technical, and authoritative.
    
    Format the output as Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis complete: No significant anomalies detected.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Failed to perform AI analysis. Please try again later.";
  }
};