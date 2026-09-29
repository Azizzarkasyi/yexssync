import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Crosshair, MapPin, Maximize2, RefreshCw } from 'lucide-react-native';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { APP_ENV } from '@/config/env';

export interface InlineLeafletMapProps {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  height?: number;
  onLocationChange: (lat: number, lng: number) => void;
  onOpenFullscreenPicker?: () => void;
  editable?: boolean;
}

export const InlineLeafletMap: React.FC<InlineLeafletMapProps> = ({
  latitude,
  longitude,
  radius = APP_ENV.MAP.DEFAULT_RADIUS,
  height = 260,
  onLocationChange,
  onOpenFullscreenPicker,
  editable = true,
}) => {
  const theme = useAdminTheme();
  const iframeRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Default coordinates from .env if null
  const currentLat = latitude !== undefined && latitude !== null && !isNaN(Number(latitude))
    ? Number(latitude)
    : APP_ENV.MAP.DEFAULT_LAT;
  const currentLng = longitude !== undefined && longitude !== null && !isNaN(Number(longitude))
    ? Number(longitude)
    : APP_ENV.MAP.DEFAULT_LNG;
  const currentRadius = radius && radius > 0 ? radius : 50;

  // Listen for postMessage from Leaflet iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.data && event.data.type === 'PIN_MOVED') {
          const lat = parseFloat(Number(event.data.lat).toFixed(6));
          const lng = parseFloat(Number(event.data.lng).toFixed(6));
          onLocationChange(lat, lng);
        }
      } catch (err) {
        console.error('Error handling map postMessage:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onLocationChange]);

  // Update iframe map when coordinates or radius change
  useEffect(() => {
    if (Platform.OS === 'web' && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'UPDATE_VIEW',
          lat: currentLat,
          lng: currentLng,
          radius: currentRadius,
        },
        '*'
      );
    }
  }, [currentLat, currentLng, currentRadius]);

  // Use browser geolocation GPS
  const handleUseCurrentLocation = () => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          onLocationChange(lat, lng);
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              { type: 'UPDATE_VIEW', lat, lng, radius: currentRadius },
              '*'
            );
          }
        },
        (err) => {
          setIsLocating(false);
          if (typeof window !== 'undefined') {
            window.alert('Gagal mengambil lokasi GPS: ' + err.message);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      if (typeof window !== 'undefined') {
        window.alert('Perangkat atau browser tidak mendukung akses geolokasi.');
      }
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          #map { width: 100%; height: 100%; }
          .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
          .leaflet-popup-content { font-size: 12px; margin: 10px 14px; line-height: 1.4; color: #1e293b; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var lat = ${currentLat};
          var lng = ${currentLng};
          var radius = ${currentRadius};
          var isEditable = ${editable};

          var map = L.map('map', { zoomControl: false }).setView([lat, lng], 17);
          L.control.zoom({ position: 'topleft' }).addTo(map);

          L.tileLayer('${APP_ENV.MAP.TILE_URL}', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var marker = L.marker([lat, lng], { draggable: isEditable }).addTo(map);
          marker.bindPopup("<b>Titik Lokasi Kerja</b><br>Geser pin atau klik peta untuk ubah.").openPopup();

          var circle = L.circle([lat, lng], {
            radius: radius,
            color: '#2a75d3',
            weight: 2,
            fillColor: '#2a75d3',
            fillOpacity: 0.18
          }).addTo(map);

          function notifyMoved(newLat, newLng) {
            window.parent.postMessage({
              type: 'PIN_MOVED',
              lat: newLat,
              lng: newLng
            }, '*');
          }

          if (isEditable) {
            marker.on('dragend', function(e) {
              var pos = marker.getLatLng();
              circle.setLatLng(pos);
              notifyMoved(pos.lat, pos.lng);
            });

            map.on('click', function(e) {
              marker.setLatLng(e.latlng);
              circle.setLatLng(e.latlng);
              notifyMoved(e.latlng.lat, e.latlng.lng);
            });
          }

          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'UPDATE_VIEW') {
              var nLat = Number(e.data.lat);
              var nLng = Number(e.data.lng);
              var nRad = Number(e.data.radius);
              if (!isNaN(nLat) && !isNaN(nLng)) {
                marker.setLatLng([nLat, nLng]);
                circle.setLatLng([nLat, nLng]);
                if (!isNaN(nRad) && nRad > 0) {
                  circle.setRadius(nRad);
                }
                map.setView([nLat, nLng], map.getZoom());
              }
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.borderColor,
        position: 'relative',
        backgroundColor: theme.isDark ? '#1e293b' : '#f0f5fa',
        marginBottom: 16,
      }}
    >
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Leaflet Map Geofence"
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MapPin size={32} color={theme.primaryBlue} />
          <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>
            Lat: {currentLat.toFixed(6)}, Lng: {currentLng.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Top Floating Badge with coordinates & radius */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          zIndex: 10,
        }}
      >
        <MapPin size={13} color={theme.primaryBlue} />
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#1e293b' }}>
          {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
        </Text>
        <Text style={{ fontSize: 11, color: '#64748b' }}>
          (Radius: {currentRadius}m)
        </Text>
      </View>

      {/* Bottom Floating Actions */}
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          flexDirection: 'row',
          gap: 8,
          zIndex: 10,
        }}
      >
        {/* GPS Button */}
        <TouchableOpacity
          onPress={handleUseCurrentLocation}
          disabled={isLocating}
          style={{
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={theme.primaryBlue} />
          ) : (
            <Crosshair size={14} color={theme.primaryBlue} />
          )}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>
            GPS Saya
          </Text>
        </TouchableOpacity>

        {/* Fullscreen Picker Button */}
        {onOpenFullscreenPicker && (
          <TouchableOpacity
            onPress={onOpenFullscreenPicker}
            style={{
              backgroundColor: theme.primaryBlue,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Maximize2 size={13} color="#ffffff" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff' }}>
              Peta Penuh
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default InlineLeafletMap;
