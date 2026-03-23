// Category ID to French name mapping — must match backend CATEGORIES_DATA
export const CATEGORY_NAMES: Record<string, string> = {
  music: 'Musique',
  video: 'Audiovisuel',
  photo: 'Photographie',
  design: 'Arts graphiques',
  fashion: 'Mode',
  event: 'Événementiel',
  architecture: 'Architecture',
  writing: 'Rédaction',
  content: 'Création de contenu',
  artisanal: 'Créations artisanales',
  spectacle_vivant: 'Spectacle vivant',
  ia: 'IA',
};

export const CATEGORY_ICONS: Record<string, string> = {
  music: 'musical-notes',
  video: 'videocam',
  photo: 'camera',
  design: 'color-palette',
  fashion: 'shirt',
  event: 'calendar',
  architecture: 'business',
  writing: 'document-text',
  content: 'megaphone',
  artisanal: 'color-wand',
  spectacle_vivant: 'mic',
  ia: 'hardware-chip',
};

// All subcategories per category — must match backend
export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  music: [
    'beatmaker', 'ingénieur du son', 'DJ', 'chanteur/rappeur',
    'studio d\'enregistrement', 'auteur-compositeur', 'label/producteur', 'toplineur'
  ],
  video: [
    'réalisateur', 'monteur', 'société de production', 'journaliste',
    'cadreur', 'producteur', 'créateur d\'animations', 'technicien'
  ],
  photo: ['photographe', 'retoucheur photo', 'modèle', 'Make Up Artist'],
  design: [
    'graphiste', 'designer d\'objet', 'designer d\'espace', 'animateur 2D/3D',
    'artiste plasticien', 'illustrateur', 'éditeur'
  ],
  fashion: ['styliste', 'modéliste', 'couturier', 'créateur de mode', 'mannequin'],
  event: [
    'scénographe/metteur en scène', 'organisateur d\'événement', 'animateur',
    'technicien son lumière', 'responsable sécurité', 'responsable sponsoring',
    'décorateur', 'responsable logistique', 'traiteur'
  ],
  architecture: ['dessinateur', 'architecte d\'intérieur', 'urbaniste', 'paysagiste'],
  writing: ['scénariste', 'correcteur', 'éditeur', 'auteur fantôme', 'écrivain/auteur', 'relecteur'],
  content: [
    'gestionnaire de communauté', 'influenceur', 'créateur de contenu', 'rédacteur publicitaire',
    'vidéaste YouTube', 'podcasteur', 'blogueur', 'gestionnaire de réseaux sociaux'
  ],
  artisanal: [
    'bijoux artisanaux', 'bougies artisanales', 'peinture', 'création de meubles',
    'maroquinerie', 'céramique', 'poterie', 'sculpture', 'broderie',
    'savonnerie artisanale', 'travail du bois', 'verrerie', 'tapisserie', 'artisan fleuriste'
  ],
  spectacle_vivant: [
    'danseur', 'stand-uppeur', 'comédien', 'performance scénique',
    'humoriste', 'metteur en scène', 'circassien', 'conteur'
  ],
  ia: [
    'Développeur IA', 'Prompt Artist', 'AI Designer', 'Conversation Designer',
    'IA Music Producer', 'AI Copywriter', 'Directeur Artistique IA'
  ],
};

export function getCategoryName(categoryId: string): string {
  return CATEGORY_NAMES[categoryId] || categoryId;
}

export function getFirstSubcategoryLabel(subcategories?: string[]): string | null {
  if (!subcategories || subcategories.length === 0) return null;
  // Capitalize first letter
  const sub = subcategories[0];
  return sub.charAt(0).toUpperCase() + sub.slice(1);
}

// Date formatting utility — JJ/MM/AAAA
export function formatDateFR(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Generate shareable profile link
export function getProfileShareUrl(profileSlug?: string | null): string {
  if (!profileSlug) return '';
  return `https://harmooclub.com/freelancer/${profileSlug}`;
}
