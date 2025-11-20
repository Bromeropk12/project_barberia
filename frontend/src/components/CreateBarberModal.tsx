import { useState } from 'react';
import './CreateBarberModal.css';

interface CreateBarberModalProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
}

export function CreateBarberModal({ onClose, onSubmit, loading }: CreateBarberModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        turno_trabajo: 'manana',
        experiencia_anios: 0,
        especialidades: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <div className="barber-modal-overlay">
            <div className="barber-modal-content">
                <h2>Registrar Nuevo Barbero</h2>
                <form onSubmit={handleSubmit} className="barber-form">
                    <div className="form-group">
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="juan@ejemplo.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label>Teléfono</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+57 300 123 4567"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Turno</label>
                            <select
                                value={formData.turno_trabajo}
                                onChange={e => setFormData({ ...formData, turno_trabajo: e.target.value })}
                            >
                                <option value="manana">Mañana</option>
                                <option value="tarde">Tarde</option>
                                <option value="completo">Completo</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Experiencia (años)</label>
                            <input
                                type="number"
                                value={formData.experiencia_anios}
                                onChange={e => setFormData({ ...formData, experiencia_anios: parseInt(e.target.value) })}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Especialidades</label>
                        <input
                            type="text"
                            value={formData.especialidades}
                            onChange={e => setFormData({ ...formData, especialidades: e.target.value })}
                            placeholder="Ej: Corte clásico, Barba, Degradado"
                        />
                    </div>

                    <div className="barber-modal-buttons">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar Barbero'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
