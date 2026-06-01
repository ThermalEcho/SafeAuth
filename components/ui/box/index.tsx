import React from 'react';
import { View, type ViewProps } from 'react-native';

type BoxProps = ViewProps & {
  className?: string;
};

export const Box = React.forwardRef<React.ElementRef<typeof View>, BoxProps>(
  ({ className, ...props }, ref) => <View ref={ref} {...props} className={className} />
);

Box.displayName = 'Box';