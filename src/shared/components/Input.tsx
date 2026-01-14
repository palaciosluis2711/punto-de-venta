import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    rightElement,
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
                    className={`input-field ${error ? 'has-error' : ''} ${icon ? 'has-icon' : ''} ${rightElement ? 'has-right-element' : ''}`}
                    {...props}
                />
                {rightElement && <div className="input-right-element">{rightElement}</div>}
            </div>
            {error && <span className="input-error">{error}</span>}
        </div>
    );
};
