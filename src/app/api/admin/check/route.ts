import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdminSession();

  if (!admin) {
    return NextResponse.json({
      isAdmin: false,
      role: null,
      email: null,
    });
  }

  return NextResponse.json({
    isAdmin: true,
    role: admin.role,
    email: admin.email,
  });
}
