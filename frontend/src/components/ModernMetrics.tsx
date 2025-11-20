// ModernMetrics.tsx - Advanced Metrics Component
import React, { useEffect, useState } from 'react';

interface MetricData {
    id: string;
    label: string;
    value: number;
    previousValue?: number;
    icon: string;
    description?: string;
    trend?: 'positive' | 'negative' | 'neutral';
    format?: 'number' | 'currency' | 'percentage';
    color?: 'blue' | 'green' | 'yellow' | 'red';
}

interface ModernMetricsProps {
    metrics: MetricData[];
    loading?: boolean;
}

const ModernMetrics: React.FC<ModernMetricsProps> = ({ metrics, loading = false }) => {
    const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

    useEffect(() => {
        // Animate counters
        metrics.forEach(metric => {
            const startValue = 0;
            const endValue = metric.value;
            const duration = 1500; // 1.5 seconds
            const increment = endValue / (duration / 16); // 60fps
            let current = startValue;

            const timer = setInterval(() => {
                current += increment;
                if (current >= endValue) {
                    current = endValue;
                    clearInterval(timer);
                }

                setAnimatedValues(prev => ({
                    ...prev,
                    [metric.id]: current
                }));
            }, 16);

            return () => clearInterval(timer);
        });
    }, [metrics]);

    const formatValue = (value: number, format?: string) => {
        switch (format) {
            case 'currency':
                return `$${value.toLocaleString()}`;
            case 'percentage':
                return `${value.toFixed(1)}%`;
            default:
                return Math.round(value).toLocaleString();
        }
    };

    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case 'positive':
                return '📈';
            case 'negative':
                return '📉';
            default:
                return '➖';
        }
    };

    const getTrendColor = (trend?: string) => {
        switch (trend) {
            case 'positive':
                return 'positive';
            case 'negative':
                return 'negative';
            default:
                return 'neutral';
        }
    };

    const getIconBackground = (color?: string) => {
        switch (color) {
            case 'green':
                return 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)';
            case 'yellow':
                return 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)';
            case 'red':
                return 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)';
            default:
                return 'linear-gradient(135deg, rgba(46, 90, 143, 0.2) 0%, rgba(62, 106, 175, 0.2) 100%)';
        }
    };

    const getIconBorder = (color?: string) => {
        switch (color) {
            case 'green':
                return 'border: 1px solid rgba(16, 185, 129, 0.3)';
            case 'yellow':
                return 'border: 1px solid rgba(245, 158, 11, 0.3)';
            case 'red':
                return 'border: 1px solid rgba(239, 68, 68, 0.3)';
            default:
                return 'border: 1px solid rgba(46, 90, 143, 0.3)';
        }
    };

    if (loading) {
        return (
            <div className="metrics-grid">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="metric-card">
                        <div className="skeleton-line medium"></div>
                        <div className="skeleton-line long"></div>
                        <div className="skeleton-line short"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="metrics-grid fade-in">
            {metrics.map((metric, index) => (
                <div
                    key={metric.id}
                    className="metric-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <div className="metric-header">
                        <div
                            className="metric-icon"
                            style={{
                                background: getIconBackground(metric.color),
                                ...Object.fromEntries(getIconBorder(metric.color).split('; ').filter(s => s).map(s => s.split(': ')))
                            }}
                        >
                            {metric.icon}
                        </div>
                        {metric.trend && (
                            <div className={`metric-trend ${getTrendColor(metric.trend)}`}>
                                {getTrendIcon(metric.trend)} {metric.trend}
                            </div>
                        )}
                    </div>

                    <div className="animated-counter counting">
                        <h3 className="metric-value">
                            {formatValue(animatedValues[metric.id] || 0, metric.format)}
                        </h3>
                    </div>

                    <p className="metric-label">{metric.label}</p>
                    {metric.description && (
                        <p className="metric-description">{metric.description}</p>
                    )}

                    {metric.previousValue !== undefined && (
                        <div className="metric-comparison" style={{
                            fontSize: '0.9rem',
                            marginTop: '0.5rem',
                            color: 'var(--text-muted)'
                        }}>
                            {metric.value > metric.previousValue ? '↗️ +' : metric.value < metric.previousValue ? '↘️ ' : '➡️ '}
                            {Math.abs(metric.value - metric.previousValue)} vs período anterior
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ModernMetrics;