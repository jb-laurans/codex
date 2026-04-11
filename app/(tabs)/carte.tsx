// app/(tabs)/carte.tsx
// Carte interactive OpenStreetMap via Leaflet dans un WebView
// Aucune clé API nécessaire !

import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useGame } from '../../context/GameContext';
import { CHAPTERS, MAP_LOCATIONS } from '../../data/story';

const C = {
  bg: '#0a0a0f', surface: '#12121c', border: '#2a2a3a',
  gold: '#c9a84c', goldDark: '#7a5a1a', parchment: '#e8d9b5',
  muted: '#6a6a8a', faint: '#3a3a4a',
};

const { height } = Dimensions.get('window');

// ─── HTML Leaflet ──────────────────────────────────────────────
function buildLeafletHTML(
  locations: typeof MAP_LOCATIONS,
  customMarkers: { id: string; lat: number; lng: number; label: string; color: string }[],
  discoveredLocations: { id: string; lat: number; lng: number; title: string; emoji: string }[]
) {
  // ✅ JSON.stringify gère tous les caractères spéciaux automatiquement
  const dataJS = `
    var STORY_LOCS    = ${JSON.stringify(locations)};
    var CUSTOM_MARKERS = ${JSON.stringify(customMarkers)};
    var DISC_LOCS     = ${JSON.stringify(discoveredLocations)};
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; background:#0a0a0f; }
    .leaflet-popup-content-wrapper {
      background:#1a1a28; color:#e8d9b5;
      border:1px solid #c9a84c; border-radius:8px;
    }
    .leaflet-popup-tip { background:#1a1a28; }
    .leaflet-tile-pane {
      filter: sepia(0.8) contrast(0.95) brightness(0.85) saturate(0.4);
    }
    @keyframes pulse {
      0%   { transform: scale(1);   opacity: 0.8; }
      70%  { transform: scale(2.2); opacity: 0;   }
      100% { transform: scale(1);   opacity: 0;   }
    }
  </style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script>
  ${dataJS}

  function waitForLeaflet() {
    if (typeof L !== 'undefined') { initMap(); }
    else { setTimeout(waitForLeaflet, 100); }
  }

  function initMap() {
    var map = L.map('map', { zoomControl: true, attributionControl: false })
      .setView([47.85, 2.35], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    // ── Lieux de l'histoire ──
    STORY_LOCS.forEach(function(loc) {
      var icon = L.divIcon({
        html: '<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8))">' + loc.emoji + '</div>',
        iconSize: [32, 32], iconAnchor: [16, 16], className: ''
      });
      L.marker([loc.lat, loc.lng], { icon: icon })
        .bindPopup(
          '<b style="color:#c9a84c">' + loc.emoji + ' ' + loc.name + '</b>' +
          '<br><small style="color:#999">' + loc.subtitle + '</small>' +
          '<br><span style="color:#ccc;font-size:12px">' + loc.description + '</span>'
        )
        .addTo(map);
    });

    // ── Repères personnels ──
    CUSTOM_MARKERS.forEach(function(m) {
      L.circleMarker([m.lat, m.lng], {
        radius: 10, color: m.color, fillColor: m.color,
        fillOpacity: 0.8, weight: 2
      })
        .bindPopup('<b style="color:' + m.color + '">' + m.label + '</b>')
        .addTo(map);
    });

    // ── Lieux découverts (pulsants) ──
    DISC_LOCS.forEach(function(loc) {
      var icon = L.divIcon({
        html: '<div style="position:relative;width:36px;height:36px;">'
            + '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(201,168,76,0.25);border:2px solid #c9a84c;animation:pulse 1.8s ease-out infinite;"></div>'
            + '<div style="position:absolute;inset:6px;border-radius:50%;background:#c9a84c;display:flex;align-items:center;justify-content:center;font-size:14px;">' + loc.emoji + '</div>'
            + '</div>',
        iconSize: [36, 36], iconAnchor: [18, 18], className: ''
      });
      L.marker([loc.lat, loc.lng], { icon: icon })
        .bindPopup(
          '<b style="color:#c9a84c">\uD83D\uDD13 ' + loc.title + '</b>' +
          '<br><small style="color:#4ecdc4">Lieu d\u00e9couvert dans l\u2019enqu\u00eate</small>'
        )
        .addTo(map);
    });

    // ── Appui long = nouveau repère ──
    map.on('contextmenu', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ADD_MARKER', lat: e.latlng.lat, lng: e.latlng.lng
      }));
    });
  }

  waitForLeaflet();
<\/script>
</body>
</html>`;
}

// ─── Légende ──────────────────────────────────────────────────
function LegendItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <Text style={{ fontSize: 16 }}>{emoji}</Text>
      <Text style={{ color: C.muted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}



// ─── Écran Carte ──────────────────────────────────────────────
export default function CarteScreen() {
  const { state, dispatch } = useGame();

  const unlockedMapLocations = MAP_LOCATIONS.filter(loc =>
    CHAPTERS.find(ch => ch.id === loc.chapter)
      ?.scenes.some(sceneId => state.unlockedScenes.includes(sceneId))
    ?? false
  );

  const discoveredLocations = state.discoveries
    .filter(d => d.type === 'location' && d.lat != null && d.lng != null)
    .map(d => ({
      id: d.id,
      lat: d.lat!,
      lng: d.lng!,
      title: d.title,
      emoji: d.emoji,
    }));
  const webviewRef = useRef<WebView>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [markerLabel, setMarkerLabel] = useState('');

  //const html = buildLeafletHTML(unlockedMapLocations, state.mapMarkers, discoveredLocations);
  const html = buildLeafletHTML([], state.mapMarkers, discoveredLocations);


// const html = `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">

//   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

//   <style>
//     html, body {
//       margin: 0;
//       padding: 0;
//       height: 100%;
//       background: black;
//     }

//     #map {
//       width: 100%;
//       height: 100%;
//     }
//   </style>
// </head>

// <body>
//   <div id="map"></div>

//   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

//   <script>
//     document.addEventListener("DOMContentLoaded", function () {
//       console.log("DOM loaded");

//       function init() {
//         if (typeof L === "undefined") {
//           console.log("Leaflet not ready...");
//           setTimeout(init, 200);
//           return;
//         }

//         console.log("Leaflet loaded ✅");

//         var map = L.map('map').setView([47.85, 2.35], 6);

//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//           maxZoom: 18,
//         }).addTo(map);

//         L.marker([48.8566, 2.3522])
//           .addTo(map)
//           .bindPopup("Paris 🔍")
//           .openPopup();
//       }

//       init();
//     });
//   </script>
// </body>
// </html>
// `;


  

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ADD_MARKER') {
        setPendingMarker({ lat: msg.lat, lng: msg.lng });
      } else if (msg.type === 'DELETE_MARKER') {
        dispatch({ type: 'DELETE_MAP_MARKER', payload: msg.id });
      }
    } catch {}
  };

  const addMarker = (label: string) => {
    if (!pendingMarker) return;
    dispatch({
      type: 'ADD_MAP_MARKER',
      payload: { ...pendingMarker, label: label || 'Repère', color: '#c9a84c' },
    });
    setPendingMarker(null);
    setMarkerLabel('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ CARTE</Text>
        <TouchableOpacity
          style={styles.legendBtn}
          onPress={() => setShowLegend(v => !v)}
        >
          <Text style={styles.legendBtnText}>{showLegend ? '✕' : 'Légende'}</Text>
        </TouchableOpacity>
      </View>

      {/* Légende */}
      {showLegend && (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Lieux de l'enquête</Text>
          {discoveredLocations.map(loc => (
            <LegendItem
                key={loc.id}
                emoji={loc.emoji}
                label={loc.title}
            />
            ))}
          <Text style={[styles.legendTitle, { marginTop: 10 }]}>Repères personnels</Text>
          <Text style={{ color: C.muted, fontSize: 11 }}>
            Appui long sur la carte pour ajouter un repère
          </Text>
        </View>
      )}

      {/* WebView Leaflet */}
      <View style={styles.mapContainer}>
        <WebView
            ref={webviewRef}
            source={{ html }}
            style={{ flex: 1, backgroundColor: C.bg }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            />
      </View>

      {/* Repères perso */}
      {state.mapMarkers.length > 0 && (
        <View style={styles.markersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {state.mapMarkers.map(m => (
              <TouchableOpacity
                key={m.id}
                style={styles.markerChip}
                onLongPress={() => {
                  Alert.alert('Supprimer ?', m.label, [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_MAP_MARKER', payload: m.id }) },
                  ]);
                }}
              >
                <Text style={styles.markerChipDot}>●</Text>
                <Text style={styles.markerChipText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Modal ajout repère */}
      {pendingMarker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📍 Nouveau repère</Text>
            <Text style={styles.modalCoords}>
              {pendingMarker.lat.toFixed(5)}° N  {pendingMarker.lng.toFixed(5)}° E
            </Text>
            {/* Simple text input via Alert pour garder les dépendances au minimum */}
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.gold }]}
              onPress={() => {
                Alert.prompt
                  ? Alert.prompt('Nom du repère', '', (text) => addMarker(text || 'Repère'))
                  : addMarker('Repère ' + (state.mapMarkers.length + 1));
              }}
            >
              <Text style={{ color: '#000', fontWeight: '700' }}>Nommer et poser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setPendingMarker(null)}
            >
              <Text style={{ color: C.muted }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { color: C.gold, fontSize: 16, fontWeight: '800', letterSpacing: 3 },
  legendBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  legendBtnText: { color: C.muted, fontSize: 13 },

  legend: {
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
    padding: 14,
  },
  legendTitle: {
    color: C.goldDark, fontSize: 10, letterSpacing: 2,
    marginBottom: 8, textTransform: 'uppercase',
  },

  mapContainer: { flex: 1 },

  markersBar: {
    borderTopWidth: 1, borderTopColor: C.border,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: C.surface,
  },
  markerChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 6,
    marginRight: 8, gap: 6,
  },
  markerChipDot: { color: C.gold, fontSize: 10 },
  markerChipText: { color: C.parchment, fontSize: 12 },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: C.surface,
    borderRadius: 16, borderWidth: 1, borderColor: C.gold,
    padding: 24, width: '80%', alignItems: 'center', gap: 12,
  },
  modalTitle: { color: C.gold, fontSize: 17, fontWeight: '800' },
  modalCoords: { color: C.muted, fontSize: 12, fontFamily: 'monospace' },
  modalBtn: {
    width: '100%', backgroundColor: C.surface,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
    padding: 14, alignItems: 'center',
  },
});
