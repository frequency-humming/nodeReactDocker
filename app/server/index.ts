import cors from 'cors';
import express from 'express';
import next from 'next';

import routes from './routes/routes.js';

const nextApp = next({dev: false, dir: '../client'});
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 8000;

nextApp.prepare()
    .then(() => {
      const app = express();

      app.set('trust proxy', 1);

      app.use(cors({
        origin: ['https://cloudlogger.org', 'https://www.cloudlogger.org'],
        credentials: true
      }));
      app.use(express.json());

      const getRealClientIP = (req: express.Request): string => {
        return req.get('CF-Connecting-IP') ||  
            req.get('X-Real-IP') ||            
            req.get('X-Forwarded-For')?.split(',')[0] ||  
            req.ip ||                                     
            'unknown';
      };

      app.use('/api', (req, res, next) => {
        const userAgent = req.get('User-Agent') || '';
        const clientIP = getRealClientIP(req);
        const blockedAgents = [
          'curl', 'wget', 'python-requests', 'postmanruntime', 'go-http-client',
          'apache-httpclient', 'okhttp', 'node-fetch'
        ];

        const isBlocked = blockedAgents.some(agent => userAgent.toLowerCase().includes(agent));

        if (isBlocked || userAgent === '') {
          console.log(`Blocked User-Agent: "${userAgent}" from IP: ${clientIP}`);
          return res.status(403).json({
            error: 'Automated access detected',
            details: 'Access Denied',
            userAgent: userAgent || 'empty',
            timestamp: new Date().toISOString()
          });
        }
        console.log(`API Request: ${req.method} ${req.path} from IP: ${clientIP}`);
        next();
      });

      app.use('/api', routes);

      // Next.js pages
      app.get('*', (req, res) => {
        return handle(req, res);
      });

      app.listen(PORT, () => {
        console.log(`Server listening on Port ${PORT}`);
      });
    })
    .catch((ex) => {
      console.error(ex.stack);
      process.exit(1);
    });

// dev server

// import express from 'express';
// import cors from 'cors';
// import routes from './routes/routes.js';

// const PORT = process.env.PORT || 8000;
// const app = express();

// // Middleware
// app.use(cors({ origin: '*' }));
// app.use(express.json());

// // API routes only (no Next.js in development)
// app.use('/api', routes);

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', mode: 'development', timestamp: new
//   Date().toISOString() });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Development API server listening on Port ${PORT}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/health`);
//   console.log(`🔌 API endpoints: http://localhost:${PORT}/api/*`);
// });