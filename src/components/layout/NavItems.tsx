
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar"; // Import useSidebar

export function NavItems() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar(); // Get isMobile and setOpenMobile

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false); // Close sidebar on mobile after click
    }
  };

  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
            tooltip={{ children: item.title, className: "bg-primary text-primary-foreground" }}
            className={cn(
              "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
              (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            // It's better to attach onClick to the Link or a wrapper around it
            // if asChild is true, the onClick might not bubble up as expected
            // depending on the child. Let's attach it to the Link itself.
          >
            <Link href={item.href} onClick={handleLinkClick}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
