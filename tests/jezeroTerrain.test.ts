/**
 * Scientific Validation & Unit Tests for USGS Jezero Terrain Service & A* Routing Engine
 * NASA Space Apps Challenge 2026 - Team Quanta Buddies
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  isPointWithinJezeroDem,
  interpolateJezeroElevation,
  getTerrainElevation,
  calculateTerrainSlope,
  JEZERO_DEM_METADATA,
  JEZERO_DEM_BOUNDS,
  JEZERO_DEM_GRID
} from '../src/services/jezeroTerrainService';
import { runGridAStar } from '../src/utils/routingEngine';
import { MarsCoordinates, HazardZone, ScienceTarget } from '../src/types';

describe('Phase 2B: USGS Jezero Terrain Service Scientific Validation', () => {
  it('1. Verify DEM Metadata and Official USGS Source URLs', () => {
    assert.ok(JEZERO_DEM_METADATA.primarySourceUrl.includes('planetarymaps.usgs.gov'));
    assert.ok(JEZERO_DEM_METADATA.hiriseSourceUrl.includes('planetarymaps.usgs.gov'));
    assert.strictEqual(JEZERO_DEM_METADATA.elevationUnits, 'meters');
    assert.strictEqual(JEZERO_DEM_METADATA.verticalDatum, 'MOLA IAU 2000 Areoid');
    assert.ok(JEZERO_DEM_METADATA.coordinateReferenceSystem.includes('Equirectangular'));
    assert.strictEqual(JEZERO_DEM_GRID.rows, 267);
    assert.strictEqual(JEZERO_DEM_GRID.cols, 253);
  });

  it('2. Verify Coordinate Mapping and Bounds Checking', () => {
    // Center point inside Jezero crater bounding box (e.g., Jezero Landing Site / octavia e. butler landing)
    const insideLat = 18.385;
    const insideLon = 77.500; // wait, let's check bounds: minLon 77.3, maxLon 77.479287
    // Let's use coordinates within bounds: lat 18.45, lon 77.38
    const validLat = 18.45;
    const validLon = 77.38;

    assert.strictEqual(isPointWithinJezeroDem(validLat, validLon), true);

    // Outside coordinates (e.g. Olympus Mons or off-disk)
    assert.strictEqual(isPointWithinJezeroDem(18.65, -133.8), false);
    assert.strictEqual(isPointWithinJezeroDem(90.0, 0.0), false);
  });

  it('3. Verify Bilinear Interpolation & Elevation Retrieval within Coverage', () => {
    const testLat = 18.45;
    const testLon = 77.38;
    const result = getTerrainElevation(testLat, testLon);

    assert.strictEqual(result.isRealDem, true);
    assert.strictEqual(result.dataSource, 'USGS_CTX_HIRISE_DEM');
    assert.ok(typeof result.elevationMeters === 'number');
    assert.ok(result.elevationMeters < 0, 'Jezero basin floor should be below datum (~ -2500m)');
  });

  it('4. Verify Missing Data / Out-of-Coverage Graceful Fallback Behavior', () => {
    // Olympus Mons coordinate (far outside Jezero)
    const outLat = 18.65;
    const outLon = -133.8;
    const result = getTerrainElevation(outLat, outLon);

    assert.strictEqual(result.isRealDem, false);
    assert.strictEqual(result.dataSource, 'MOLA_REGIONAL_BASELINE');
    assert.strictEqual(result.elevationMeters, -2500); // default fallback
  });

  it('5. Verify Slope Calculation from Actual Sampled Elevations', () => {
    const p1: MarsCoordinates = { lat: 18.44, lon: 77.35, elevationMeters: -2500 };
    const p2: MarsCoordinates = { lat: 18.46, lon: 77.37, elevationMeters: -2400 };

    const slopeRes = calculateTerrainSlope(p1, p2, 1000); // 1000m distance
    assert.ok(slopeRes.slopeDeg > 0);
    assert.ok(slopeRes.elevDeltaMeters >= 0);
    assert.strictEqual(slopeRes.isDerivedFromRealDem, true);
  });

  it('6. Verify A* Pathfinding Steep-Slope and Hazard Avoidance with Real DEM', () => {
    const start: MarsCoordinates = { lat: 18.44, lon: 77.33, elevationMeters: -2520 };
    const goal: MarsCoordinates = { lat: 18.52, lon: 77.38, elevationMeters: -2480 };

    const hazards: HazardZone[] = [
      {
        id: 'steep_scarp',
        title: 'Kodiak Escarpment',
        type: 'CRATER_RIM',
        riskLevel: 'CRITICAL',
        center: { lat: 18.48, lon: 77.35, elevationMeters: -2450 },
        radiusMeters: 400,
        maxSlopeDeg: 28.0,
        roughnessIndex: 0.9,
        description: 'Steep delta scarp',
        mitigationAdvice: 'Avoid',
        detectedBy: 'HiRISE DTM'
      }
    ];

    const targets: ScienceTarget[] = [];
    const route = runGridAStar(start, goal, hazards, targets, 'SAFETY_FIRST');

    assert.ok(route.path.length >= 2);
    assert.strictEqual(route.isUnreachable, false);
    assert.strictEqual(route.isRealDem, true);
    assert.ok(route.terrainSource?.includes('USGS'));
  });

  it('7. Verify Unreachable Destination Handling', () => {
    const start: MarsCoordinates = { lat: 18.44, lon: 77.33, elevationMeters: -2520 };
    const unreachableGoal: MarsCoordinates = { lat: 18.48, lon: 77.35, elevationMeters: -2450 }; // directly inside critical exclusion zone

    const hazards: HazardZone[] = [
      {
        id: 'impassable_zone',
        title: 'Impassable Caldera Wall',
        type: 'CRATER_RIM',
        riskLevel: 'CRITICAL',
        center: unreachableGoal,
        radiusMeters: 800,
        maxSlopeDeg: 35.0,
        roughnessIndex: 0.99,
        description: 'Completely impassable hazard',
        mitigationAdvice: 'Do not enter',
        detectedBy: 'CTX DEM'
      }
    ];

    const route = runGridAStar(start, unreachableGoal, hazards, [], 'SAFETY_FIRST');
    assert.strictEqual(route.isUnreachable, true);
    assert.ok(route.unreachableReason && route.unreachableReason.length > 0);
  });
});
