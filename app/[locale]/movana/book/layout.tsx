// The booking app brings its own frame: no Movana header or footer here.
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" className="w-full min-h-screen">{children}</main>;
}
