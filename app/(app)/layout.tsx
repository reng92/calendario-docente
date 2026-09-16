import { BottomNav } from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-dvh pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+1rem)]">{children}</div>
      <BottomNav />
    </>
  )
}
