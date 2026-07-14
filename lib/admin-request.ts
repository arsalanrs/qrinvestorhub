import 'server-only';
import { NextRequest } from 'next/server';
import { verifyAdminCredentials } from '@/lib/admin-auth';

export function verifyAdminRequest(req: NextRequest): boolean {
  const email = req.headers.get('x-admin-email');
  const password = req.headers.get('x-admin-password');
  return verifyAdminCredentials(email, password);
}

export function adminHeaders(req: NextRequest): Record<string, string> {
  return {
    'x-admin-email': req.headers.get('x-admin-email') || '',
    'x-admin-password': req.headers.get('x-admin-password') || '',
  };
}
