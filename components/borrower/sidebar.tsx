import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutGrid, CreditCard, Settings, LogOut } from "lucide-react"

const nav = [
  { href: "/borrower", label: "Overview", Icon: LayoutGrid },
  { href: "/borrower?tab=payments", label: "Payments", Icon: CreditCard },
  { href: "/borrower?tab=settings", label: "Settings", Icon: Settings },
]

export function BorrowerSidebar({ active = "Overview" }: { active?: string }) {
  return (
    <aside className="sticky top-0 h-[100svh] w-64 shrink-0 border-r border-sidebar-border bg-sidebar px-4 py-6">
      <div className="px-2 text-lg font-semibold text-sidebar-foreground">
        <span className="rounded-md bg-sidebar-accent px-2 py-1">Credify</span>
      </div>
      <nav className="mt-6 space-y-1">
        {nav.map(({ href, label, Icon }) => {
          const isActive = active === label
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-l-2 border-l-sidebar-primary bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto pt-6">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          )}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </aside>
  )
}
