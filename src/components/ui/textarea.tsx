import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea component that uses uncontrolled mode for better IME keyboard support
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, value, defaultValue, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const lastValueRef = React.useRef(value ?? defaultValue ?? '');

    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    // Sync external value changes to the uncontrolled textarea
    React.useEffect(() => {
      if (value !== undefined && textareaRef.current && textareaRef.current.value !== value) {
        textareaRef.current.value = String(value);
        lastValueRef.current = value;
      }
    }, [value]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      lastValueRef.current = e.target.value;
      if (onChange) {
        onChange(e);
      }
    }, [onChange]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={textareaRef}
        defaultValue={value ?? defaultValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
