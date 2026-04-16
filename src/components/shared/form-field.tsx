'use client';

import {
  useFormContext,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// ── FormField wrapper ────────────────────────────────────────────────────────

type FormFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  help?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function FormField<T extends FieldValues>({
  name,
  label,
  help,
  required,
  className,
  children,
}: FormFieldProps<T>) {
  const {
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {errorMessage && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
      {help && !errorMessage && (
        <p id={helpId} className="text-xs text-muted-foreground">{help}</p>
      )}
    </div>
  );
}

// ── Typed input fields ───────────────────────────────────────────────────────

type InputFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  help?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
};

export function InputField<T extends FieldValues>({
  name,
  label,
  help,
  required,
  placeholder,
  type = 'text',
  disabled,
  className,
}: InputFieldProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const hasError = !!errors[name];
  const describedBy = hasError ? `${name}-error` : help ? `${name}-help` : undefined;

  return (
    <FormField<T> name={name} label={label} help={help} required={required} className={className}>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...register(name)}
      />
    </FormField>
  );
}

type TextareaFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  help?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
};

export function TextareaField<T extends FieldValues>({
  name,
  label,
  help,
  required,
  placeholder,
  rows = 3,
  className,
}: TextareaFieldProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const hasError = !!errors[name];
  const describedBy = hasError ? `${name}-error` : help ? `${name}-help` : undefined;

  return (
    <FormField<T> name={name} label={label} help={help} required={required} className={className}>
      <Textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...register(name)}
      />
    </FormField>
  );
}

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  options: SelectOption[];
  help?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export function SelectField<T extends FieldValues>({
  name,
  label,
  options,
  help,
  required,
  placeholder = 'Bitte wählen',
  className,
}: SelectFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField<T> name={name} label={label} help={help} required={required} className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value as string}
            onValueChange={(v) => {
              if (v) field.onChange(v);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}

type CheckboxFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  help?: string;
  className?: string;
};

export function CheckboxField<T extends FieldValues>({
  name,
  label,
  help,
  className,
}: CheckboxFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Checkbox
            id={name}
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <div>
        <Label htmlFor={name} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        {help && (
          <p className="text-xs text-muted-foreground">{help}</p>
        )}
      </div>
    </div>
  );
}
