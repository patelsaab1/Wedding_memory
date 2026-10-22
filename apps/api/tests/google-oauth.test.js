import { describe, expect, it } from 'vitest';
import { buildGoogleDriveAuthUrl } from '../src/services/storage/google-oauth.js';

describe('Google Drive OAuth URL', () => {
  it('sends Google back to the API callback and asks for a refresh token', () => {
    const url = new URL(
      buildGoogleDriveAuthUrl({
        clientId: 'client-id.apps.googleusercontent.com',
        redirectUri: 'http://localhost:4000/api/v1/storage/google/callback',
        state: 'state-token',
      }),
    );

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/api/v1/storage/google/callback',
    );
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive.readonly');
    expect(url.searchParams.get('client_secret')).toBeNull();
    expect(url.searchParams.get('login_hint')).toBeNull();
  });

  it('asks Google to open the house Gmail when a login hint is given', () => {
    const url = new URL(
      buildGoogleDriveAuthUrl({
        clientId: 'client-id.apps.googleusercontent.com',
        redirectUri: 'https://wedding-memory-cdid.onrender.com/api/v1/storage/google/callback',
        state: 'state-token',
        loginHint: 'rohitroshnipatel@gmail.com',
      }),
    );

    expect(url.searchParams.get('login_hint')).toBe('rohitroshnipatel@gmail.com');
    expect(url.searchParams.get('client_secret')).toBeNull();
  });
});
