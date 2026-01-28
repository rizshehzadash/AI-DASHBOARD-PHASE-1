import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Emails", href: "/emails" },
  { label: "Tasks", href: "/tasks" },
  { label: "Files", href: "/files" },
  { label: "Daily View", href: "/daily" }
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-6">
      <div className="text-lg font-semibold">AI Dashboard</div>
      <nav className="mt-8 flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
