import React from 'react';
import { View, type ViewProps } from 'react-native';

type HStackProps = ViewProps & {
  className?: string;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  reversed?: boolean;
};

const spaceClasses: Record<NonNullable<HStackProps['space']>, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
};

export const HStack = React.forwardRef<React.ElementRef<typeof View>, HStackProps>(
  ({ className, space = 'md', reversed = false, ...props }, ref) => (
    <View
      ref={ref}
      {...props}
      className={`flex-row ${reversed ? 'flex-row-reverse' : ''} items-center ${spaceClasses[space]} ${className ?? ''}`}
    />
  )
);

HStack.displayName = 'HStack';