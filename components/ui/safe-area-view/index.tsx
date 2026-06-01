import React from 'react';
import { SafeAreaView as RNSafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

type GluestackSafeAreaViewProps = SafeAreaViewProps & {
  className?: string;
};

export const SafeAreaView = React.forwardRef<
  React.ElementRef<typeof RNSafeAreaView>,
  GluestackSafeAreaViewProps
>(({ className, ...props }, ref) => <RNSafeAreaView ref={ref} {...props} className={className} />);

SafeAreaView.displayName = 'SafeAreaView';