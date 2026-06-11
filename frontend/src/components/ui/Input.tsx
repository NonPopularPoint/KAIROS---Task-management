import { forwardRef } from "react";
import { CharacterCounter } from "./CharacterCounter";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  maxLength?: number;
  currentLength?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helpText, error, maxLength, currentLength, className = "", ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium mb-1.5 ${hasError ? "text-coral-600" : "text-gray-700"}`}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full px-3 py-2 rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 ${
              hasError
                ? "border-coral-500 ring-4 ring-coral-500/10 focus:border-coral-500 focus:ring-coral-500/10"
                : "border-gray-300 focus:border-kairos-500 focus:ring-4 focus:ring-kairos-500/10"
            } disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>
        {helpText && !hasError && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        {error && <p className="mt-1 text-xs text-coral-600">{error}</p>}
        {maxLength !== undefined && currentLength !== undefined && (
          <CharacterCounter current={currentLength} max={maxLength} />
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
