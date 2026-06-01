import React from 'react';
import { View, type ViewProps } from 'react-native';

type DividerProps = ViewProps & {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
};

export const Divider = React.forwardRef<React.ElementRef<typeof View>, DividerProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <View
      ref={ref}
      {...props}
      className={`bg-outline-200 ${orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full'} ${className ?? ''}`}
    />
  )
);

Divider.displayName = 'Divider';