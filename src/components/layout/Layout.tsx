import { Sidebar } from './Sidebar';

interface LayoutProps { children: React.ReactNode; }

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar />
      {/* White main content card — matches fintech dashboard reference */}
      <main className="flex-1 overflow-y-auto custom-scrollbar m-3 ml-0">
        <div
          className="bg-white rounded-2xl min-h-full p-6"
          style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.12)' }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
