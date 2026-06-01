import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

type GluestackTextProps = TextProps & {
  className?: string;
};

export const Text = React.forwardRef<React.ElementRef<typeof RNText>, GluestackTextProps>(
  ({ className, ...props }, ref) => <RNText ref={ref} {...props} className={className} />
);

Text.displayName = 'Text';