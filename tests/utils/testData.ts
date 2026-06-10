import { z } from 'zod';

export const ENDPOINTS = {
  users: '/api/users',
} as const;

export const RESPONSE_TIME_LIMIT_MS = 250;

export type NewUser = {
  name: string;
  job: string;
};

// reqres.in serves a fixed dataset — page 2 always contains users 7–12.
export const EXPECTED_PAGE2_USERS = [
  { last_name: 'Lawson' },
  { last_name: 'Ferguson' },
] as const;

// Zod schemas are the single source of truth — TypeScript types are inferred from them,
// so adding a field to the schema automatically updates the type and the runtime validation.
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  avatar: z.string().url(),
});

export const SupportSchema = z.object({
  url: z.string().url(),
  text: z.string().min(1),
});

export const ListUsersResponseSchema = z.object({
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  data: z.array(UserSchema),
  support: SupportSchema,
});

export const CreateUserResponseSchema = z.object({
  name: z.string(),
  job: z.string(),
  id: z.string(),
  createdAt: z.string().datetime({ offset: true }),
});

export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

export const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) throw new Error('API_KEY is not set — create a free key at https://app.reqres.in/api-keys');
  return key;
};
