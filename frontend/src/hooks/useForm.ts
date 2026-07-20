import { useState } from 'react';
import type { ChangeEvent } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K], values: T) => string | null;
};

type Errors<T> = {
  [K in keyof T]?: string;
};

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});

  const validateField = (name: keyof T, value: any, currentValues: T): string | null => {
    if (validationRules && validationRules[name]) {
      const rule = validationRules[name];
      return rule ? rule(value, currentValues) : null;
    }
    return null;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: any }>
  ) => {
    const name = e.target.name as keyof T;
    const value = e.target.value;

    if (!name) return;

    const nextValues = {
      ...values,
      [name]: value,
    };

    setValues(nextValues);

    // Validate on the fly
    const fieldError = validateField(name, value, nextValues);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError ? fieldError : undefined,
    }));
  };

  const validateAll = (): boolean => {
    if (!validationRules) return true;

    const newErrors: Errors<T> = {};
    let isValid = true;

    (Object.keys(validationRules) as Array<keyof T>).forEach((key) => {
      const fieldError = validateField(key, values[key], values);
      if (fieldError) {
        newErrors[key] = fieldError;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    validateAll,
    resetForm,
    setValues,
    setErrors,
  };
}
