import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { sfx } from "./sound";

export type RoutePath =
  | "/"
  | "/chat"
  | "/assistant"
  | "/home"
  | "/login"
  | "/about"
  | "/download"
  | "/templates"
  | "/pricing"
  | string;

interface RouterContextType {
  path: string;
  navigate: (to: RoutePath, options?: { replace?: boolean; silent?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType>({
  path: "/",
  navigate: () => {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const getInitialPath = () => {
    if (typeof window === "undefined") return "/";
    const p = window.location.pathname.toLowerCase();
    if (!p || p === "" || p === "/index.html") return "/";
    return p;
  };

  const [path, setPath] = useState<string>(getInitialPath);

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase() || "/";
      setPath(p);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback(
    (to: RoutePath, options?: { replace?: boolean; silent?: boolean }) => {
      const target = to.startsWith("/") ? to : `/${to}`;
      if (!options?.silent) {
        sfx.whoosh();
      }

      if (options?.replace) {
        window.history.replaceState({}, "", target);
      } else {
        window.history.pushState({}, "", target);
      }
      setPath(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  return {
    path: ctx.path,
    push: (to: RoutePath) => ctx.navigate(to),
    replace: (to: RoutePath) => ctx.navigate(to, { replace: true }),
    navigate: ctx.navigate,
  };
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: RoutePath;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  replace?: boolean;
}

export function Link({
  href,
  children,
  className = "",
  activeClassName = "",
  replace = false,
  onClick,
  ...rest
}: LinkProps) {
  const { path, navigate } = useContext(RouterContext);
  const isActive =
    href === "/" ? path === "/" || path === "/assistant" || path === "/home" : path.startsWith(href);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      navigate(href, { replace });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => sfx.hover()}
      className={`${className} ${isActive ? activeClassName : ""}`}
      {...rest}
    >
      {children}
    </a>
  );
}
