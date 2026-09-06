"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, UserRound } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/shared/ui/navigation-menu";
import { Button } from "@/components/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/shared/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { siteBrandName, siteLogo, siteNav } from "@/lib/site/routes";
import { cn } from "@/lib/utils";

function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const isLoggedIn = session?.user != null;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="border-border/60 bg-background sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 w-full min-w-0 max-w-6xl items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src={siteLogo}
            alt={siteBrandName}
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover"
          />
          <span className="font-display text-foreground truncate text-xl tracking-tight">
            {siteBrandName}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <NavigationMenu viewport={false} className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
              {siteNav.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild active={active}>
                      <Link
                        href={item.href}
                        className={cn(
                          "font-sans text-foreground hover:bg-transparent focus:bg-transparent rounded-none px-3 py-2 text-sm",
                          active && "underline underline-offset-4",
                        )}
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
          <Button
            asChild
            variant="outline"
            className="font-sans hidden gap-2 lg:inline-flex"
          >
            {isLoggedIn ? (
              // Sin prefetch: /dashboard redirige por rol, y el router se queda
              // con esa redirección cacheada y no pinta el panel al entrar.
              <Link href={routes.cuenta} prefetch={false}>
                <UserRound className="size-4 shrink-0" aria-hidden />
                Ver cuenta
              </Link>
            ) : (
              <Link href={routes.login}>
                <LogIn className="size-4 shrink-0" aria-hidden />
                Iniciar sesión
              </Link>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-foreground lg:hidden"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-6" aria-hidden />
          </Button>
        </div>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
          <SheetHeader>
            <SheetTitle className="font-display text-left text-xl">
              Menú
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1">
            {siteNav.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "font-sans text-foreground rounded-md px-3 py-3 text-base font-normal",
                    active && "bg-sage underline underline-offset-4",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-border mt-6 border-t pt-6">
            <Button asChild variant="outline" className="font-sans w-full gap-2">
              {isLoggedIn ? (
                <Link
                  href={routes.cuenta}
                  prefetch={false}
                  onClick={() => setMenuOpen(false)}
                >
                  <UserRound className="size-4 shrink-0" aria-hidden />
                  Ver cuenta
                </Link>
              ) : (
                <Link href={routes.login} onClick={() => setMenuOpen(false)}>
                  <LogIn className="size-4 shrink-0" aria-hidden />
                  Iniciar sesión
                </Link>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
