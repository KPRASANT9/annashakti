import { SiteNav } from "@/components/SiteNav";

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <SiteNav />
      <main>{children}</main>
      <footer className="footer">
        Annashakti · kitchen science for full-spectrum resilience · not medical
        advice · <a href="/">Kitchen home</a>
      </footer>
    </div>
  );
}
