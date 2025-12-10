import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BaseFieldProps {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  className?: string;
  labelClassName?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password" | "tel" | "url" | "number";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
}

export function FormField({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  className,
  labelClassName,
  disabled = false,
  ...props
}: InputFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={id}
        className={cn(
          error && "text-destructive",
          labelClassName
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(error && "border-destructive focus-visible:ring-destructive/20")}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function FormTextareaField({
  label,
  id,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  className,
  labelClassName,
  rows = 3,
  disabled = false,
  ...props
}: TextareaFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={id}
        className={cn(
          error && "text-destructive",
          labelClassName
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className={cn(error && "border-destructive focus-visible:ring-destructive/20")}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({
  children,
  columns = 2,
  className
}: FormGridProps) {
  const gridClassName = cn(
    "grid gap-4",
    {
      "grid-cols-1": columns === 1,
      "grid-cols-1 md:grid-cols-2": columns === 2,
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": columns === 3,
    },
    className
  );

  return (
    <div className={gridClassName}>
      {children}
    </div>
  );
}