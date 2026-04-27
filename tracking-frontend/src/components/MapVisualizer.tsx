import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Well-known city coordinates to avoid geocoding delays
const CITY_COORDS: Record<string, [number, number]> = {
  'new york,ny': [-74.006, 40.7128],
  'brooklyn,ny': [-73.9442, 40.6782],
  'chicago,il': [-87.6298, 41.8781],
  'los angeles,ca': [-118.2437, 34.0522],
  'san francisco,ca': [-122.4194, 37.7749],
  'las vegas,nv': [-115.1398, 36.1699],
  'austin,tx': [-97.7431, 30.2672],
  'atlanta,ga': [-84.388, 33.749],
  'seattle,wa': [-122.3321, 47.6062],
  'denver,co': [-104.9903, 39.7392],
  'miami,fl': [-80.1918, 25.7617],
  'boston,ma': [-71.0589, 42.3601],
  'dallas,tx': [-96.797, 32.7767],
  'houston,tx': [-95.3698, 29.7604],
  'phoenix,az': [-112.074, 33.4484],
  'portland,or': [-122.6765, 45.5152],
  'boise,id': [-116.2023, 43.615],
  'bakersfield,ca': [-119.0187, 35.3733],
  'jackson,ms': [-90.1848, 32.2988],
};

interface MapProps {
  trackingId: string;
  shipment?: any;
  mapboxToken?: string;
}

export default function MapVisualizer({ trackingId, shipment, mapboxToken }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const getCoords = (city: string, province: string): [number, number] | null => {
    const key = `${city},${province}`.toLowerCase();
    return CITY_COORDS[key] || null;
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = mapboxToken || '';
    if (!token) return;
    mapboxgl.accessToken = token;

    // Get coordinates from shipment data
    let originLngLat: [number, number] = [-74.006, 40.7128];
    let destLngLat: [number, number] = [-118.2437, 34.0522];

    if (shipment?.origin?.city && shipment?.origin?.province) {
      const coords = getCoords(shipment.origin.city, shipment.origin.province);
      if (coords) originLngLat = coords;
    }
    if (shipment?.destination?.city && shipment?.destination?.province) {
      const coords = getCoords(shipment.destination.city, shipment.destination.province);
      if (coords) destLngLat = coords;
    }

    const centerLng = (originLngLat[0] + destLngLat[0]) / 2;
    const centerLat = (originLngLat[1] + destLngLat[1]) / 2;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [centerLng, centerLat],
      zoom: 3,
      pitch: 30,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      if (!map.current) return;
      setMapReady(true);

      // Origin Marker (White)
      new mapboxgl.Marker({ color: '#ffffff', scale: 0.8 })
        .setLngLat(originLngLat)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="font-family:sans-serif;font-weight:800;text-transform:uppercase;font-size:11px;letter-spacing:1px;">Origin<br/><span style="font-weight:400;font-size:10px;color:#666;">${shipment?.origin?.city || 'Unknown'}, ${shipment?.origin?.province || ''}</span></div>`
        ))
        .addTo(map.current);

      // Destination Marker (Yellow)
      new mapboxgl.Marker({ color: '#FFD600', scale: 0.8 })
        .setLngLat(destLngLat)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="font-family:sans-serif;font-weight:800;text-transform:uppercase;font-size:11px;letter-spacing:1px;">Destination<br/><span style="font-weight:400;font-size:10px;color:#666;">${shipment?.destination?.city || 'Unknown'}, ${shipment?.destination?.province || ''}</span></div>`
        ))
        .addTo(map.current);

      // Draw Route
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [originLngLat, destLngLat]
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#FFD600',
          'line-width': 3,
          'line-dasharray': [2, 2]
        }
      });

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(originLngLat);
      bounds.extend(destLngLat);
      map.current.fitBounds(bounds, { padding: 60 });

      setTimeout(() => map.current?.resize(), 300);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full border-4 border-black bg-gray-900 overflow-hidden" style={{ height: '380px' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Label overlay */}
      <div className="absolute top-4 left-4 bg-black/90 text-[#FFD600] px-4 py-2 text-[10px] font-black uppercase tracking-widest z-10 backdrop-blur-sm">
        Live Trajectory
      </div>

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Map…</p>
          </div>
        </div>
      )}
    </div>
  );
}
