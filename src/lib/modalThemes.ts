// =============================================================================
// Cancel Flow Modal Themes
// =============================================================================
// 6 beautiful design themes for the cancel flow modal

export type ModalTheme = 'minimal' | 'gradient' | 'soft' | 'bold' | 'glass' | 'dark';

export interface ThemeConfig {
  id: ModalTheme;
  name: string;
  description: string;
  preview: string; // Preview color/gradient
  styles: {
    // Card styles
    cardBg: string;
    cardBorder: string;
    cardShadow: string;
    // Header styles
    headerBg: string;
    titleColor: string;
    descColor: string;
    // Button styles
    primaryBtnBg: string;
    primaryBtnText: string;
    primaryBtnHover: string;
    secondaryBtnBg: string;
    secondaryBtnText: string;
    secondaryBtnBorder: string;
    // Offer card styles
    offerBg: string;
    offerBorder: string;
    offerBadgeBg: string;
    offerBadgeText: string;
    offerPriceColor: string;
    // Radio/checkbox styles
    radioSelectedBg: string;
    radioSelectedBorder: string;
    // Success/cancel colors
    successBg: string;
    successIcon: string;
  };
}

export const MODAL_THEMES: Record<ModalTheme, ThemeConfig> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design',
    preview: '#ffffff',
    styles: {
      cardBg: 'bg-white dark:bg-zinc-900',
      cardBorder: 'border border-zinc-200 dark:border-zinc-800',
      cardShadow: 'shadow-lg',
      headerBg: '',
      titleColor: 'text-zinc-900 dark:text-white',
      descColor: 'text-zinc-500 dark:text-zinc-400',
      primaryBtnBg: 'bg-zinc-900 dark:bg-white',
      primaryBtnText: 'text-white dark:text-zinc-900',
      primaryBtnHover: 'hover:bg-zinc-800 dark:hover:bg-zinc-100',
      secondaryBtnBg: 'bg-transparent',
      secondaryBtnText: 'text-zinc-600 dark:text-zinc-400',
      secondaryBtnBorder: 'border border-zinc-200 dark:border-zinc-700',
      offerBg: 'bg-zinc-50 dark:bg-zinc-800/50',
      offerBorder: 'border border-zinc-200 dark:border-zinc-700',
      offerBadgeBg: 'bg-zinc-900 dark:bg-white',
      offerBadgeText: 'text-white dark:text-zinc-900',
      offerPriceColor: 'text-zinc-900 dark:text-white',
      radioSelectedBg: 'bg-zinc-900/5 dark:bg-white/5',
      radioSelectedBorder: 'border-zinc-900 dark:border-white',
      successBg: 'bg-zinc-100 dark:bg-zinc-800',
      successIcon: 'text-zinc-900 dark:text-white',
    },
  },
  gradient: {
    id: 'gradient',
    name: 'Gradient',
    description: 'Vibrant gradient accents',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    styles: {
      cardBg: 'bg-white dark:bg-slate-900',
      cardBorder: 'border-0',
      cardShadow: 'shadow-2xl shadow-purple-500/10',
      headerBg: 'bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10',
      titleColor: 'text-slate-900 dark:text-white',
      descColor: 'text-slate-600 dark:text-slate-400',
      primaryBtnBg: 'bg-gradient-to-r from-purple-600 to-pink-600',
      primaryBtnText: 'text-white',
      primaryBtnHover: 'hover:from-purple-700 hover:to-pink-700',
      secondaryBtnBg: 'bg-transparent',
      secondaryBtnText: 'text-slate-600 dark:text-slate-400',
      secondaryBtnBorder: 'border border-slate-200 dark:border-slate-700',
      offerBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      offerBorder: 'border border-emerald-200 dark:border-emerald-800',
      offerBadgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      offerBadgeText: 'text-white',
      offerPriceColor: 'text-emerald-600 dark:text-emerald-400',
      radioSelectedBg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      radioSelectedBorder: 'border-purple-500',
      successBg: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30',
      successIcon: 'text-emerald-600',
    },
  },
  soft: {
    id: 'soft',
    name: 'Soft',
    description: 'Gentle rounded design',
    preview: '#f0fdf4',
    styles: {
      cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      cardBorder: 'border border-emerald-100 dark:border-emerald-900',
      cardShadow: 'shadow-xl shadow-emerald-500/5',
      headerBg: '',
      titleColor: 'text-emerald-900 dark:text-emerald-100',
      descColor: 'text-emerald-700 dark:text-emerald-300',
      primaryBtnBg: 'bg-emerald-600',
      primaryBtnText: 'text-white',
      primaryBtnHover: 'hover:bg-emerald-700',
      secondaryBtnBg: 'bg-white dark:bg-emerald-900/50',
      secondaryBtnText: 'text-emerald-700 dark:text-emerald-300',
      secondaryBtnBorder: 'border border-emerald-200 dark:border-emerald-800',
      offerBg: 'bg-white dark:bg-emerald-900/30',
      offerBorder: 'border-2 border-emerald-300 dark:border-emerald-700',
      offerBadgeBg: 'bg-emerald-500',
      offerBadgeText: 'text-white',
      offerPriceColor: 'text-emerald-700 dark:text-emerald-300',
      radioSelectedBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      radioSelectedBorder: 'border-emerald-500',
      successBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      successIcon: 'text-emerald-600',
    },
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Strong contrasting colors',
    preview: '#3b82f6',
    styles: {
      cardBg: 'bg-white dark:bg-slate-950',
      cardBorder: 'border-2 border-blue-500',
      cardShadow: 'shadow-xl shadow-blue-500/20',
      headerBg: 'bg-blue-600',
      titleColor: 'text-white',
      descColor: 'text-blue-100',
      primaryBtnBg: 'bg-blue-600',
      primaryBtnText: 'text-white',
      primaryBtnHover: 'hover:bg-blue-700',
      secondaryBtnBg: 'bg-transparent',
      secondaryBtnText: 'text-blue-600 dark:text-blue-400',
      secondaryBtnBorder: 'border-2 border-blue-500',
      offerBg: 'bg-amber-50 dark:bg-amber-950/30',
      offerBorder: 'border-2 border-amber-400',
      offerBadgeBg: 'bg-amber-500',
      offerBadgeText: 'text-white',
      offerPriceColor: 'text-amber-600 dark:text-amber-400',
      radioSelectedBg: 'bg-blue-50 dark:bg-blue-950/30',
      radioSelectedBorder: 'border-blue-500',
      successBg: 'bg-green-500',
      successIcon: 'text-white',
    },
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    description: 'Frosted glass effect',
    preview: 'rgba(255,255,255,0.8)',
    styles: {
      cardBg: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
      cardBorder: 'border border-white/20 dark:border-slate-700/50',
      cardShadow: 'shadow-2xl',
      headerBg: '',
      titleColor: 'text-slate-900 dark:text-white',
      descColor: 'text-slate-600 dark:text-slate-400',
      primaryBtnBg: 'bg-slate-900/90 dark:bg-white/90 backdrop-blur',
      primaryBtnText: 'text-white dark:text-slate-900',
      primaryBtnHover: 'hover:bg-slate-900 dark:hover:bg-white',
      secondaryBtnBg: 'bg-white/50 dark:bg-slate-800/50 backdrop-blur',
      secondaryBtnText: 'text-slate-700 dark:text-slate-300',
      secondaryBtnBorder: 'border border-slate-200/50 dark:border-slate-700/50',
      offerBg: 'bg-emerald-500/10 backdrop-blur',
      offerBorder: 'border border-emerald-500/30',
      offerBadgeBg: 'bg-emerald-500/90 backdrop-blur',
      offerBadgeText: 'text-white',
      offerPriceColor: 'text-emerald-600 dark:text-emerald-400',
      radioSelectedBg: 'bg-slate-900/5 dark:bg-white/5',
      radioSelectedBorder: 'border-slate-900 dark:border-white',
      successBg: 'bg-emerald-500/10 backdrop-blur',
      successIcon: 'text-emerald-600',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Dark mode focused',
    preview: '#1e293b',
    styles: {
      cardBg: 'bg-slate-900',
      cardBorder: 'border border-slate-700',
      cardShadow: 'shadow-2xl shadow-black/50',
      headerBg: '',
      titleColor: 'text-white',
      descColor: 'text-slate-400',
      primaryBtnBg: 'bg-indigo-600',
      primaryBtnText: 'text-white',
      primaryBtnHover: 'hover:bg-indigo-500',
      secondaryBtnBg: 'bg-slate-800',
      secondaryBtnText: 'text-slate-300',
      secondaryBtnBorder: 'border border-slate-700',
      offerBg: 'bg-emerald-900/30',
      offerBorder: 'border border-emerald-700',
      offerBadgeBg: 'bg-emerald-600',
      offerBadgeText: 'text-white',
      offerPriceColor: 'text-emerald-400',
      radioSelectedBg: 'bg-indigo-900/30',
      radioSelectedBorder: 'border-indigo-500',
      successBg: 'bg-emerald-900/50',
      successIcon: 'text-emerald-400',
    },
  },
};

export const getThemeConfig = (theme: ModalTheme): ThemeConfig => {
  return MODAL_THEMES[theme] || MODAL_THEMES.minimal;
};
