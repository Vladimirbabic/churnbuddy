// Design Style Configuration for Cancel Flow Modals
// Each style defines the visual appearance for all modal components

export interface DesignStyleConfig {
  id: number;
  name: string;
  description: string;
  // Container styles
  container: {
    background: string;
    border: string;
    borderRadius: string;
    shadow: string;
    extraClasses?: string;
  };
  // Header styles
  header: {
    background: string;
    border: string;
    padding: string;
    titleColor: string;
    iconBackground: string;
    iconColor: string;
    closeButtonClasses: string;
  };
  // Content area
  content: {
    padding: string;
    titleClasses: string;
    subtitleClasses: string;
  };
  // Options/buttons
  option: {
    default: {
      background: string;
      border: string;
      borderRadius: string;
      textColor: string;
      letterBadge: {
        background: string;
        textColor: string;
        border: string;
      };
    };
    selected: {
      background: string;
      border: string;
      textColor: string;
      shadow?: string;
      transform?: string;
      letterBadge: {
        background: string;
        textColor: string;
      };
    };
  };
  // Footer buttons
  footer: {
    backButton: string;
    primaryButton: string;
    secondaryButton?: string;
  };
  // Plan cards (for plans modal)
  planCard?: {
    background: string;
    border: string;
    borderRadius: string;
    recommendedBorder?: string;
    recommendedBackground?: string;
  };
  // Offer box
  offerBox?: {
    background: string;
    border: string;
    shadow?: string;
  };
  // Typography overrides
  fonts?: {
    heading?: string;
    body?: string;
  };
  // Dark mode flag
  isDark?: boolean;
}

export const DESIGN_STYLE_CONFIGS: Record<number, DesignStyleConfig> = {
  // Style 1: Classic Card (Default)
  1: {
    id: 1,
    name: 'Classic Card',
    description: 'Colored headers and rounded cards',
    container: {
      background: 'bg-white',
      border: '',
      borderRadius: 'rounded-2xl',
      shadow: 'shadow-2xl',
    },
    header: {
      background: '', // Uses color from colors prop
      border: '',
      padding: 'px-4 py-2',
      titleColor: '', // Uses color from colors prop
      iconBackground: '',
      iconColor: '', // Uses color from colors prop
      closeButtonClasses: 'p-1 rounded-md hover:opacity-80',
    },
    content: {
      padding: 'px-6 py-4',
      titleClasses: 'font-bold text-[22px] mt-2',
      subtitleClasses: 'text-sm mt-1 mb-6 opacity-70',
    },
    option: {
      default: {
        background: '', // Uses colors.background
        border: '', // Uses colors.primary with opacity
        borderRadius: 'rounded-lg',
        textColor: '', // Uses colors.text
        letterBadge: {
          background: 'bg-white',
          textColor: '', // Uses colors.text
          border: '', // Uses colors.primary with opacity
        },
      },
      selected: {
        background: '', // Uses colors.background
        border: 'border-2', // Uses colors.primary
        textColor: '', // Uses colors.text
        letterBadge: {
          background: '', // Uses colors.primary
          textColor: 'text-white',
        },
      },
    },
    footer: {
      backButton: 'px-4 py-2 rounded-lg font-medium',
      primaryButton: 'bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50',
    },
  },

  // Style 2: Minimal Flat
  2: {
    id: 2,
    name: 'Minimal Flat',
    description: 'Clean, flat design with subtle borders',
    container: {
      background: 'bg-white',
      border: 'border border-gray-200',
      borderRadius: '',
      shadow: '',
    },
    header: {
      background: '',
      border: 'border-b border-gray-100',
      padding: 'px-6 py-5',
      titleColor: 'text-gray-400',
      iconBackground: '',
      iconColor: 'text-gray-400',
      closeButtonClasses: 'text-gray-400 hover:text-gray-600',
    },
    content: {
      padding: 'px-6 py-6',
      titleClasses: 'text-2xl font-light text-gray-900 mb-1',
      subtitleClasses: 'text-sm text-gray-400 mb-8',
    },
    option: {
      default: {
        background: 'bg-white',
        border: 'border border-gray-200 hover:border-gray-300',
        borderRadius: '',
        textColor: 'text-gray-700',
        letterBadge: {
          background: 'hidden',
          textColor: '',
          border: '',
        },
      },
      selected: {
        background: 'bg-gray-50',
        border: 'border border-gray-900',
        textColor: 'text-gray-900',
        letterBadge: {
          background: 'hidden',
          textColor: '',
        },
      },
    },
    footer: {
      backButton: 'text-gray-500 hover:text-gray-700 font-medium',
      primaryButton: 'bg-gray-900 text-white px-6 py-2 font-medium hover:bg-gray-800',
    },
  },

  // Style 3: Glassmorphism
  3: {
    id: 3,
    name: 'Glassmorphism',
    description: 'Frosted glass with gradients',
    container: {
      background: 'bg-white/80 backdrop-blur-xl',
      border: 'border border-white/50',
      borderRadius: 'rounded-3xl',
      shadow: 'shadow-xl',
    },
    header: {
      background: 'bg-gradient-to-r from-violet-500/10 to-purple-500/10',
      border: '',
      padding: 'px-6 py-4',
      titleColor: 'text-gray-800',
      iconBackground: 'bg-gradient-to-br from-violet-500 to-purple-600',
      iconColor: 'text-white',
      closeButtonClasses: 'w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/80',
    },
    content: {
      padding: 'px-6 py-6',
      titleClasses: 'text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent',
      subtitleClasses: 'text-gray-500 mt-2 mb-6',
    },
    option: {
      default: {
        background: 'bg-white/50 hover:bg-white/80',
        border: 'border-2 border-transparent',
        borderRadius: 'rounded-2xl',
        textColor: 'text-gray-700',
        letterBadge: {
          background: 'bg-gray-200',
          textColor: 'text-gray-600',
          border: '',
        },
      },
      selected: {
        background: 'bg-violet-50/50',
        border: 'border-2 border-violet-500',
        textColor: 'text-gray-700',
        shadow: 'shadow-lg shadow-violet-500/20',
        letterBadge: {
          background: 'bg-gradient-to-br from-violet-500 to-purple-600',
          textColor: 'text-white',
        },
      },
    },
    footer: {
      backButton: 'flex-1 py-3 rounded-xl font-medium text-gray-600 bg-white/50 hover:bg-white/80',
      primaryButton: 'flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30',
    },
  },

  // Style 4: Brutalist
  4: {
    id: 4,
    name: 'Brutalist',
    description: 'Bold borders and hard shadows',
    container: {
      background: 'bg-white',
      border: 'border-4 border-black',
      borderRadius: '',
      shadow: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
    },
    header: {
      background: 'bg-yellow-300',
      border: 'border-b-4 border-black',
      padding: 'px-4 py-3',
      titleColor: 'text-black',
      iconBackground: '',
      iconColor: 'text-black',
      closeButtonClasses: 'w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-red-500 hover:text-white',
    },
    content: {
      padding: 'p-6',
      titleClasses: 'text-3xl font-black uppercase mb-2',
      subtitleClasses: 'text-gray-600 mb-6',
    },
    option: {
      default: {
        background: 'bg-white hover:bg-gray-100',
        border: 'border-[3px] border-black',
        borderRadius: '',
        textColor: 'text-black',
        letterBadge: {
          background: 'bg-white',
          textColor: 'text-black',
          border: 'border-2 border-black',
        },
      },
      selected: {
        background: 'bg-lime-300',
        border: 'border-[3px] border-black',
        textColor: 'text-black',
        shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        transform: '-translate-x-1 -translate-y-1',
        letterBadge: {
          background: 'bg-black',
          textColor: 'text-lime-300',
        },
      },
    },
    footer: {
      backButton: 'px-6 py-3 bg-white border-[3px] border-black font-black uppercase hover:bg-gray-100',
      primaryButton: 'flex-1 px-6 py-3 bg-black text-white font-black uppercase border-[3px] border-black hover:bg-gray-800',
    },
    fonts: {
      heading: 'font-black uppercase',
      body: 'font-bold',
    },
  },

  // Style 5: Dark Mode Premium
  5: {
    id: 5,
    name: 'Dark Mode',
    description: 'Sleek dark interface',
    isDark: true,
    container: {
      background: 'bg-gray-900',
      border: 'border border-gray-800',
      borderRadius: 'rounded-2xl',
      shadow: 'shadow-2xl',
    },
    header: {
      background: '',
      border: 'border-b border-gray-800',
      padding: 'px-5 py-4',
      titleColor: 'text-white',
      iconBackground: 'bg-gradient-to-br from-purple-500 to-pink-500',
      iconColor: 'text-white',
      closeButtonClasses: 'text-gray-500 hover:text-white',
    },
    content: {
      padding: 'p-5',
      titleClasses: 'text-xl font-semibold text-white mb-1',
      subtitleClasses: 'text-gray-400 text-sm mb-6',
    },
    option: {
      default: {
        background: 'bg-gray-800/50',
        border: 'border border-gray-800 hover:border-gray-700',
        borderRadius: 'rounded-xl',
        textColor: 'text-gray-200',
        letterBadge: {
          background: 'bg-gray-700',
          textColor: 'text-gray-400',
          border: '',
        },
      },
      selected: {
        background: 'bg-purple-500/20',
        border: 'border border-purple-500',
        textColor: 'text-gray-200',
        letterBadge: {
          background: 'bg-purple-500',
          textColor: 'text-white',
        },
      },
    },
    footer: {
      backButton: 'px-5 py-2.5 rounded-xl font-medium text-gray-400 bg-gray-800 hover:bg-gray-700',
      primaryButton: 'flex-1 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90',
    },
  },

  // Style 6: Soft Rounded
  6: {
    id: 6,
    name: 'Soft Rounded',
    description: 'Extra rounded with pastels',
    container: {
      background: 'bg-white',
      border: '',
      borderRadius: 'rounded-[32px]',
      shadow: 'shadow-xl shadow-pink-200/50',
    },
    header: {
      background: 'bg-gradient-to-r from-pink-100 to-purple-100',
      border: '',
      padding: 'px-6 py-4',
      titleColor: 'text-purple-700',
      iconBackground: 'bg-gradient-to-br from-pink-400 to-purple-400',
      iconColor: 'text-white',
      closeButtonClasses: 'w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white text-purple-400',
    },
    content: {
      padding: 'px-6 py-6',
      titleClasses: 'text-2xl font-bold text-gray-800',
      subtitleClasses: 'text-gray-500 mt-2 mb-6',
    },
    option: {
      default: {
        background: 'bg-purple-50/50 hover:bg-purple-50',
        border: 'border-2 border-transparent',
        borderRadius: 'rounded-2xl',
        textColor: 'text-gray-700',
        letterBadge: {
          background: 'bg-white',
          textColor: 'text-purple-600',
          border: 'border-2 border-purple-200',
        },
      },
      selected: {
        background: 'bg-gradient-to-r from-pink-50 to-purple-50',
        border: 'border-2 border-purple-400',
        textColor: 'text-gray-800',
        letterBadge: {
          background: 'bg-gradient-to-br from-pink-400 to-purple-400',
          textColor: 'text-white',
        },
      },
    },
    footer: {
      backButton: 'px-6 py-3 rounded-2xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200',
      primaryButton: 'flex-1 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-pink-400 to-purple-500',
    },
  },

  // Style 7: Corporate Sharp
  7: {
    id: 7,
    name: 'Corporate',
    description: 'Professional with sharp corners',
    container: {
      background: 'bg-white',
      border: 'border border-slate-200',
      borderRadius: '',
      shadow: 'shadow-lg',
    },
    header: {
      background: 'bg-slate-900',
      border: '',
      padding: 'px-5 py-4',
      titleColor: 'text-white',
      iconBackground: '',
      iconColor: 'text-white',
      closeButtonClasses: 'text-slate-400 hover:text-white',
    },
    content: {
      padding: 'px-5 py-5',
      titleClasses: 'text-xl font-semibold text-slate-900 mb-1',
      subtitleClasses: 'text-slate-500 text-sm mb-6',
    },
    option: {
      default: {
        background: 'bg-slate-50 hover:bg-slate-100',
        border: 'border border-slate-200',
        borderRadius: '',
        textColor: 'text-slate-700',
        letterBadge: {
          background: 'bg-slate-200',
          textColor: 'text-slate-600',
          border: '',
        },
      },
      selected: {
        background: 'bg-blue-50',
        border: 'border-2 border-blue-600',
        textColor: 'text-slate-900',
        letterBadge: {
          background: 'bg-blue-600',
          textColor: 'text-white',
        },
      },
    },
    footer: {
      backButton: 'px-5 py-2 font-medium text-slate-600 border border-slate-300 hover:bg-slate-50',
      primaryButton: 'px-6 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700',
    },
  },

  // Style 8: Playful
  8: {
    id: 8,
    name: 'Playful',
    description: 'Bright gradients and emojis',
    container: {
      background: 'bg-white',
      border: '',
      borderRadius: 'rounded-3xl',
      shadow: 'shadow-xl',
      extraClasses: 'overflow-visible',
    },
    header: {
      background: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
      border: '',
      padding: 'px-6 py-4',
      titleColor: 'text-white',
      iconBackground: '',
      iconColor: 'text-white',
      closeButtonClasses: 'w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 text-white',
    },
    content: {
      padding: 'px-6 py-6',
      titleClasses: 'text-2xl font-bold text-gray-800',
      subtitleClasses: 'text-gray-500 mt-1 mb-6',
    },
    option: {
      default: {
        background: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-2 border-transparent',
        borderRadius: 'rounded-2xl',
        textColor: 'text-gray-700',
        letterBadge: {
          background: 'bg-gradient-to-br from-pink-200 to-purple-200',
          textColor: 'text-purple-700',
          border: '',
        },
      },
      selected: {
        background: 'bg-gradient-to-r from-pink-50 to-purple-50',
        border: 'border-2 border-purple-400',
        textColor: 'text-gray-800',
        letterBadge: {
          background: 'bg-gradient-to-br from-pink-500 to-purple-500',
          textColor: 'text-white',
        },
      },
    },
    footer: {
      backButton: 'px-5 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200',
      primaryButton: 'flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90',
    },
  },

  // Style 9: Elegant Serif
  9: {
    id: 9,
    name: 'Elegant Serif',
    description: 'Sophisticated typography',
    container: {
      background: 'bg-stone-50',
      border: 'border border-stone-200',
      borderRadius: 'rounded-lg',
      shadow: 'shadow-sm',
    },
    header: {
      background: 'bg-stone-100',
      border: 'border-b border-stone-200',
      padding: 'px-6 py-4',
      titleColor: 'text-stone-700',
      iconBackground: '',
      iconColor: 'text-stone-600',
      closeButtonClasses: 'text-stone-400 hover:text-stone-600',
    },
    content: {
      padding: 'px-6 py-6',
      titleClasses: 'text-2xl text-stone-800 mb-2',
      subtitleClasses: 'text-stone-500 mb-8',
    },
    option: {
      default: {
        background: 'bg-white hover:bg-stone-50',
        border: 'border border-stone-200',
        borderRadius: 'rounded-md',
        textColor: 'text-stone-700',
        letterBadge: {
          background: 'bg-stone-100',
          textColor: 'text-stone-500',
          border: 'border border-stone-300',
        },
      },
      selected: {
        background: 'bg-amber-50',
        border: 'border-2 border-amber-600',
        textColor: 'text-stone-800',
        letterBadge: {
          background: 'bg-amber-600',
          textColor: 'text-white',
        },
      },
    },
    footer: {
      backButton: 'px-5 py-2 rounded-md font-medium text-stone-600 border border-stone-300 hover:bg-stone-100',
      primaryButton: 'px-6 py-2 rounded-md font-medium text-white bg-stone-800 hover:bg-stone-900',
    },
    fonts: {
      heading: 'font-serif',
      body: '',
    },
  },
};

export function getDesignStyleConfig(styleId: number): DesignStyleConfig {
  return DESIGN_STYLE_CONFIGS[styleId] || DESIGN_STYLE_CONFIGS[1];
}
