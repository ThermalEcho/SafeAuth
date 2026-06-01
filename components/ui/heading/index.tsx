import React from 'react';
import { Text, type TextProps } from 'react-native';

type HeadingProps = TextProps & {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

const sizeClasses: Record<NonNullable<HeadingProps['size']>, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
};

export const Heading = React.forwardRef<React.ElementRef<typeof Text>, HeadingProps>(
  ({ className, size = 'lg', ...props }, ref) => (
    <Text
      ref={ref}
      {...props}
      className={`font-bold tracking-tight text-typography-900 ${sizeClasses[size]} ${className ?? ''}`}
    />
  )
);

Heading.displayName = 'Heading';