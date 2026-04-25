/**
 * GlobeScene — main react-globe.gl component with validator points.
 *
 * Adapted for card-embedded rendering with a dark muted globe texture
 * and transparent background to blend with the dashboard card.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeMethods } from 'react-globe.gl';
import { GlobeControls } from './GlobeControls';
import { getValidatorTooltipHtml } from './ValidatorMarker';
import { useGeocode } from '../../hooks/useGeocode';
import { getStakeTier, getTierColor, getTierRadius, getTierAltitude } from '../../utils/formatters';
import type { Validator, ValidatorWithGeo } from '../../types';

// Dark muted topology texture for the globe
const GLOBE_IMAGE = 'https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png';

interface GlobeSceneProps {
  validators: Validator[];
  selectedAddress: string | null;
  onSelectValidator: (validator: Validator) => void;
}

export function GlobeScene({ validators, selectedAddress, onSelectValidator }: GlobeSceneProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Geocode validators
  const geoValidators = useGeocode(validators);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Configure globe on mount
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.15;
      controls.rotateSpeed = 0.4;
      controls.zoomSpeed = 0.8;
      controls.minDistance = 150;
      controls.maxDistance = 500;
      controls.addEventListener('start', () => setAutoRotate(false));
    }
  }, []);

  // Fly to selected validator
  useEffect(() => {
    if (!selectedAddress || !globeRef.current) return;
    const v = geoValidators.find((g) => g.iotaAddress === selectedAddress);
    if (v) {
      globeRef.current.pointOfView({ lat: v.lat, lng: v.lng, altitude: 1.5 }, 1000);
    }
  }, [selectedAddress, geoValidators]);

  const handlePointClick = useCallback(
    (point: object) => {
      const v = point as ValidatorWithGeo;
      onSelectValidator(v);
      setAutoRotate(false);
      globeRef.current?.pointOfView({ lat: v.lat, lng: v.lng, altitude: 1.5 }, 1000);
    },
    [onSelectValidator],
  );

  const handleZoomIn = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ ...pov, altitude: Math.max(pov.altitude * 0.7, 0.5) }, 300);
  }, []);

  const handleZoomOut = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ ...pov, altitude: Math.min(pov.altitude * 1.4, 4) }, 300);
  }, []);

  const handleReset = useCallback(() => {
    globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    setAutoRotate(true);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-transparent">
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl={GLOBE_IMAGE}
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.1}
          animateIn={true}
          // Auto-rotate
          enablePointerInteraction={true}
          // Points layer
          pointsData={geoValidators}
          pointLat="lat"
          pointLng="lng"
          pointColor={(d: object) => {
            const v = d as ValidatorWithGeo;
            const tier = getStakeTier(v, validators);
            return v.iotaAddress === selectedAddress ? '#ffdd00' : getTierColor(tier);
          }}
          pointRadius={(d: object) => {
            const v = d as ValidatorWithGeo;
            const tier = getStakeTier(v, validators);
            return v.iotaAddress === selectedAddress ? 0.7 : getTierRadius(tier);
          }}
          pointAltitude={(d: object) => {
            const v = d as ValidatorWithGeo;
            const tier = getStakeTier(v, validators);
            return v.iotaAddress === selectedAddress ? 0.08 : getTierAltitude(tier);
          }}
          pointLabel={(d: object) => {
            const v = d as ValidatorWithGeo;
            return getValidatorTooltipHtml(v, validators);
          }}
          onPointClick={handlePointClick}
          pointResolution={8}
          pointsMerge={false}
          pointsTransitionDuration={800}
        />
      )}

      {/* Controls overlay */}
      <GlobeControls
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((p) => !p)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleReset}
      />
    </div>
  );
}
