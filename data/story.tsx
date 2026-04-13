// data/story.ts
// ══════════════════════════════════════════════════════════════
//  DONNÉES NARRATIVES — Modifiez ici pour construire votre histoire
// ══════════════════════════════════════════════════════════════
//
//  SYNOPSIS :
//  Le Pr. Henri Marchand, archéologue renommé, est retrouvé mort
//  dans son appartement parisien. L'enquête révèle qu'il étudiait
//  le meurtre non élucidé de son aïeul, Émile Marchand, en 1497,
//  assassiné par un homme de l'entourage de Léonard de Vinci
//  pour protéger l'emplacement d'un cache secret.
//  La piste mène au Clos Lucé, à Amboise.
// ══════════════════════════════════════════════════════════════

import type { Discovery } from '../context/GameContext';

// ─── Hotspot : zone cliquable sur une image ───────────────────
export type Hotspot = {
  id: string;
  // Position en % de la largeur/hauteur de l'image (0-100)
  x: number;
  y: number;
  size?: number;          // diamètre du point cliquable (défaut 48)
  label: string;
  hint: string;           // texte court affiché au tap
  discovery?: Discovery;  // si défini → auto-enregistré dans le carnet
  unlocksScene?: string;  // débloque une scène après tap
  emoji?: string;
};

export type ForegroundLayer = {
  imageUri: any;
  // Position et taille sur l'écran (en %)
  top?: number;   left?: number;
  right?: number; bottom?: number;
  width?: number; height?: number;
  // Rendu
  opacity?: number;
  blurRadius?: number;  // flou natif de <Image>
  // Animation
  animation?: 'sway' | 'float' | 'breathe' | 'drift';
  animationIntensity?: 'subtle' | 'medium' | 'strong';
};

// ─── Scène : lieu d'enquête avec image de fond ────────────────
export type Scene = {
  id: string;
  title: string;
  chapter: string;
  description: string;
  // Chemin vers l'image dans /assets/images/scenes/
  // Mettez vos propres photos ici !
  imageUri?: any;
  // Couleur de fond si pas d'image
  bgColor?: string;
  
  bgEmoji?: string;       // grand emoji de fond en attendant une vraie image
  hotspots: Hotspot[];
  // Scènes débloquées dès qu'on arrive ici
  autoUnlocks?: string[];
  locked?: boolean;
  foregroundLayers?: ForegroundLayer[];
};

// ─── Chapitres ────────────────────────────────────────────────
export type Chapter = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  emoji: string;
  scenes: string[];        // IDs des scènes de ce chapitre
};

// ══════════════════════════════════════════════════════════════
//  SCÈNES
// ══════════════════════════════════════════════════════════════
export const SCENES: Scene[] = [

  // ────────────────────────────────────────────────────────────
  //  CHAPITRE 1 — L'Appartement du mort
  // ────────────────────────────────────────────────────────────
  {
    id: 'scene_appartement',
    title: 'L\'appartement',
    foregroundLayers: [
    {
      // Plante au premier plan, bord gauche
      imageUri: require('../assets/images/scenes/plante.png'),
      top: -15, right: 20,
      width: 500, height: 600,
      opacity: 0.75,
      blurRadius: 2.5,   // légèrement flou = profondeur de champ
      animation: 'sway',
      animationIntensity: 'subtle',
    },

  ],
    chapter: 'ch1',
    description:
      'Le Pr. Marchand a été retrouvé inanimé ici ce matin. La pièce a été fouillée — mais par qui ?',
    bgColor: '#1a1208',
    imageUri: require('../assets/images/scenes/appart.png'),
    bgEmoji: '🏛️',
    hotspots: [
      {
        id: 'hs_bureau',
        x: 25, y: 45,
        emoji: '📚',
        label: 'Bureau en désordre',
        hint: 'Des notes éparpillées… l\'une porte la date du 15 avril 1497.',
        discovery: {
          id: 'disc_note_1497',
          type: 'clue',
          layer:"investigation",
          title: 'Note manuscrite — 1497',
          content:
            'Une feuille couverte de l\'écriture de Marchand. En haut : « É.M. — 15 avril 1497 — Amboise ». Plus bas, barré : « Il savait. Il devait être réduit au silence. »',
          emoji: '📄',
          sceneId: 'scene_appartement',
          timestamp: 0,
        },
      },
      {
        id: 'hs_photo',
        x: 68, y: 30,
        emoji: '🖼️',
        label: 'Portrait encadré',
        hint: 'Un vieux daguerréotype. Au dos : « Émile Marchand, archéologue, 1862–1497 ». Attendez… 1497 ?',
        discovery: {
          id: 'disc_portrait_emile',
          type: 'person',
          layer:"investigation",
          title: 'Émile Marchand (1862–1497?)',
          content:
            'L\'ancêtre du Professeur. Archéologue lui aussi. La date de décès semble erronée — sûrement une faute de frappe pour 1897. Mais pourquoi Amboise ?',
          emoji: '👴',
          sceneId: 'scene_appartement',
          timestamp: 0,
        },
      },
      {
        id: 'hs_safe',
        x: 82, y: 72,
        emoji: '🔒',
        label: 'Coffre-fort ouvert',
        hint: 'Forcé de l\'extérieur. Vide — sauf un morceau de parchemin coincé dans la charnière.',
        discovery: {
          id: 'disc_parchemin',
          type: 'evidence',
          layer:"investigation",
          title: 'Fragment de parchemin',
          content:
            'Bout de cuir vieilli, bords brûlés. On distingue : « …sub aquila dormit… » — « sous l\'aigle il dort ». Écriture du XVe siècle.',
          emoji: '📜',
          sceneId: 'scene_appartement',
          timestamp: 0,
        },
        unlocksScene: 'scene_bibliotheque',
      },
      {
        id: 'hs_livre',
        x: 45, y: 65,
        emoji: '📖',
        label: 'Livre ouvert',
        hint: '« Léonard de Vinci à Amboise — Les dernières années ». Page cornée : le plan du Clos Lucé.',
        discovery: {
          id: 'disc_livre_vinci',
          type: 'clue',
          layer:"investigation",
          title: 'Livre sur Léonard de Vinci',
          content:
            'Markings au crayon autour d\'un paragraphe : « Léonard passa les 3 dernières années de sa vie au Clos Lucé (1516–1519). On dit qu\'il y enterra ses secrets les plus précieux. »',
          emoji: '📖',
          sceneId: 'scene_appartement',
          timestamp: 0,
        },
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'scene_bibliotheque',
    title: 'La bibliothèque universitaire',
    foregroundLayers: [
    {
      // Plante au premier plan, bord gauche
      imageUri: require('../assets/images/scenes/plante.png'),
      top: -15, right: 20,
      width: 500, height: 600,
      opacity: 0.75,
      blurRadius: 2.5,   // légèrement flou = profondeur de champ
      animation: 'sway',
      animationIntensity: 'subtle',
    },

  ],
    chapter: 'ch1',
    description:
      'Les archives de la faculté d\'archéologie. Les dossiers d\'Émile Marchand y sont conservés.',
    bgColor: '#0f1a0f',
    bgEmoji: '🏫',
    imageUri: require('../assets/images/scenes/coco.png'),
    
    hotspots: [
      {
        id: 'hs_dossier_emile',
        x: 30, y: 40,
        emoji: '🗂️',
        label: 'Dossier Émile Marchand',
        hint: 'Rapport de mission, 1897. Destination : Amboise. Objectif : « localiser le cache Vinci ».',
        discovery: {
          id: 'disc_mission_1897',
          type: 'clue',
          layer:"investigation",
          title: 'Rapport de mission — 1897',
          content:
            'Émile Marchand fut mandaté par la Société des Antiquaires pour retrouver un cache attribué à Léonard de Vinci. Il écrivit à son directeur : « J\'ai trouvé. Quelqu\'un d\'autre aussi. Je crains pour ma vie. » Ce fut sa dernière lettre.',
          emoji: '🗂️',
          sceneId: 'scene_bibliotheque',
          timestamp: 0,
        },
      },
      {
        id: 'hs_journal',
        x: 65, y: 55,
        emoji: '📰',
        label: 'Microfilm — Le Figaro, 1897',
        hint: '« Archéologue retrouvé mort près d\'Amboise — cause indéterminée ».',
        discovery: {
          id: 'disc_article_1897',
          type: 'evidence',
          layer:"investigation",
          title: 'Article de presse — 14 juin 1897',
          content:
            'Bref article en page 6 : « M. Émile Marchand, 35 ans, retrouvé sans vie dans les sous-bois du Clos Lucé. Aucune marque de violence apparente. Les autorités concluent à un malaise cardiaque. » Mais le dossier médical dit autre chose…',
          emoji: '📰',
          sceneId: 'scene_bibliotheque',
          timestamp: 0,
        },
      },
      {
        id: 'hs_carte_ancienne',
        x: 50, y: 25,
        emoji: '🗺️',
        label: 'Carte d\'Amboise — XVe siècle',
        hint: 'Reproduction d\'une carte contemporaine de Vinci. Une croix est tracée au crayon moderne… par Marchand ?',
        discovery: {
          id: 'disc_carte_amboise',
          type: 'location',
          layer:"treasure",
          streetViewUrl: 'https://maps.app.goo.gl/yytBEiEVUpNmDrB67',
          title: 'Carte d\'Amboise annotée',
          content:
            'Sur la carte reproduite du XVe siècle, une main récente a tracé une croix et écrit : « sub aquila — 47.4095° N / 0.9841° E ». Ces coordonnées… correspondent au jardin du Clos Lucé.',
          emoji: '🗺️',
          sceneId: 'scene_bibliotheque',
          timestamp: 0,
          lat: 47.2437,
        lng: 0.5931,
        },
        unlocksScene: 'scene_clos_luce',
      },
      {
        id: 'hs_medaillon',
        x: 78, y: 70,
        emoji: '🏅',
        label: 'Médaillon sous verre',
        hint: 'Portrait gravé. Inscription au dos : « F. di B. — Garde du secret depuis 1499 ».',
        discovery: {
          id: 'disc_medaillon',
          type: 'person',
          layer:"investigation",
          title: 'Médaillon mystérieux',
          content:
            '« F. di B. » — Francesco di Bartolomeo ? Un homme de main de Vinci ? L\'inscription suggère une confrérie chargée de protéger le cache depuis le XVe siècle. Elle existerait-elle encore ?',
          emoji: '🏅',
          sceneId: 'scene_bibliotheque',
          timestamp: 0,
        },
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  //  CHAPITRE 2 — Amboise
  // ────────────────────────────────────────────────────────────
  {
    id: 'scene_clos_luce',
    title: 'Le Clos Lucé — Façade',
    chapter: 'ch2',
    description:
      'Amboise. Le manoir où Léonard de Vinci passa ses dernières années, de 1516 à sa mort en 1519.',
    bgColor: '#1a1500',
    bgEmoji: '🏰',
    hotspots: [
      {
        id: 'hs_aigle',
        x: 55, y: 35,
        emoji: '🦅',
        label: 'Sculpture d\'aigle',
        hint: '« Sub aquila dormit » — sous l\'aigle il dort. L\'aigle est sculpté au-dessus d\'une fenêtre aveugle.',
        discovery: {
          id: 'disc_aigle',
          type: 'clue',
          layer:"investigation",
          title: 'L\'Aigle du Clos Lucé',
          content:
            'Nichée dans la pierre au-dessus d\'une fenêtre murée, une sculpture d\'aigle aux ailes déployées. Ses yeux semblent regarder vers le bas, vers le jardin. « Sous l\'aigle il dort » — cherchez ce qu\'il regarde.',
          emoji: '🦅',
          sceneId: 'scene_clos_luce',
          timestamp: 0,
        },
      },
      {
        id: 'hs_jardin',
        x: 25, y: 70,
        emoji: '🌿',
        label: 'Accès au jardin',
        hint: 'Les jardins de la Renaissance, redessinés d\'après les carnets de Vinci.',
        unlocksScene: 'scene_jardin',
      },
      {
        id: 'hs_souterrains',
        x: 75, y: 75,
        emoji: '🚪',
        label: 'Entrée des souterrains',
        hint: 'Un souterrain relie le Clos Lucé au Château d\'Amboise. Léonard y travaillait à l\'abri des regards.',
        discovery: {
          id: 'disc_souterrain',
          type: 'location',
          layer:"treasure",
          streetViewUrl: 'https://maps.app.goo.gl/yytBEiEVUpNmDrB67',
          title: 'Passage souterrain',
          content:
            'Le souterrain menant au château royal est réel et documenté. Mais selon les notes d\'Émile Marchand, il existe une bifurcation non répertoriée, creusée par Vinci lui-même.',
          emoji: '🚇',
          sceneId: 'scene_clos_luce',
          timestamp: 0,
          lat: 47.4095,
           lng: 0.9841,
        },
        unlocksScene: 'scene_jardin',
      },
    ],
  },

  {
    id: 'scene_jardin',
    title: 'Le jardin du Clos Lucé',
    chapter: 'ch2',
    description:
      'Sous l\'aigle, le jardin. Et quelque part ici, le secret d\'Émile Marchand attend depuis 1897.',
    bgColor: '#0a150a',
    bgEmoji: '🌳',
    hotspots: [
      {
        id: 'hs_vieux_chene',
        x: 40, y: 60,
        emoji: '🌳',
        label: 'Vieux chêne',
        hint: 'Un chêne qui pourrait avoir 500 ans. À sa base, les racines ont soulevé une dalle.',
        discovery: {
          id: 'disc_dalle',
          type: 'evidence',
          title: 'Dalle descellée',
          layer:"investigation",
          content:
            'Sous les racines du chêne centenaire, une dalle de pierre portant un symbole : une aile et un compas entrecroisés. Ce n\'est pas naturel — quelqu\'un a voulu marquer cet endroit.',
          emoji: '🪨',
          sceneId: 'scene_jardin',
          timestamp: 0,
        },
      },
      {
        id: 'hs_cadran_solaire',
        x: 70, y: 40,
        emoji: '☀️',
        label: 'Cadran solaire',
        hint: 'Le cadran pointe vers le nord-nord-est à midi. L\'ombre à 15h vise exactement le vieux chêne.',
        discovery: {
          id: 'disc_cadran',
          type: 'clue',
          layer:"investigation",
          title: 'Le cadran solaire de Vinci',
          content:
            'Dessiné selon les spécifications retrouvées dans un carnet de Vinci. À 15h précises, le 15 avril (date anniversaire de la naissance de Léonard), l\'ombre du gnomon pointe vers la dalle. Pas un hasard.',
          emoji: '🕒',
          sceneId: 'scene_jardin',
          timestamp: 0,
        },
      },
      {
        id: 'hs_inscription',
        x: 20, y: 35,
        emoji: '🔍',
        label: 'Inscription dans la pierre',
        hint: 'Gravé en miroir, comme Vinci écrivait. Retournez votre téléphone pour lire.',
        discovery: {
          id: 'disc_inscription_finale',
          type: 'evidence',
          layer:"investigation",
          title: '🔑 INSCRIPTION — Message de Vinci',
          content:
            '« Qui cherche avec l\'œil du faucon et le cœur du sage trouvera ce que le temps a couvert. Sous la première racine, à sept empans vers l\'aurore. — L. »\n\nSept empans (environ 1,60m) vers l\'est depuis la dalle. Vous y êtes presque.',
          emoji: '🔑',
          sceneId: 'scene_jardin',
          timestamp: 0,
        },
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
//  CHAPITRES
// ══════════════════════════════════════════════════════════════
export const CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    number: 1,
    title: 'La Mort du Professeur',
    subtitle: 'Paris — De nos jours',
    summary:
      'Henri Marchand est retrouvé mort. Son appartement a été fouillé. Ses recherches sur un ancêtre assassiné au XIXe siècle semblent être le mobile.',
    emoji: '🔍',
    scenes: ['scene_appartement', 'scene_bibliotheque'],
  },
  {
    id: 'ch2',
    number: 2,
    title: 'Le Secret de Vinci',
    subtitle: 'Amboise — Sur les traces d\'Émile',
    summary:
      'Les indices pointent vers Amboise et le Clos Lucé. Léonard de Vinci y aurait caché quelque chose que des générations se sont transmis le secret de garder.',
    emoji: '🦅',
    scenes: ['scene_clos_luce', 'scene_jardin'],
  },
];

// ══════════════════════════════════════════════════════════════
//  LIEUX CLÉS SUR LA CARTE (OpenStreetMap)
// ══════════════════════════════════════════════════════════════
export const MAP_LOCATIONS = [
  {
    id: 'map_paris',
    name: 'Appartement Marchand',
    subtitle: 'Paris, 5e arrondissement',
    lat: 48.8505,
    lng: 2.3477,
    emoji: '🔍',
    color: '#c0392b',
    chapter: 'ch1',
    description: 'Dernier domicile connu du Pr. Henri Marchand.',
  },
  {
    id: 'map_sorbonne',
    name: 'Bibliothèque universitaire',
    subtitle: 'Sorbonne, Paris',
    lat: 48.8485,
    lng: 2.3436,
    emoji: '🏛️',
    color: '#8a6a20',
    chapter: 'ch1',
    description: 'Archives de la faculté d\'archéologie.',
  },
  {
    id: 'map_clos_luce',
    name: 'Le Clos Lucé',
    subtitle: 'Amboise, Indre-et-Loire',
    lat: 47.4095,
    lng: 0.9841,
    emoji: '🦅',
    color: '#c9a84c',
    chapter: 'ch2',
    description: 'Dernière demeure de Léonard de Vinci (1516–1519). La piste se termine ici.',
  },
  {
    id: 'map_chateau_amboise',
    name: 'Château Royal d\'Amboise',
    subtitle: 'Amboise',
    lat: 47.4130,
    lng: 0.9845,
    emoji: '🏰',
    color: '#4ecdc4',
    chapter: 'ch2',
    description: 'Léonard y fut reçu par François Ier. Un souterrain relie les deux bâtiments.',
  },
];
