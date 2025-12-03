"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import NextLink from "next/link";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/theme-switch";
import { Logo, TwitterIcon, GithubIcon } from "@/components/icons";
import { link as linkStyles } from "@heroui/theme";
import { usePrivy } from "@privy-io/react-auth";

export const Navbar = () => {
  const { authenticated } = usePrivy();

  // Grupo izquierdo
  const leftNavItems = [
    { label: "Comunidad", href: "/community" },
    { label: "Acciones", href: "/actions" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  // Grupo derecho
  const rightNavItems = [
    { label: "Recompensas", href: "/rewards" },
    { label: "Ayuda", href: "/help" },
  ];

  if (authenticated) {
    rightNavItems.push({ label: "Perfil", href: "/profile" });
  }

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      {/* Brand + navegación izquierda */}
      <NavbarContent className="basis-1/2 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Rikuy</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {leftNavItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      {/* Íconos + navegación derecha */}
      <NavbarContent className="hidden sm:flex basis-1/2 sm:basis-full" justify="end">
        <NavbarItem className="flex gap-3 items-center">
          <Link isExternal aria-label="Twitter" href="https://twitter.com/rikuyapp">
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="GitHub" href="https://github.com/Firrton/Rikuy">
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>

        <ul className="hidden lg:flex gap-4 ml-6">
          {rightNavItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      {/* Mobile toggle */}
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      {/* Menú móvil */}
      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {[...leftNavItems, ...rightNavItems].map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link color="foreground" href={item.href} size="lg">
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <Link isExternal href="https://twitter.com/rikuyapp" size="lg">
              Twitter
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link isExternal href="https://github.com/Firrton/Rikuy" size="lg">
              GitHub
            </Link>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
