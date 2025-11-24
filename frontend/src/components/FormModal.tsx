// FormModal.tsx - Componente genérico para modales de formularios
import { useState } from 'react';
import './FormModal.css';

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea' | 'select';
    required?: boolean;
    placeholder?: string;
    min?: number;
    step?: number;
    options?: { value: string; label: string }[];
    rows?: number;
}

interface FormModalProps {
    title: string;
    fields: FormField[];
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
    submitButtonText?: string;
    cancelButtonText?: string;
}

export function FormModal({
    title,
    fields,
    onClose,
    onSubmit,
    loading,
    submitButtonText = 'Guardar',
    cancelButtonText = 'Cancelar'
}: FormModalProps) {
    const initialFormData = fields.reduce((acc, field) => {
        acc[field.name] = field.type === 'number' ? 0 : '';
        return acc;
    }, {} as any);

    const [formData, setFormData] = useState(initialFormData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const handleInputChange = (fieldName: string, value: any) => {
        setFormData((prev: Record<string, any>) => ({
            ...prev,
            [fieldName]: fieldName.includes('precio') || fieldName.includes('duracion') || fieldName.includes('experiencia')
                ? parseInt(value) || 0
                : value
        }));
    };

    return (
        <div className="form-modal-overlay">
            <div className="form-modal-content">
                <h2>{title}</h2>
                <form onSubmit={handleSubmit} className="form-modal-form">
                    {fields.map(field => (
                        <div key={field.name} className="form-group">
                            <label>{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.name]}
                                    onChange={e => handleInputChange(field.name, e.target.value)}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    rows={field.rows || 3}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    value={formData[field.name]}
                                    onChange={e => handleInputChange(field.name, e.target.value)}
                                    required={field.required}
                                >
                                    {field.options?.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    value={formData[field.name]}
                                    onChange={e => handleInputChange(field.name, e.target.value)}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    min={field.min}
                                    step={field.step}
                                />
                            )}
                        </div>
                    ))}

                    <div className="form-modal-buttons">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                            {cancelButtonText}
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : submitButtonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}