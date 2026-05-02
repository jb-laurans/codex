// app/scene/[id].tsx
// Écran de scène : image zoomable + points d'intérêt cliquables

import { AnimatedLayer } from '@/components/AnimatedLayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, AppState, Dimensions, Image, Linking, Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../../context/GameContext';
import { SCENES } from '../../data/story';

const { width: W, height: H } = Dimensions.get('window');
const IMAGE_H = H * 0.52;


const C = {
  bg: '#0a0a0f', surface: '#12121c', surfaceAlt: '#1a1a28',
  border: '#2a2a3a', gold: '#c9a84c', goldDark: '#7a5a1a',
  parchment: '#e8d9b5', muted: '#6a6a8a', faint: '#3a3a4a',
  success: '#27ae60',
};

// ─── Image zoomable via PanResponder ──────────────────────────
// (sans librairie externe — fonctionne dans Expo Go natif)
function ZoomableSceneImage({ bgColor, bgEmoji, foregroundLayers, imageUri, children }) {
  const scale      = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  

  const currentScale = useRef(1);
  const lastScale    = useRef(1);
  const initialDist  = useRef(0);

  // Valeurs réelles courantes (évite stopAnimation async)
  const curTX = useRef(0);
  const curTY = useRef(0);

  // Gestion transition 2 → 1 doigt dans le même geste
  const prevTouchCount  = useRef(0);
  const gsBaseX         = useRef(0);   // gs.dx au moment de la transition
  const gsBaseY         = useRef(0);
  const txAtTransition  = useRef(0);   // curTX au moment de la transition
  const tyAtTransition  = useRef(0);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // Helpers qui gardent curTX/curTY synchronisés
  const setTX = (v: number) => { curTX.current = v; translateX.setValue(v); };
  const setTY = (v: number) => { curTY.current = v; translateY.setValue(v); };

  const maxForScale = (s: number) => {
  const scaledWidth = W * s;
  const scaledHeight = IMAGE_H * s;

  return {
    x: Math.max(0, (scaledWidth - W) / 2),
    y: Math.max(0, (scaledHeight - IMAGE_H) / 2),
  };
};

  const MOVE_THRESHOLD = 6;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (e, gs) => {
        const n = e.nativeEvent.touches.length;
        if (n === 2) return true;
        if (currentScale.current > 1)
          return Math.abs(gs.dx) > MOVE_THRESHOLD || Math.abs(gs.dy) > MOVE_THRESHOLD;
        return false;
      },
      onMoveShouldSetPanResponderCapture: (e, gs) => {
        const n = e.nativeEvent.touches.length;
        if (n === 2) return true;
        if (currentScale.current > 1)
          return Math.abs(gs.dx) > MOVE_THRESHOLD || Math.abs(gs.dy) > MOVE_THRESHOLD;
        return false;
      },

      onPanResponderGrant: (e) => {
        const touches = e.nativeEvent.touches;
        prevTouchCount.current = touches.length;
        // Baseline au démarrage du geste = position actuelle
        gsBaseX.current = 0;
        gsBaseY.current = 0;
        txAtTransition.current = curTX.current;
        tyAtTransition.current = curTY.current;

        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          initialDist.current = Math.sqrt(dx * dx + dy * dy);
        }
        translateX.stopAnimation();
        translateY.stopAnimation();
        scale.stopAnimation();
      },

      onPanResponderMove: (e, gs) => {
        const touches = e.nativeEvent.touches;

        // ── Pinch (2 doigts) ──────────────────────────────────
        if (touches.length === 2) {
          if (prevTouchCount.current !== 2) {
            // 1→2 doigts : réinitialiser le pinch
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            initialDist.current = Math.sqrt(dx * dx + dy * dy);
            lastScale.current   = currentScale.current;
          }
          prevTouchCount.current = 2;

          const dx      = touches[0].pageX - touches[1].pageX;
          const dy      = touches[0].pageY - touches[1].pageY;
          const dist    = Math.sqrt(dx * dx + dy * dy);
          const newScale = clamp(lastScale.current * (dist / initialDist.current), 1, 12);

          currentScale.current = newScale;
          scale.setValue(newScale);

          const { x: maxX, y: maxY } = maxForScale(newScale);
          setTX(clamp(curTX.current, -maxX, maxX));
          setTY(clamp(curTY.current, -maxY, maxY));

        // ── Pan (1 doigt) ──────────────────────────────────────
        } else if (touches.length === 1 && currentScale.current > 1) {
          if (prevTouchCount.current === 2) {
            // ← FIX PRINCIPAL : transition 2 → 1 doigt
            // On fige le baseline ici pour ignorer l'accumulation du pinch
            gsBaseX.current = gs.dx;
            gsBaseY.current = gs.dy;
            txAtTransition.current = curTX.current;
            tyAtTransition.current = curTY.current;
          }
          prevTouchCount.current = 1;

          const s = currentScale.current;
          const { x: maxX, y: maxY } = maxForScale(s);

          // Delta depuis la transition (et non depuis le début du geste entier)
          const effectiveDx = gs.dx - gsBaseX.current;
          const effectiveDy = gs.dy - gsBaseY.current;

          setTX(clamp(txAtTransition.current + effectiveDx, -maxX, maxX));
          setTY(clamp(tyAtTransition.current + effectiveDy, -maxY, maxY));
        }
      },

      onPanResponderRelease: () => {
        // Sauvegarde synchrone (pas de callback async)
        lastScale.current      = currentScale.current;
        prevTouchCount.current = 0;
        gsBaseX.current        = 0;
        gsBaseY.current        = 0;
        // curTX / curTY sont déjà à jour, on les réutilise comme baseline
        txAtTransition.current = curTX.current;
        tyAtTransition.current = curTY.current;
      },
    })
  ).current;

  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(scale,      { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start(() => {
      lastScale.current      = 1;
      currentScale.current   = 1;
      curTX.current          = 0;
      curTY.current          = 0;
      txAtTransition.current = 0;
      tyAtTransition.current = 0;
    });
  };

  return (
    <View style={[styles.imageContainer, { height: IMAGE_H }]}>
      <Animated.View
        style={[
          styles.imageInner,
          { transform: [ { translateX }, { translateY },{ scale }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.imageBg, { height: IMAGE_H, backgroundColor: bgColor || '#000' }]}>
          {imageUri ? (
            <Image
              source={imageUri}
              style={{
                width: W,
                height: IMAGE_H,
                position: 'absolute',
              }}
              resizeMode="cover"
            />
          ) : bgEmoji ? (
            <Text style={styles.bgEmoji}>{bgEmoji}</Text>
          ) : null}
          {children}
          {foregroundLayers?.map((layer, i) => (
            <AnimatedLayer key={i} layer={layer} containerHeight={IMAGE_H} />
          ))}
        </View>
      </Animated.View>
      <TouchableOpacity style={styles.resetZoomBtn} onPress={resetZoom}>
        <Text style={styles.resetZoomText}>↺ Reset zoom</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Point d'intérêt cliquable ────────────────────────────────
function Hotspot({
  hotspot,
  clicked,
  onPress,
}: {
  hotspot: typeof SCENES[0]['hotspots'][0];
  clicked: boolean;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  React.useEffect(() => {
    if (!clicked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [clicked]);

  const size = hotspot.size || 52;
  const isDoor  = hotspot.navigationStyle === 'door';
  const isArrow = hotspot.navigationStyle === 'arrow';
  // ── Style PORTE ──────────────────────────────────────────────
  if (isDoor) {
    return (
      <TouchableOpacity
        style={[
          styles.hotspot,
          {
            left: `${hotspot.x}%`,
            top:  `${hotspot.y}%`,
            width: 70, height: 110,
            marginLeft: -35, marginTop: -55,
          },
        ]}
        onPress={() => { triggerFlash(); onPress(); }}
        activeOpacity={1}
      >
 <Animated.View style={[
          styles.doorBubble,
          { opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }) },
        ]}>          
          <Text style={styles.doorEmoji}>{hotspot.emoji || '🚪'}</Text>
          <Text style={styles.doorLabel}>{hotspot.label}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ── Style FLÈCHE ─────────────────────────────────────────────
  if (isArrow) {
    return (
      <TouchableOpacity
        style={[
          styles.hotspot,
          {
            left: `${hotspot.x}%`,
            top:  `${hotspot.y}%`,
            width: 52, height: 52,
            marginLeft: -26, marginTop: -26,
          },
        ]}
        onPress={() => { triggerFlash(); onPress(); }}
        activeOpacity={1}
      >
        <Animated.View style={[
          styles.arrowBubble,
          { opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.8] }) },
        ]}>
          <Text style={{ fontSize: 26 }}>{hotspot.emoji || '➡️'}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.hotspot,
        {
          left: `${hotspot.x}%`,
          top: `${hotspot.y}%`,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
      ]}
      onPress={() => { triggerFlash(); onPress(); }}
      activeOpacity={1}
    >
            <View style={[styles.hotspotHitArea, { width: size, height: size, borderRadius: size / 2 }]} />

      <Animated.View style={[
        styles.hotspotFlash,
        { width: size, height: size, borderRadius: size / 2 },
        { opacity: flashAnim },
      ]} />

        {/* Checkmark discret si déjà trouvé */}
      {clicked && (
        <View style={styles.hotspotFoundDot} />
      )}
    </TouchableOpacity>
  );
}

// ─── Modal de découverte ──────────────────────────────────────
function DiscoveryModal({
  hotspot,
  visible,
  onClose,
  alreadySeen,
}: {
  hotspot: typeof SCENES[0]['hotspots'][0] | null;
  visible: boolean;
  onClose: () => void;
  alreadySeen: boolean;
}) {
  if (!hotspot) return null;
  const isNew = !!hotspot.discovery && !alreadySeen;





  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
          {/* Badge nouveau */}
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>✦ NOUVEAU — inscrit au carnet</Text>
            </View>
          )}

          <Text style={styles.modalEmoji}>{hotspot.emoji || '🔍'}</Text>
          <Text style={styles.modalLabel}>{hotspot.label}</Text>
          <View style={styles.modalDivider} />
          <Text style={styles.modalHint}>{hotspot.hint}</Text>

          {hotspot.discovery && (
            <View style={styles.modalDiscovery}>
              <Text style={styles.modalDiscoveryTitle}>
                📖 {hotspot.discovery.title}
              </Text>
              <Text style={styles.modalDiscoveryContent}>{hotspot.discovery.content}</Text>
            </View>
          )}
          {hotspot.discovery?.type === 'location' &&
            hotspot.discovery.lat &&
            hotspot.discovery.lng && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#2c3e50',
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              

                onPress={async () => {
                  if (hotspot.discovery?.streetViewUrl) {
                    // Enregistre l'instant du clic
                    await AsyncStorage.setItem('streetViewTime', Date.now().toString());
                    // Ouvre Street View
                    Linking.openURL(hotspot.discovery.streetViewUrl);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  🌍 Voir le lieu réel (Street View)
                </Text>
              </TouchableOpacity>
            )}

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseBtnText}>Continuer l'enquête →</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────
export default function SceneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useGame();

  const scene = SCENES.find(s => s.id === id);
  const [activeHotspot, setActiveHotspot] = useState<typeof SCENES[0]['hotspots'][0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const checkHackerReturn = async () => {
      try {
        const streetViewTime = await AsyncStorage.getItem('streetViewTime');
        if (streetViewTime) {
          const elapsed = Date.now() - parseInt(streetViewTime);
          if (elapsed >= 60000) { // 1 minute ou plus
            Alert.alert(
              "📡 HACKER CONNECTÉ",
              "Je vois que vous avez visité la scène de crime... Je sais où vous êtes. Restez vigilant.",
              [{ text: "OK" }]
            );
            // Une fois l'alerte affichée, on efface la marque
            await AsyncStorage.removeItem('streetViewTime');
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du hacker", error);
      }
    };

    // Écoute les changements d'état de l'app (premier plan / arrière-plan)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkHackerReturn();
      }
    });

    return () => subscription.remove();
  }, []); 


   
    if (!scene) {
    return (
      <SafeAreaView style={styles.container } edges={['top', 'bottom']}>
        <Text style={{ color: '#fff', padding: 20 }}>Scène introuvable</Text>
      </SafeAreaView>
    );
  }

  

  const handleHotspotPress = (hotspot: typeof scene.hotspots[0]) => {
    
    if (hotspot.navigatesToScene) {
      dispatch({ type: 'CLICK_HOTSPOT', payload: hotspot.id });
      dispatch({ type: 'UNLOCK_SCENE', payload: hotspot.navigatesToScene });
      router.push(`/scene/${hotspot.navigatesToScene}`);
      return; // ← on court-circuite tout le reste
    }
    
    setActiveHotspot(hotspot);
    setModalVisible(true);

    const alreadyClicked = state.clickedHotspots[hotspot.id];

    if (!alreadyClicked) {
      // Marquer comme cliqué
      dispatch({ type: 'CLICK_HOTSPOT', payload: hotspot.id });

      // Auto-enregistrer dans le carnet
      if (hotspot.discovery) {
        dispatch({
          type: 'ADD_DISCOVERY',
          payload: { ...hotspot.discovery, timestamp: Date.now() },
        });
      }

      // Débloquer une scène si défini
      if (hotspot.unlocksScene) {
        dispatch({ type: 'UNLOCK_SCENE', payload: hotspot.unlocksScene });
      }

      

      
    }
  };

  const discovered = scene.hotspots.filter(h => state.clickedHotspots[h.id]).length;
  const allFound = discovered === scene.hotspots.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={styles.sceneTitle}>{scene.title}</Text>
          <Text style={styles.sceneProgress}>
            {discovered}/{scene.hotspots.length} indices trouvés
          </Text>
        </View>
        {allFound && <Text style={{ fontSize: 22 }}>✅</Text>}
      </View>

      {/* Description */}
      <View style={styles.descBanner}>
        <Text style={styles.descText}>{scene.description}</Text>
      </View>

      {/* Zone image + hotspots */}
      <ZoomableSceneImage 
  bgColor={scene.bgColor} 
  bgEmoji={scene.imageUri ? undefined : scene.bgEmoji}
  imageUri={scene.imageUri}
  foregroundLayers={scene.foregroundLayers} 
>
        {scene.hotspots.map(h => (
          <Hotspot
            key={h.id}
            hotspot={h}
            clicked={!!state.clickedHotspots[h.id]}
            onPress={() => handleHotspotPress(h)}
          />
        ))}
      </ZoomableSceneImage>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          👆 Explorez l'image en tapant partout • Pincez pour zoomer
        </Text>
      </View>

      {/* Liste des indices trouvés */}
      {discovered > 0 && (
        <ScrollView style={styles.foundList} showsVerticalScrollIndicator={false}>
          <Text style={styles.foundListTitle}>Indices relevés dans cette scène :</Text>
          {scene.hotspots
            .filter(h => state.clickedHotspots[h.id] && !h.navigatesToScene)
            .map(h => (
              <TouchableOpacity
                key={h.id}
                style={styles.foundItem}
                onPress={() => { setActiveHotspot(h); setModalVisible(true); }}
              >
                <Text style={styles.foundEmoji}>{h.emoji || '🔍'}</Text>
                <Text style={styles.foundLabel}>{h.label}</Text>
                <Text style={styles.foundArrow}>→</Text>
              </TouchableOpacity>
            ))}
          <View style={{ height: 16 }} />
        </ScrollView>
      )}

      {/* Modal découverte */}
      <DiscoveryModal
        hotspot={activeHotspot}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        alreadySeen={!!activeHotspot && !!state.clickedHotspots[activeHotspot.id]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { color: C.gold, fontSize: 18 },
  sceneTitle: { color: C.parchment, fontSize: 16, fontWeight: '800' },
  sceneProgress: { color: C.muted, fontSize: 12, marginTop: 2 },

  descBanner: {
    backgroundColor: C.surfaceAlt,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  descText: { color: C.muted, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },

  imageContainer: {
    width: W, overflow: 'hidden', position: 'relative',
    backgroundColor: '#0a0a0f',
  },
  imageInner: { width: W, height: IMAGE_H , overflow: 'hidden' }, 
  imageBg: {
     width: W,
  height: IMAGE_H,       // ← s'assurer que la hauteur est fixée ici aussi
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',  
  },
  bgEmoji: { fontSize: 120, opacity: 0.18 },

  hotspot: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },

  hotspotBubble: {
    borderWidth: 2, borderColor: C.gold,
    backgroundColor: 'rgba(201,168,76,0.2)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  

   hotspotFlash: {
    position: 'absolute',
    backgroundColor: 'rgba(201,168,76,0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.8)',
  },
  // Petit point discret pour indiquer "déjà exploré"
  hotspotFoundDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(39,174,96,0.6)',
  },

  hotspotCheck: {
    position: 'absolute', top: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.success,
    justifyContent: 'center', alignItems: 'center',
  },

  resetZoomBtn: {
    position: 'absolute', top: 10, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  hotspotHitArea: {
    position: 'absolute',
    // Complètement transparent — juste pour absorber le tap
    // backgroundColor: 'transparent',
     backgroundColor: 'red',

  },
  resetZoomText: { color: C.muted, fontSize: 11 },

  instructions: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  instructionsText: { color: C.faint, fontSize: 11, textAlign: 'center' },

  foundList: { flex: 1, padding: 16 },
  foundListTitle: { color: C.goldDark, fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  foundItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
    padding: 12, marginBottom: 8, gap: 10,
  },
  foundEmoji: { fontSize: 22 },
  foundLabel: { flex: 1, color: C.parchment, fontSize: 13 },
  foundArrow: { color: C.muted, fontSize: 14 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: C.gold,
    padding: 24, paddingBottom: 36,
  },
  newBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: 8, borderWidth: 1, borderColor: C.goldDark,
    padding: 8, marginBottom: 16, alignSelf: 'flex-start',
  },

  doorBubble: {
    width: 70, height: 110,
    borderRadius: 10,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(201,168,76,0.6)',
    backgroundColor: 'rgba(201,168,76,0.1)',
    justifyContent: 'flex-end', alignItems: 'center',
    paddingBottom: 10, gap: 4,
  },
  doorEmoji: { fontSize: 30 },
  doorLabel: {
    color: 'rgba(232,217,181,0.7)',
    fontSize: 9, textAlign: 'center',
    letterSpacing: 0.5,
  },
  arrowBubble: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: 'rgba(201,168,76,0.5)',
    backgroundColor: 'rgba(201,168,76,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  
  newBadgeText: { color: C.gold, fontSize: 11, letterSpacing: 2 },

  modalEmoji: { fontSize: 44, marginBottom: 8 },
  modalLabel: { color: C.gold, fontSize: 19, fontWeight: '800', marginBottom: 8 },
  modalDivider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
  modalHint: { color: C.parchment, fontSize: 14, lineHeight: 22, marginBottom: 16 },

  modalDiscovery: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 12, borderWidth: 1, borderColor: C.goldDark,
    borderLeftWidth: 3, borderLeftColor: C.gold,
    padding: 14, marginBottom: 16,
  },
  modalDiscoveryTitle: { color: C.gold, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  modalDiscoveryContent: { color: C.parchment, fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
 sceneImage: {
  width: '100%',
  height: '100%',
},
  modalCloseBtn: {
    backgroundColor: C.gold, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  
  modalCloseBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
