import { ADDS_A_LINE, BRAND_KIT, PICK_ANY, addOn, type ProjectType } from "./shared";

/** A logo, a brand and the screens that carry it. The kit is INVOICE line 02; the rest is DRAFT unless marked. */
export const brand: ProjectType = {
  id: "brand",
  code: "DSGN",
  label: "Brand & design",
  detail: "A logo, a brand and the screens that carry it.",
  base: [{ id: "brand-kit", ...BRAND_KIT, why: "This is the brand itself: what people recognise you by." }],
  steps: [
    {
      id: "scope",
      label: "Scope",
      title: "How far should the design go?",
      lead: "The brand kit is always included. Add the screens it will live on, if you want them designed too.",
      groups: [
        {
          id: "size",
          kind: "single",
          legend: "Design",
          options: [
            { id: "size-kit", label: "The brand kit alone", detail: "Logo, colours, type and favicon." },
            addOn("size-site", "Plus a website design", "Up to 5 pages, ready for any developer.", {
              title: "Website design",
              covers: "Wireframes and finished designs for up to 5 pages, on desktop and phone, handed over in Figma.",
              why: "You asked for the website designed in the new brand.",
              price: 300,
            }),
            // INVOICE line 03.
            addOn("size-app", "Plus a web app or store design", "Every key screen, ready for any developer.", {
              title: "UI/UX design",
              covers: "Wireframes and high-fidelity designs for every key screen, handed over in Figma.",
              why: "You asked for the product designed in the new brand.",
              price: 425,
            }),
            addOn("size-mobile", "Plus a mobile app design", "iPhone and Android, with the app icon.", {
              title: "Mobile app design",
              covers: "Every key screen designed for iPhone and Android to each platform's guidelines, with the app icon, handed over in Figma.",
              why: "You asked for the app designed in the new brand.",
              price: 700,
            }),
          ],
        },
      ],
    },
    {
      id: "features",
      label: "Extras",
      title: "Anything to go with it?",
      lead: ADDS_A_LINE,
      groups: [
        {
          id: "brand-thinking",
          kind: "multi",
          legend: "Strategy & words",
          hint: PICK_ANY,
          options: [
            addOn("brand-strategy", "Brand strategy", "Audience, position and personality.", {
              title: "Brand strategy",
              covers: "A workshop on your audience, competitors, position and personality, written up as a one-page brief that every design decision follows.",
              why: "You asked for the brand to stand for something before it looks like something.",
              price: 250,
            }),
            addOn("brand-naming", "Naming", "A shortlist, checked for availability.", {
              title: "Naming",
              covers: "A shortlist of names with the thinking behind each, checked against Companies House, the UK trade mark register and domain availability.",
              why: "You asked for a name. A trade mark attorney's search is still advised before you commit.",
              price: 300,
            }),
            addOn("brand-voice", "Tone of voice & tagline", "How the brand sounds, in writing.", {
              title: "Tone of voice & tagline",
              covers: "A tagline and a short tone-of-voice guide with examples of what the brand says, and how.",
              why: "You asked for the brand to sound as consistent as it looks.",
              price: 150,
            }),
          ],
        },
        {
          id: "brand-identity",
          kind: "multi",
          legend: "Identity",
          hint: PICK_ANY,
          options: [
            addOn("brand-guide", "Brand guidelines", "A short PDF on how to use it all.", {
              title: "Brand guidelines",
              covers: "A short PDF showing how the logo, colours and type are used, and how they are not.",
              why: "You asked for rules other people can follow.",
              price: 150,
            }),
            addOn("brand-icons", "Icon set", "Icons drawn to match the logo.", {
              title: "Icon set",
              covers: "A set of up to 24 icons drawn to match the brand, for the web, apps and print, delivered as SVG.",
              why: "You asked for icons that belong to the brand, not a free pack.",
              price: 200,
            }),
            addOn("brand-illustration", "Illustration style", "A drawn style, with a starter set.", {
              title: "Illustration style",
              covers: "An illustration style designed for the brand, with a starter set of six drawings and notes on extending it.",
              why: "You asked for imagery that only your brand has.",
              price: 300,
            }),
            addOn("brand-motion", "Animated logo", "For video, socials and app launch.", {
              title: "Animated logo",
              covers: "The logo animated for videos, socials and app launch screens, delivered as video and Lottie files.",
              why: "You asked for the brand to move.",
              price: 200,
            }),
            addOn("brand-photo", "Photography direction", "A style guide and shot list.", {
              title: "Photography direction",
              covers: "A photography style guide and a shot list, ready to brief any photographer.",
              why: "You asked for photos that look like one brand, whoever takes them.",
              price: 150,
            }),
          ],
        },
        {
          id: "brand-assets",
          kind: "multi",
          legend: "In use",
          hint: PICK_ANY,
          options: [
            addOn("brand-social", "Social media kit", "Profile images and post templates.", {
              title: "Social media kit",
              covers: "Profile and cover images, and editable post and story templates in the new brand.",
              why: "You asked for the brand to be ready to post.",
              price: 100,
            }),
            addOn(
              "brand-print",
              "Stationery",
              "Business card, letterhead, email signature.",
              {
                title: "Stationery",
                covers: "A business card, a letterhead and an email signature, print-ready.",
                why: "You asked for the brand on paper.",
                price: 100,
              },
              ["licences"],
            ),
            addOn("brand-deck", "Presentation template", "Slides for pitches and proposals.", {
              title: "Presentation template",
              covers: "An editable slide template for Google Slides, Keynote or PowerPoint, with layouts for pitches and proposals.",
              why: "You asked for the brand in the room as well as online.",
              price: 200,
            }),
            addOn("brand-email", "Email templates", "Newsletters and receipts on-brand.", {
              title: "Email templates",
              covers: "Newsletter and transactional email templates that hold up in every major inbox, for your mailing tool.",
              why: "You asked for your emails to look like the rest of the brand.",
              price: 150,
            }),
            addOn(
              "brand-packaging",
              "Packaging or labels",
              "One pack or label range, print-ready.",
              {
                title: "Packaging & labels",
                covers: "One packaging design or label range, set up to your printer's templates with print-ready files.",
                why: "You asked for the brand on the product itself.",
                price: 350,
              },
              ["licences"],
            ),
            addOn(
              "brand-signage",
              "Signage & merchandise",
              "Shop sign, banners, uniforms, merch.",
              {
                title: "Signage & merchandise",
                covers: "Designs for a shop sign, banners and up to three merchandise items, with files to your suppliers' specs.",
                why: "You asked for the brand out in the world.",
                price: 200,
              },
              ["licences"],
            ),
          ],
        },
      ],
    },
  ],
  shared: ["timeline"],
  running: ["licences"],
};
