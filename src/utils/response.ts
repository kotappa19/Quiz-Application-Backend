import { Response } from 'express';
import { IApiResponse } from '@/types';

export class ApiResponse {
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response<IApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res: Response,
    message: string = 'Error occurred',
    statusCode: number = 500,
    error?: any
  ): Response<IApiResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error?.message || error,
    });
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    error?: any
  ): Response<IApiResponse> {
    return this.error(res, message, 400, error);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized',
    error?: any
  ): Response<IApiResponse> {
    return this.error(res, message, 401, error);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden',
    error?: any
  ): Response<IApiResponse> {
    return this.error(res, message, 403, error);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found',
    error?: any
  ): Response<IApiResponse> {
    return this.error(res, message, 404, error);
  }

  static conflict(
    res: Response,
    message: string = 'Conflict occurred',
    error?: any
  ): Response<IApiResponse> {
    return this.error(res, message, 409, error);
  }

  static validationError(
    res: Response,
    message: string = 'Validation failed',
    error?: any
  ): Response<IApiResponse> {
    return this.error(res, message, 422, error);
  }

  static internalServerError(
    res: Response,
    message: string = 'Internal server error',
    error?: any
  ): Response<IApiResponse> {
    return this.error(res, message, 500, error);
  }
}
