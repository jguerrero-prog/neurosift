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
    heading: "Foundations",
    items: [
      {
        label: "Iconography",
        href: "/foundations/iconography/",
        summary: "IBM Carbon icons, their sizes and what they replace.",
      },
    ],
  },
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
  {
    heading: "Components",
    items: [
      {
        label: "Buttons",
        href: "/components/buttons/",
        summary: "Button and Icon button: four styles, two sizes, every state.",
      },
      {
        label: "Text inputs and search",
        href: "/components/text-inputs/",
        summary: "Text input and Search field: labels, units, errors in words.",
      },
      {
        label: "Checkboxes",
        href: "/components/checkboxes/",
        summary: "On, off and mixed, with the whole row as the target.",
      },
      {
        label: "Dropdowns and selects",
        href: "/components/selects/",
        summary: "Select and Menu: one value or one action from a list.",
      },
      {
        label: "Alerts and toasts",
        href: "/components/alerts/",
        summary: "Alert, Toast and Inline message: what happened, what to do.",
      },
      {
        label: "Tooltips",
        href: "/components/tooltips/",
        summary: "Tooltip, Toggletip and Info button: names and help on request.",
      },
      {
        label: "Pages and sections",
        href: "/components/pages/",
        summary: "Page and Section: a page's title, column and titled panels.",
      },
      {
        label: "Sliders",
        href: "/components/sliders/",
        summary: "Slider and Range slider: feel by eye, exact numbers in a field.",
      },
    ],
  },
];
