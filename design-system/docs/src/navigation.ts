export interface NavItem {
  label: string;
  href: string;
  summary?: string;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const withBase = (href: string): string => `${base}${href}`;

export const navigation: NavSection[] = [
  { items: [{ label: "Overview", href: "/" }] },
  {
    heading: "Tokens",
    items: [
      {
        label: "Color",
        href: "/tokens/color/",
        summary: "Primitive, semantic and data colors, each a CSS custom property.",
      },
      {
        label: "Typography",
        href: "/tokens/typography/",
        summary: "Fifteen text styles and the IBM Plex font stacks.",
      },
      {
        label: "Spacing",
        href: "/tokens/spacing/",
        summary: "The 4px space scale, icon sizes and workspace dimensions.",
      },
      {
        label: "Radius and elevation",
        href: "/tokens/radius-and-elevation/",
        summary: "Corners, border widths, shadows and the focus ring.",
      },
      {
        label: "States",
        href: "/tokens/states/",
        summary: "Hover, pressed, focus, selected, disabled and error.",
      },
    ],
  },
];
