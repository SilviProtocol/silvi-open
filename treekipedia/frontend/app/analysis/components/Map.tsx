'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { analyzePlot } from '@/lib/api';
import { PlotAnalysisResponse, GeoJSONPolygon } from '@/lib/types';
import { Layers } from 'lucide-react';

// Fix Leaflet icon issues with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  onAnalysisComplete: (results: PlotAnalysisResponse) => void;
  onAnalysisError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onClear: () => void;
}

// Drawing control component that uses the map instance
function DrawControl({ onAnalysisComplete, onAnalysisError, onLoadingChange, onClear }: MapProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // Create draw control
    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#b00b00',
            timeout: 1000
          }
        },
        circle: false,
        rectangle: {
          showArea: true
        },
        marker: false,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });

    map.addControl(drawControl);

    // Handle drawing completion
    const onDrawCreated = async (e: any) => {
      const { layer } = e;
      // Force clear all existing layers and results before adding new one
      drawnItems.clearLayers();
      onClear(); // Clear previous results immediately
      drawnItems.addLayer(layer);

      try {
        onLoadingChange(true);

        // Convert Leaflet polygon to GeoJSON
        const geoJson = layer.toGeoJSON();
        const geometry: GeoJSONPolygon = {
          type: 'Polygon',
          coordinates: geoJson.geometry.coordinates
        };

        console.log('Analyzing polygon:', geometry);
        
        // Call the analyze-plot API
        const results = await analyzePlot(geometry);
        console.log('Analysis results:', results);
        
        onAnalysisComplete(results);
      } catch (error) {
        console.error('Analysis error:', error);
        onAnalysisError(error instanceof Error ? error.message : 'Failed to analyze plot');
      } finally {
        onLoadingChange(false);
      }
    };

    // Handle layer removal
    const onDrawDeleted = (e: any) => {
      // Ensure all layers are properly cleared
      drawnItems.clearLayers();
      onClear();
    };

    const onDrawEdited = async (e: any) => {
      const layers = e.layers;
      layers.eachLayer(async (layer: any) => {
        try {
          onLoadingChange(true);
          onClear();

          const geoJson = layer.toGeoJSON();
          const geometry: GeoJSONPolygon = {
            type: 'Polygon',
            coordinates: geoJson.geometry.coordinates
          };

          const results = await analyzePlot(geometry);
          onAnalysisComplete(results);
        } catch (error) {
          console.error('Analysis error:', error);
          onAnalysisError(error instanceof Error ? error.message : 'Failed to analyze plot');
        } finally {
          onLoadingChange(false);
        }
      });
    };

    // Add event listeners
    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);
    map.on(L.Draw.Event.EDITED, onDrawEdited);

    // Cleanup
    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
      map.off(L.Draw.Event.EDITED, onDrawEdited);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onAnalysisComplete, onAnalysisError, onLoadingChange, onClear]);

  return null;
}

// Ecoregion layer component
function EcoregionLayer({ visible }: { visible: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  const [loading, setLoading] = useState(false);

  useMapEvents({
    moveend: () => {
      if (visible) {
        loadEcoregions();
      }
    }
  });

  const loadEcoregions = async () => {
    if (!visible || loading) return;

    const bounds = map.getBounds();
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    // Adjust simplification based on zoom level
    const zoom = map.getZoom();
    const simplify = zoom < 5 ? 0.1 : zoom < 8 ? 0.05 : 0.01;

    try {
      setLoading(true);
      const response = await fetch(`https://treekipedia-api.silvi.earth/api/geospatial/ecoregions/boundaries?bbox=${bbox}&simplify=${simplify}`);
      const data = await response.json();

      // Remove old layer
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }

      // Add new layer
      layerRef.current = L.geoJSON(data, {
        style: (feature) => ({
          color: feature?.properties?.color || '#00ff00',
          weight: 1,
          opacity: 0.6,
          fillOpacity: 0.1,
          fillColor: feature?.properties?.color_bio || '#00ff00'
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">${feature.properties.eco_name}</h3>
              <p class="text-sm">${feature.properties.biome_name}</p>
              <p class="text-xs text-gray-500">${feature.properties.realm}</p>
            </div>
          `);
        }
      });

      layerRef.current.addTo(map);
    } catch (error) {
      console.error('Error loading ecoregions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadEcoregions();
    } else if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [visible]);

  return null;
}

// External polygon display component
function ExternalPolygonLayer({ geometry }: { geometry: GeoJSONPolygon | null }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    // Remove previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    // Add new layer if geometry exists
    if (geometry) {
      layerRef.current = L.geoJSON(geometry, {
        style: {
          color: '#3388ff',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.2
        }
      });
      
      layerRef.current.addTo(map);
      
      // Fit map to bounds
      const bounds = layerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, geometry]);

  return null;
}

export default function Map({ onAnalysisComplete, onAnalysisError, onLoadingChange, onClear }: MapProps) {
  const [externalGeometry, setExternalGeometry] = useState<GeoJSONPolygon | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showEcoregions, setShowEcoregions] = useState(false);

  // Function to handle externally provided geometry (from KML upload)
  const handleExternalGeometry = async (geometry: GeoJSONPolygon) => {
    try {
      onLoadingChange(true);
      onClear();
      
      setExternalGeometry(geometry);
      
      const results = await analyzePlot(geometry);
      onAnalysisComplete(results);
    } catch (error) {
      console.error('Analysis error:', error);
      onAnalysisError(error instanceof Error ? error.message : 'Failed to analyze plot');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[20, 0]} // Global view center
        zoom={2} // World-level zoom
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
        />
        
        <DrawControl
          onAnalysisComplete={onAnalysisComplete}
          onAnalysisError={onAnalysisError}
          onLoadingChange={onLoadingChange}
          onClear={onClear}
        />

        <ExternalPolygonLayer geometry={externalGeometry} />

        <EcoregionLayer visible={showEcoregions} />
      </MapContainer>
      
      {/* Ecoregion toggle button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowEcoregions(!showEcoregions)}
          className={`bg-black/80 backdrop-blur-md border ${
            showEcoregions ? 'border-emerald-500 text-emerald-300' : 'border-white/20 text-white/80'
          } rounded-xl shadow-lg p-3 transition-all hover:scale-105 flex items-center gap-2`}
          aria-label="Toggle ecoregion boundaries"
        >
          <Layers className="w-5 h-5" />
          <span className="text-sm font-medium">
            {showEcoregions ? 'Hide' : 'Show'} Ecoregions
          </span>
        </button>
      </div>

      {/* Collapsible instructions overlay */}
      <div className="absolute bottom-4 left-4 z-10">
        {showInstructions ? (
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-4 max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-emerald-300">How to use:</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Minimize instructions"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• Use the polygon tool to draw an area</li>
              <li>• Use the rectangle tool for simple rectangular areas</li>
              <li>• Edit or delete drawn shapes using the edit tools</li>
              <li>• Or upload a KML file in the sidebar</li>
            </ul>
          </div>
        ) : (
          <button
            onClick={() => setShowInstructions(true)}
            className="bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-3 text-emerald-300 hover:text-emerald-200 transition-colors"
            aria-label="Show instructions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// External geometry handler is handled internally within the component