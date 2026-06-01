'use client';

import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
    type PressableProps,
    type TextProps,
    type ViewProps
} from 'react-native';

type ButtonVariant = 'solid' | 'outline' | 'link';
type ButtonAction = 'primary' | 'secondary' | 'positive' | 'negative' | 'default';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = PressableProps & {
  className?: string;
  variant?: ButtonVariant;
  action?: ButtonAction;
  size?: ButtonSize;
};

type ButtonTextProps = TextProps & {
  className?: string;
};

type ButtonIconProps = ViewProps & {
  className?: string;
  as?: React.ElementType;
  size?: number;
  color?: string;
};

type ButtonGroupProps = ViewProps & {
  className?: string;
};

type ButtonContextValue = {
  variant: ButtonVariant;
  action: ButtonAction;
  size: ButtonSize;
};

const ButtonContext = React.createContext<ButtonContextValue>({
  variant: 'solid',
  action: 'primary',
  size: 'md',
});

const buttonVariantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-primary-500',
  outline: 'border border-outline-200 bg-background-0',
  link: 'bg-transparent',
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  xs: 'h-8 px-3',
  sm: 'h-9 px-4',
  md: 'h-10 px-5',
  lg: 'h-11 px-6',
  xl: 'h-12 px-7',
};

const buttonTextVariantClasses: Record<ButtonVariant, string> = {
  solid: 'text-background-0',
  outline: 'text-primary-600',
  link: 'text-primary-600',
};

function joinClassNames(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(' ');
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      className,
      variant = 'solid',
      size = 'md',
      action = 'primary',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isOutline = variant === 'outline';
    const isLink = variant === 'link';

    return (
      <ButtonContext.Provider value={{ variant, action, size }}>
        <Pressable
          ref={ref}
          disabled={disabled}
          accessibilityRole="button"
          className={joinClassNames(
            'flex-row items-center justify-center rounded-2xl gap-2',
            buttonVariantClasses[variant],
            buttonSizeClasses[size],
            action === 'primary' && !isOutline && !isLink && 'shadow-sm',
            disabled && 'opacity-40',
            className
          )}
          {...props}
        >
          {children}
        </Pressable>
      </ButtonContext.Provider>
    );
  }
);

const ButtonText = React.forwardRef<React.ElementRef<typeof Text>, ButtonTextProps>(
  ({ className, children, ...props }, ref) => {
    const { variant } = React.useContext(ButtonContext);

    return (
      <Text
        ref={ref}
        className={joinClassNames(
          'text-base font-semibold',
          buttonTextVariantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

const ButtonSpinner: React.FC<React.ComponentProps<typeof ActivityIndicator>> = (props) => (
  <ActivityIndicator {...props} />
);

const ButtonIcon = React.forwardRef<React.ElementRef<typeof View>, ButtonIconProps>(
  ({ className, as: IconComponent, size = 18, color, children, ...props }, ref) => {
    const { variant } = React.useContext(ButtonContext);
    const resolvedColor = color ?? (variant === 'outline' || variant === 'link' ? '#2563eb' : '#ffffff');

    if (IconComponent !== undefined) {
      return (
        <View ref={ref} className={joinClassNames('items-center justify-center', className)} {...props}>
          <IconComponent size={size} color={resolvedColor} />
        </View>
      );
    }

    return (
      <View ref={ref} className={joinClassNames('items-center justify-center', className)} {...props}>
        {children}
      </View>
    );
  }
);

const ButtonGroup = React.forwardRef<React.ElementRef<typeof View>, ButtonGroupProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={joinClassNames('gap-3', className)} {...props}>
      {children}
    </View>
  )
);

Button.displayName = 'Button';
ButtonText.displayName = 'ButtonText';
ButtonSpinner.displayName = 'ButtonSpinner';
ButtonIcon.displayName = 'ButtonIcon';
ButtonGroup.displayName = 'ButtonGroup';

export { Button, ButtonGroup, ButtonIcon, ButtonSpinner, ButtonText };

