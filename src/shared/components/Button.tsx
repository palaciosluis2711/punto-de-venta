import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    className = '',
    children,
    ...props
}) => {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <span className="spinner"></span>}
            {!isLoading && icon && <span className="btn-icon">{icon}</span>}
            <span>{children}</span>
        </button>
    );
};
