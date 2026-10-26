import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationCoordinate, DeviceStatus } from '../types';
import { SAFE_ZONES, isZoneSafeAtHour } from '../services/data';

interface KeralaMapProps {
  location: LocationCoordinate;
  status: DeviceStatus;
  timeOfDay: number; // 0 - 24
  interactive?: boolean; // if true, person marker can be dragged
  onLocationChange?: (newLoc: LocationCoordinate) => void;
  className?: string;
  zoomLevel?: number;
}

export const KeralaMap: React.FC<KeralaMapProps> = ({
  location,
  status,
  timeOfDay,
  interactive = false,
  onLocationChange,
  className = 'h-72 w-full rounded-2xl',
  zoomLevel = 17,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lng],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false,
    });

    // Sleek tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Subtle scale control
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Safe Zone Circles based on time of day
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing circles
    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    SAFE_ZONES.forEach((zone) => {
      const isSafe = isZoneSafeAtHour(zone, timeOfDay);
      const color = isSafe ? '#9CCDB0' : '#F0A9A0'; // sage green if safe, peach if restricted

      const circle = L.circle([zone.center.lat, zone.center.lng], {
        color: color,
        fillColor: color,
        fillOpacity: isSafe ? 0.16 : 0.08,
        weight: isSafe ? 2 : 1.5,
        dashArray: isSafe ? undefined : '5, 5',
        radius: zone.radiusMeters,
      }).addTo(map);

      circle.bindTooltip(
        `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; padding: 2px 4px;">
          <strong>${zone.name_en}</strong><br/>
          <span style="color: ${isSafe ? '#2e7d32' : '#c62828'}; font-weight: 600;">
            ${isSafe ? '✓ Safe Zone Active' : '⚠ Restricted after hours'}
          </span>
        </div>`,
        { sticky: true, direction: 'top' }
      );

      circlesRef.current.push(circle);
    });
  }, [timeOfDay]);

  // Update Person Marker with status ring and drag capability
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const getStatusColor = () => {
      switch (status) {
        case 'alert':
          return '#E57373';
        case 'warning':
          return '#F0A9A0';
        case 'offline':
          return '#8E8585';
        case 'safe':
        default:
          return '#9CCDB0';
      }
    };

    const statusColor = getStatusColor();
    const isAlerting = status === 'alert';

    const customIcon = L.divIcon({
      className: 'coresense-map-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          ${
            isAlerting
              ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: ${statusColor}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #FAF8F4; border: 3px solid ${statusColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A2527" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div style="position: absolute; bottom: -6px; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; box-shadow: 0 0 6px ${statusColor};"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!markerRef.current) {
      const marker = L.marker([location.lat, location.lng], {
        icon: customIcon,
        draggable: interactive,
      }).addTo(map);

      if (interactive) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onLocationChange) {
            onLocationChange({
              lat: pos.lat,
              lng: pos.lng,
              label: 'Custom simulated location',
            });
          }
        });
      }

      markerRef.current = marker;
    } else {
      markerRef.current.setIcon(customIcon);
      markerRef.current.setLatLng([location.lat, location.lng]);
      if (interactive) {
        markerRef.current.dragging?.enable();
      } else {
        markerRef.current.dragging?.disable();
      }
    }

    // Smoothly pan map to new location
    map.panTo([location.lat, location.lng], { animate: true, duration: 0.6 });
  }, [location, status, interactive, onLocationChange]);

  return (
    <div className={`relative overflow-hidden shadow-inner isolate z-0 ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      {interactive && (
        <div className="absolute top-2 left-2 z-[400] bg-surface-dark/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-muted-dark border border-white/5 pointer-events-none shadow-md flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-peach animate-pulse"></span>
          Drag pin to simulate movement
        </div>
      )}
    </div>
  );
};
