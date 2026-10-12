import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { SUPER_ADMIN_EMAIL, USER_ROLES } from '@wedding-memory/shared';
import { createApp } from '../src/app.js';
import { loginAs, seedUser, authedRequest } from './helpers/auth.js';

describe('master panel access', () => {
  const app = createApp();

  it('hides the panel from every account except the super admin email', async () => {
    const master = await seedUser({
      email: 'other-master@example.com',
      role: USER_ROLES.MASTER,
    });
    const { agent, csrfToken } = await loginAs(app, {
      email: master.user.email,
      password: master.password,
    });

    const response = await authedRequest(agent, 'get', '/api/v1/admin/sections', csrfToken);
    expect(response.status).toBe(403);
  });

  it('lets the super admin email reorder home sections', async () => {
    const admin = await seedUser({
      email: SUPER_ADMIN_EMAIL,
      role: USER_ROLES.MASTER,
      name: 'Rohit & Roshni',
    });
    const { agent, csrfToken } = await loginAs(app, {
      email: admin.user.email,
      password: admin.password,
    });

    const listed = await agent.get('/api/v1/admin/sections');
    expect(listed.status).toBe(200);
    const keys = listed.body.data.map((section) => section.key);
    expect(keys).toContain('hero');
    expect(keys).toContain('slider');
    expect(keys).toContain('album_note');

    const reversed = [...keys].reverse();
    const saved = await authedRequest(agent, 'put', '/api/v1/admin/sections/order', csrfToken).send({
      keys: reversed,
    });

    expect(saved.status).toBe(200);
    expect(saved.body.data.map((section) => section.key)).toEqual(reversed);
    expect(saved.body.data[0].sortOrder).toBe(0);

    const note = await authedRequest(agent, 'patch', '/api/v1/admin/sections/album_note', csrfToken).send({
      title: 'For you',
      eyebrow: 'A note',
      description: 'Turn the page.',
      enabled: true,
    });
    expect(note.status).toBe(200);
    expect(note.body.data.description).toBe('Turn the page.');
  });

  it('shows enabled home sections to a signed-in family account', async () => {
    const family = await seedUser({
      email: 'family-home@example.com',
      role: USER_ROLES.FAMILY,
    });
    const { agent } = await loginAs(app, {
      email: family.user.email,
      password: family.password,
    });

    const response = await agent.get('/api/v1/website/home');
    expect(response.status).toBe(200);
    expect(response.body.data.every((section) => section.enabled)).toBe(true);
    expect(JSON.stringify(response.body)).not.toMatch(/refreshToken|clientSecret/);
  });

  it('lets the super admin create a temporary login and hides the password afterwards', async () => {
    const admin = await seedUser({
      email: SUPER_ADMIN_EMAIL,
      role: USER_ROLES.MASTER,
      name: 'Rohit & Roshni',
    });
    const { agent, csrfToken } = await loginAs(app, {
      email: admin.user.email,
      password: admin.password,
    });

    const created = await authedRequest(agent, 'post', '/api/v1/admin/guests', csrfToken).send({
      name: 'Family Guest',
      email: 'guest-login@example.com',
      role: 'family',
      activeDays: 7,
    });

    expect(created.status).toBe(201);
    expect(created.body.data.password).toMatch(/^WM-[A-Z2-9]{8}$/);
    expect(created.body.data.status).toBe('active');

    const listed = await agent.get('/api/v1/admin/guests');
    expect(listed.status).toBe(200);
    expect(JSON.stringify(listed.body)).not.toContain(created.body.data.password);
    expect(listed.body.data[0].email).toBe('guest-login@example.com');
  });

  it('refuses a guest whose access date has passed', async () => {
    const guest = await seedUser({
      email: 'ended-guest@example.com',
      role: USER_ROLES.FAMILY,
      password: 'Password123!',
      accessExpiresAt: new Date(Date.now() - 60_000),
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: guest.user.email,
      password: guest.password,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('This login has ended');
  });
});
