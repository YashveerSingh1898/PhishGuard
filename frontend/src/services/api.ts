/**
 * API service client for communicating with the PhishGuard FastAPI backend.
 */

import {
  AutomataConvertResponse,
  ApiErrorDetail,
  DetectionRequest,
  DetectionResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export class AutomataApiError extends Error {
  public position?: number;
  public errorType?: string;

  constructor(message: string, position?: number, errorType?: string) {
    super(message);
    this.name = 'AutomataApiError';
    this.position = position;
    this.errorType = errorType;
  }
}

export async function checkBackendHealth(): Promise<{
  status: string;
  service?: string;
  version?: string;
  phase?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Health check returned status ${response.status}`);
    }
    return await response.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend unreachable';
    throw new Error(msg);
  }
}

export async function convertRegex(pattern: string): Promise<AutomataConvertResponse> {
  const trimmed = pattern.trim();
  if (!trimmed) {
    throw new AutomataApiError('Regular expression cannot be empty.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/automata/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ regex: trimmed }),
    });
  } catch {
    throw new AutomataApiError(
      'Unable to connect to the backend API server. Please verify that the FastAPI backend is running at http://127.0.0.1:8000.',
      undefined,
      'ConnectionError'
    );
  }

  if (!response.ok) {
    let errorDetail: ApiErrorDetail | undefined;
    try {
      const data = await response.json();
      if (data && typeof data === 'object') {
        if (typeof data.detail === 'object' && !Array.isArray(data.detail)) {
          errorDetail = data.detail;
        } else if (Array.isArray(data.detail) && data.detail[0]) {
          errorDetail = {
            message: data.detail[0].msg || 'Validation failed',
            error: 'ValidationError',
          };
        } else if (typeof data.detail === 'string') {
          errorDetail = { message: data.detail, error: 'ApiError' };
        }
      }
    } catch {
      // JSON parse failed
    }

    const message = errorDetail?.message || `Conversion request failed with status code ${response.status}.`;
    throw new AutomataApiError(message, errorDetail?.position, errorDetail?.error);
  }

  const result = await response.json();
  return result as AutomataConvertResponse;
}

export async function analyzeThreat(request: DetectionRequest): Promise<DetectionResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/detection/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: request.sender || '',
        url: request.url || '',
        subject: request.subject || '',
        body: request.body || '',
      }),
    });
  } catch {
    throw new Error(
      'Unable to connect to the threat detection API server at http://127.0.0.1:8000. Please ensure the backend is running.'
    );
  }

  if (!response.ok) {
    let errorMsg = `Threat analysis failed with status code ${response.status}`;
    try {
      const data = await response.json();
      if (data?.detail?.message) {
        errorMsg = data.detail.message;
      } else if (typeof data?.detail === 'string') {
        errorMsg = data.detail;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  const result = await response.json();
  return result as DetectionResponse;
}
