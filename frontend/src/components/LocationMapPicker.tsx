import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator,
  useWindowDimensions, Platform
} from 'react-native';
import { 
  MapPin, Search, Crosshair, X, Check, Navigation, Sliders, 
  Layers, Map, AlertCircle 
} from 'lucide-react-native';
import { APP_ENV } from '@/config/env';

export interface LocationPickerResult {
  latitude: number;
  longitude: number;
  radius: number;
  name?: string;
  address?: string;
}

interface LocationMapPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (result: LocationPickerResult) => void;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialRadius?: number | null;
  title?: string;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLatitude,
  initialLongitude,
  initialRadius = 50,
  title = 'Tentukan Titik Lokasi Presensi',
}) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Default coordinates from .env if null
  const defaultLat = initialLatitude || APP_ENV.MAP.DEFAULT_LAT;
  const defaultLng = initialLongitude || APP_ENV.MAP.DEFAULT_LNG;
  const defaultRadius = initialRadius && initialRadius > 0 ? initialRadius : APP_ENV.MAP.DEFAULT_RADIUS;

  const [currentLat, setCurrentLat] = useState<number>(defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(defaultLng);
  const [radius, setRadius] = useState<number>(defaultRadius);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addressName, setAddressName] = useState('');
  const iframeRef = useRef<any>(null);

  // Sync when initial coordinates change
  useEffect(() => {
    if (visible) {
      const lat = initialLatitude || APP_ENV.MAP.DEFAULT_LAT;
      const lng = initialLongitude || APP_ENV.MAP.DEFAULT_LNG;
      const rad = initialRadius && initialRadius > 0 ? initialRadius : APP_ENV.MAP.DEFAULT_RADIUS;
      setCurrentLat(lat);
      setCurrentLng(lng);
      setRadius(rad);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible, initialLatitude, initialLongitude, initialRadius]);

  // Listen for postMessage from Leaflet iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.data && event.data.type === 'PIN_MOVED') {
          const lat = parseFloat(Number(event.data.lat).toFixed(6));
          const lng = parseFloat(Number(event.data.lng).toFixed(6));
          setCurrentLat(lat);
          setCurrentLng(lng);
          if (event.data.address) {
            setAddressName(event.data.address);
          }
        }
      } catch (err) {
        console.error('Error handling map postMessage:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update iframe map when coordinates or radius change
  const sendUpdateToIframe = (lat: number, lng: number, rad: number) => {
    if (Platform.OS === 'web' && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'UPDATE_VIEW', lat, lng, radius: rad },
        '*'
      );
    }
  };

  // Search Address with Nominatim OpenStreetMap
  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `${APP_ENV.MAP.GEOCODING_URL}/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=id&limit=5`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(Number(item.lat).toFixed(6));
    const lng = parseFloat(Number(item.lon).toFixed(6));
    setCurrentLat(lat);
    setCurrentLng(lng);
    setAddressName(item.display_name);
    setSearchResults([]);
    setSearchQuery(item.display_name.split(',')[0]);
    sendUpdateToIframe(lat, lng, radius);
  };

  // GPS Current Location
  const handleUseCurrentLocation = () => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setCurrentLat(lat);
          setCurrentLng(lng);
          setAddressName('Lokasi Perangkat Saya (GPS)');
          sendUpdateToIframe(lat, lng, radius);
        },
        (err) => {
          alert('Gagal mengambil lokasi GPS: ' + err.message);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Change Radius
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    sendUpdateToIframe(currentLat, currentLng, newRadius);
  };

  const handleConfirm = () => {
    onSelectLocation({
      latitude: currentLat,
      longitude: currentLng,
      radius: radius,
      address: addressName,
    });
    onClose();
  };

  // HTML content for self-contained Leaflet Map
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: sans-serif; }
          #map { width: 100%; height: 100%; }
          .custom-pin {
            background-color: #2563eb;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var lat = ${currentLat};
          var lng = ${currentLng};
          var radius = ${radius};

          var map = L.map('map', { zoomControl: false }).setView([lat, lng], 17);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          L.tileLayer('${APP_ENV.MAP.TILE_URL}', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          var marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.bindPopup("<b>Titik Presensi</b><br>Geser pin ini ke lokasi yang tepat.").openPopup();

          var circle = L.circle([lat, lng], {
            radius: radius,
            color: '#2563eb',
            weight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.2
          }).addTo(map);

          function notifyMoved(newLat, newLng) {
            window.parent.postMessage({
              type: 'PIN_MOVED',
              lat: newLat,
              lng: newLng
            }, '*');
          }

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

          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'UPDATE_VIEW') {
              var nLat = e.data.lat;
              var nLng = e.data.lng;
              var nRad = e.data.radius;
              marker.setLatLng([nLat, nLng]);
              circle.setLatLng([nLat, nLng]);
              circle.setRadius(nRad);
              map.setView([nLat, nLng], map.getZoom());
            }
          });
        </script>
      </body>
    </html>
  `;

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-3 sm:p-6">
        <View 
          style={{ width: isDesktop ? '80%' : '100%', maxWidth: 900, height: isDesktop ? 650 : '95%' }}
          className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex-col"
        >
          {/* Header */}
          <View className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex-row justify-between items-center z-10">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-2.5">
                <MapPin size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-800 dark:text-white">{title}</Text>
                <Text className="text-[11px] text-slate-500">
                  Klik pada peta atau geser pin marker ke titik lokasi kantor / cabang
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search & Location Bar */}
          <View className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center gap-2 z-20">
            <View className="flex-1 relative">
              <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-3 h-10 bg-slate-50 dark:bg-slate-800">
                <Search size={16} color="#94a3b8" className="mr-2" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchAddress}
                  placeholder="Cari nama gedung, jalan, atau kota..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-xs text-slate-800 dark:text-white"
                />
                {isSearching && <ActivityIndicator size="small" color="#2563eb" className="mr-1" />}
                <TouchableOpacity
                  onPress={handleSearchAddress}
                  className="px-2.5 py-1 bg-blue-600 rounded-md ml-1"
                >
                  <Text className="text-[11px] font-bold text-white">Cari</Text>
                </TouchableOpacity>
              </View>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <View className="absolute top-11 left-0 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                  {searchResults.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSelectSearchResult(item)}
                      className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 flex-row items-center"
                    >
                      <MapPin size={14} color="#2563eb" className="mr-2 shrink-0" />
                      <Text className="text-xs text-slate-700 dark:text-slate-200 flex-1" numberOfLines={1}>
                        {item.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* GPS Button */}
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              accessibilityLabel="Gunakan Lokasi GPS Saya"
              className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row items-center"
            >
              <Crosshair size={16} color="#2563eb" className="mr-1.5" />
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">GPS Saya</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Map Area */}
          <View className="flex-1 bg-slate-100 relative">
            {Platform.OS === 'web' ? (
              <iframe
                ref={iframeRef}
                srcDoc={mapHtml}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Leaflet Map"
              />
            ) : (
              <View className="flex-1 items-center justify-center p-6">
                <AlertCircle size={32} color="#f59e0b" />
                <Text className="text-sm font-bold text-slate-700 mt-2">Peta Tersedia di Versi Web</Text>
              </View>
            )}

            {/* Floating Radius Controls */}
            <View className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-slate-200 dark:border-slate-800 z-30">
              <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Radius Valid: {radius} meter
              </Text>
              <View className="flex-row gap-1">
                {[25, 50, 100, 200, 500].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => handleRadiusChange(r)}
                    className={`px-2 py-1 rounded-lg border ${
                      radius === r
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Text className={`text-[10px] font-bold ${radius === r ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {r}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Bottom Coordinate Bar & Footer */}
          <View className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex-row justify-between items-center flex-wrap gap-3">
            <View className="flex-row items-center gap-3">
              <View className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <Text className="text-[10px] text-slate-400 font-bold uppercase">Latitude</Text>
                <Text className="text-xs font-mono font-bold text-slate-800 dark:text-white">{currentLat}</Text>
              </View>
              <View className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <Text className="text-[10px] text-slate-400 font-bold uppercase">Longitude</Text>
                <Text className="text-xs font-mono font-bold text-slate-800 dark:text-white">{currentLng}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                className="px-5 py-2 rounded-xl bg-[#2a75d3] hover:bg-[#1f5ca8] flex-row items-center shadow-md shadow-blue-500/20"
              >
                <Check size={14} color="#ffffff" className="mr-1.5" />
                <Text className="text-xs font-bold text-white">Gunakan Titik Lokasi Ini</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
