import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Button
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      onPress={() => setColorScheme(isDarkMode ? 'light' : 'dark')}
      variant="outline"
      action="primary"
      className="overflow-hidden rounded-full border-outline-200 bg-background-0 px-3 py-2"
    >
      <HStack space="sm">
        <Box
          className={`h-8 w-8 items-center justify-center rounded-full ${
            isDarkMode ? 'bg-typography-900' : 'bg-primary-500'
          }`}
        >
          {isDarkMode ? (
            <Sun className="text-background-0" size={18} />
          ) : (
            <Moon className="text-background-0" size={18} />
          )}
        </Box>

        <VStack space="xs">
          <Text className="text-[10px] font-medium uppercase tracking-[0.24em] text-typography-400">
            Theme
          </Text>
          <Text className="text-sm font-semibold text-typography-900">
            {isDarkMode ? 'Dark' : 'Light'}
          </Text>
        </VStack>
      </HStack>
    </Button>
  );
}