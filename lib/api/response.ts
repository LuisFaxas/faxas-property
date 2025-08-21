import { NextResponse } from 'next/server';

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
  statusCode: number = 500
): NextResponse<ApiResponse> {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: statusCode }
    );
  }
  
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred'
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