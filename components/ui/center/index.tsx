import React from 'react';
import { View, type ViewProps } from 'react-native';

type CenterProps = ViewProps & {
  className?: string;
};

export const Center = React.forwardRef<React.ElementRef<typeof View>, CenterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} {...props} className={`items-center justify-center ${className ?? ''}`} />
  )
);

Center.displayName = 'Center';