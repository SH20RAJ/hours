import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from 'react-native';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <Box className="absolute w-full p-3 justify-center items-center flex-row">
            <HStack className="py-2 px-5 rounded-full items-center gap-2 max-w-4xl flex-grow bg-background-50 dark:bg-background-950">
              <Text size="sm" className="font-bold mr-auto">Hours</Text>
              
              <TabTrigger name="index" href="/" asChild>
                <TabButton>Tasks</TabButton>
              </TabTrigger>
              <TabTrigger name="explore" href="/explore" asChild>
                <TabButton>Analytics</TabButton>
              </TabTrigger>
            </HStack>
        </Box>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({pressed}) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Box className={`py-1 px-3 rounded-xl ${isFocused ? 'bg-background-200 dark:bg-background-800' : 'bg-transparent'}`}>
        <Text size="sm" className={isFocused ? 'text-typography-950 dark:text-typography-50' : 'text-typography-500 dark:text-typography-400'}>
          {children}
        </Text>
      </Box>
    </Pressable>
  );
}
