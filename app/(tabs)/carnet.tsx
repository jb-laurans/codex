// app/(tabs)/carnet.tsx
// Carnet de l'enquêteur : découvertes auto + notes libres

import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../../context/GameContext';

const C = {
  bg: '#0a0a0f', surface: '#12121c', surfaceAlt: '#1a1a28',
  border: '#2a2a3a', borderLight: '#3a3a4a',
  gold: '#c9a84c', goldDark: '#7a5a1a',
  parchment: '#e8d9b5', muted: '#6a6a8a', faint: '#3a3a4a',
  clue: '#c9a84c', evidence: '#e74c3c', location: '#4ecdc4',
  person: '#9b59b6', object: '#27ae60',
};

const TYPE_COLORS: Record<string, string> = {
  clue: C.clue,
  evidence: C.evidence,
  location: C.location,
  person: C.person,
  object: C.object,
};
const TYPE_LABELS: Record<string, string> = {
  clue: 'Indice',
  evidence: 'Preuve',
  location: 'Lieu',
  person: 'Personne',
  object: 'Objet',
};

type Tab = 'discoveries' | 'notes';
type FilterType = 'all' | 'clue' | 'evidence' | 'location' | 'person' | 'object';

export default function CarnetScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<Tab>('discoveries');
  const [filter, setFilter] = useState<FilterType>('all');
  const [noteText, setNoteText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtrer les découvertes
  const discoveries = filter === 'all'
    ? state.discoveries
    : state.discoveries.filter(d => d.type === filter);

  const addNote = () => {
    const text = noteText.trim();
    if (!text) return;
    dispatch({ type: 'ADD_NOTE', payload: text });
    setNoteText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📖 CARNET D'ENQUÊTE</Text>
      </View>

      {/* Onglets internes */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'discoveries' && styles.tabActive]}
          onPress={() => setTab('discoveries')}
        >
          <Text style={[styles.tabText, tab === 'discoveries' && styles.tabTextActive]}>
            Découvertes ({state.discoveries.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'notes' && styles.tabActive]}
          onPress={() => setTab('notes')}
        >
          <Text style={[styles.tabText, tab === 'notes' && styles.tabTextActive]}>
            Notes ({state.playerNotes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'discoveries' ? (
        <>
          {/* Filtres par type */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
          >
            {(['all', 'clue', 'evidence', 'location', 'person', 'object'] as FilterType[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  filter === f && { backgroundColor: TYPE_COLORS[f] || C.gold, borderColor: 'transparent' },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && { color: '#000' }]}>
                  {f === 'all' ? 'Tout' : TYPE_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {discoveries.length === 0 ? (
              <EmptyState
                emoji="🔍"
                title="Carnet vide"
                text="Explorez les scènes d'enquête. Chaque indice trouvé s'inscrit automatiquement ici."
              />
            ) : (
              <View style={{ padding: 16, gap: 10 }}>
                {discoveries.map(disc => (
                  <DiscoveryCard
                    key={disc.id}
                    discovery={disc}
                    expanded={expandedId === disc.id}
                    onToggle={() => setExpandedId(p => p === disc.id ? null : disc.id)}
                  />
                ))}
              </View>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Zone de saisie */}
          <View style={styles.noteInput}>
            <Text style={styles.noteInputLabel}>Nouvelle observation</Text>
            <TextInput
              style={styles.noteTextInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Notez vos déductions, connexions, hypothèses…"
              placeholderTextColor={C.faint}
              multiline
              maxLength={800}
            />
            <TouchableOpacity
              style={[styles.noteAddBtn, !noteText.trim() && { opacity: 0.4 }]}
              onPress={addNote}
              disabled={!noteText.trim()}
            >
              <Text style={styles.noteAddBtnText}>+ Ajouter au carnet</Text>
            </TouchableOpacity>
          </View>

          {state.playerNotes.length === 0 ? (
            <EmptyState emoji="✍️" title="Aucune note" text="Vos observations personnelles apparaissent ici." />
          ) : (
            <View style={{ padding: 16, gap: 10 }}>
              {state.playerNotes.map(note => (
                <View key={note.id} style={styles.noteCard}>
                  <Text style={styles.noteText}>{note.text}</Text>
                  <View style={styles.noteFoot}>
                    <Text style={styles.noteDate}>
                      {new Date(note.ts).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Supprimer ?', '', [
                          { text: 'Annuler', style: 'cancel' },
                          { text: 'Supprimer', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_NOTE', payload: note.id }) },
                        ])
                      }
                    >
                      <Text style={{ color: C.muted, fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Carte découverte dépliable ───────────────────────────────
function DiscoveryCard({ discovery: d, expanded, onToggle }: {
  discovery: ReturnType<typeof useGame>['state']['discoveries'][0];
  expanded: boolean;
  onToggle: () => void;
}) {
const LAYER_COLORS: Record<string, string> = {
  investigation: '#c9a84c',
  treasure: '#4ecdc4',
};
  const color = TYPE_COLORS[d.type] || C.gold;
  return (
    <TouchableOpacity
      style={[styles.discCard, expanded && { borderColor: color }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={styles.discHeader}>
        <Text style={styles.discEmoji}>{d.emoji}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
  <View style={[
    styles.layerBadge,
    { borderColor: LAYER_COLORS[d.layer || 'investigation'] }
  ]}>
    <Text style={[
      styles.layerText,
      { color: LAYER_COLORS[d.layer || 'investigation'] }
    ]}>
      {d.layer === 'treasure' ? 'TRÉSOR' : 'ENQUÊTE'}
    </Text>
  </View>
</View>
        <View style={{ flex: 1 }}>
          <View style={styles.discTypeBadge}>
            <View style={[styles.discTypeDot, { backgroundColor: color }]} />
            <Text style={[styles.discTypeLabel, { color }]}>{TYPE_LABELS[d.type]}</Text>
          </View>
          <Text style={styles.discTitle}>{d.title}</Text>
        </View>
        <Text style={{ color: C.muted, fontSize: 14 }}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={styles.discBody}>
          <View style={[styles.discLine, { backgroundColor: color }]} />
          <Text style={styles.discContent}>{d.content}</Text>
          {d.sceneId && (
            <Text style={styles.discScene}>
              Trouvé dans : {d.sceneId.replace('scene_', '').replace('_', ' ')}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.gold, fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.gold },
  tabText: { color: C.muted, fontSize: 13 },
  tabTextActive: { color: C.gold, fontWeight: '700' },

  filterBar: { maxHeight: 52, backgroundColor: C.surface },
  filterChip: {
    borderWidth: 1, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: C.bg,
  },
  filterText: { color: C.muted, fontSize: 12 },

  discCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  discHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  discEmoji: { fontSize: 28, marginTop: 2 },
  discTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  discTypeDot: { width: 8, height: 8, borderRadius: 4 },
  discTypeLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  discTitle: { color: C.parchment, fontSize: 14, fontWeight: '700' },
  discBody: { paddingHorizontal: 14, paddingBottom: 14 },
  discLine: { height: 1, marginBottom: 12 },
  discContent: { color: C.parchment, fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  discScene: { color: C.muted, fontSize: 11, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 },

  noteInput: {
    margin: 16,
    backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 14,
  },
  noteInputLabel: { color: C.goldDark, fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  noteTextInput: {
    color: C.parchment, fontSize: 14, lineHeight: 22,
    minHeight: 90, textAlignVertical: 'top',
  },
  noteAddBtn: {
    marginTop: 12, backgroundColor: C.gold,
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  noteAddBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },

  noteCard: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 3, borderLeftColor: C.goldDark,
    padding: 14,
  },
  noteText: { color: C.parchment, fontSize: 14, lineHeight: 22 },
  noteFoot: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 10,
  },
  noteDate: { color: C.muted, fontSize: 11 },

  empty: { alignItems: 'center', padding: 48 },
  emptyTitle: { color: C.parchment, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: C.muted, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  layerBadge: {
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 8,
  paddingVertical: 2,
  alignSelf: 'flex-start',
},

layerText: {
  fontSize: 9,
  fontWeight: '800',
  letterSpacing: 1,
}
});
