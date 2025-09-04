import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
  correlationId?: string;
};

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function successResponse<T>(
  data: T,
  message?: string,
  metadata?: ApiResponse['metadata']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    metadata
  });
}

export function errorResponse(
  error: unknown,
  statusCode: number = 500,
  correlationId?: string
): NextResponse<ApiResponse> {
  // Log the error with Winston
  log.error('API Error', error, { correlationId, statusCode });
  
  if (error instanceof ApiError) {
    // Log security-related errors separately
    if (error.statusCode === 401 || error.statusCode === 403) {
      log.security.failure('API Access', undefined, error.message, { 
        statusCode: error.statusCode,
        correlationId 
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        correlationId
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'An error occurred while processing your request'
          : error.message,
        correlationId
      },
      { status: statusCode }
    );
  }
  
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      correlationId
    },
    { status: 500 }
  );
}

export function paginationMetadata(
  page: number,
  limit: number,
  total: number
): ApiResponse['metadata'] {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total
  };
}