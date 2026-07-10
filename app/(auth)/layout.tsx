export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer className="fixed bottom-0 flex w-full justify-center gap-8 px-0 py-5">
        <a href="https://willard.design/legal/terms" rel="noopener noreferrer" target="_blank" className="font-type-body text-fs-75 text-muted-foreground hover:text-foreground transition-colors">Terms</a>
        <a href="https://willard.design/legal/privacy" rel="noopener noreferrer" target="_blank" className="font-type-body text-fs-75 text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
        <a href="https://willard.design/legal/support" rel="noopener noreferrer" target="_blank" className="font-type-body text-fs-75 text-muted-foreground hover:text-foreground transition-colors">Support</a>
      </footer>
    </>
  );
}
