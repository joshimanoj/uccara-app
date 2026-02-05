/**
 * Color tokens for Uccara mobile app
 * Based on web app design system with dark mode support
 */

export const lightColors = {
  // Backgrounds
  background: {
    page: '#f7f5f2',      // Original Light Beige
    elevated: '#F8FAFC',  // Slate-50 (Very light gray, no brown)
    card: '#FFFFFF',
    cardSolid: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.95)',
  },

  // Gradient presets (disabled - transparent)
  gradients: {
    card: ['transparent', 'transparent'] as [string, string],
    cardHover: ['transparent', 'transparent'] as [string, string],
    deity: ['transparent', 'transparent'] as [string, string],
    focus: ['transparent', 'transparent'] as [string, string],
    collection: ['transparent', 'transparent'] as [string, string],
    mantraCard: ['transparent', 'transparent'] as [string, string],
  },

  // Text
  text: {
    primary: '#0F172A',   // Slate-900 (Deep blue-black)
    secondary: '#475569', // Slate-600
    muted: '#94A3B8',    // Slate-400
    inverse: '#FFFFFF',
  },

  // Semantic colors for Sanskrit learning
  semantic: {
    sanskrit: '#1A1A1A',      // Strict Black for Devanagari
    pronunciation: '#475569', // Slate-600
    etymology: '#1A1A1A',     // Strict Black
    meaning: '#475569',       // Slate-600
  },

  // Accent colors
  accent: {
    primary: '#6366F1',   // Indigo-500
    secondary: '#94A3B8', // Slate-400
    tertiary: '#4F46E5',  // Indigo-600
    focus: 'rgba(99, 102, 241, 0.08)', // Reduced opacity
  },

  // Deity-specific colors (Matching Mock colors)
  deity: {
    durga: { text: '#FFFFFF', bg: '#DC3545' },
    ganesha: { text: '#FFFFFF', bg: '#E07B5B' },
    shiva: { text: '#FFFFFF', bg: '#6B5B95' },
    krishna: { text: '#FFFFFF', bg: '#3D5A80' },
    hanuman: { text: '#FFFFFF', bg: '#E85D04' },
    vishnu: { text: '#FFFFFF', bg: '#1D3557' },
    devi: { text: '#FFFFFF', bg: '#DC2626' },
  },

  // Benefit / Focus section colors
  benefit: {
    health: '#4ECDC4',
    knowledge: '#9B7ED9',
    peace: '#95D5B2',
    protection: '#FFB703',
  },

  // Collection section colors
  collection: {
    start: '#F472B6', // Pink
    popular: '#7DD3FC', // Light blue
    devotion: '#C4B5FD', // Light purple
    educational: '#BBF7D0', // Light green
    daily: '#FCD34D', // Yellow
  },

  // Soft accent backgrounds for settings icons
  softAccent: {
    peach: '#f5e6d8',
    mint: '#dceee8',
    lavender: '#e8e0f0',
    gold: '#f0e8d0',
    blush: '#f0dce0',
    cream: '#f0ece4',
  },

  // Icon foreground colors for settings
  iconFg: {
    warm: '#c08050',
    green: '#4a9c7e',
    purple: '#7c5ca0',
    gold: '#b09040',
    rose: '#c07080',
    brown: '#a89070',
  },

  // UI elements
  ui: {
    border: '#E2E8F0',    // Slate-200
    divider: '#F1F5F9',   // Slate-100
    overlay: 'rgba(0,0,0,0.4)',
    shadow: 'rgba(0,0,0,0.05)',
  },

  // Status
  status: {
    success: '#059669',
    error: '#DC2626',
    warning: '#D97706',
    info: '#1D4ED8',
  },

  // Tab bar
  tabBar: {
    active: '#6366F1', // Indigo in some mocks, or primary
    inactive: '#9CA3AF',
    background: '#f7f5f2',
  },
};

export const darkColors = {
  // Backgrounds – warm dark palette from design mockup
  background: {
    page: '#141214',      // Deep warm dark
    elevated: '#1c1a1d',  // Slightly lighter warm dark
    card: '#232125',      // Card surface
    cardSolid: '#232125',
    overlay: 'rgba(20, 18, 20, 0.95)',
  },

  // Gradient presets (dark mode - disabled)
  gradients: {
    card: ['transparent', 'transparent'] as [string, string],
    cardHover: ['transparent', 'transparent'] as [string, string],
    deity: ['transparent', 'transparent'] as [string, string],
    focus: ['transparent', 'transparent'] as [string, string],
    collection: ['transparent', 'transparent'] as [string, string],
    mantraCard: ['transparent', 'transparent'] as [string, string],
  },

  // Text – warm tones
  text: {
    primary: '#f5f2f0',   // Warm off-white
    secondary: '#8a8588', // Warm gray
    muted: '#5c585a',     // Muted warm gray
    inverse: '#141214',
  },

  // Semantic colors (lighter for dark mode)
  semantic: {
    sanskrit: '#FBBF24',      // Amber-400
    pronunciation: '#34D399', // Emerald-400
    etymology: '#FCD34D',     // Amber-300
    meaning: '#60A5FA',       // Blue-400
  },

  // Accent colors (tuned for dark)
  accent: {
    primary: '#818CF8',   // Indigo-400 (Brighter for dark mode)
    secondary: '#94A3B8',
    tertiary: '#A5B4FC',
    focus: 'rgba(129, 140, 248, 0.15)',
  },

  // Deity-specific colors (adapted for dark mode)
  // Deity-specific colors (Slate tints + original color)
  deity: {
    durga: { text: '#F8FAFC', bg: '#991B1B' },   // Red-800
    ganesha: { text: '#F8FAFC', bg: '#9A3412' }, // Orange-800
    shiva: { text: '#F8FAFC', bg: '#4C1D95' },   // Violet-900
    krishna: { text: '#F8FAFC', bg: '#1E3A8A' }, // Blue-900
    hanuman: { text: '#F8FAFC', bg: '#C2410C' }, // Orange-700
    vishnu: { text: '#F8FAFC', bg: '#172554' },  // Blue-950
    devi: { text: '#F8FAFC', bg: '#7F1D1D' },    // Red-900
  },

  // Benefit category colors (adapted for dark mode)
  benefit: {
    health: '#34d399',
    knowledge: '#a78bfa',
    peace: '#60a5fa',
    protection: '#fbbf24',
  },

  // Collection section colors (dark mode)
  collection: {
    start: 'rgba(244, 114, 182, 0.3)',
    popular: 'rgba(125, 211, 252, 0.3)',
    devotion: 'rgba(196, 181, 253, 0.3)',
    educational: 'rgba(187, 247, 208, 0.3)',
    daily: 'rgba(252, 211, 77, 0.3)',
  },

  // Soft accent backgrounds for settings icons (dark mode – muted)
  softAccent: {
    peach: 'rgba(192, 128, 80, 0.18)',
    mint: 'rgba(74, 156, 126, 0.18)',
    lavender: 'rgba(124, 92, 160, 0.18)',
    gold: 'rgba(176, 144, 64, 0.18)',
    blush: 'rgba(192, 112, 128, 0.18)',
    cream: 'rgba(168, 144, 112, 0.18)',
  },

  // Icon foreground colors for settings (dark mode – brighter)
  iconFg: {
    warm: '#d4995e',
    green: '#5cb896',
    purple: '#9878b8',
    gold: '#c8a850',
    rose: '#d48898',
    brown: '#bca888',
  },

  // UI elements
  ui: {
    border: 'rgba(255,255,255,0.04)', // Very subtle warm
    divider: 'rgba(255,255,255,0.04)',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: 'rgba(0,0,0,0.5)',
  },

  // Status
  status: {
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
  },

  // Tab bar
  tabBar: {
    active: '#f5f2f0',    // Warm white – matches text.primary
    inactive: '#5c585a',  // Muted warm gray
    background: '#141214', // Deep warm dark
  },
};

export type ColorTheme = typeof lightColors;
