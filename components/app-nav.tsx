import Image from "next/image";
import Link from "next/link";

export function AppNav({ authenticated = false, admin = false }: { authenticated?: boolean; admin?: boolean }) {
  return (
    <header className="app-nav">
      <Link href="/" aria-label="CreateX home"><Image src="/assets/cre8x-logo.png" alt="CreateX 3.0" width={160} height={80} priority /></Link>
      <nav className="app-nav-links" aria-label="Application navigation">
        <Link href="/#experience">Experience</Link><Link href="/#journey">Journey</Link><Link href="/#faq">FAQ</Link>
        {authenticated && <Link href="/dashboard">Dashboard</Link>}
        {admin && <Link href="/admin">Admin</Link>}
        <Link className="nav-register" href="/register">Register</Link>
      </nav>
    </header>
  );
}
