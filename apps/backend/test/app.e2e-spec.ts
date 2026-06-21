import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface AuthResponseBody {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

interface ShortUrlResponseBody {
  id: string;
  fullUrl: string;
  shortId: string;
  isArchived: boolean;
  archivedAt: string | null;
}

interface DuplicateUrlResponseBody {
  statusCode: number;
  message: string;
  existingUrl: ShortUrlResponseBody;
}

interface IntegrationShortUrlResponseBody extends ShortUrlResponseBody {
  shortUrl: string;
}

interface CreateApiKeyResponseBody {
  id: string;
  name: string;
  keyPrefix: string;
  apiKey: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const turnstileToken = 'XXXX.DUMMY.TOKEN.XXXX';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let previousMongoUri: string | undefined;

  beforeAll(() => {
    previousMongoUri = process.env.MONGODB_URI;
    process.env.MONGODB_URI = `mongodb://localhost:27017/url-shortener-e2e-${process.pid}`;
    process.env.TURNSTILE_SKIP_VERIFY = 'true';
    process.env.PUBLIC_BASE_URL = 'https://linkable.test';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    mongoConnection = app.get<Connection>(getConnectionToken());
    await Promise.all(
      mongoConnection
        .modelNames()
        .map((modelName) => mongoConnection.model(modelName).syncIndexes()),
    );
  });

  afterEach(async () => {
    await mongoConnection.dropDatabase();
    await app.close();
  });

  afterAll(() => {
    delete process.env.TURNSTILE_SKIP_VERIFY;
    delete process.env.PUBLIC_BASE_URL;
    if (previousMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = previousMongoUri;
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('auth', () => {
    const password = 'secret123';
    let email: string;

    beforeEach(() => {
      email = `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    });

    it('signs up a user with email and password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(201);
      const body = response.body as unknown as AuthResponseBody;

      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.user.id).toBe('string');
      expect(body.user.email).toBe(email);
    });

    it('rejects duplicate signup emails', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(409);
    });

    it('logs in with valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password, turnstileToken })
        .expect(200);
      const body = response.body as unknown as AuthResponseBody;

      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.user.id).toBe('string');
      expect(body.user.email).toBe(email);
    });

    it('rejects invalid login credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrong-password', turnstileToken })
        .expect(401);
    });

    it('returns the authenticated user profile', async () => {
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(201);
      const signupBody = signupResponse.body as unknown as AuthResponseBody;

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${signupBody.accessToken}`)
        .expect(200);
      const body = response.body as unknown as AuthResponseBody['user'];

      expect(body).toEqual({
        id: signupBody.user.id,
        email,
      });
    });

    it('rejects profile requests without a bearer token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('urls', () => {
    const password = 'secret123';
    let accessToken: string;
    let email: string;

    beforeEach(async () => {
      email = `url-user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(201);
      const signupBody = signupResponse.body as unknown as AuthResponseBody;

      accessToken = signupBody.accessToken;
    });

    it('rejects duplicate full URLs for the same user and returns the existing short URL', async () => {
      const fullUrl = `https://example.com/${Date.now()}/duplicate`;

      const createResponse = await request(app.getHttpServer())
        .post('/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ fullUrl })
        .expect(201);
      const createdUrl = createResponse.body as unknown as ShortUrlResponseBody;

      const duplicateResponse = await request(app.getHttpServer())
        .post('/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ fullUrl })
        .expect(409);
      const duplicateBody =
        duplicateResponse.body as unknown as DuplicateUrlResponseBody;

      expect(duplicateBody).toEqual({
        statusCode: 409,
        message: 'You have already shortened this URL',
        existingUrl: createdUrl,
      });
    });
  });

  describe('integrations', () => {
    const password = 'secret123';
    let accessToken: string;
    let apiKey: string;
    let email: string;

    beforeEach(async () => {
      email = `integration-user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email, password, turnstileToken })
        .expect(201);
      const signupBody = signupResponse.body as unknown as AuthResponseBody;

      accessToken = signupBody.accessToken;

      const apiKeyResponse = await request(app.getHttpServer())
        .post('/v1/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Integration test key' })
        .expect(201);
      const apiKeyBody =
        apiKeyResponse.body as unknown as CreateApiKeyResponseBody;

      apiKey = apiKeyBody.apiKey;
    });

    it('creates, lists, archives, and unarchives links via API key auth', async () => {
      const fullUrl = `https://example.com/${Date.now()}/integration`;

      const createResponse = await request(app.getHttpServer())
        .post('/v1/links')
        .set('X-API-Key', apiKey)
        .send({ fullUrl, shortId: 'launch-notes' })
        .expect(201);
      const createdLink =
        createResponse.body as unknown as IntegrationShortUrlResponseBody;

      expect(createdLink).toMatchObject({
        fullUrl,
        shortId: 'launch-notes',
        shortUrl: 'https://linkable.test/launch-notes',
        isArchived: false,
      });

      const listResponse = await request(app.getHttpServer())
        .get('/v1/links')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
      const links = listResponse.body as unknown as IntegrationShortUrlResponseBody[];

      expect(links).toHaveLength(1);
      expect(links[0]?.id).toBe(createdLink.id);

      await request(app.getHttpServer())
        .patch('/v1/links/launch-notes/archive')
        .set('X-API-Key', apiKey)
        .expect(200);

      const archivedListResponse = await request(app.getHttpServer())
        .get('/v1/links?archived=true')
        .set('X-API-Key', apiKey)
        .expect(200);
      const archivedLinks =
        archivedListResponse.body as unknown as IntegrationShortUrlResponseBody[];

      expect(archivedLinks).toHaveLength(1);
      expect(archivedLinks[0]?.isArchived).toBe(true);

      await request(app.getHttpServer())
        .patch('/v1/links/launch-notes/unarchive')
        .set('X-API-Key', apiKey)
        .expect(200);

      const activeListResponse = await request(app.getHttpServer())
        .get('/v1/links?archived=false')
        .set('X-API-Key', apiKey)
        .expect(200);
      const activeLinks =
        activeListResponse.body as unknown as IntegrationShortUrlResponseBody[];

      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]?.isArchived).toBe(false);
    });

    it('rejects integration requests without an API key', async () => {
      await request(app.getHttpServer()).get('/v1/links').expect(401);
    });
  });
});
