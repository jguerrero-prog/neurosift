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
        summary:
          "Primitive, semantic and data colors, each a CSS custom property.",
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
    heading: "Usage guidelines",
    items: [
      {
        label: "Voice and content",
        href: "/guidelines/voice/",
        summary: "Precise, plain and considerate, in two modes of one voice.",
      },
      {
        label: "Scientific notation and units",
        href: "/guidelines/notation/",
        summary: "Exact identifiers, readable numbers, one spelling per unit.",
      },
      {
        label: "Data visualization",
        href: "/guidelines/data-visualization/",
        summary: "One set of rules for every plot; the data gets the hue.",
      },
      {
        label: "Errors and access",
        href: "/guidelines/errors/",
        summary: "Where each error goes, how to word it, and API keys.",
      },
      {
        label: "Empty states",
        href: "/guidelines/empty-states/",
        summary: "Say why it’s empty and offer one way forward.",
      },
      {
        label: "Loading and large data",
        href: "/guidelines/loading/",
        summary: "Say what is loading, how far along, and what is too big.",
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
        summary:
          "Tooltip, Toggletip and Info button: names and help on request.",
      },
      {
        label: "Pages and sections",
        href: "/components/pages/",
        summary: "Page and Section: a page's title, column and titled panels.",
      },
    ],
  },
];
