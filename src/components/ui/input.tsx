import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input component that uses uncontrolled mode for better IME keyboard support
 * (Helakuru, SwiftKey, etc.). Uses defaultValue + ref instead of controlled value.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, value, defaultValue, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const lastValueRef = React.useRef(value ?? defaultValue ?? '');

    // Forward ref
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Sync external value changes to the uncontrolled input
    React.useEffect(() => {
      if (value !== undefined && inputRef.current && inputRef.current.value !== value) {
        inputRef.current.value = String(value);
        lastValueRef.current = value;
      }
    }, [value]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      lastValueRef.current = e.target.value;
      if (onChange) {
        onChange(e);
      }
    }, [onChange]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={inputRef}
        defaultValue={value ?? defaultValue}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
