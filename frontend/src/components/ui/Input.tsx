import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-medium text-gray-700 ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-gray-400 flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            className={cn(
              'flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#eb1b23] focus-visible:border-[#eb1b23] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-gray-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        
        {helperText && !error && (
          <p className="text-[13px] text-gray-500 ml-1">{helperText}</p>
        )}
        
        {error && (
          <p className="flex items-center gap-1.5 text-[13px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
