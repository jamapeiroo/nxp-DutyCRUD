import express from 'express';
import { dutiesRouter } from './duties/duties.routes';
import { cors } from './middlewares/cors.middleware';
import { errorHandler } from './middlewares/error-handler.middleware';
import { notFound } from './middlewares/not-found.middleware';
import { requestLogger } from './middlewares/request-logger.middleware';

export const app = express();

app.use(express.json());
app.use(cors);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/duties', dutiesRouter);

app.use(notFound);
app.use(errorHandler);
