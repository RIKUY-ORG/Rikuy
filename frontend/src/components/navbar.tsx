// import { Button } from "@heroui/button";
// import { Kbd } from "@heroui/kbd";
// import { Search } from "lucide-react";
// import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { addToast } from "@heroui/toast";
import { User } from "@heroui/user";
import { UserCircle } from "lucide-react";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { usePrivy } from "@privy-io/react-auth";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { RikuyLogo } from "./rikuyLogo";
import { useAvatarContext } from "@/context/avatarContext";

export const Navbar = () => {
  const { user, authenticated, login, logout, ready } = usePrivy();
  const { AvatarComp } = useAvatarContext();

  // 🔍 Buscador comentado por ahora
  /*
  const searchInput = (
    <Input
      aria-label="Buscar"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Buscar denuncias..."
      startContent={
        <Search className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );
  */

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      {/* Logo + navegación principal */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <RikuyLogo size={32} title="Logo de RIKUY" />
            <p className="font-bold text-inherit">RIKUY</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      {/* Íconos sociales + theme switch */}
      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.twitter} title="Twitter">
            <FaXTwitter className="text-default-500" size={28} />
          </Link>
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <FaGithub className="text-default-500" size={28} />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        {/* 🔑 Aquí agregas el botón de login/perfil */}
        <NavbarItem>
          {authenticated && user
            ? (
              <Popover showArrow placement="bottom-end">
                <PopoverTrigger>
                  <User
                    as="button"
                    avatarProps={{
                      icon: authenticated && user
                        ? (
                          <AvatarComp
                            size={28}
                            className="text-primary"
                            title="Avatar RIKUY"
                          />
                        )
                        : <UserCircle className="text-primary" size={28} />,
                      isBordered: true,
                      radius: "full",
                      className: "bg-default-100",
                    }}
                    className="transition-transform"
                    description="Usuario RIKUY"
                    name="Perfil"
                  />
                </PopoverTrigger>
                <PopoverContent className="p-2">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-default-600">
                      Dirección:{" "}
                      {user.wallet?.address?.slice(0, 6)}...{user.wallet
                        ?.address?.slice(-4)}
                    </p>
                    <Button
                      as={Link}
                      href="/denunciar"
                      color="success"
                      radius="full"
                      size="sm"
                      variant="bordered"
                    >
                      Denunciar
                    </Button>
                    <Button
                      as={Link}
                      href="/como-funciona"
                      color="success"
                      radius="full"
                      size="sm"
                      variant="bordered"
                    >
                      Como funciona
                    </Button>
                    <Button
                      as={Link}
                      href="/comunidades"
                      color="success"
                      radius="full"
                      size="sm"
                      variant="bordered"
                    >
                      Comunidades
                    </Button>
                    <Button
                      as={Link}
                      href="/perfil"
                      color="success"
                      radius="full"
                      size="sm"
                      variant="solid"
                    >
                      Ver perfil
                    </Button>
                    <Button
                      onClick={() => {
                        logout();
                        addToast({
                          title: "Sesión cerrada",
                          description: "Has cerrado sesión.",
                          color: "danger",
                        });
                      }}
                      color="danger"
                      radius="full"
                      size="sm"
                      variant="solid"
                    >
                      Cerrar sesión
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )
            : (
              <Button
                onClick={() => {
                  login();
                  addToast({
                    title: "Sesión iniciada",
                    description: "Has iniciado sesión correctamente.",
                    color: "success",
                  });
                }}
                disabled={!ready}
                color="success"
                radius="full"
                variant="solid"
              >
                Iniciar sesión
              </Button>
            )}
        </NavbarItem>
        {/* Buscador comentado */}
        {/* <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem> */}
      </NavbarContent>

      {/* Menú móvil */}
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal href={siteConfig.links.github}>
          <FaGithub className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {/* {searchInput} */}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <Link href={item.href} color="foreground" size="lg">
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}

          {
            /* {siteConfig.institutional.map((item) => (
            <NavbarMenuItem key={item.href}>
              <Link href={item.href} color="foreground" size="lg">
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}

          {siteConfig.help.map((item) => (
            <NavbarMenuItem key={item.href}>
              <Link href={item.href} color="foreground" size="lg">
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))} */
          }

          {siteConfig.account.map((item) => (
            <NavbarMenuItem key={item.href}>
              {item.label === "Cierre de sesión"
                ? (
                  <button
                    onClick={() => {
                      logout();
                      addToast({
                        title: "Sesión cerrada",
                        description: "Tu sesión fue cerrada correctamente.",
                        color: "danger",
                      });
                    }}
                    className="text-red-500"
                  >
                    {item.label}
                  </button>
                )
                : item.label === "Inicio de sesión"
                ? (
                  <button
                    onClick={() => {
                      login();
                      addToast({
                        title: "Sesión iniciada",
                        description: "Bienvenido a RIKUY.",
                        color: "success",
                      });
                    }}
                    disabled={!ready}
                    className="text-green-500"
                  >
                    {item.label}
                  </button>
                )
                : (
                  <Link
                    href={item.href}
                    size="lg"
                    color="foreground"
                  >
                    {item.label}
                  </Link>
                )}
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
