import type { Metadata } from 'next';
import '@/styles/index.css';

export const metadata: Metadata = {
  title: 'Xentra Employee Management',
  description: 'Manage employees efficiently.',
};

import { Sidebar } from '@/components/Sidebar';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';

import { createClient } from '@/lib/supabase-server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let initialUser = null;
  if (user) {
    initialUser = {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || '',
      role: user.user_metadata?.role || 'admin',
      avatarUrl: user.user_metadata?.avatar_url || '',
    };
  }

  return (
    <html lang="en">
      <body className="antialiased bg-[#FBFBFD] overflow-hidden zoom-container m-0 p-0">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
        <AuthProvider initialUser={initialUser}>
          <QueryProvider>
            <div className="flex zoom-container bg-[#FBFBFD] overflow-hidden">
            <Sidebar />
            <main className="flex-1 ml-[80px] flex flex-col pt-2 pr-2 pb-2 pl-0 bg-[#FBFBFD]">
              <div className="main-content-card w-full rounded-[25px] bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="w-full h-full overflow-y-auto page-scrollbar pt-4 px-4 pb-8">
                  {children}
                </div>
              </div>
            </main>
            </div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
