'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Users,
  Settings,
  CreditCard,
  LogOut,
  ChevronUp,
  Moon,
  Sun,
  Monitor,
  Radar,
  LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Custom icon component for SVG images
function CustomIcon({ src, srcDark, alt, size = 20, bgColor }: { src: string; srcDark?: string; alt: string; size?: number; bgColor?: string }) {
  const actualSize = size;
  const containerSize = size + 16; // 8px padding on each side

  if (bgColor) {
    return (
      <>
        {/* Light mode */}
        <div
          className="flex items-center justify-center shrink-0 dark:hidden"
          style={{
            width: containerSize,
            height: containerSize,
            backgroundColor: bgColor,
            borderRadius: '6px',
          }}
        >
          <Image
            src={src}
            alt={alt}
            width={actualSize}
            height={actualSize}
          />
        </div>
        {/* Dark mode - 15% opacity background */}
        <div
          className="hidden dark:flex items-center justify-center shrink-0"
          style={{
            width: containerSize,
            height: containerSize,
            backgroundColor: hexToRgba(bgColor, 0.15),
            borderRadius: '6px',
          }}
        >
          <Image
            src={srcDark || src}
            alt={alt}
            width={actualSize}
            height={actualSize}
          />
        </div>
      </>
    );
  }

  // Workspace items without background color
  if (srcDark) {
    return (
      <>
        <Image
          src={src}
          alt={alt}
          width={actualSize}
          height={actualSize}
          className="dark:hidden"
        />
        <Image
          src={srcDark}
          alt={alt}
          width={actualSize}
          height={actualSize}
          className="hidden dark:block"
        />
      </>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={actualSize}
      height={actualSize}
      className="rounded text-zinc-700 dark:text-zinc-300"
    />
  );
}

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  customIcon?: string;
  customIconDark?: string; // Dark mode icon variant
  bgColor?: string; // Background color (15% opacity in dark mode)
}

// Automation section - core product features
const AUTOMATION_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', customIcon: '/img/dashboard.svg', customIconDark: '/img/dark-mode-dashbaord.svg', bgColor: '#E1DDF4' },
  { href: '/cancel-flows', label: 'Cancel Flows', customIcon: '/img/cancel-flows.svg', customIconDark: '/img/dark-mode-cancel-flows.svg', bgColor: '#C4F9C8' },
  { href: '/email-sequences', label: 'Email Sequences', customIcon: '/img/email-templates.svg', customIconDark: '/img/dark-mode-email-templates.svg', bgColor: '#F9E9C4' },
  { href: '/churn-radar', label: 'Churn Radar', customIcon: '/img/churn.svg', customIconDark: '/img/dark-mode-churn.svg', bgColor: '#F9D6C4' },
];

// Workspace section - account management
const WORKSPACE_ITEMS: NavItem[] = [
  { href: '/customers', label: 'Customers', customIcon: '/img/customers.svg', customIconDark: '/img/dark-mode-customers.svg' },
  { href: '/billing', label: 'Billing', customIcon: '/img/billing.svg', customIconDark: '/img/dark-mode-billing.svg' },
  { href: '/settings', label: 'Settings', customIcon: '/img/settings.svg', customIconDark: '/img/dark-mode-settings.svg' },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      {/* Header with Logo */}
      <SidebarHeader className="p-4">
        <Link href="/dashboard">
          {isCollapsed ? (
            // Logo without text when collapsed
            <Image
              src="/img/logo-no-text.svg"
              alt="Exit Loop"
              width={40}
              height={40}
              className="h-10 w-10"
            />
          ) : (
            // Full logo when expanded
            <>
              <Image
                src="/img/logo.svg"
                alt="Exit Loop"
                width={90}
                height={24}
                className="h-6 w-auto dark:hidden"
              />
              <Image
                src="/img/logo-dark-mode.svg"
                alt="Exit Loop"
                width={90}
                height={24}
                className="h-6 w-auto hidden dark:block"
              />
            </>
          )}
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        {/* Automation Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Automation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {AUTOMATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} className="p-1">
                      <Link href={item.href}>
                        {item.customIcon ? (
                          <CustomIcon src={item.customIcon} srcDark={item.customIconDark} alt={item.label} bgColor={item.bgColor} />
                        ) : Icon ? (
                          <Icon className="h-7 w-7" />
                        ) : null}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspace Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKSPACE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        {item.customIcon ? (
                          <CustomIcon src={item.customIcon} srcDark={item.customIconDark} alt={item.label} />
                        ) : Icon ? (
                          <Icon className="h-7 w-7" />
                        ) : null}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                      {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || 'Not signed in'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <div className="relative mr-2 h-4 w-4">
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute inset-0" />
                      <Moon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute inset-0" />
                    </div>
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
