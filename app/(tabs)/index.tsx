// app/(tabs)/index.tsx
// Écran principal d'enquête : liste des chapitres et scènes

import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../../context/GameContext';
import { CHAPTERS, SCENES } from '../../data/story';

// ─── Couleurs ────────────────────────────────────────────────
const C = {
  bg: '#0a0a0f',
  surface: '#12121c',
  surfaceAlt: '#1a1a28',
  border: '#2a2a3a',
  gold: '#c9a84c',
  goldDark: '#7a5a1a',
  parchment: '#e8d9b5',
  muted: '#6a6a8a',
  faint: '#3a3a4a',
  success: '#27ae60',
  locked: '#2a2a2a',
};

// ─── Carte de scène ──────────────────────────────────────────
function SceneCard({
  scene,
  unlocked,
  discovered,  // nb hotspots cliqués
  total,       // nb total de hotspots
  onPress,
}: {
  scene: typeof SCENES[0];
  unlocked: boolean;
  discovered: number;
  total: number;
  onPress: () => void;
}) {
  const pct = total > 0 ? (discovered / total) * 100 : 0;

  return (
    <TouchableOpacity
      style={[styles.sceneCard, !unlocked && styles.sceneCardLocked]}
      onPress={unlocked ? onPress : undefined}
      activeOpacity={0.82}
    >
      {/* Emoji de fond */}
      <Text style={styles.sceneEmoji}>{scene.bgEmoji || '🔍'}</Text>

      <View style={styles.sceneInfo}>
        <Text style={styles.sceneName}>{scene.title}</Text>
        <Text style={styles.sceneDesc} numberOfLines={2}>{scene.description}</Text>

        {/* Barre de progression */}
        {unlocked && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{discovered}/{total} indices</Text>
          </View>
        )}
      </View>

      {!unlocked ? (
        <Text style={styles.lockIcon}>🔒</Text>
      ) : (
        <Text style={styles.arrowIcon}>→</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Écran principal ─────────────────────────────────────────
export default function InvestigationScreen() {
  const router = useRouter();
  const { state, dispatch  } = useGame();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>✦ enquête en cours ✦</Text>
          <Text style={styles.title}>CODEX{'\n'}OSTRAKON</Text>
          <Text style={styles.subtitle}>
            Le Pr. Henri Marchand est mort.{'\n'}La vérité est enfouie depuis des siècles.
          </Text>
        </View>

        {/* Stat rapide */}
        <View style={styles.statsRow}>
          <StatBox label="Découvertes" value={state.discoveries.length} emoji="🔍" />
          <StatBox label="Notes" value={state.playerNotes.length} emoji="✍️" />
          <StatBox label="Scènes" value={state.unlockedScenes.length} emoji="🏛️" />
        </View>

        <TouchableOpacity
  style={styles.resetBtn}
  onPress={() => {
    dispatch({ type: 'RESET' });
  }}
>
  <Text style={styles.resetBtnText}>🧹 Réinitialiser la partie</Text>
</TouchableOpacity>

        {/* Chapitres + scènes */}
        {CHAPTERS.map((chapter) => {
          const chapterScenes = SCENES.filter(s => s.chapter === chapter.id);
          const anyUnlocked = chapterScenes.some(s =>
            state.unlockedScenes.includes(s.id)
          );

          return (
            <View key={chapter.id} style={styles.chapter}>
              {/* En-tête chapitre */}
              <View style={styles.chapterHeader}>
                <Text style={styles.chapterEmoji}>{chapter.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chapterNum}>Chapitre {chapter.number}</Text>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterSub}>{chapter.subtitle}</Text>
                </View>
              </View>

              {/* Résumé */}
              {anyUnlocked && (
                <Text style={styles.chapterSummary}>{chapter.summary}</Text>
              )}

              {/* Scènes */}
              {chapterScenes.map((scene) => {
                const unlocked = state.unlockedScenes.includes(scene.id);
                const discovered = scene.hotspots.filter(
                  h => state.clickedHotspots[h.id]
                ).length;

                return (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    unlocked={unlocked}
                    discovered={discovered}
                    total={scene.hotspots.length}
                    onPress={() => router.push(`/scene/${scene.id}` as any)}
                  />
                );
              })}

              {!anyUnlocked && (
                <View style={styles.chapterLocked}>
                  <Text style={styles.chapterLockedText}>
                    🔒 Terminez le chapitre précédent pour accéder à celui-ci
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  resetBtn: {
  marginHorizontal: 16,
  marginBottom: 16,
  padding: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#7a1a1a',
  backgroundColor: '#2a0f0f',
  alignItems: 'center',
},
resetBtnText: {
  color: '#ff6b6b',
  fontWeight: '700',
},

  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  eyebrow: { color: C.goldDark, fontSize: 11, letterSpacing: 4, marginBottom: 12 },
  title: {
    color: C.gold,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 16,
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { color: C.gold, fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { color: C.muted, fontSize: 10, marginTop: 2 },

  chapter: { marginHorizontal: 16, marginBottom: 24 },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  chapterEmoji: { fontSize: 32, marginTop: 4 },
  chapterNum: { color: C.goldDark, fontSize: 10, letterSpacing: 3 },
  chapterTitle: { color: C.parchment, fontSize: 18, fontWeight: '800', marginTop: 2 },
  chapterSub: { color: C.muted, fontSize: 12 },
  chapterSummary: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: C.goldDark,
    paddingLeft: 10,
  },
  chapterLocked: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.faint,
    padding: 16,
    alignItems: 'center',
    opacity: 0.5,
  },
  chapterLockedText: { color: C.muted, fontSize: 13, textAlign: 'center' },

  sceneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  sceneCardLocked: { opacity: 0.4 },
  sceneEmoji: { fontSize: 32, width: 42, textAlign: 'center' },
  sceneInfo: { flex: 1 },
  sceneName: { color: C.parchment, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  sceneDesc: { color: C.muted, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressTrack: {
    flex: 1, height: 3, backgroundColor: C.faint,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.gold, borderRadius: 2 },
  progressLabel: { color: C.muted, fontSize: 10 },

  lockIcon: { fontSize: 20 },
  arrowIcon: { color: C.gold, fontSize: 18, fontWeight: '700' },
});
