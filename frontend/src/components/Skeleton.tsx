// components/Skeleton.tsx - Skeleton loaders modernos
import './Skeleton.css';

export function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton skeleton-image"></div>
            <div className="skeleton-content">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text short"></div>
            </div>
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="skeleton-list">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton-list-item">
                    <div className="skeleton skeleton-avatar"></div>
                    <div className="skeleton-list-content">
                        <div className="skeleton skeleton-line"></div>
                        <div className="skeleton skeleton-line short"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="skeleton-stats-grid">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-stat-card">
                    <div className="skeleton skeleton-stat-value"></div>
                    <div className="skeleton skeleton-stat-label"></div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="skeleton-table">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skeleton-table-row">
                    <div className="skeleton skeleton-cell"></div>
                    <div className="skeleton skeleton-cell"></div>
                    <div className="skeleton skeleton-cell short"></div>
                </div>
            ))}
        </div>
    );
}
