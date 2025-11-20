// components/NotFound.tsx
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <h1 className="not-found-title">404</h1>
            <h2 className="not-found-subtitle">Página No Encontrada</h2>
            <p className="not-found-text">
                Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
            <button
                onClick={() => navigate('/inicio')}
                className="btn-home"
            >
                Volver al Inicio
            </button>
        </div>
    );
}
