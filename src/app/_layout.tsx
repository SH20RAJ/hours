import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AppDataProvider } from '@/state/tasks-context';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/src/global.css';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    
    <GluestackUIProvider mode="dark">
      <AppDataProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppTabs />
      </ThemeProvider>
    </AppDataProvider>
    </GluestackUIProvider>
  
  );
}
