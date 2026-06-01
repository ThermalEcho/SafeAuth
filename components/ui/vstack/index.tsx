import React from 'react';
import { View, type ViewProps } from 'react-native';

type VStackProps = ViewProps & {
  className?: string;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  reversed?: boolean;
};

const spaceClasses: Record<NonNullable<VStackProps['space']>, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
};

export const VStack = React.forwardRef<React.ElementRef<typeof View>, VStackProps>(
  ({ className, space = 'md', reversed = false, ...props }, ref) => (
    <View
      ref={ref}
      {...props}
      className={`flex-col ${reversed ? 'flex-col-reverse' : ''} ${spaceClasses[space]} ${className ?? ''}`}
    />
  )
);

VStack.displayName = 'VStack';