import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

export const GET = () => {
  getServerEnv();

  return NextResponse.json({ ok: true });
};
