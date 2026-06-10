import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ENDPOINTS,
  EXPECTED_PAGE2_USERS,
  RESPONSE_TIME_LIMIT_MS,
  ListUsersResponseSchema,
  CreateUserResponseSchema,
  type NewUser,
  type ListUsersResponse,
} from '../utils/testData.js';

let newUsers: NewUser[];
try {
  newUsers = JSON.parse(readFileSync(resolve(__dirname, '../data/newUsers.json'), 'utf-8'));
  if (newUsers.length === 0) throw new Error('newUsers.json is empty');
} catch (err) {
  throw new Error(`Cannot load tests/data/newUsers.json — ${(err as Error).message}`);
}

test.describe('Users API', () => {
  test.describe('GET /api/users', () => {
    test('TC01 - returns paginated list with correct data and valid schema', async ({ request }) => {
      const response = await request.get(ENDPOINTS.users, { params: { page: 2 } });

      await test.step('Assert HTTP status', async () => {
        expect(response.status()).toBe(200);
      });

      const body: ListUsersResponse = await response.json();

      await test.step('Assert schema', async () => {
        const result = ListUsersResponseSchema.safeParse(body);
        expect(result.success, result.error?.toString()).toBe(true);
      });

      await test.step('Assert total', async () => {
        expect(body.total).toBeGreaterThan(0);
      });

      await test.step('Assert last_name for first two users on page 2', async () => {
        expect(body.data[0].last_name).toBe(EXPECTED_PAGE2_USERS[0].last_name);
        expect(body.data[1].last_name).toBe(EXPECTED_PAGE2_USERS[1].last_name);
      });
    });

    test('TC01b - data.length equals total when fetching all users at once', async ({ request }) => {
      const firstResponse = await request.get(ENDPOINTS.users);
      expect(firstResponse.status()).toBe(200);

      const { total } = (await firstResponse.json()) as ListUsersResponse;

      const allResponse = await request.get(ENDPOINTS.users, { params: { per_page: total } });
      expect(allResponse.status()).toBe(200);

      const allBody: ListUsersResponse = await allResponse.json();
      expect(allBody.data.length).toBe(allBody.total);
    });
  });

  test.describe('POST /api/users', () => {
    for (const { name, job } of newUsers) {
      test(`TC02 - creates "${name}" (${job})`, async ({ request }) => {
        const sentAt = Date.now();
        const start = performance.now();
        const response = await request.post(ENDPOINTS.users, { data: { name, job } });
        const elapsed = performance.now() - start;

        await test.step('Assert HTTP status', async () => {
          expect(response.status()).toBe(201);
        });

        await test.step('Assert response time', async () => {
          expect(
            elapsed,
            `Response time ${elapsed.toFixed(0)}ms exceeded limit of ${RESPONSE_TIME_LIMIT_MS}ms`,
          ).toBeLessThan(RESPONSE_TIME_LIMIT_MS);
        });

        const body = await response.json();

        await test.step('Assert schema', async () => {
          const result = CreateUserResponseSchema.safeParse(body);
          expect(result.success, result.error?.toString()).toBe(true);
        });

        await test.step('Assert ID', async () => {
          expect(body.id.length).toBeGreaterThan(0);
          expect(Number(body.id)).not.toBeNaN();
        });

        await test.step('Assert createdAt is within 10s of request', async () => {
          const createdAt = new Date(body.createdAt).getTime();
          expect(createdAt).toBeGreaterThanOrEqual(sentAt);
          expect(createdAt - sentAt).toBeLessThan(10_000);
        });

        await test.step('Assert echoed request data', async () => {
          expect(body.name).toBe(name);
          expect(body.job).toBe(job);
        });
      });
    }
  });
});
