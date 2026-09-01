import { TestResult, UserPersona } from '../types';

export class ScoreCalculator {
  // Calculates linear score between min and max bounds
  private static linearScale(val: number, bestVal: number, worstVal: number, maxWeight: number): number {
    if (val <= 0 && bestVal > 0) return 0.0;
    if (bestVal < worstVal) {
      // Lower is better (e.g. latency, jitter, packet loss)
      if (val <= bestVal) return maxWeight;
      if (val >= worstVal) return 0.0;
      return maxWeight * (1.0 - (val - bestVal) / (worstVal - bestVal));
    } else {
      // Higher is better (e.g. download speed, upload speed)
      if (val >= bestVal) return maxWeight;
      if (val <= worstVal) return 0.0;
      return maxWeight * ((val - worstVal) / (bestVal - worstVal));
    }
  }

  static calculateScores(res: TestResult, totalSites: number): {
    gamingScore: number;
    streamingScore: number;
    aiScore: number;
    uploadScore: number;
    overallScore: number;
  } {
    if (!res.isHealthy || res.tcpPing <= 0) {
      return {
        gamingScore: 0,
        streamingScore: 0,
        aiScore: 0,
        uploadScore: 0,
        overallScore: 0
      };
    }

    // Base sub-scores:
    // 1. Ping Score (20ms -> 100%, 800ms -> 0%)
    const pingScore = this.linearScale(res.tcpPing, 20, 800, 100);

    // 2. Jitter Score (0-1ms -> 100%, 80ms -> 0%) - Fix: Jitter 0 gets 100%
    const jitterVal = res.jitter < 0 ? 50 : res.jitter;
    const jitterScore = this.linearScale(jitterVal, 0.5, 80, 100);

    // 3. Packet Loss Score (0% -> 100%, 25% -> 0%)
    const packetLossVal = res.packetLossRate < 0 ? 0 : res.packetLossRate;
    const packetLossScore = this.linearScale(packetLossVal, 0, 25, 100);

    // 4. Real Delay Score (80ms -> 100%, 1500ms -> 0%)
    const realDelayVal = res.realDelay <= 0 ? 1500 : res.realDelay;
    const realDelayScore = this.linearScale(realDelayVal, 80, 1500, 100);

    // 5. Download Speed Score (100Mbps -> 100%, 0Mbps -> 0%)
    const downloadVal = res.downloadSpeedMbps <= 0 ? 0 : res.downloadSpeedMbps;
    const downloadScore = this.linearScale(downloadVal, 100, 0, 100);

    // 6. Upload Speed Score (50Mbps -> 100%, 0Mbps -> 0%)
    const uploadVal = res.uploadSpeedMbps <= 0 ? 0 : res.uploadSpeedMbps;
    const uploadScore = this.linearScale(uploadVal, 50, 0, 100);

    // 7. Site Reachability Score
    const safeSitesCount = res.siteReports.filter(s => s.status === 'SAFE').length;
    const websiteScore = totalSites > 0 ? (safeSitesCount / totalSites) * 100 : 100;

    // Gaming Persona: Ping (40%) + Jitter (30%) + Packet Loss (25%) + Real Delay (5%)
    const gamingScore = (pingScore * 0.40) + (jitterScore * 0.30) + (packetLossScore * 0.25) + (realDelayScore * 0.05);

    // Streaming Persona: Download (50%) + Real Delay (20%) + Website Reach (20%) + Packet Loss (10%)
    const streamingScore = (downloadScore * 0.50) + (realDelayScore * 0.20) + (websiteScore * 0.20) + (packetLossScore * 0.10);

    // AI & Bypass Persona: Website Reach (55%) + Real Delay (25%) + Ping (15%) + Packet Loss (5%)
    const aiScore = (websiteScore * 0.55) + (realDelayScore * 0.25) + (pingScore * 0.15) + (packetLossScore * 0.05);

    // Upload Persona: Upload (50%) + Download (20%) + Jitter/Loss (20%) + Real Delay (10%)
    const calculatedUploadScore = (uploadScore * 0.50) + (downloadScore * 0.20) + (((jitterScore + packetLossScore) / 2) * 0.20) + (realDelayScore * 0.10);

    // Overall Benchmark: Balanced weight of all dimensions
    const overallScore = (pingScore * 0.20) +
                         (jitterScore * 0.15) +
                         (packetLossScore * 0.15) +
                         (realDelayScore * 0.15) +
                         (downloadScore * 0.15) +
                         (uploadScore * 0.10) +
                         (websiteScore * 0.10);

    return {
      gamingScore: Math.min(100, Math.max(0, parseFloat(gamingScore.toFixed(2)))),
      streamingScore: Math.min(100, Math.max(0, parseFloat(streamingScore.toFixed(2)))),
      aiScore: Math.min(100, Math.max(0, parseFloat(aiScore.toFixed(2)))),
      uploadScore: Math.min(100, Math.max(0, parseFloat(calculatedUploadScore.toFixed(2)))),
      overallScore: Math.min(100, Math.max(0, parseFloat(overallScore.toFixed(2))))
    };
  }

  static getActivePersonaScore(res: TestResult, persona: UserPersona): number {
    if (!res.personaScores) return res.smartScore || 0;
    switch (persona) {
      case 'gaming': return res.personaScores.gamingScore;
      case 'streaming': return res.personaScores.streamingScore;
      case 'ai_bypass': return res.personaScores.aiScore;
      case 'upload': return res.personaScores.uploadScore;
      case 'all_rounder': default: return res.personaScores.overallScore;
    }
  }
}
