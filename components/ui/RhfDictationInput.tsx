'use client';

import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { DictationInput } from '@/components/ui/DictationTextarea';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  placeholder?: string;
  style?: React.CSSProperties;
  type?: string;
  autoComplete?: string;
};

export function RhfDictationInput<T extends FieldValues>({
  control,
  name,
  placeholder,
  style,
  type,
  autoComplete,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DictationInput
          name={field.name}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          placeholder={placeholder}
          style={style}
          type={type}
          autoComplete={autoComplete}
        />
      )}
    />
  );
}
