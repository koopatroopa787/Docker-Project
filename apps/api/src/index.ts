import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import client from 'prom-client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Prometheus Registry & Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
register.registerMetric(httpRequestDurationMicroseconds);

app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
    });
    next();
});

app.use(cors());
app.use(express.json());

// Database Configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Redis Configuration
const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect to services
const connectServices = async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis', err);
    }

    try {
        await pool.query('SELECT NOW()');
        console.log('Connected to Postgres');
    } catch (err) {
        console.error('Failed to connect to Postgres', err);
    }
};

connectServices();

// Basic Stats Route
app.get('/api/stats', async (req: Request, res: Response) => {
    try {
        // Try to get from cache first
        const cachedStats = await redisClient.get('opsview:stats');
        if (cachedStats) {
            return res.json(JSON.parse(cachedStats));
        }

        // If not in cache, query DB
        const result = await pool.query('SELECT COUNT(*) as events_count FROM events');
        const stats = {
            eventsCount: parseInt(result.rows[0].events_count),
            systemStatus: 'Healthy',
            lastUpdated: new Date().toISOString()
        };

        // Cache for 10 seconds
        await redisClient.set('opsview:stats', JSON.stringify(stats), {
            EX: 10
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Ingest Event Route
app.post('/api/events', async (req: Request, res: Response) => {
    const { type, payload } = req.body;
    try {
        await pool.query('INSERT INTO events (type, payload) VALUES ($1, $2)', [type, JSON.stringify(payload)]);
        // Invalidate cache
        await redisClient.del('opsview:stats');
        res.status(201).json({ message: 'Event ingested' });
    } catch (error) {
        console.error('Error ingesting event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

// Metrics Endpoint
app.get('/metrics', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
