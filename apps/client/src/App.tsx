import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
    eventsCount: number;
    systemStatus: string;
    lastUpdated: string;
}

function App() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    // Transformation for chart (dummy data for history if needed, or just current)
    const data = stats ? [
        {
            name: 'Events',
            count: stats.eventsCount,
        },
    ] : [];

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0, color: '#333' }}>OpsView HOT RELOAD!!! 🚀</h1>
                <p style={{ color: '#666', marginTop: '0.5rem' }}>Microservices System Monitor</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.9rem', textTransform: 'uppercase' }}>System Status</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats?.systemStatus === 'Healthy' ? '#2ecc71' : '#e74c3c' }}>
                        {loading ? '...' : stats?.systemStatus}
                    </div>
                </div>

                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Events</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                        {loading ? '...' : stats?.eventsCount}
                    </div>
                </div>

                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.9rem', textTransform: 'uppercase' }}>Last Updated</h3>
                    <div style={{ fontSize: '1.1rem', color: '#333' }}>
                        {loading ? '...' : stats ? new Date(stats.lastUpdated).toLocaleTimeString() : '-'}
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '400px' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Event Metrics</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3498db" name="Total Events processed" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default App;
