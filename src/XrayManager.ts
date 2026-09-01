import { XrayConfig, TestResult, UserPersona } from './types';
import { XrayParser } from './services/XrayParser';
import { ScoreCalculator } from './services/ScoreCalculator';
import { XrayExporter } from './services/XrayExporter';
import { TestEngine, TestSettings } from './services/TestEngine';

export { XrayParser, ScoreCalculator, XrayExporter, TestEngine };

export const XrayManager = {
  parseConfigsFromMessyText(rawText: string): XrayConfig[] {
    return XrayParser.parseConfigsFromMessyText(rawText);
  },

  deduplicateConfigs(configs: XrayConfig[]) {
    return XrayParser.deduplicateConfigs(configs);
  },

  calculatePreciseScore(res: TestResult, totalSites: number): number {
    const scores = ScoreCalculator.calculateScores(res, totalSites);
    return scores.overallScore;
  },

  calculatePersonaScores(res: TestResult, totalSites: number) {
    return ScoreCalculator.calculateScores(res, totalSites);
  },

  getActivePersonaScore(res: TestResult, persona: UserPersona): number {
    return ScoreCalculator.getActivePersonaScore(res, persona);
  },

  runSimulatedTests(
    configs: XrayConfig[],
    settings: TestSettings,
    selectedSites: { domain: string; displayName: string }[],
    onProgress: (index: number, result: TestResult) => void,
    abortSignal?: AbortSignal
  ): Promise<TestResult[]> {
    return TestEngine.runDiagnostics(configs, settings, selectedSites, onProgress, abortSignal);
  }
};
