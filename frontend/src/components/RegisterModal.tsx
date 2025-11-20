// components/RegisterModal.tsx - Register modal component
import { useState } from 'react';

interface RegisterModalProps {
    onSubmit: (data: RegisterData) => Promise<void>;
    onClose: () => void;
    loading: boolean;
    error: string;
}

export interface RegisterData {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export function RegisterModal({ onSubmit, onClose, loading, error }: RegisterModalProps) {
    const [formData, setFormData] = useState<RegisterData>({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Registrarse</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="nombre"
                        placeholder="Nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        name="apellido"
                        placeholder="Apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="tel"
                        name="telefono"
                        placeholder="Teléfono"
                        value={formData.telefono}
                        onChange={handleChange}
                        disabled={loading}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirmar Contraseña"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    {error && <div className="error">{error}</div>}
                    <div className="modal-buttons">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Cargando...' : 'Registrarse'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
