import {
  BookOpen,
  Brain,
  Calculator,
  FlaskConical,
  type LucideIcon,
  Music,
  NotebookPen,
  School,
  Star,
  Trophy,
  UtensilsCrossed,
} from 'lucide-react-native';
import type { ImageSourcePropType } from 'react-native';

type SubjectCategory =
  | 'math'
  | 'science'
  | 'physics'
  | 'chemistry'
  | 'english'
  | 'hindi'
  | 'kannada'
  | 'tamil'
  | 'telugu'
  | 'social'
  | 'sports'
  | 'music'
  | 'lunch'
  | 'lab'
  | 'library'
  | 'default';

export interface SubjectVisual {
  accent: string;
  soft: string;
  text: string;
  icon: LucideIcon;
  image?: ImageSourcePropType;
}

const SUBJECT_IMAGES: Partial<Record<SubjectCategory, ImageSourcePropType>> = {
  math: require('../../assets/images/subjects/MATH.png') as ImageSourcePropType,
  science:
    require('../../assets/images/subjects/SCI.png') as ImageSourcePropType,
  physics:
    require('../../assets/images/subjects/PHY.png') as ImageSourcePropType,
  chemistry:
    require('../../assets/images/subjects/CHEM.png') as ImageSourcePropType,
  english:
    require('../../assets/images/subjects/ENG.png') as ImageSourcePropType,
  hindi: require('../../assets/images/subjects/HIN.png') as ImageSourcePropType,
  kannada:
    require('../../assets/images/subjects/KAN.png') as ImageSourcePropType,
  tamil: require('../../assets/images/subjects/TAM.png') as ImageSourcePropType,
  telugu:
    require('../../assets/images/subjects/TEL.png') as ImageSourcePropType,
  social:
    require('../../assets/images/subjects/SST.png') as ImageSourcePropType,
  lab: require('../../assets/images/subjects/LAB.png') as ImageSourcePropType,
  library:
    require('../../assets/images/subjects/LIB.png') as ImageSourcePropType,
};

const SUBJECT_VISUALS: Record<SubjectCategory, SubjectVisual> = {
  math: {
    accent: '#2563eb',
    soft: '#dbeafe',
    text: '#1d4ed8',
    icon: Calculator,
    image: SUBJECT_IMAGES.math,
  },
  science: {
    accent: '#16a34a',
    soft: '#dcfce7',
    text: '#15803d',
    icon: Brain,
    image: SUBJECT_IMAGES.science,
  },
  physics: {
    accent: '#0284c7',
    soft: '#e0f2fe',
    text: '#0369a1',
    icon: Brain,
    image: SUBJECT_IMAGES.physics,
  },
  chemistry: {
    accent: '#059669',
    soft: '#d1fae5',
    text: '#047857',
    icon: FlaskConical,
    image: SUBJECT_IMAGES.chemistry,
  },
  english: {
    accent: '#7c3aed',
    soft: '#ede9fe',
    text: '#6d28d9',
    icon: NotebookPen,
    image: SUBJECT_IMAGES.english,
  },
  hindi: {
    accent: '#d97706',
    soft: '#fef3c7',
    text: '#b45309',
    icon: NotebookPen,
    image: SUBJECT_IMAGES.hindi,
  },
  kannada: {
    accent: '#e11d48',
    soft: '#ffe4e6',
    text: '#be123c',
    icon: NotebookPen,
    image: SUBJECT_IMAGES.kannada,
  },
  tamil: {
    accent: '#c026d3',
    soft: '#fae8ff',
    text: '#a21caf',
    icon: NotebookPen,
    image: SUBJECT_IMAGES.tamil,
  },
  telugu: {
    accent: '#0d9488',
    soft: '#ccfbf1',
    text: '#0f766e',
    icon: NotebookPen,
    image: SUBJECT_IMAGES.telugu,
  },
  social: {
    accent: '#db2777',
    soft: '#fce7f3',
    text: '#be185d',
    icon: School,
    image: SUBJECT_IMAGES.social,
  },
  sports: {
    accent: '#dc2626',
    soft: '#fee2e2',
    text: '#b91c1c',
    icon: Trophy,
  },
  music: {
    accent: '#9333ea',
    soft: '#f3e8ff',
    text: '#7e22ce',
    icon: Music,
  },
  lunch: {
    accent: '#ea580c',
    soft: '#ffedd5',
    text: '#c2410c',
    icon: UtensilsCrossed,
  },
  lab: {
    accent: '#0891b2',
    soft: '#cffafe',
    text: '#0e7490',
    icon: FlaskConical,
    image: SUBJECT_IMAGES.lab,
  },
  library: {
    accent: '#f59e0b',
    soft: '#fef3c7',
    text: '#b45309',
    icon: BookOpen,
    image: SUBJECT_IMAGES.library,
  },
  default: {
    accent: '#4f46e5',
    soft: '#e0e7ff',
    text: '#4338ca',
    icon: Star,
  },
};

// Mirrors apps/web/src/lib/subject-image.ts matching order.
function resolveCategory(subjectName?: string | null): SubjectCategory {
  const name = (subjectName ?? '').toLowerCase().trim();
  if (name.includes('lab') || name.includes('practical')) return 'lab';
  if (name.includes('english') || name.includes('grammar')) return 'english';
  if (/math|algebra|geometry|trigonometry/.test(name)) return 'math';
  if (/social|history|geography|civics|economics|sst/.test(name)) {
    return 'social';
  }
  if (name.includes('physics')) return 'physics';
  if (name.includes('chem')) return 'chemistry';
  if (name.includes('hindi')) return 'hindi';
  if (name.includes('kannada')) return 'kannada';
  if (name.includes('telugu')) return 'telugu';
  if (name.includes('tamil')) return 'tamil';
  if (name.includes('library') || name.includes('reading')) return 'library';
  if (/sport|physical|game|^pt$|\bpt\b/.test(name)) return 'sports';
  if (/music|dance|art/.test(name)) return 'music';
  if (/lunch|meal|food|break/.test(name)) return 'lunch';
  if (name.includes('biology') || name.includes('evs')) return 'science';
  if (name.includes('science')) {
    if (name.includes('computer') || name.includes('political')) {
      return 'default';
    }
    return 'science';
  }
  return 'default';
}

export function getSubjectVisual(subjectName?: string | null): SubjectVisual {
  return SUBJECT_VISUALS[resolveCategory(subjectName)];
}
