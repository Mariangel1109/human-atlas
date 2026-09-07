export type VliOrganId = 'heart' | 'metabolism' | 'liver' | 'muscle' | 'brain' | 'kidney' | 'pancreas';
export type VliClinicalMode = 'actual' | 'target';

export interface VliOrganConfig {
  id: VliOrganId;
  label: string;
  atlasQueries: string[];
  subtitle: string;
  currentScore?: number;
  targetScore?: number;
  currentBiologicalAge?: number;
  targetBiologicalAge?: number;
  findings?: string[];
  goals?: string[];
  isCoreClock: boolean;
}

export const VLI_ORGANS: VliOrganConfig[] = [
  {
    id: 'heart',
    label: 'Corazón',
    atlasQueries: ['heart'],
    subtitle: 'Salud cardiovascular y riesgo aterosclerótico',
    isCoreClock: true,
  },
  {
    id: 'metabolism',
    label: 'Metabolismo',
    atlasQueries: ['pancreas', 'adipose'],
    subtitle: 'Glucosa, insulina y adiposidad visceral',
    isCoreClock: true,
  },
  {
    id: 'liver',
    label: 'Hígado',
    atlasQueries: ['liver'],
    subtitle: 'Centro metabólico y salud hepática',
    currentScore: 52,
    targetScore: 86,
    currentBiologicalAge: 57,
    targetBiologicalAge: 51,
    findings: [
      'Hígado graso grado 2',
      'AST 50 U/L',
      'ALT 45 U/L',
      'Triglicéridos 190 mg/dL',
    ],
    goals: [
      'Reducir esteatosis hepática',
      'Normalizar enzimas hepáticas',
      'Mejorar perfil metabólico',
      'Disminuir triglicéridos y adiposidad visceral',
    ],
    isCoreClock: true,
  },
  {
    id: 'muscle',
    label: 'Músculo',
    atlasQueries: ['muscle'],
    subtitle: 'Reserva funcional, masa y fuerza',
    isCoreClock: true,
  },
  {
    id: 'brain',
    label: 'Cerebro',
    atlasQueries: ['brain'],
    subtitle: 'Función cognitiva y salud cerebral',
    isCoreClock: true,
  },
  {
    id: 'kidney',
    label: 'Riñones',
    atlasQueries: ['kidney'],
    subtitle: 'Función renal y balance de líquidos',
    isCoreClock: false,
  },
  {
    id: 'pancreas',
    label: 'Páncreas',
    atlasQueries: ['pancreas'],
    subtitle: 'Regulación endocrina y metabolismo de glucosa',
    isCoreClock: false,
  },
];

export const VLI_VIEWER_CONTRACT = {
  version: '1.0',
  primaryActions: [
    'rotateBody360',
    'zoomBody',
    'selectOrganByTouch',
    'highlightOrganInBody',
    'isolateOrgan',
    'rotateIsolatedOrgan360',
    'compareActualVsTarget',
    'restoreWholeBody',
  ] as const,
  note:
    'Scores and biological ages in the prototype are illustrative until the VLI algorithm is clinically defined and validated.',
};
