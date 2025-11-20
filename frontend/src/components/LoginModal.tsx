// components/LoginModal.tsx - Login modal component
import { useState } from 'react';

interface LoginModalProps {
    onSubmit: (email: string, password: string) => Promise<void>;
    onClose: () => void;
    loading: boolean;
    error: string;
}

export function LoginModal({ onSubmit, onClose, loading, error }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(email, password);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Iniciar Sesión</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {error && <div className="error">{error}</div>}
                    <div className="modal-buttons">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Cargando...' : 'Ingresar'}
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
