/**
 * Provenance & NASA Official Grounding Integrity Tests
 * Verifies that all NASA telemetry, AI services, and regional datasets
 * provide an explicit, consistent DataProvenance status:
 * 'LIVE_NASA' | 'HISTORICAL_NASA' | 'DATA_UNAVAILABLE' | 'AI_GENERATED' | 'SIMULATED' | 'FALLBACK'
 * and that fabricated confidence percentages/telemetry values are strictly eliminated.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { DataProvenance } from '../src/types';
import { VERIFIED_PDS_FALLBACK_TELEMETRY } from '../src/services/nasaTelemetryService';
import { VERIFIED_PDS_WEATHER_FALLBACK } from '../src/services/nasaApiService';
import { buildEmpiricalFallbackAdvice } from '../src/services/geminiMissionAdvisor';
import {
  CURRENT_MARS_ENVIRONMENT,
  CURRENT_MARS_MISSION_CONDITION,
  INITIAL_AI_MESSAGES,
  INITIAL_CONSENSUS
} from '../src/data/marsDatasets';

const VALID_PROVENANCES: readonly DataProvenance[] = [
  'LIVE_NASA',
  'HISTORICAL_NASA',
  'DATA_UNAVAILABLE',
  'AI_GENERATED',
  'SIMULATED',
  'DERIVED',
  'FALLBACK'
];

describe('DataProvenance Schema and Official NASA Grounding Integrity', () => {
  it('should accept all valid provenance enum values including HISTORICAL_NASA and DATA_UNAVAILABLE', () => {
    VALID_PROVENANCES.forEach((prov) => {
      assert.ok(['LIVE_NASA', 'HISTORICAL_NASA', 'DATA_UNAVAILABLE', 'AI_GENERATED', 'SIMULATED', 'DERIVED', 'FALLBACK'].includes(prov));
    });
  });

  it('VERIFIED_PDS_FALLBACK_TELEMETRY must designate verified official archive provenance', () => {
    assert.ok(['HISTORICAL_NASA', 'FALLBACK'].includes(VERIFIED_PDS_FALLBACK_TELEMETRY.provenance));
    assert.strictEqual(VERIFIED_PDS_FALLBACK_TELEMETRY.sol, 1240);
    assert.strictEqual(typeof VERIFIED_PDS_FALLBACK_TELEMETRY.atmosphericPressure.averagePa, 'number');
  });

  it('VERIFIED_PDS_WEATHER_FALLBACK must designate verified official archive provenance', () => {
    assert.ok(['HISTORICAL_NASA', 'FALLBACK'].includes(VERIFIED_PDS_WEATHER_FALLBACK.provenance || ''));
    assert.strictEqual(VERIFIED_PDS_WEATHER_FALLBACK.sol, 1240);
  });

  it('buildEmpiricalFallbackAdvice must return grounded provenance without fabricated confidence scores', () => {
    const fallbackAdvice = buildEmpiricalFallbackAdvice('Check wheel slippage near Séítah dunes');

    assert.ok(['FALLBACK', 'HISTORICAL_NASA'].includes(fallbackAdvice.provenance));
    assert.strictEqual(fallbackAdvice.role, 'assistant');

    // Fabricated scores like "99%" or "95%" must NOT be present
    assert.strictEqual(fallbackAdvice.confidence_score, undefined);

    // Citations should not have fabricated float confidence values
    if (fallbackAdvice.evidenceCitations) {
      fallbackAdvice.evidenceCitations.forEach((cit) => {
        assert.strictEqual(cit.confidence, undefined);
      });
    }

    // Explainable reasoning confidenceScore must be undefined in fallback
    if (fallbackAdvice.explainableReasoning) {
      assert.strictEqual(fallbackAdvice.explainableReasoning.confidenceScore, undefined);
    }
  });

  it('Default datasets must contain consistent HISTORICAL_NASA or grounded provenance tags', () => {
    assert.ok(['HISTORICAL_NASA', 'SIMULATED'].includes(CURRENT_MARS_ENVIRONMENT.provenance || ''));
    assert.ok(['HISTORICAL_NASA', 'SIMULATED'].includes(CURRENT_MARS_MISSION_CONDITION.provenance || ''));
    assert.ok(['HISTORICAL_NASA', 'FALLBACK'].includes(INITIAL_AI_MESSAGES[0].provenance || ''));
    assert.ok(['HISTORICAL_NASA', 'SIMULATED'].includes(INITIAL_CONSENSUS.provenance || ''));
  });

  it('CURRENT_MARS_MISSION_CONDITION must clearly declare crew telemetry as unavailable for robotic phase', () => {
    assert.strictEqual(CURRENT_MARS_MISSION_CONDITION.isCrewDataAvailable, false);
    assert.ok(typeof CURRENT_MARS_MISSION_CONDITION.crewDataUnavailableReason === 'string');
    assert.ok(CURRENT_MARS_MISSION_CONDITION.crewDataUnavailableReason?.includes('uncrewed robotic phase'));
  });

  it('INITIAL_AI_MESSAGES must not contain fabricated confidence percentages', () => {
    INITIAL_AI_MESSAGES.forEach((msg: any) => {
      if (msg.evidenceCitations) {
        msg.evidenceCitations.forEach((cite: any) => {
          assert.strictEqual(cite.confidence, undefined);
        });
      }
      if (msg.explainableReasoning) {
        assert.strictEqual(msg.explainableReasoning.confidenceScore, undefined);
      }
    });
  });
});
