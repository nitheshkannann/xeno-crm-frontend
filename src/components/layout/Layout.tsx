import { Sidebar } from './Sidebar';

interface LayoutProps { children: React.ReactNode; }

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar />
      {/* Glass UI main content card */}
      <main className="flex-1 overflow-y-auto custom-scrollbar m-3 ml-0">
        <div
          className="rounded-2xl min-h-full p-6"
          style={{
            background: 'rgba(18, 18, 22, 0.65)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
