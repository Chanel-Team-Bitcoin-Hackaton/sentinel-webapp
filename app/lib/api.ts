/**
 * Sentinel API Client & Mock Data Layer
 * Handles communication with the Express.js backend.
 * Integrates a persistent local-storage mock database for offline/demo testing.
 */

// Types
export interface User {
  id: string;
  email: string;
  nsec?: string;
  createdAt: string;
}

export type TestamentStatus = 'ACTIVE' | 'WARNING' | 'TRIGGERED';

export interface Testament {
  id: string;
  ownerId: string;
  delayDays: number;
  lastSeenAt: string;
  nextCheckinAt: string;
  status: TestamentStatus;
  anchorTxid: string | null;
  triggeredAt: string | null;
  createdAt: string;
  beneficiary?: Beneficiary | null;
  secrets?: EncryptedSecret[];
}

export interface EncryptedSecret {
  id: string;
  testamentId: string;
  title: string;
  encryptedBlob: string;
  ivHex: string;
  saltHex: string;
  type: 'SEED' | 'PDF' | 'TEXT' | 'CREDENTIALS';
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  testamentId: string;
  name: string;
  email: string;
  phone: string;
  secretQuestion: string | null;
  secretQuestionHash: string | null; // bcrypt hash stored on server
  createdAt: string;
}

export interface Checkin {
  id: string;
  testamentId: string;
  createdAt: string;
  amountSats: number;
  preimage: string | null;
  status: 'PENDING' | 'PAID';
}

export interface AuthResponse {
  token: string;
  nsec?: string;
  user: User;
}

// Global Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || true; // Set to true by default for seamless hackathon testing

// Get token from local storage
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sentinel_jwt_token');
  }
  return null;
}

// API request helper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── Local Mock Database ──────────────────────────────────────────────────────
const MOCK_STORAGE_KEY = 'sentinel_mock_db';

interface MockDB {
  users: Record<string, User & { passwordHash: string }>;
  testaments: Record<string, Testament>;
  secrets: Record<string, EncryptedSecret[]>;
  beneficiaries: Record<string, Beneficiary>;
  checkins: Record<string, Checkin[]>;
  tokens: Record<string, string>; // Maps jwt token to userId
  legacyTokens: Record<string, { testamentId: string; token: string }>; // Legacy unlock tokens
}

function getMockDB(): MockDB {
  if (typeof window === 'undefined') {
    return { users: {}, testaments: {}, secrets: {}, beneficiaries: {}, checkins: {}, tokens: {}, legacyTokens: {} };
  }
  const raw = localStorage.getItem(MOCK_STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // Reset
    }
  }

  // Initial Seed
  const db: MockDB = {
    users: {},
    testaments: {},
    secrets: {},
    beneficiaries: {},
    checkins: {},
    tokens: {},
    legacyTokens: {},
  };
  saveMockDB(db);
  return db;
}

function saveMockDB(db: MockDB) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
  }
}

// ─── Client API Functions ─────────────────────────────────────────────────────
export const api = {
  // ─── Authentication ───
  auth: {
    signup: async (email: string, password: string): Promise<AuthResponse> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const db = getMockDB();
        if (db.users[email]) {
          throw new Error('Cet email est déjà enregistré.');
        }

        const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
        const user: User = {
          id: userId,
          email,
          nsec: 'nsec1' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // fake nsec
          createdAt: new Date().toISOString(),
        };

        const token = 'jwt_' + Math.random().toString(36).substring(2, 15);
        db.users[email] = { ...user, passwordHash: 'hash_' + password };
        db.tokens[token] = userId;
        saveMockDB(db);

        return { token, nsec: user.nsec, user };
      }
      return request<AuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const db = getMockDB();
        const userEntry = db.users[email];
        if (!userEntry || userEntry.passwordHash !== 'hash_' + password) {
          throw new Error('Email ou mot de passe incorrect.');
        }

        const token = 'jwt_' + Math.random().toString(36).substring(2, 15);
        db.tokens[token] = userEntry.id;
        saveMockDB(db);

        if (typeof document !== 'undefined') {
          document.cookie = `sentinel_session=${token}; path=/; max-age=3600`;
        }

        const { passwordHash, ...user } = userEntry;
        return { token, user };
      }
      return request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    getLnurlChallenge: async (): Promise<{ lnurl: string; k1: string; expiresAt: string }> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const k1 = 'k1_' + Math.random().toString(36).substring(2, 15);
        const lnurl = 'lnurl1dp68gurn8ghj7um5v93kketj9ehx2amn9uh8wetvdskkkmn0wahz7mrww4excup0dajx2mrv92x9xpukvcm';
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
        
        const db = getMockDB();
        db.tokens[k1] = 'PENDING';
        saveMockDB(db);
        
        return { lnurl, k1, expiresAt };
      }
      return request<{ lnurl: string; k1: string; expiresAt: string }>('/api/auth/lnurl-challenge');
    },

    checkLnurlStatus: async (k1: string): Promise<{ status: 'PENDING' | 'CONFIRMED' | 'ERROR'; user?: User }> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const db = getMockDB();
        const current = db.tokens[k1];
        
        if (current === 'PENDING') {
          // Simulate user scanning after a few polls
          if (Math.random() > 0.7) {
            db.tokens[k1] = 'CONFIRMED';
            saveMockDB(db);
            
            const userId = 'usr_mock_123';
            const user: User = { id: userId, email: 'testateur@sentinel.btc', createdAt: new Date().toISOString() };
            db.users['testateur@sentinel.btc'] = { ...user, passwordHash: '' };
            if (typeof document !== 'undefined') {
              document.cookie = `sentinel_session=mock_token; path=/; max-age=3600`;
            }
            return { status: 'CONFIRMED', user };
          }
          return { status: 'PENDING' };
        }
        
        if (current === 'CONFIRMED') {
          const user: User = { id: 'usr_mock_123', email: 'testateur@sentinel.btc', createdAt: new Date().toISOString() };
          return { status: 'CONFIRMED', user };
        }
        
        return { status: 'ERROR' };
      }
      return request<{ status: 'PENDING' | 'CONFIRMED' | 'ERROR'; user?: User }>(`/api/auth/lnurl-status?k1=${k1}`);
    },

    logout: async (): Promise<void> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (typeof document !== 'undefined') {
          document.cookie = `sentinel_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
        return;
      }
      return request<void>('/api/auth/logout', { method: 'POST' });
    },

    getCurrentUser: async (): Promise<User> => {
      if (USE_MOCK) {
        let cookieToken = null;
        if (typeof document !== 'undefined') {
          const match = document.cookie.match(new RegExp('(^| )sentinel_session=([^;]+)'));
          if (match) cookieToken = match[2];
        }
        if (!cookieToken) throw new Error('Unauthenticated');
        return { id: 'usr_mock_123', email: 'testateur@sentinel.btc', createdAt: new Date().toISOString() };
      }
      return request<User>('/api/auth/me');
    },
  },

  // ─── Testaments ───
  testament: {
    getMe: async (): Promise<Testament | null> => {
      if (USE_MOCK) {
        const token = getAuthToken();
        if (!token) throw new Error('Unauthenticated');
        const db = getMockDB();
        const userId = db.tokens[token];
        if (!userId) throw new Error('Invalid token');

        const testament = Object.values(db.testaments).find((t) => t.ownerId === userId);
        if (!testament) return null;

        // Populate details
        testament.beneficiary = db.beneficiaries[testament.id] || null;
        testament.secrets = db.secrets[testament.id] || [];
        return testament;
      }
      // The API maps GET /api/testaments/me to get the user's testament.
      // Wait, let's verify if the route is /api/testaments/me or /api/me.
      // In app.ts: app.use('/api', testamentRoutes) and in routes: router.get('/me', controller.getMyTestament).
      // So the exact URL is GET /api/me (or GET /api/testaments/me). Let's make it fetch /api/me.
      return request<Testament | null>('/api/me').catch(() => null);
    },

    create: async (delayDays: number): Promise<Testament> => {
      if (USE_MOCK) {
        const token = getAuthToken();
        if (!token) throw new Error('Unauthenticated');
        const db = getMockDB();
        const userId = db.tokens[token];
        if (!userId) throw new Error('Invalid token');

        const testamentId = 'tst_' + Math.random().toString(36).substring(2, 9);
        const now = new Date();
        const nextCheckin = new Date();
        nextCheckin.setDate(now.getDate() + delayDays);

        const testament: Testament = {
          id: testamentId,
          ownerId: userId,
          delayDays,
          lastSeenAt: now.toISOString(),
          nextCheckinAt: nextCheckin.toISOString(),
          status: 'ACTIVE',
          anchorTxid: 'tx_' + Math.random().toString(16).substring(2, 10), // simulated Bitcoin tx
          triggeredAt: null,
          createdAt: now.toISOString(),
        };

        db.testaments[testamentId] = testament;
        db.checkins[testamentId] = [
          {
            id: 'chk_init',
            testamentId,
            createdAt: now.toISOString(),
            amountSats: 1,
            preimage: 'preimage_initialization_hash_sentinel_btc_hackaton_2026',
            status: 'PAID',
          },
        ];
        saveMockDB(db);
        return testament;
      }
      return request<Testament>('/api/', {
        method: 'POST',
        body: JSON.stringify({ delayDays }),
      });
    },

    updateDelay: async (id: string, delayDays: number): Promise<Testament> => {
      if (USE_MOCK) {
        const db = getMockDB();
        const testament = db.testaments[id];
        if (!testament) throw new Error('Testament not found');

        testament.delayDays = delayDays;
        const now = new Date(testament.lastSeenAt);
        const nextCheckin = new Date(now);
        nextCheckin.setDate(now.getDate() + delayDays);
        testament.nextCheckinAt = nextCheckin.toISOString();

        db.testaments[id] = testament;
        saveMockDB(db);
        return testament;
      }
      return request<Testament>(`/api/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ delayDays }),
      });
    },
  },

  // ─── Secrets ───
  secrets: {
    list: async (testamentId: string): Promise<EncryptedSecret[]> => {
      if (USE_MOCK) {
        const db = getMockDB();
        return db.secrets[testamentId] || [];
      }
      return request<EncryptedSecret[]>(`/api/testaments/${testamentId}/secrets`);
    },

    create: async (
      testamentId: string,
      title: string,
      type: EncryptedSecret['type'],
      encryptedBlob: string,
      ivHex: string,
      saltHex: string
    ): Promise<EncryptedSecret> => {
      if (USE_MOCK) {
        const db = getMockDB();
        const secretId = 'sec_' + Math.random().toString(36).substring(2, 9);
        const newSecret: EncryptedSecret = {
          id: secretId,
          testamentId,
          title,
          type,
          encryptedBlob,
          ivHex,
          saltHex,
          createdAt: new Date().toISOString(),
        };

        if (!db.secrets[testamentId]) {
          db.secrets[testamentId] = [];
        }
        db.secrets[testamentId].push(newSecret);
        saveMockDB(db);
        return newSecret;
      }
      return request<EncryptedSecret>(`/api/testaments/${testamentId}/secrets`, {
        method: 'POST',
        body: JSON.stringify({ title, type, encryptedBlob, ivHex, saltHex }),
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      if (USE_MOCK) {
        const db = getMockDB();
        for (const testId in db.secrets) {
          const list = db.secrets[testId];
          const index = list.findIndex((s) => s.id === id);
          if (index !== -1) {
            list.splice(index, 1);
            db.secrets[testId] = list;
            break;
          }
        }
        saveMockDB(db);
        return { success: true };
      }
      return request<{ success: boolean }>(`/api/secrets/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ─── Beneficiary ───
  beneficiary: {
    get: async (testamentId: string): Promise<Beneficiary | null> => {
      if (USE_MOCK) {
        const db = getMockDB();
        return db.beneficiaries[testamentId] || null;
      }
      return request<Beneficiary | null>(`/api/testaments/${testamentId}/beneficiary`).catch(() => null);
    },

    upsert: async (
      testamentId: string,
      data: { name: string; email: string; phone: string; secretQuestion: string; secretQuestionHash: string }
    ): Promise<Beneficiary> => {
      if (USE_MOCK) {
        const db = getMockDB();
        const beneficiaryId = db.beneficiaries[testamentId]?.id || 'ben_' + Math.random().toString(36).substring(2, 9);
        const beneficiary: Beneficiary = {
          id: beneficiaryId,
          testamentId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          secretQuestion: data.secretQuestion,
          secretQuestionHash: data.secretQuestionHash, // bcrypt hash
          createdAt: db.beneficiaries[testamentId]?.createdAt || new Date().toISOString(),
        };

        db.beneficiaries[testamentId] = beneficiary;

        // Generate a mock legacy token for testing the legacy flow
        const legacyToken = 'tok_' + Math.random().toString(36).substring(2, 12);
        db.legacyTokens[legacyToken] = { testamentId, token: legacyToken };

        saveMockDB(db);
        return beneficiary;
      }
      return request<Beneficiary>(`/api/testaments/${testamentId}/beneficiary`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ─── Check-ins (Lightning Heartbeat) ───
  checkin: {
    list: async (testamentId: string): Promise<Checkin[]> => {
      if (USE_MOCK) {
        const db = getMockDB();
        return db.checkins[testamentId] || [];
      }
      // Fallback endpoints for future expansion
      return request<Checkin[]>(`/api/testaments/${testamentId}/checkins`).catch(() => []);
    },

    requestInvoice: async (testamentId: string): Promise<{ payment_request: string; payment_hash: string }> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const paymentHash = 'ln_hash_' + Math.random().toString(16).substring(2, 12);
        const payReq = 'lnbc1u1p0...' + Math.random().toString(36).substring(2, 15);
        return { payment_request: payReq, payment_hash: paymentHash };
      }
      return request<{ payment_request: string; payment_hash: string }>(`/api/testaments/${testamentId}/checkin/invoice`, {
        method: 'POST',
      });
    },

    checkStatus: async (
      testamentId: string,
      paymentHash: string
    ): Promise<{ paid: boolean; preimage: string | null }> => {
      if (USE_MOCK) {
        // Automatically simulate payment after 5 seconds
        const db = getMockDB();
        const testament = db.testaments[testamentId];
        
        // Simulating 80% chance it gets paid on poll if user waited
        const now = new Date();
        const preimage = 'preimage_' + Math.random().toString(16).substring(2, 16);
        
        // Keep track of checkins status
        if (testament) {
          testament.lastSeenAt = now.toISOString();
          const nextCheckin = new Date();
          nextCheckin.setDate(now.getDate() + testament.delayDays);
          testament.nextCheckinAt = nextCheckin.toISOString();
          testament.status = 'ACTIVE';
          db.testaments[testamentId] = testament;

          if (!db.checkins[testamentId]) {
            db.checkins[testamentId] = [];
          }
          
          // Add checkin record if not already added
          const alreadyPaid = db.checkins[testamentId].some(c => c.preimage?.startsWith('preimage_'));
          if (!alreadyPaid) {
            db.checkins[testamentId].unshift({
              id: 'chk_' + Math.random().toString(36).substring(2, 9),
              testamentId,
              createdAt: now.toISOString(),
              amountSats: 1,
              preimage,
              status: 'PAID',
            });
          }
        }
        
        saveMockDB(db);
        return { paid: true, preimage };
      }
      return request<{ paid: boolean; preimage: string | null }>(`/api/checkins/status/${paymentHash}`);
    },
  },

  // ─── Beneficiary Legacy Portal ───
  legacy: {
    getPortalData: async (token: string): Promise<{ testament: Testament; beneficiary: Beneficiary }> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const db = getMockDB();
        
        // Check if token exists
        const tokenData = db.legacyTokens[token];
        if (!tokenData) {
          // If mock DB is empty, let's create a simulated triggered testament for demoing
          const mockTstId = 'tst_demo_triggered';
          const mockTestament: Testament = {
            id: mockTstId,
            ownerId: 'usr_demo',
            delayDays: 30,
            lastSeenAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), // 40 days ago
            nextCheckinAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // missed 10 days ago
            status: 'TRIGGERED',
            anchorTxid: 'tx_btc_anchor_demo_101010',
            triggeredAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
          };
          const mockBeneficiary: Beneficiary = {
            id: 'ben_demo',
            testamentId: mockTstId,
            name: 'Koffi Adjovi',
            email: 'koffi.adjovi@example.com',
            phone: '+22890000000',
            secretQuestion: 'Quel est le nom de la chèvre préférée de ton grand-père ?',
            secretQuestionHash: 'bcrypt_mock_hash_goat_name',
            createdAt: new Date().toISOString(),
          };
          
          db.testaments[mockTstId] = mockTestament;
          db.beneficiaries[mockTstId] = mockBeneficiary;
          db.legacyTokens[token] = { testamentId: mockTstId, token };
          
          // Seed some encrypted mock secrets
          db.secrets[mockTstId] = [
            {
              id: 'sec_seed',
              testamentId: mockTstId,
              title: 'Mnemonic Seed BIP-39 de mon Hardware Wallet (GreenAddress)',
              type: 'SEED',
              encryptedBlob: 'will_be_decrypted_with_correct_passphrase',
              ivHex: 'iv_placeholder',
              saltHex: 'salt_placeholder',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sec_pdf',
              testamentId: mockTstId,
              title: 'Instructions de succession et testaments authentiques rédigés',
              type: 'PDF',
              encryptedBlob: 'will_be_decrypted_with_correct_passphrase',
              ivHex: 'iv_placeholder',
              saltHex: 'salt_placeholder',
              createdAt: new Date().toISOString(),
            }
          ];
          
          saveMockDB(db);
          return { testament: mockTestament, beneficiary: mockBeneficiary };
        }
        
        const testament = db.testaments[tokenData.testamentId];
        const beneficiary = db.beneficiaries[tokenData.testamentId];
        if (!testament || !beneficiary) {
          throw new Error('Testament ou bénéficiaire introuvable pour ce jeton.');
        }
        
        return { testament, beneficiary };
      }
      return request<{ testament: Testament; beneficiary: Beneficiary }>(`/api/legacy/${token}`);
    },

    verifyQuestion: async (token: string, answer: string): Promise<{ success: boolean }> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Mock verification: accepts any answer for the emotional question
        return { success: true };
      }
      return request<{ success: boolean }>(`/api/legacy/${token}/question`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      });
    },

    unlockSecrets: async (token: string, secretWord: string): Promise<EncryptedSecret[]> => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const db = getMockDB();
        const tokenData = db.legacyTokens[token];
        if (!tokenData) throw new Error('Jeton invalide');
        
        const testamentId = tokenData.testamentId;
        const secrets = db.secrets[testamentId] || [];
        
        // Return secrets. In real API, the server returns the encrypted blobs list only if the secretWord has the right verification, or it returns the list and client tries to decrypt it.
        // According to Zero Knowledge, the server doesn't know the secretWord, so it might store a bcrypt hash of the secretWord or it might just return the blobs and let the client fail decryption.
        // Conceptor K CDC says:
        // "Rate limiting sur la route /legacy/[token]/unlock (5 tentatives/heure)."
        // So the server must track attempts. In mock, we return the secrets, and client-side will decrypt them.
        return secrets;
      }
      return request<EncryptedSecret[]>(`/api/legacy/${token}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ secretWord }),
      });
    },
  },
};
