/**
 * Database Transaction Management
 * Ensures data consistency for complex operations
 */

import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

/**
 * Execute a function within a database transaction
 * Automatically rolls back on error
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number; // Maximum time to wait for a transaction slot (ms)
    timeout?: number; // Maximum time for the transaction to complete (ms)
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  const startTime = Date.now();
  const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  log.debug(`Starting transaction ${transactionId}`, {
    transactionId,
    options
  });

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Set transaction context for logging
        const txWithLogging = new Proxy(tx, {
          get(target, prop) {
            const original = target[prop as keyof typeof target];
            
            // Intercept database operations for logging
            if (typeof original === 'object' && original !== null) {
              return new Proxy(original, {
                get(innerTarget, innerProp) {
                  const innerOriginal = innerTarget[innerProp as keyof typeof innerTarget];
                  
                  if (typeof innerOriginal === 'function') {
                    return async (...args: any[]) => {
                      const opStartTime = Date.now();
                      const operation = `${String(prop)}.${String(innerProp)}`;
                      
                      try {
                        const result = await innerOriginal.apply(innerTarget, args);
                        const duration = Date.now() - opStartTime;
                        
                        log.db.query(operation, String(prop), duration, {
                          transactionId,
                          argsCount: args.length
                        });
                        
                        return result;
                      } catch (error) {
                        log.db.error(operation, String(prop), error);
                        throw error;
                      }
                    };
                  }
                  
                  return innerOriginal;
                }
              });
            }
            
            return original;
          }
        }) as TransactionClient;
        
        return await fn(txWithLogging);
      },
      {
        maxWait: options?.maxWait ?? 2000,
        timeout: options?.timeout ?? 5000,
        isolationLevel: options?.isolationLevel
      }
    );

    const duration = Date.now() - startTime;
    log.info(`Transaction ${transactionId} completed successfully`, {
      transactionId,
      duration
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    log.error(`Transaction ${transactionId} failed`, error, {
      transactionId,
      duration
    });

    // Check for specific Prisma errors
    if (error.code === 'P2028') {
      throw new Error('Transaction timeout - operation took too long');
    }
    
    if (error.code === 'P2034') {
      throw new Error('Transaction failed due to write conflict');
    }

    throw error;
  }
}

/**
 * Batch operations for better performance
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T, tx: TransactionClient) => Promise<R>,
  options?: {
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<R[]> {
  const batchSize = options?.batchSize ?? 100;
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await withTransaction(async (tx) => {
      return Promise.all(batch.map(item => operation(item, tx)));
    });
    
    results.push(...batchResults);
    
    if (options?.onProgress) {
      options.onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }
  
  return results;
}

/**
 * Retry a transaction on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const retryDelay = options?.retryDelay ?? 1000;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (
        error.code === 'P2002' || // Unique constraint violation
        error.code === 'P2003' || // Foreign key constraint violation
        error.code === 'P2025' || // Record not found
        error.statusCode === 400 || // Bad request
        error.statusCode === 403 || // Forbidden
        error.statusCode === 404    // Not found
      ) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        log.warn(`Retrying operation (attempt ${attempt}/${maxRetries})`, {
          attempt,
          maxRetries,
          error: error.message
        });
        
        if (options?.onRetry) {
          options.onRetry(attempt, error);
        }
        
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  log.error(`Operation failed after ${maxRetries} retries`, lastError);
  throw lastError;
}

/**
 * Create a savepoint for nested transactions
 */
export async function withSavepoint<T>(
  tx: TransactionClient,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const savepointName = `sp_${name}_${Date.now()}`;
  
  try {
    // Create savepoint
    await prisma.$executeRawUnsafe(`SAVEPOINT ${savepointName}`);
    
    const result = await fn();
    
    // Release savepoint on success
    await prisma.$executeRawUnsafe(`RELEASE SAVEPOINT ${savepointName}`);
    
    return result;
  } catch (error) {
    // Rollback to savepoint on error
    await prisma.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    throw error;
  }
}

/**
 * Lock a record for update within a transaction
 */
export async function lockForUpdate<T>(
  tx: TransactionClient,
  model: keyof TransactionClient,
  where: any
): Promise<T | null> {
  const query = Prisma.sql`
    SELECT * FROM ${Prisma.raw(String(model))}
    WHERE id = ${where.id}
    FOR UPDATE
  `;
  
  const result = await tx.$queryRaw<T[]>(query);
  return result[0] || null;
}

/**
 * Bulk insert with conflict handling
 */
export async function bulkUpsert<T>(
  tx: TransactionClient,
  model: keyof TransactionClient,
  data: any[],
  uniqueFields: string[]
): Promise<number> {
  if (data.length === 0) return 0;
  
  const modelObj = tx[model] as any;
  
  // Use createMany with skipDuplicates for simple upsert
  const result = await modelObj.createMany({
    data,
    skipDuplicates: true
  });
  
  return result.count;
}

/**
 * Check if we're currently in a transaction
 */
export function isInTransaction(): boolean {
  // This is a simplified check - in production you might want to use AsyncLocalStorage
  return false;
}

/**
 * Get transaction metrics
 */
export async function getTransactionMetrics() {
  // In production, this would query actual metrics
  return {
    activeTransactions: 0,
    averageDuration: 0,
    failureRate: 0,
    timeouts: 0
  };
}