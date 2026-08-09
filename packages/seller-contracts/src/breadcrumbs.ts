import { type RouteNode, routeTree } from "./routes.js";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function matchShellBreadcrumbs(
  pathname: string,
  replacements?: Record<string, string | null>,
): BreadcrumbItem[] {
  const segments = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [];
  let children: RouteNode[] = routeTree;
  let currentPath = "";

  const root = routeTree.find((n) => n.path === "");
  if (root?.label) {
    crumbs.push({ label: root.label, to: "/" });
    children = root.children ?? [];
  }

  if (segments.length === 0 && crumbs.length > 0) {
    return [{ label: crumbs[0].label }];
  }

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const match =
      children.find((n) => n.path === segment) ??
      children.find((n) => n.path.startsWith(":"));

    let label = match?.label;
    if (match && replacements && replacements[match.path]) {
      label = replacements[match.path] as string;
    }

    if (label) {
      crumbs.push({ label, to: currentPath });
      children = match?.children ?? [];
    } else {
      crumbs.push({ label: humanize(segment), to: currentPath });
      children = [];
    }
  }
  if (crumbs.length > 0) {
    crumbs[crumbs.length - 1].to = undefined;
  }
  return crumbs;
}

function humanize(segment: string): string {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
