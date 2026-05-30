import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapNode, MAP_NODES, MAP_CONNECTIONS, PATH_ROUTES } from '../data';
import { RideJourney, RiderRequest, RouteMatchResult } from '../types';
import {
  Map as MapIcon,
  MapPin,
  Navigation,
  Car,
  Users,
  RefreshCw,
  Search,
  Sparkles,
  HelpCircle,
  Info,
  Sliders,
  Globe,
  Settings,
  X,
  Compass
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

// Read API key from Vite defined variable
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Sleek dark theme map styles for professional aesthetics
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#161618" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#161618" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8e8e93" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a2a2a7" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1c1c1e" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#51a3a3" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1c1c1e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a2a2a7" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a3a3c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ff9500" }, { weight: 1 }, { opacity: 0.1 }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#efeff4" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1c1c1e" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3a3a3c" }],
  },
];

interface MapRouterProps {
  selectedRide: RideJourney | null;
  selectedRequest: RiderRequest | null;
  activeMatch: RouteMatchResult | null;
  onSelectNode?: (node: MapNode) => void;
}

// Subcomponent to compute live polylines using Route.computeRoutes
function LiveRouteLines({
  selectedRide,
  selectedRequest,
  activeMatch
}: {
  selectedRide: RideJourney | null;
  selectedRequest: RiderRequest | null;
  activeMatch: RouteMatchResult | null;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Clear old polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    const drawLine = (path: any[], color: string, weight: number, index: number) => {
      const poly = new google.maps.Polyline({
        path: path as any,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: weight,
        zIndex: index,
        map
      });
      polylinesRef.current.push(poly);
    };

    const calculateAndDraw = async () => {
      // 1. Draw Driver Journey Polyline
      if (selectedRide?.origin && selectedRide?.destination) {
        try {
          const originLatLng = { lat: selectedRide.origin.lat, lng: selectedRide.origin.lng };
          const destLatLng = { lat: selectedRide.destination.lat, lng: selectedRide.destination.lng };

          const response = await routesLib.Route.computeRoutes({
            origin: originLatLng,
            destination: destLatLng,
            travelMode: 'DRIVING',
            fields: ['path'],
          });

          if (response.routes?.[0]?.path) {
            const p = response.routes[0].path;
            drawLine(p, '#eab308', 5, 10); // Standard Gold yellow
            p.forEach(pt => bounds.extend(pt));
          }
        } catch (err) {
          console.error("Failed to compute driver live route:", err);
        }
      }

      // 2. Draw Request Rider Polyline
      if (selectedRequest?.origin && selectedRequest?.destination) {
        try {
          const originLatLng = { lat: selectedRequest.origin.lat, lng: selectedRequest.origin.lng };
          const destLatLng = { lat: selectedRequest.destination.lat, lng: selectedRequest.destination.lng };

          const response = await routesLib.Route.computeRoutes({
            origin: originLatLng,
            destination: destLatLng,
            travelMode: 'DRIVING',
            fields: ['path'],
          });

          if (response.routes?.[0]?.path) {
            const p = response.routes[0].path;
            drawLine(p, '#06b6d4', 4, 20); // Cyan blue
            p.forEach(pt => bounds.extend(pt as any));

            // 3. Highlight Overlap segment in Vibrantly bright Emerald Green if matched
            if (activeMatch) {
              drawLine(p, '#10b981', 6, 30); // Emerald green overlay
            }
          }
        } catch (err) {
          console.error("Failed to compute rider live route:", err);
        }
      }

      // Fit map camera bounds
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          top: 70,
          right: 70,
          bottom: 120,
          left: 70
        });
      }
    };

    calculateAndDraw();

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, selectedRide?.id, selectedRequest?.id, activeMatch]);

  return null;
}

interface AutocompleteSearchBoxProps {
  onPlaceSelect: (place: { name: string; location: google.maps.LatLngLiteral }) => void;
}

function AutocompleteSearchBox({ onPlaceSelect }: AutocompleteSearchBoxProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!placesLib) return;
    setSessionToken(new placesLib.AutocompleteSessionToken());
  }, [placesLib]);

  useEffect(() => {
    if (!placesLib || !inputValue || !sessionToken) {
      setSuggestions([]);
      return;
    }

    const autocompleteService = new placesLib.AutocompleteService();
    const timeoutId = setTimeout(() => {
      autocompleteService.getPlacePredictions({
        input: inputValue,
        sessionToken: sessionToken,
        locationBias: map?.getCenter() || undefined,
        componentRestrictions: { country: 'in' }
      }, (predictions, status) => {
        if (status === 'OK' && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      });
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [inputValue, placesLib, sessionToken, map]);

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompletePrediction) => {
    setInputValue(suggestion.description);
    setSuggestions([]);

    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const matchedPlace = {
            name: results[0].formatted_address || suggestion.description,
            location: { lat: loc.lat(), lng: loc.lng() }
          };
          onPlaceSelect(matchedPlace);
          if (map) {
            map.panTo(matchedPlace.location);
            map.setZoom(14);
          }
        }
      });
    } catch (err) {
      console.error("Geocoding failed for place ID:", err);
    }

    if (placesLib) {
      setSessionToken(new placesLib.AutocompleteSessionToken());
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-full max-w-sm flex flex-col gap-1">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (suggestions.length > 0) {
            handleSelectSuggestion(suggestions[0]);
          } else if (inputValue) {
            try {
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ address: inputValue }, (results, status) => {
                if (status === 'OK' && results?.[0]?.geometry?.location) {
                  const loc = results[0].geometry.location;
                  const matchedPlace = {
                    name: results[0].formatted_address || inputValue,
                    location: { lat: loc.lat(), lng: loc.lng() }
                  };
                  onPlaceSelect(matchedPlace);
                  if (map) {
                    map.panTo(matchedPlace.location);
                    map.setZoom(14);
                  }
                }
              });
            } catch (err) {
              console.error("Geocoding failed for direct query:", err);
            }
          }
        }}
        className="w-full flex gap-2 bg-[#161618]/95 p-2 rounded-xl border border-zinc-805 shadow-xl backdrop-blur-md"
      >
        <input
          type="text"
          placeholder="Search on Google Maps (e.g. Gachibowli)..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-[#0A0A0B] border border-zinc-800 text-zinc-150 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 font-sans"
        />
        <button
          type="submit"
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3.5 rounded-lg transition"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {suggestions.length > 0 && (
        <ul className="w-full bg-[#111113]/98 border border-zinc-805 rounded-xl overflow-hidden shadow-2xl divide-y divide-zinc-900 z-50 backdrop-blur-md max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelectSuggestion(s)}
              className="p-3 text-xs text-zinc-350 hover:text-white hover:bg-cyan-950/25 cursor-pointer transition flex flex-col gap-0.5"
            >
              <div className="font-semibold text-left">{s.structured_formatting.main_text}</div>
              <div className="text-[10px] text-zinc-500 text-left font-sans">{s.structured_formatting.secondary_text}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MapRouter({
  selectedRide,
  selectedRequest,
  activeMatch,
  onSelectNode
}: MapRouterProps) {
  // Mode selection state: live map vs simulation SVG map
  const [viewMode, setViewMode] = useState<'live' | 'simulation'>(hasValidKey ? 'live' : 'simulation');
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);

  // Search Address States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedPlace, setSearchedPlace] = useState<{ name: string; location: google.maps.LatLngLiteral } | null>(null);

  // Local simulated map hover states
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [animatingCar, setAnimatingCar] = useState<{ x: number; y: number; progress: number } | null>(null);

  // SVG Point generator utilities
  const getPathPoints = (pathId: string | undefined): { pointsString: string; nodes: MapNode[] } => {
    if (!pathId) return { pointsString: '', nodes: [] };
    const nodeIds = PATH_ROUTES[pathId] || [];
    const nodes = nodeIds
      .map(id => MAP_NODES.find(n => n.id === id))
      .filter((n): n is MapNode => !!n);

    const pointsString = nodes.map(n => `${n.x},${n.y}`).join(' ');
    return { pointsString, nodes };
  };

  const driverPath = getPathPoints(selectedRide?.routePath);
  const riderPath = getPathPoints(selectedRequest?.routePath);

  const getOverlapPath = (): { pointsString: string; nodes: MapNode[] } => {
    if (!selectedRide || !selectedRequest || !activeMatch) return { pointsString: '', nodes: [] };

    const driverNodeIds = PATH_ROUTES[selectedRide.routePath] || [];
    const riderNodeIds = PATH_ROUTES[selectedRequest.routePath] || [];

    const sharedNodeIds = driverNodeIds.filter(id => riderNodeIds.includes(id));
    const nodes = sharedNodeIds
      .map(id => MAP_NODES.find(n => n.id === id))
      .filter((n): n is MapNode => !!n);

    const pointsString = nodes.map(n => `${n.x},${n.y}`).join(' ');
    return { pointsString, nodes };
  };

  const overlapPath = getOverlapPath();

  // Animation controller for driver's SVG simulated path
  useEffect(() => {
    if (!selectedRide || viewMode !== 'simulation') {
      setAnimatingCar(null);
      return;
    }

    const { nodes } = getPathPoints(selectedRide.routePath);
    if (nodes.length < 2) return;

    let currentSegment = 0;
    let segmentProgress = 0;

    const interval = setInterval(() => {
      if (currentSegment >= nodes.length - 1) {
        currentSegment = 0;
      }

      const startNode = nodes[currentSegment];
      const endNode = nodes[currentSegment + 1];

      if (startNode && endNode) {
        const x = startNode.x + (endNode.x - startNode.x) * segmentProgress;
        const y = startNode.y + (endNode.y - startNode.y) * segmentProgress;
        setAnimatingCar({ x, y, progress: (currentSegment + segmentProgress) / (nodes.length - 1) });
      }

      segmentProgress += 0.05;
      if (segmentProgress >= 1) {
        segmentProgress = 0;
        currentSegment += 1;
      }
    }, 40);

    return () => clearInterval(interval);
  }, [selectedRide?.id, viewMode]);

  // Live Location Address Search Resolver
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          setSearchedPlace({
            name: results[0].formatted_address || searchQuery,
            location: { lat: loc.lat(), lng: loc.lng() }
          });
        } else {
          alert('Location search resolved no coordinate offsets. Try typing a corridor address or region index like "IIIT Hyderabad, Gachibowli"!');
        }
      });
    } catch (err) {
      console.error("Live geocoding services failed to bind:", err);
    }
  };

  return (
    <div className="relative bg-[#0A0A0B] border border-zinc-805 rounded-2xl overflow-hidden h-full flex flex-col shadow-2xl">
      {/* Dynamic View Engine Controller Bar */}
      <div className="bg-[#121214] border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-25 relative">
        <div className="flex items-center gap-2">
          <Globe className="text-cyan-400 w-4 h-4" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">MAP ROUTE SYSTEM</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation Toggle Switch */}
          <button
            onClick={() => setViewMode('simulation')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'simulation'
                ? 'bg-zinc-850 border border-zinc-700 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Tactical SVG
          </button>

          {/* Live Map Toggle Switch */}
          <button
            onClick={() => {
              if (hasValidKey) {
                setViewMode('live');
              } else {
                setShowKeyInstructions(true);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'live'
                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Live Google Map
            {!hasValidKey && (
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Embedded Setup Instructions drawer */}
      <AnimatePresence>
        {showKeyInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#1a1a1e] border-b border-zinc-800 p-4 shrink-0 text-xs z-25"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-2 text-yellow-450 font-bold">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Google Maps Configuration Required</span>
              </div>
              <button
                onClick={() => setShowKeyInstructions(false)}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-zinc-300 mt-2 leading-relaxed text-[11px]">
              To swap onto live satellite feeds and calculate coordinates on actual streets:
            </p>

            <ol className="list-decimal list-inside text-[11px] text-zinc-450 mt-2.5 space-y-2 max-w-lg">
              <li>
                Get an API Key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-cyan-400 underline hover:text-cyan-300">Google Cloud Console</a>
              </li>
              <li>
                Click the <strong>Settings</strong> gear in the <strong>top-right corner</strong> of AI Studio.
              </li>
              <li>
                Under <strong>Secrets</strong>, add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the name.
              </li>
              <li>
                Paste your secret API Key, press <strong>Enter</strong>, and wait seconds for automatic rebuild.
              </li>
            </ol>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setViewMode('simulation');
                  setShowKeyInstructions(false);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-250 font-bold px-3 py-1.5 rounded text-[10px] transition"
              >
                Inspect in Simulation Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Segment */}
      <div className="flex-1 w-full min-h-[500px] flex flex-col relative">
        {viewMode === 'live' && hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            {/* Live Google Map container */}
            <div className="relative w-full h-[600px]">
              {/* Autocomplete Locations Search Box inside map overlay */}
              <AutocompleteSearchBox onPlaceSelect={setSearchedPlace} />

              <Map
                defaultCenter={{ lat: 17.4435, lng: 78.3773 }}
                defaultZoom={11}
                mapId="DEMO_MAP_ID"
                style={{ width: '100%', height: '100%' }}
                gestureHandling="cooperative"
                styles={darkMapStyle}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              >
                {/* 1. Driver Start & Destination Advanced Markers */}
                {selectedRide && (
                  <>
                    <AdvancedMarker position={{ lat: selectedRide.origin.lat, lng: selectedRide.origin.lng }} title={`Driver Start: ${selectedRide.origin.name}`}>
                      <Pin background="#eab308" glyphColor="#000" scale={1.2} />
                    </AdvancedMarker>
                    <AdvancedMarker position={{ lat: selectedRide.destination.lat, lng: selectedRide.destination.lng }} title={`Driver End: ${selectedRide.destination.name}`}>
                      <Pin background="#eab308" glyphColor="#000" scale={1.2} />
                    </AdvancedMarker>
                  </>
                )}

                {/* 2. Rider Pickup & Dropoff Advanced Markers */}
                {selectedRequest && (
                  <>
                    <AdvancedMarker position={{ lat: selectedRequest.origin.lat, lng: selectedRequest.origin.lng }} title={`Rider Pickup: ${selectedRequest.origin.name}`}>
                      <Pin background="#06b6d4" glyphColor="#fff" />
                    </AdvancedMarker>
                    <AdvancedMarker position={{ lat: selectedRequest.destination.lat, lng: selectedRequest.destination.lng }} title={`Rider Dropoff: ${selectedRequest.destination.name}`}>
                      <Pin background="#06b6d4" glyphColor="#fff" />
                    </AdvancedMarker>
                  </>
                )}

                {/* 3. Searched Place Pin */}
                {searchedPlace && (
                  <AdvancedMarker position={searchedPlace.location} title={searchedPlace.name}>
                    <Pin background="#ef4444" glyphColor="#fff" />
                  </AdvancedMarker>
                )}

                {/* Live Polylines Computer Overlay */}
                <LiveRouteLines
                  selectedRide={selectedRide}
                  selectedRequest={selectedRequest}
                  activeMatch={activeMatch}
                />
              </Map>

              {/* Legend overlay inside Google Map Segment */}
              <div className="absolute bottom-4 right-4 bg-[#161618]/95 border border-zinc-805 p-3.5 rounded-xl shadow-xl z-10 flex flex-col gap-2.5 text-[11px]">
                <span className="font-bold text-white uppercase font-mono tracking-wider text-[10px] border-b border-zinc-800 pb-1 mb-0.5">Legend</span>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1.5 bg-yellow-500 inline-block rounded"></span>
                  <span className="text-zinc-300">Scheduled Driver Journey</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1.5 bg-cyan-400 inline-block rounded"></span>
                  <span className="text-zinc-350">Requested Rider Travel</span>
                </div>
                {activeMatch && (
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-1.5 bg-emerald-500 inline-block rounded"></span>
                    <span className="text-emerald-400 font-bold">P2P Shared Overlap Segment</span>
                  </div>
                )}
              </div>
            </div>
          </APIProvider>
        ) : (
          /* High-Fidelity Tactical SVG Corridor Simulator fallback */
          <>
            {/* Map Header Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-[#161618]/95 border border-zinc-800 backdrop-blur-md px-4 py-3 rounded-xl flex items-center justify-between gap-4 max-w-sm shadow-lg">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  Geospatial Match Engine
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Analyzing regional paths on Gachibowli Ring Road and transit sectors
                </p>
              </div>
            </div>

            {/* Map Legend (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-10 bg-[#161618]/90 border border-zinc-800 backdrop-blur-md p-3 rounded-lg text-xs leading-none flex flex-col gap-2 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-zinc-700 inline-block rounded"></span>
                <span className="text-zinc-500 font-mono text-[10px]">ROAD CORRIDOR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-yellow-400/80 inline-block rounded"></span>
                <span className="text-zinc-400">Driver Journey</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-cyan-400/80 inline-block rounded"></span>
                <span className="text-zinc-400">Requested Path</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-emerald-400 inline-block rounded shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                <span className="text-emerald-400 font-semibold font-mono">P2P Overlap Match</span>
              </div>
            </div>

            {/* Detail Overlay of Hovered Node */}
            <AnimatePresence>
              {hoveredNode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-4 z-10 bg-[#161618] border border-zinc-800 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl max-w-xs"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="text-rose-500 w-4.5 h-4.5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-xs text-white">{hoveredNode.name}</h4>
                      <div className="text-[10px] text-mono text-zinc-400 mt-1 space-y-0.5">
                        <p>Lat: {hoveredNode.lat.toFixed(4)}° / Lng: {hoveredNode.lng.toFixed(4)}°</p>
                        <p className="capitalize text-emerald-400 font-semibold">
                          Type: {hoveredNode.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SVG Interactive Canvas Map */}
            <div className="flex-1 w-full h-[580px] p-4 flex items-center justify-center relative select-none">
              <svg
                viewBox="100 0 400 660"
                className="w-full h-full max-h-[580px]"
                style={{ backgroundImage: 'radial-gradient(rgba(39, 39, 42, 0.45) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
              >
                <defs>
                  <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <text x="120" y="30" fill="#4B5563" fontSize="10" fontFamily="monospace">GRID B1</text>
                <text x="450" y="30" fill="#4B5563" fontSize="10" fontFamily="monospace">GRID C1</text>
                <text x="120" y="620" fill="#4B5563" fontSize="10" fontFamily="monospace">BAY AREA METRO (SOUTH)</text>

                {/* Draw Roads Map Connections */}
                {MAP_CONNECTIONS.map((c, idx) => {
                  const startNode = MAP_NODES.find(n => n.id === c.from);
                  const endNode = MAP_NODES.find(n => n.id === c.to);
                  if (!startNode || !endNode) return null;

                  return (
                    <g key={`conn-${idx}`}>
                      <line
                        x1={startNode.x}
                        y1={startNode.y}
                        x2={endNode.x}
                        y2={endNode.y}
                        stroke="#18181B"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <line
                        x1={startNode.x}
                        y1={startNode.y}
                        x2={endNode.x}
                        y2={endNode.y}
                        stroke="#27272A"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={(startNode.x + endNode.x) / 2}
                        cy={(startNode.y + endNode.y) / 2}
                        r="5"
                        fill="#0A0A0B"
                        stroke="#27272A"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {/* Highlight Driver simulated journey */}
                {selectedRide && driverPath.pointsString && (
                  <motion.polyline
                    points={driverPath.pointsString}
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                    initial={{ strokeDasharray: 500, strokeDashoffset: 500 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                )}

                {/* Highlight Rider simulated request */}
                {selectedRequest && riderPath.pointsString && (
                  <motion.polyline
                    points={riderPath.pointsString}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                    initial={{ strokeDasharray: 500, strokeDashoffset: 500 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                )}

                {/* Overlap P2P match simulated line */}
                {activeMatch && overlapPath.pointsString && (
                  <motion.polyline
                    points={overlapPath.pointsString}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow-emerald)"
                    initial={{ strokeDasharray: 400, strokeDashoffset: 400 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                )}

                {/* Simulated Car indicator looping driver route */}
                {animatingCar && (
                  <g>
                    <circle cx={animatingCar.x} cy={animatingCar.y} r="16" fill="url(#nodeGrad)" className="animate-pulse" />
                    <circle cx={animatingCar.x} cy={animatingCar.y} r="9" fill="#eab308" />
                    <circle cx={animatingCar.x} cy={animatingCar.y} r="5" fill="#78350f" />
                  </g>
                )}

                {/* Render Corridor nodes */}
                {MAP_NODES.map((node) => {
                  const isDriverStop = driverPath.nodes.some(n => n.id === node.id);
                  const isRiderStop = riderPath.nodes.some(n => n.id === node.id);
                  const isOverlapStop = overlapPath.nodes.some(n => n.id === node.id);

                  let nodeColor = '#475569';
                  let nodeSize = 10;

                  if (isOverlapStop) {
                    nodeColor = '#10b981';
                    nodeSize = 13;
                  } else if (isRiderStop) {
                    nodeColor = '#06b6d4';
                    nodeSize = 11;
                  } else if (isDriverStop) {
                    nodeColor = '#eab308';
                    nodeSize = 11;
                  }

                  const isHovered = hoveredNode?.id === node.id;
                  if (isHovered) {
                    nodeSize += 3;
                  }

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => onSelectNode?.(node)}
                    >
                      {(isOverlapStop || isRiderStop || isDriverStop || isHovered) && (
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeSize + 6}
                          fill={nodeColor}
                          opacity="0.15"
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeSize}
                        fill="#0A0A0B"
                        stroke={nodeColor}
                        strokeWidth="3.5"
                      />

                      <circle cx={node.x} cy={node.y} r={nodeSize - 6 > 1 ? nodeSize - 6 : 2} fill={nodeColor} />

                      {(node.type === 'university' || node.type === 'airport' || isHovered || isOverlapStop) && (
                        <text
                          x={node.x + 14}
                          y={node.y + 4}
                          fill={isHovered ? "#ffffff" : isOverlapStop ? "#34d399" : "#cbd5e1"}
                          fontSize="10"
                          fontWeight={isHovered || isOverlapStop ? "bold" : "normal"}
                          fontFamily="sans-serif"
                          className="pointer-events-none drop-shadow-md select-none animate-fade-in"
                        >
                          {node.name.split(' (')[0]}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Map Segment Footer status */}
      <div className="bg-[#0F0F11]/90 border-t border-zinc-800 p-3.5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Algorithm: Overpassing Path Intersector ({viewMode === 'live' ? 'Live Routing Enabled' : 'Simulated'})</span>
        </div>
        <div className="font-mono text-[11px] text-cyan-400 font-semibold bg-cyan-950/30 border border-cyan-900/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
          REAL-TIME MATCH ACTIVE
        </div>
      </div>
    </div>
  );
}
