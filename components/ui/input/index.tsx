import React from 'react';
import {
    Pressable,
    TextInput,
    View,
    type TextInputProps,
    type ViewProps,
} from 'react-native';

type InputProps = ViewProps & {
  className?: string;
};

type InputFieldProps = TextInputProps & {
  className?: string;
};

type InputSlotProps = ViewProps & {
  className?: string;
};

type InputIconProps = ViewProps & {
  className?: string;
};

export const Input = React.forwardRef<React.ElementRef<typeof View>, InputProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      {...props}
      className={`flex-row items-center rounded-2xl border border-outline-200 bg-background-50 px-4 py-3 ${className ?? ''}`}
    />
  )
);

export const InputField = React.forwardRef<React.ElementRef<typeof TextInput>, InputFieldProps>(
  ({ className, ...props }, ref) => (
    <TextInput ref={ref} {...props} className={`flex-1 text-typography-900 ${className ?? ''}`} />
  )
);

export const InputSlot = React.forwardRef<React.ElementRef<typeof View>, InputSlotProps>(
  ({ className, ...props }, ref) => <View ref={ref} {...props} className={className} />
);

export const InputIcon = React.forwardRef<React.ElementRef<typeof Pressable>, InputIconProps>(
  ({ className, ...props }, ref) => <Pressable ref={ref} {...props} className={className} />
);

Input.displayName = 'Input';
InputField.displayName = 'InputField';
InputSlot.displayName = 'InputSlot';
InputIcon.displayName = 'InputIcon';