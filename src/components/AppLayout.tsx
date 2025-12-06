'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AppLayout({ children, title, description, actions }: AppLayoutProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 1, rootMargin: '-1px 0px 0px 0px' }
    );

    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        {/* Wrapper with 8px padding on top, right, bottom */}
        <div className="flex-1 p-2 pl-0 dark:bg-sidebar">
          <SidebarInset className="bg-white dark:bg-black border border-border rounded-xl h-full">
            {/* Header */}
            <header
              ref={headerRef}
              className={`sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-black ${isSticky ? '' : 'rounded-t-xl'}`}
            >
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              {(title || description) && (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              )}
              {/* Header actions */}
              {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
            </header>

            {/* Page content */}
            <div className="flex flex-1 flex-col gap-4 px-12 py-6" style={{ backgroundImage: 'url(/img/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center top', backgroundAttachment: 'fixed' }}>
              <div className="w-full max-w-[1280px] mx-auto">
                {title && (
                  <h2 className="text-2xl font-semibold tracking-tight mb-6">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mb-4">{description}</p>
                )}
                {children}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
