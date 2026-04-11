export const fonts = {
bold: 'Ramabhadra',
  regular: 'Ramabhadra',
  medium: 'Ramabhadra',
  description: 'Priyaanka',
};

export const lightTheme = {
  // Brand Colors
  primary: '#007AFF',          // Sleek Electric Blue (Fits B&W theme)
  primaryBlue: '#007AFF',      
  secondary: '#4ECDC4',
  accentBlue: '#007AFF',

  // UI Colors
  background: '#FFFFFF',
  cardBackground: '#F8F9FA',
  text: '#000000',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  tabBar: '#FFFFFF',
  shadow: '#000000',
  shimmer: ['#E8E8E8', '#F3F3F3', '#E8E8E8'],
  
  // Status Colors
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',

  // Additional extracted colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#CCCCCC',
  darkGray: '#525252',
  lightGray: '#E0E0E0',
  iconGray: '#3D3D3D',
  buttonOrange: '#FF9500',
};

export const darkTheme = {
  // Brand Colors
  primary: '#007AFF',          // Sleek Electric Blue (Fits B&W theme)
  primaryBlue: '#007AFF',
  secondary: '#4ECDC4',
  accentBlue: '#007AFF',

  // UI Colors
  background: '#121212',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#2C2C2C',
  tabBar: '#1E1E1E',
  shadow: '#FFFFFF',
  shimmer: ['#2C2C2C', '#3A3A3A', '#2C2C2C'],

  // Status Colors
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',

  // Additional extracted colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#CCCCCC',
  darkGray: '#525252',
  lightGray: '#E0E0E0',
  iconGray: '#3D3D3D',
  buttonOrange: '#FF9500',
};

export type Theme = typeof lightTheme;
