import { ADDS_A_LINE, PICK_ANY, addOn, type ProjectType } from "./shared";

/** A marketing site, a portfolio or landing pages. All DRAFT: the invoice was for a store, so these are its phases scaled down. */
export const website: ProjectType = {
  id: "website",
  code: "WEB",
  label: "Website",
  detail: "A marketing site, a portfolio or landing pages.",
  base: [
    {
      id: "discovery",
      title: "Discovery & project scope",
      covers: "A call to pin down the goal and the audience, then a sitemap and the content each page needs.",
      why: "It fixes what is being built before any design starts, so the price below holds.",
      price: 100,
    },
    {
      id: "design",
      title: "UI/UX design",
      covers: "Wireframes, then finished designs for every page, on desktop and phone.",
      why: "You see and approve the whole site before it is built.",
      price: 300,
      scales: true,
    },
    {
      id: "build",
      title: "Website development",
      covers: "Every page built responsively in Next.js, fast on any phone, with accessible markup and sharing previews for every page.",
      why: "This is the site itself.",
      price: 500,
      scales: true,
    },
    {
      id: "golive",
      title: "Testing, SEO & go-live",
      covers: "Testing across browsers and phones, SEO basics, speed tuning, a sitemap and deployment.",
      why: "A site that is slow, broken on one phone or invisible to search has not launched.",
      price: 150,
    },
  ],
  steps: [
    {
      id: "scope",
      label: "Scope",
      title: "How big is the site?",
      lead: "Count the distinct pages a visitor can land on. A blog or a gallery counts once, however many posts it holds.",
      groups: [
        {
          id: "size",
          kind: "single",
          legend: "Pages",
          options: [
            { id: "size-one", label: "One page", detail: "A single scrolling page.", factor: 0.6 },
            { id: "size-small", label: "Up to 5 pages", detail: "Home, about, services, contact.", factor: 1 },
            { id: "size-medium", label: "6 to 12 pages", detail: "Room for case studies or a team.", factor: 1.6 },
            { id: "size-large", label: "More than 12", detail: "A full company site.", factor: 2.2 },
          ],
        },
      ],
    },
    {
      id: "features",
      label: "Features",
      title: "What should it do?",
      lead: ADDS_A_LINE,
      groups: [
        {
          id: "web-content",
          kind: "multi",
          legend: "Content",
          hint: PICK_ANY,
          options: [
            addOn("web-cms", "Edit it yourself", "A content manager for pages and images.", {
              title: "Content management",
              covers: "A simple editor for your pages, text and images, with drafts, previews and scheduled publishing.",
              why: "You asked to change the content yourself, without a developer.",
              price: 250,
            }),
            addOn("web-blog", "Blog or news", "Posts, categories and an RSS feed.", {
              title: "Blog",
              covers: "A blog with categories, author pages, reading times, a sharing image for every post and an RSS feed.",
              why: "You asked to publish regularly, which is also how most sites earn their search traffic.",
              price: 150,
            }),
            addOn("web-gallery", "Gallery or portfolio", "Filterable work, with a page for each piece.", {
              title: "Gallery",
              covers: "A filterable gallery with a page for each piece, images sized for every screen.",
              why: "You asked to show work, which needs more than a page of pictures.",
              price: 100,
            }),
            addOn("web-events", "Events", "Dates, places and add-to-calendar.", {
              title: "Events",
              covers: "An events list and a page for each event, with dates, a map and an add-to-calendar button; past events archive themselves.",
              why: "You asked to promote events, which need to stay current without anyone remembering to tidy them.",
              price: 150,
            }),
            addOn("web-search", "Site search", "Fast search across pages and posts.", {
              title: "Site search",
              covers: "Search across every page and post, quick and forgiving of typos.",
              why: "You asked for visitors to find things on a site with a lot in it.",
              price: 125,
            }),
            addOn("web-languages", "More than one language", "A language switch and translated routes.", {
              title: "Multi-language",
              covers: "A language switch, translated routes and the SEO tags search engines need for each language.",
              why: "You asked for the site in more than one language.",
              price: 200,
            }),
          ],
        },
        {
          id: "web-visitors",
          kind: "multi",
          legend: "Visitors",
          hint: PICK_ANY,
          options: [
            addOn(
              "web-forms",
              "Enquiry forms",
              "Messages delivered to your inbox, spam filtered.",
              {
                title: "Enquiry forms",
                covers: "Contact and enquiry forms with validation, spam protection, an auto-reply and delivery to your inbox.",
                why: "You asked for visitors to reach you from the site.",
                price: 75,
              },
              ["messaging"],
            ),
            addOn(
              "web-booking",
              "Bookings",
              "Visitors pick a time; you get a calendar entry.",
              {
                title: "Booking",
                covers: "A booking flow tied to your calendar, with confirmations and reminders.",
                why: "You asked for visitors to book without phoning.",
                price: 200,
              },
              ["tools"],
            ),
            addOn(
              "web-payments",
              "Take payments",
              "Deposits, a few products or donations.",
              {
                title: "Online payments",
                covers: "Secure Stripe checkout for a handful of products, services, deposits or donations, with receipts, without a full store.",
                why: "You asked to take money on the site. Card details never touch your own server.",
                price: 200,
              },
              ["payments"],
            ),
            addOn("web-members", "Members area", "Pages and downloads behind a login.", {
              title: "Members area",
              covers: "Sign-up and login for members, with pages and downloads only they can see, and a way to manage them.",
              why: "You asked for content that only some people can reach.",
              price: 350,
            }),
            addOn(
              "web-newsletter",
              "Newsletter sign-up",
              "Sign-ups sent to your mailing tool.",
              {
                title: "Newsletter sign-up",
                covers: "Sign-up forms connected to Mailchimp or a similar tool, with consent recorded as UK rules require.",
                why: "You asked to build a mailing list from the site.",
                price: 75,
              },
              ["tools"],
            ),
            addOn(
              "web-chat",
              "Chat or WhatsApp button",
              "Visitors message you from any page.",
              {
                title: "Chat button",
                covers: "A WhatsApp button or a live chat window on every page, wired to your phone or inbox.",
                why: "You asked for visitors to reach you in the moment, not by form.",
                price: 50,
              },
              ["tools"],
            ),
          ],
        },
        {
          id: "web-connect",
          kind: "multi",
          legend: "Connections",
          hint: PICK_ANY,
          options: [
            addOn("web-analytics", "Analytics & consent", "Visitor numbers, with a proper cookie choice.", {
              title: "Analytics & consent",
              covers: "Privacy-respecting analytics with goals for your key actions, and a cookie choice set up to the ICO's guidance where one is needed.",
              why: "You asked to see how the site is used.",
              price: 75,
            }),
            addOn(
              "web-crm",
              "Connect your CRM",
              "Enquiries straight into HubSpot or similar.",
              {
                title: "CRM connection",
                covers: "Enquiries, bookings and sign-ups sent straight into your CRM, such as HubSpot, tagged by where they came from.",
                why: "You asked for leads to land where your team already works.",
                price: 150,
              },
              ["tools"],
            ),
            addOn("web-reviews", "Reviews feed", "Your Google or Trustpilot reviews, kept current.", {
              title: "Reviews feed",
              covers: "Your Google or Trustpilot reviews shown on the site and refreshed on their own, with the rating marked up for search.",
              why: "You asked to show what customers say, without copying it in by hand.",
              price: 75,
            }),
            addOn(
              "web-maps",
              "Maps & locations",
              "An interactive map with directions.",
              {
                title: "Maps & locations",
                covers: "An interactive map of your locations, with opening hours and directions from wherever the visitor is.",
                why: "You asked for people to find you in person.",
                price: 75,
              },
              ["apis"],
            ),
          ],
        },
      ],
    },
  ],
  shared: ["look", "launch", "timeline"],
  running: ["domain", "hosting"],
};
