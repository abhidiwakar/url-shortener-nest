export interface ShortUrlResponse {
  id: string;
  fullUrl: string;
  shortId: string;
  isArchived: boolean;
  archivedAt: string | null;
}

export interface IntegrationShortUrlResponse extends ShortUrlResponse {
  shortUrl: string;
}

export interface CreateUrlRequest {
  fullUrl: string;
  shortId?: string;
}

export interface ShortUrlConflictErrorBody {
  statusCode: 409;
  message: string;
  existingUrl: ShortUrlResponse;
}

export interface RedirectJsonResponse {
  shortId: string;
  fullUrl: string;
  isArchived: boolean;
  archivedAt: string | null;
}
