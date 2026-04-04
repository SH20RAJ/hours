import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function AppTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  const bg = isDark ? '#000000' : '#ffffff';
  const indicator = isDark ? '#1e293b' : '#f1f5f9';
  const textClr = isDark ? '#f8fafc' : '#020617';

  return (
    <NativeTabs
      backgroundColor={bg}
      indicatorColor={indicator}
      labelStyle={{ selected: { color: textClr } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Analytics</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
