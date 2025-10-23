import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validate request body against Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      } else {
        res.status(400).json({ error: 'Invalid request data' });
      }
    }
  };
}

/**
 * Validate request query against Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      } else {
        res.status(400).json({ error: 'Invalid query parameters' });
      }
    }
  };
}

/**
 * Validate request params against Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      } else {
        res.status(400).json({ error: 'Invalid path parameters' });
      }
    }
  };
}
