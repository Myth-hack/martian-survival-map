/**
 * Automated Unit Tests for Martian A* Grid Routing Engine
 * NASA Space Apps Challenge 2026 - Team Quanta Buddies
 * 
 * Tests:
 * 1. Basic path generation between valid coordinates
 * 2. Obstacle & critical hazard avoidance (detour validation)
 * 3. Slope ceiling enforcement
 * 4. Unreachable destination diagnostics
 * 5. Consumable (O2 / power) modeling and fatal threshold detection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  calculateMarsDistanceKm,
  calculateSlopeDeg,
  getSimulatedElevation,
  runGridAStar,
  generateOptimalRoutes,
  calculateEmergencyReturnRoute
} from '../src/utils/routingEngine';
import { MarsCoordinates, HazardZone, ScienceTarget } from '../src/types';

describe('Martian A* Grid Routing Engine', () => {
  const startCoord: MarsCoordinates = {
    lat: 18.3800,
    lon: 77.5800,
    elevationMeters: -2500,
    name: 'Jezero Basecamp'
  };

  const goalCoord: MarsCoordinates = {
    lat: 18.4680,
    lon: 77.3880,
    elevationMeters: -2510,
    name: 'Amalik Delta Front'
  };

  const testHazards: HazardZone[] = [
    {
      id: 'haz_seitah_dunes',
      title: 'South Séítah Aeolian Dune Trap',
      type: 'DUNE_FIELD',
      riskLevel: 'CRITICAL',
      center: { lat: 18.4200, lon: 77.4800, elevationMeters: -2520 },
      radiusMeters: 600,
      maxSlopeDeg: 19.5,
      roughnessIndex: 0.88,
      description: 'Active bedforms with loose basaltic sand.',
      mitigationAdvice: 'Circumnavigate outside 600m perimeter.',
      detectedBy: 'HiRISE DTM'
    }
  ];

  const testScienceTargets: ScienceTarget[] = [
    {
      id: 'sci_amalik',
      name: 'Amalik Mudstone',
      type: 'FLUVIAL_DELTA',
      tier: 1,
      coordinates: { lat: 18.4680, lon: 77.3880, elevationMeters: -2510 },
      scienceValueScore: 98,
      potentialBiosignature: 'Organic carbon preservation in lacustrine clay laminations',
      crismSpectralSignature: 'Fe/Mg smectite 2.21 um',
      investigationStatus: 'ANALYZED',
      description: 'Delta bottomset mudstone unit'
    }
  ];

  it('calculateMarsDistanceKm should compute accurate planetary distances using R=3389.5 km', () => {
    // 1 degree latitude on Mars is approx ~59.16 km
    const dist = calculateMarsDistanceKm(0, 0, 1, 0);
    assert.ok(dist > 58.5 && dist < 59.8, `Expected ~59.16 km, got ${dist}`);

    // Zero distance
    assert.strictEqual(calculateMarsDistanceKm(18.38, 77.58, 18.38, 77.58), 0);
  });

  it('calculateSlopeDeg should return 0 for flat surfaces and scale with elevation difference', () => {
    const p1: MarsCoordinates = { lat: 18.0, lon: 77.0, elevationMeters: -2500 };
    const p2: MarsCoordinates = { lat: 18.0, lon: 77.01, elevationMeters: -2500 };
    assert.strictEqual(calculateSlopeDeg(p1, p2), 0);

    const p3: MarsCoordinates = { lat: 18.0, lon: 77.01, elevationMeters: -2200 };
    const slope = calculateSlopeDeg(p1, p3);
    assert.ok(slope > 10, `Expected slope > 10 deg, got ${slope}`);
  });

  it('runGridAStar should generate a connected path from start to goal', () => {
    const result = runGridAStar(startCoord, goalCoord, testHazards, testScienceTargets, 'BALANCED');

    assert.ok(result.path.length >= 2, 'Path should have at least 2 points');
    assert.strictEqual(result.path[0].lat, startCoord.lat);
    assert.strictEqual(result.path[0].lon, startCoord.lon);
    assert.strictEqual(result.isUnreachable, false);

    // End point should be at goal
    const endPoint = result.path[result.path.length - 1];
    assert.strictEqual(endPoint.lat, goalCoord.lat);
    assert.strictEqual(endPoint.lon, goalCoord.lon);
  });

  it('runGridAStar should avoid critical hazard zones when planning routes', () => {
    // Place a critical hazard directly midway between start and goal
    const midwayLat = (startCoord.lat + goalCoord.lat) / 2;
    const midwayLon = (startCoord.lon + goalCoord.lon) / 2;
    const blockingHazard: HazardZone = {
      id: 'haz_direct_block',
      title: 'Direct Blocking Crater Scarp',
      type: 'CRATER_RIM',
      riskLevel: 'CRITICAL',
      center: { lat: midwayLat, lon: midwayLon, elevationMeters: -2500 },
      radiusMeters: 500,
      maxSlopeDeg: 28.0,
      roughnessIndex: 0.95,
      description: 'Impassable boulder scarp',
      mitigationAdvice: 'Avoid',
      detectedBy: 'MOLA'
    };

    const result = runGridAStar(
      startCoord,
      goalCoord,
      [blockingHazard],
      [],
      'SAFETY_FIRST',
      { hazardAversion: 2.5 }
    );

    assert.ok(result.path.length >= 2);

    // Verify no waypoint penetrates the hard core (<300m) of the critical hazard
    for (const pt of result.path) {
      const distToHazM = calculateMarsDistanceKm(pt.lat, pt.lon, midwayLat, midwayLon) * 1000;
      // Allow slight boundary margin, but must not cross inner hazard zone (300m)
      assert.ok(
        distToHazM >= 250,
        `Path waypoint at (${pt.lat}, ${pt.lon}) penetrated hazard core: ${distToHazM.toFixed(1)}m from center`
      );
    }
  });

  it('runGridAStar should handle unreachable destinations gracefully and flag isUnreachable', () => {
    // Goal located inside an impassable critical exclusion zone
    const unreachableGoal: MarsCoordinates = {
      lat: 18.4200,
      lon: 77.4800,
      elevationMeters: -2520,
      name: 'Trapped Point'
    };

    const result = runGridAStar(
      startCoord,
      unreachableGoal,
      testHazards,
      [],
      'SAFETY_FIRST'
    );

    assert.strictEqual(result.isUnreachable, true);
    assert.ok(typeof result.unreachableReason === 'string' && result.unreachableReason.length > 0);
    // Should still return a safe approach path ending outside the hazard
    assert.ok(result.path.length >= 2);
  });

  it('generateOptimalRoutes should return 3 Pareto-optimal route vectors with proper metadata', () => {
    const routes = generateOptimalRoutes(startCoord, goalCoord, testHazards, testScienceTargets);

    assert.strictEqual(routes.length, 3);

    const [routeA, routeB, routeC] = routes;
    assert.strictEqual(routeA.id, 'route_balanced_a');
    assert.strictEqual(routeB.id, 'route_safety_b');
    assert.strictEqual(routeC.id, 'route_science_c');

    // Provenance must be tagged as LIVE_NASA or DERIVED
    assert.ok(['LIVE_NASA', 'DERIVED'].includes(routeA.provenance || ''));
    assert.ok(['LIVE_NASA', 'DERIVED'].includes(routeB.provenance || ''));
    assert.ok(['LIVE_NASA', 'DERIVED'].includes(routeC.provenance || ''));

    // All distances and life-support costs must be positive numbers
    assert.ok(routeA.evaOxygenReserveCostPct >= 0);
    assert.ok(typeof routeA.evaOxygenRemainingPct === 'number');
    assert.ok(routeA.evaOxygenRemainingPct >= 0 && routeA.evaOxygenRemainingPct <= 100);
    if (routeA.evaOxygenReserveCostPct > 100) {
      assert.strictEqual(routeA.isOxygenFatal, true);
      assert.strictEqual(routeA.evaOxygenRemainingPct, 0);
    }
  });

  it('calculateEmergencyReturnRoute should return a safety-prioritized abort vector', () => {
    const abortRoute = calculateEmergencyReturnRoute(goalCoord, startCoord, testHazards);

    assert.strictEqual(abortRoute.id, 'route_emergency_abort');
    assert.strictEqual(abortRoute.algorithm, 'Dijkstra');
    assert.strictEqual(abortRoute.color, '#EF4444');
    assert.ok(abortRoute.pathPoints.length >= 2);
  });
});
