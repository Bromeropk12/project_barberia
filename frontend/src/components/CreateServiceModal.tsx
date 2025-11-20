import { useState } from 'react';
import './CreateServiceModal.css';

interface CreateServiceModalProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
}

export function CreateServiceModal({ onClose, onSubmit, loading }: CreateServiceModalProps) {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: 0,
        duracion_min: 30
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <div className="service-modal-overlay">
            <div className="service-modal-content">
                <h2>Crear Nuevo Servicio</h2>
                <form onSubmit={handleSubmit} className="service-form">
                    <div className="form-group">
                        <label>Nombre del Servicio</label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            placeholder="Ej: Corte Clásico"
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            value={formData.descripcion}
                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Breve descripción del servicio"
                            rows={3}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Precio ($)</label>
                            <input
                                type="number"
                                value={formData.precio}
                                onChange={e => setFormData({ ...formData, precio: parseInt(e.target.value) })}
                                required
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Duración (min)</label>
                            <input
                                type="number"
                                value={formData.duracion_min}
                                onChange={e => setFormData({ ...formData, duracion_min: parseInt(e.target.value) })}
                                required
                                min="15"
                                step="15"
                            />
                        </div>
                    </div>

                    <div className="service-modal-buttons">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Servicio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
