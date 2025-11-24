import { FormModal, FormField } from './FormModal';

interface CreateBarberModalProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
}

export function CreateBarberModal({ onClose, onSubmit, loading }: CreateBarberModalProps) {
    const fields: FormField[] = [
        {
            name: 'name',
            label: 'Nombre Completo',
            type: 'text',
            required: true,
            placeholder: 'Ej: Juan Pérez'
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'juan@ejemplo.com'
        },
        {
            name: 'password',
            label: 'Contraseña',
            type: 'password',
            required: true
        },
        {
            name: 'phone',
            label: 'Teléfono',
            type: 'tel',
            placeholder: '+57 300 123 4567'
        },
        {
            name: 'turno_trabajo',
            label: 'Turno',
            type: 'select',
            options: [
                { value: 'manana', label: 'Mañana' },
                { value: 'tarde', label: 'Tarde' },
                { value: 'completo', label: 'Completo' }
            ]
        },
        {
            name: 'experiencia_anios',
            label: 'Experiencia (años)',
            type: 'number',
            min: 0
        },
        {
            name: 'especialidades',
            label: 'Especialidades',
            type: 'text',
            placeholder: 'Ej: Corte clásico, Barba, Degradado'
        }
    ];

    return (
        <FormModal
            title="Registrar Nuevo Barbero"
            fields={fields}
            onClose={onClose}
            onSubmit={onSubmit}
            loading={loading}
            submitButtonText="Registrar Barbero"
        />
    );
}
