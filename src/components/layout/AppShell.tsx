
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavItems } from "./NavItems";
import { UserMenu } from "./UserMenu";
import { Separator } from "@/components/ui/separator";
import { Wrench } from "lucide-react"; // Example icon

export function AppShell({ children }: { children: React.ReactNode }) {
  // Read the initial state from cookie or default to true (expanded)
  const [defaultOpen, setDefaultOpen] = React.useState(true);
  React.useEffect(() => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('sidebar_state='))
        ?.split('=')[1];
      if (cookieValue) {
        setDefaultOpen(cookieValue === 'true');
      }
    }
  }, []);


  return (
    <SidebarProvider defaultOpen={defaultOpen} open={defaultOpen} onOpenChange={setDefaultOpen}>
      <Sidebar
        variant="sidebar" // "sidebar", "floating", "inset"
        collapsible="icon" // "icon", "offcanvas", "none"
        className="flex flex-col bg-sidebar text-sidebar-foreground shadow-lg"
      >
        <AppSidebarHeader />
        <Separator className="bg-sidebar-border" />
        <SidebarContent className="p-2">
          <NavItems />
        </SidebarContent>
        <Separator className="bg-sidebar-border" />
        <AppSidebarFooter />
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppHeader() {
  const { isMobile } = useSidebar();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
        {!isMobile && <SidebarTrigger className="hidden peer-data-[collapsible=icon]:flex peer-data-[collapsible=offcanvas]:hidden" />}
        <h1 className="text-xl font-semibold text-foreground font-headline">BengkelKu App</h1>
      </div>
      <UserMenu />
    </header>
  );
}

function AppSidebarHeader() {
  return (
    <SidebarHeader className="p-4">
      <Link href="/" className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
           <Wrench className="h-7 w-7" />
        </Button>
        <span className="text-lg font-semibold text-primary font-headline group-data-[collapsible=icon]:hidden">
          BengkelKu
        </span>
      </Link>
    </SidebarHeader>
  );
}

function AppSidebarFooter() {
  const [currentYear, setCurrentYear] = React.useState<string | number>('');

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []); // Empty dependency array ensures this runs once on mount (client-side)

  return (
    <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
      <p className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        © {currentYear} BengkelKu App
      </p>
    </SidebarFooter>
  );
}
