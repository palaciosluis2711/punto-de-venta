import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className={`input-wrapper ${className}`}>
            {label && <label htmlFor={inputId} className="input-label">{label}</label>}
            <div className="input-container">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    id={inputId}
                    className={`input-field ${error ? 'has-error' : ''} ${icon ? 'has-icon' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="input-error">{error}</span>}
        </div>
    );
};
