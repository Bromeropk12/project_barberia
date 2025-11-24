import { FormModal, FormField } from './FormModal';

interface CreateServiceModalProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
}

export function CreateServiceModal({ onClose, onSubmit, loading }: CreateServiceModalProps) {
    const fields: FormField[] = [
        {
            name: 'nombre',
            label: 'Nombre del Servicio',
            type: 'text',
            required: true,
            placeholder: 'Ej: Corte Clásico'
        },
        {
            name: 'descripcion',
            label: 'Descripción',
            type: 'textarea',
            placeholder: 'Breve descripción del servicio',
            rows: 3
        },
        {
            name: 'precio',
            label: 'Precio ($)',
            type: 'number',
            required: true,
            min: 0
        },
        {
            name: 'duracion_min',
            label: 'Duración (min)',
            type: 'number',
            required: true,
            min: 15,
            step: 15
        }
    ];

    return (
        <FormModal
            title="Crear Nuevo Servicio"
            fields={fields}
            onClose={onClose}
            onSubmit={onSubmit}
            loading={loading}
            submitButtonText="Crear Servicio"
        />
    );
}
