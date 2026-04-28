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
import { getStakeTier, getTierColor, getTierRadius } from '../../utils/formatters';
import type { Validator, ValidatorWithGeo } from '../../types';
import { useSettings } from '../../context/SettingsContext';



interface GlobeSceneProps {
  validators: Validator[];
  selectedAddress: string | null;
  onSelectValidator: (validator: Validator) => void;
  onReady?: () => void;
}

export function GlobeScene({ validators, selectedAddress, onSelectValidator, onReady }: GlobeSceneProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringPointRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const wasDragRef = useRef(false);
  const { settings } = useSettings();
  const autoRotateGlobeRef = useRef(settings.autoRotateGlobe);

  useEffect(() => {
    autoRotateGlobeRef.current = settings.autoRotateGlobe;
    
    // Update immediately if no interaction is currently suppressing rotation
    const globe = globeRef.current;
    if (globe) {
      const controls = globe.controls();
      if (controls && !isHoveringPointRef.current && !interactionTimerRef.current) {
        controls.autoRotate = settings.autoRotateGlobe;
      }
    }
  }, [settings.autoRotateGlobe]);

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

  // Configure globe once it's rendered
  useEffect(() => {
    if (dimensions.width === 0) return;

    // We need a tiny delay after dimension is set to ensure Globe is mounted
    const timer = setTimeout(() => {
      const globe = globeRef.current;
      if (!globe) return;

      // Choose initial altitude depending on container width so mobile shows whole globe
      const isMobile = dimensions.width <= 640;
      // On mobile start more zoomed-out so the globe is fully visible; on desktop keep closer
      const initialAltitude = isMobile ? 2.8 : 1.5;
      globe.pointOfView({ lat: 40, lng: 0, altitude: initialAltitude }, 2500);

      try {
        const material = (globe as any).globeMaterial();
        if (material && material.color) {
          material.color.set('#050609');
        }
      } catch (e) { }

      const controls = globe.controls();
      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.15;
        controls.rotateSpeed = 0.4;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 100; // Lowered min distance to allow deeper zoom
        controls.maxDistance = 500;

        // Apply auto rotation based on settings initially
        controls.autoRotate = autoRotateGlobeRef.current;
        controls.autoRotateSpeed = -2.5; // Negative value rotates to the right

        // Stop auto-rotate when interacting, resume after delay when interaction ends
        controls.addEventListener('start', () => {
          controls.autoRotate = false;
          if (interactionTimerRef.current) {
            clearTimeout(interactionTimerRef.current);
            interactionTimerRef.current = null;
          }
        });

        controls.addEventListener('end', () => {
          if (interactionTimerRef.current) {
            clearTimeout(interactionTimerRef.current);
            interactionTimerRef.current = null;
          }
          if (!isHoveringPointRef.current) {
            if (wasDragRef.current) {
              interactionTimerRef.current = setTimeout(() => {
                controls.autoRotate = autoRotateGlobeRef.current;
                interactionTimerRef.current = null;
              }, 2000);
            } else {
              // Just a click, resume immediately
              controls.autoRotate = autoRotateGlobeRef.current;
            }
          }
          wasDragRef.current = false;
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [dimensions.width]);

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
      globeRef.current?.pointOfView({ lat: v.lat, lng: v.lng, altitude: 1.5 }, 1000);
    },
    [onSelectValidator],
  );

  const handlePointHover = useCallback((point: object | null) => {
    isHoveringPointRef.current = !!point;

    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (!controls) return;

    if (point) {
      // Hovering a point: pause rotation and clear timers
      controls.autoRotate = false;
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    } else {
      // Left a point: start resume timer
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
      interactionTimerRef.current = setTimeout(() => {
        controls.autoRotate = autoRotateGlobeRef.current;
        interactionTimerRef.current = null;
      }, 2000);
    }
  }, []);

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
  }, []);

  // Hex polygons data
  const [hexData, setHexData] = useState<any[]>([]);
  // Arcs data for GitHub style
  const [arcsData, setArcsData] = useState<any[]>([]);
  const [isGlobeInitialized, setIsGlobeInitialized] = useState(false);

  useEffect(() => {
    if (isGlobeInitialized && hexData.length > 0) {
      // Add a small delay to ensure rendering is complete before hiding loader
      const timer = setTimeout(() => {
        onReady?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGlobeInitialized, hexData, onReady]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setHexData(data.features));
  }, []);

  // Generate random connecting arcs
  useEffect(() => {
    if (geoValidators.length < 2) return;
    const arcs = [];
    for (let i = 0; i < 25; i++) {
      const start = geoValidators[Math.floor(Math.random() * geoValidators.length)];
      const end = geoValidators[Math.floor(Math.random() * geoValidators.length)];
      if (start && end && start !== end) {
        arcs.push({
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
          // Gradient arc color
          color: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.6)']
        });
      }
    }
    setArcsData(arcs);
  }, [geoValidators]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-transparent"
      onPointerDown={(e) => {
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        wasDragRef.current = false;
      }}
      onPointerUp={(e) => {
        const dx = e.clientX - dragStartPosRef.current.x;
        const dy = e.clientY - dragStartPosRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          wasDragRef.current = true;
        }
      }}
      onWheel={() => {
        wasDragRef.current = true;
      }}
    >
      {dimensions.width > 0 && (
        <div className="w-full h-full">
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            // Remove the bright water image, use solid color via material (or let it be transparent)
            globeImageUrl={undefined}
            backgroundColor="rgba(0,0,0,0)"
            atmosphereColor="#b4fffa" // Use 6-character hex (Three.js doesn't support 8-character hex well)
            atmosphereAltitude={0.1}
            animateIn={true}
            onGlobeReady={() => setIsGlobeInitialized(true)}

            // Configure Hex Polygons (Dot matrix look)
            hexPolygonsData={hexData}
            hexPolygonResolution={3}
            hexPolygonMargin={0.7} // High margin turns them into dots
            hexPolygonColor={() => '#d5d7daff'} // User requested continent color

            // Configure Arcs (GitHub style connecting lines)
            arcsData={settings.enableGlobeAnimations ? arcsData : []}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={4}
            arcDashInitialGap={() => Math.random() * 5}
            arcDashAnimateTime={200}
            arcAltitudeAutoScale={0.3}

            // Auto-rotate
            enablePointerInteraction={true}
            // Rings Layer (Sonar Effect)
            ringsData={geoValidators}
            ringLat="lat"
            ringLng="lng"
            ringColor={(d: object) => {
              const v = d as ValidatorWithGeo;
              const tier = getStakeTier(v, validators);
              return v.iotaAddress === selectedAddress ? '#ffffff' : getTierColor(tier);
            }}
            ringMaxRadius={(d: object) => {
              const v = d as ValidatorWithGeo;
              const tier = getStakeTier(v, validators);
              return v.iotaAddress === selectedAddress ? 4.0 : getTierRadius(tier) * 4.0;
            }}
            ringPropagationSpeed={1.2}
            ringRepeatPeriod={(d: object) => {
              const v = d as ValidatorWithGeo;
              const tier = getStakeTier(v, validators);
              return tier === 'top' ? 800 : tier === 'mid' ? 1200 : 1600;
            }}

            // Points layer (Flat dots)
            pointsData={geoValidators}
            pointLat="lat"
            pointLng="lng"
            pointColor={(d: object) => {
              const v = d as ValidatorWithGeo;
              const tier = getStakeTier(v, validators);
              return v.iotaAddress === selectedAddress ? '#ffffff' : getTierColor(tier);
            }}
            pointRadius={(d: object) => {
              const v = d as ValidatorWithGeo;
              const tier = getStakeTier(v, validators);
              return v.iotaAddress === selectedAddress ? 0.7 : getTierRadius(tier);
            }}
            pointAltitude={() => 0.01} // Flat on surface
            pointLabel={(d: object) => {
              const v = d as ValidatorWithGeo;
              return getValidatorTooltipHtml(v, validators);
            }}
            onPointClick={handlePointClick}
            onPointHover={handlePointHover}
            pointResolution={16}
            pointsMerge={false}
            pointsTransitionDuration={800}
          />
        </div>
      )}

      {/* Controls overlay */}
      <GlobeControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleReset}
      />
    </div>
  );
}
