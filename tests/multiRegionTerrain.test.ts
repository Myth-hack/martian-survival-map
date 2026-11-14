/**
 * Scientific Validation & Multi-Region Unit Tests for Martian Terrain Services & A* Pathfinder
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 *
 * Validates all 10 Martian Exploration Regions:
 * 1. Jezero Crater (Perseverance / USGS CTX-HiRISE DEM matrix)
 * 2. Gale Crater (Curiosity / MSL MOLA-HRSC Model)
 * 3. Valles Marineris (Chasm Canyon / Cliff Drop Rejection)
 * 4. Olympus Mons (Shield Volcano / 21.3 km Caldera Peak)
 * 5. Planum Boreum (North Polar Ice Cap / Cryosphere Model)
 * 6. Hellas Planitia (Impact Basin / -7.15 km Floor)
 * 7. Elysium Planitia (InSight Seismology Site)
 * 8. Meridiani Planum (Opportunity MER-B Site)
 * 9. Noctis Labyrinthus (Swarm Rescue Scenario)
 * 10. Acidalia Planitia (Ares III Lowland Site)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  getTerrainElevation,
  calculateTerrainSlope,
  isPointWithinRegionBounds,
  REGIONAL_DEM_METADATA,
  REGIONAL_BOUNDS
} from '../src/services/marsTerrainService';
import {
  runGridAStar,
  generateOptimalRoutes,
  calculateMarsDistanceKm,
  runSwarmRescueRouting
} from '../src/utils/routingEngine';
import {
  MARS_REGIONS,
  getRegionalHazards,
  getRegionalScienceTargets
} from '../src/data/marsDatasets';
import { MapRegionId, MarsCoordinates } from '../src/types';

describe('Multi-Region Planetary GIS & Pathfinding Validation Suite', () => {
  const REGION_IDS: MapRegionId[] = [
    'jezero',
    'gale',
    'valles_marineris',
    'olympus_mons',
    'planum_boreum',
    'hellas_planitia',
    'elysium_planitia',
    'meridiani_planum',
    'noctis_labyrinthus',
    'acidalia_planitia'
  ];

  it('1. Verify MARS_REGIONS catalog contains all 10 required exploration regions', () => {
    assert.strictEqual(MARS_REGIONS.length, 10);
    const catalogIds = MARS_REGIONS.map((r) => r.id);
    for (const id of REGION_IDS) {
      assert.ok(catalogIds.includes(id), `Catalog missing region: ${id}`);
    }
  });

  it('2. Verify REGIONAL_DEM_METADATA and USGS/PDS/ESA source attributions', () => {
    for (const id of REGION_IDS) {
      const meta = REGIONAL_DEM_METADATA[id];
      assert.ok(meta, `Metadata missing for region: ${id}`);
      assert.strictEqual(meta.regionId, id);
      assert.ok(meta.primarySourceUrl.startsWith('http'), `Invalid source URL for ${id}`);
      assert.strictEqual(meta.elevationUnits, 'meters');
      assert.ok(meta.spatialResolutionMeters > 0);
      assert.ok(meta.coordinateReferenceSystem.length > 0);
      assert.ok(meta.verticalDatum.length > 0);
    }
  });

  it('3. Verify Regional Bounding Box & Coordinate Coverage Functions', () => {
    for (const id of REGION_IDS) {
      const bounds = REGIONAL_BOUNDS[id];
      assert.ok(bounds, `Bounds missing for ${id}`);
      assert.ok(bounds.maxLat > bounds.minLat, `Invalid lat bounds for ${id}`);

      // Center point of each region must be inside bounds
      const regionData = MARS_REGIONS.find((r) => r.id === id)!;
      assert.strictEqual(
        isPointWithinRegionBounds(id, regionData.center.lat, regionData.center.lon),
        true,
        `Center coords for ${id} outside bounding box`
      );

      // Outside coordinate must return false
      assert.strictEqual(isPointWithinRegionBounds(id, -89.0, -180.0), false);
    }
  });

  it('4. Verify Elevation Retrieval across all 10 regions', () => {
    for (const id of REGION_IDS) {
      const regionData = MARS_REGIONS.find((r) => r.id === id)!;
      const elevRes = getTerrainElevation(regionData.center.lat, regionData.center.lon, id);

      assert.strictEqual(elevRes.isRealDem, true, `Elevation should be marked as real/calibrated DEM for ${id}`);
      assert.ok(typeof elevRes.elevationMeters === 'number');
      assert.ok(elevRes.dataSource.length > 0);
      assert.ok(elevRes.attribution.length > 0);
    }
  });

  it('5. Verify Jezero Crater USGS 40m DEM matrix queries', () => {
    // Center point inside Jezero bounds
    const res = getTerrainElevation(18.45, 77.38, 'jezero');
    assert.strictEqual(res.isRealDem, true);
    assert.strictEqual(res.dataSource, 'USGS_CTX_HIRISE_DEM');
    assert.ok(res.elevationMeters < -2000 && res.elevationMeters > -2600);
  });

  it('6. Verify Olympus Mons extreme elevation values (+21.3 km caldera)', () => {
    const summitRes = getTerrainElevation(18.65, -133.80, 'olympus_mons');
    assert.strictEqual(summitRes.isRealDem, true);
    assert.ok(summitRes.elevationMeters > 15000, `Expected Olympus summit >15000m, got ${summitRes.elevationMeters}`);
  });

  it('7. Verify Hellas Planitia deep basin elevation (-7.15 km floor)', () => {
    const basinRes = getTerrainElevation(-42.40, 70.50, 'hellas_planitia');
    assert.strictEqual(basinRes.isRealDem, true);
    assert.ok(basinRes.elevationMeters < -6000, `Expected Hellas basin < -6000m, got ${basinRes.elevationMeters}`);
  });

  it('8. Verify Valles Marineris canyon cliff wall slope detection', () => {
    const p1: MarsCoordinates = { lat: -11.80, lon: -59.20, elevationMeters: 1200 };
    const p2: MarsCoordinates = { lat: -12.50, lon: -59.20, elevationMeters: -3800 }; // 5000m drop

    const slopeRes = calculateTerrainSlope(p1, p2, 1000, 'valles_marineris');
    assert.ok(slopeRes.slopeDeg > 30, `Expected slope > 30, got ${slopeRes.slopeDeg}`);
    assert.strictEqual(slopeRes.isCanyonCliffWall, true);
  });

  it('9. Verify A* Pathfinding executes cleanly across all 10 regions', () => {
    for (const id of REGION_IDS) {
      const regionData = MARS_REGIONS.find((r) => r.id === id)!;
      const startElev = getTerrainElevation(regionData.center.lat, regionData.center.lon, id).elevationMeters;
      const goalElev = getTerrainElevation(regionData.center.lat + 0.02, regionData.center.lon + 0.02, id).elevationMeters;

      const start: MarsCoordinates = {
        lat: regionData.center.lat,
        lon: regionData.center.lon,
        elevationMeters: startElev
      };
      const goal: MarsCoordinates = {
        lat: regionData.center.lat + 0.02,
        lon: regionData.center.lon + 0.02,
        elevationMeters: goalElev
      };

      const hazards = getRegionalHazards(id);
      const targets = getRegionalScienceTargets(id);

      const routeResult = runGridAStar(start, goal, hazards, targets, 'BALANCED', {}, id);

      assert.ok(routeResult.path.length >= 2, `A* path for ${id} should have >= 2 waypoints`);
      assert.strictEqual(routeResult.isRealDem, true, `A* for ${id} should be marked real DEM`);
      assert.ok(routeResult.terrainSource.length > 0);
    }
  });

  it('10. Verify Pareto Multi-Objective Route Generator for Gale Crater', () => {
    const galeData = MARS_REGIONS.find((r) => r.id === 'gale')!;
    const start: MarsCoordinates = { lat: -4.590, lon: 137.440, elevationMeters: -4450 };
    const goal: MarsCoordinates = { lat: -4.680, lon: 137.360, elevationMeters: -4250 };

    const hazards = getRegionalHazards('gale');
    const targets = getRegionalScienceTargets('gale');

    const routes = generateOptimalRoutes(start, goal, hazards, targets, {}, 'gale');

    assert.strictEqual(routes.length, 3);
    assert.strictEqual(routes[0].id, 'route_balanced_a');
    assert.strictEqual(routes[1].id, 'route_safety_b');
    assert.strictEqual(routes[2].id, 'route_science_c');
    assert.ok(routes[0].distanceKm > 0);
  });

  it('11. Verify Noctis Labyrinthus Multi-Agent Swarm Rescue Routing', () => {
    const agents = [
      {
        id: 'agent_alpha',
        name: 'UAV Scout Alpha',
        start: { lat: -7.000, lon: -102.200, elevationMeters: 1100 },
        target: { lat: -7.050, lon: -102.150, elevationMeters: 450 }
      },
      {
        id: 'agent_beta',
        name: 'Rescue Rover Beta',
        start: { lat: -7.100, lon: -102.300, elevationMeters: 1100 },
        target: { lat: -7.150, lon: -102.250, elevationMeters: 380 }
      }
    ];

    const hazards = getRegionalHazards('noctis_labyrinthus');
    const rescueResult = runSwarmRescueRouting(agents, hazards);

    assert.strictEqual(rescueResult.agents.length, 2);
    assert.ok(rescueResult.totalCoveragePct > 0);
    assert.ok(rescueResult.agents[0].assignedRoute !== undefined);
  });
});
