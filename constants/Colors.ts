/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Новые цвета для блога
    cardBackground: '#ffffff',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    borderLight: '#e5e7eb',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Новые цвета для блога (темная тема)
    cardBackground: '#1f2937',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',
    borderLight: '#374151',
  },
};
