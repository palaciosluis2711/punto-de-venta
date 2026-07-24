import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    value?: string;
    onChange?: any; // To accept both string and event
    options?: Option[];
    icon?: React.ReactNode;
    minWidth?: string;
    disabled?: boolean;
    title?: string;
    className?: string;
    children?: React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    icon,
    minWidth,
    disabled = false,
    title,
    className = '',
    children,
    ...rest
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Extract options from children if not provided directly
    const parsedOptions = React.useMemo(() => {
        if (options) return options;
        const extracted: Option[] = [];
        React.Children.toArray(children).forEach((child: any) => {
            if (React.isValidElement(child) && child.type === 'option') {
                extracted.push({
                    value: String((child as any).props.value ?? ''),
                    label: (child as any).props.children ? String((child as any).props.children) : ''
                });
            }
        });
        return extracted;
    }, [options, children]);

    const safeValue = value ?? rest.defaultValue ?? '';
    const selectedOption = parsedOptions.find(o => o.value === String(safeValue)) || parsedOptions[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div 
            className={`custom-select-container ${disabled ? 'disabled' : ''}`} 
            ref={containerRef}
            title={title}
        >
            {icon && <div className="custom-select-icon">{icon}</div>}
            
            <div 
                className="custom-select-trigger"
                style={{ minWidth }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="custom-select-value">{selectedOption?.label}</span>
                <ChevronDown size={14} className={`custom-select-arrow ${isOpen ? 'open' : ''}`} />
            </div>

            {isOpen && (
                <div className="custom-select-dropdown animate-in fade-in zoom-in-95 duration-200">
                    {parsedOptions.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                            onClick={() => {
                                if (onChange) {
                                    console.log('CustomSelect option clicked! Emitting value:', option.value);
                                    onChange({ target: { value: option.value, name: rest.name } } as any);
                                }
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
