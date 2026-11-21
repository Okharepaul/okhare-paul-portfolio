import { ADDS_A_LINE, ADMIN_DASHBOARD, PAYMENTS, PICK_ANY, addOn, type ProjectType } from "./shared";

/** Browse, order, pay and track. The core work is INVOICE lines 01, 03, 04, 05, 06 and 08, unchanged. */
export const store: ProjectType = {
  id: "store",
  code: "SHOP",
  label: "E-commerce store",
  detail: "Browse, order, pay and track deliveries.",
  base: [
    {
      id: "discovery",
      title: "Discovery & project scope",
      covers: "Requirements workshop, sitemap and user flows.",
      why: "It fixes what is being built before any design starts, so the price below holds.",
      price: 150,
    },
    {
      id: "design",
      title: "UI/UX design",
      covers: "Wireframes and high-fidelity designs for every key page.",
      why: "You see and approve the whole store before it is built.",
      price: 425,
      scales: true,
    },
    {
      id: "frontend",
      title: "Frontend development",
      covers: "Responsive storefront, product catalogue, search, filters, cart and checkout.",
      why: "This is the store your customers see and use.",
      price: 875,
      scales: true,
    },
    {
      id: "backend",
      title: "Backend & database",
      covers: "Products, orders, customer accounts, login, order tracking and emails.",
      why: "It is what remembers every product, customer and order behind the storefront.",
      price: 725,
      scales: true,
    },
    { id: "payments", ...PAYMENTS },
    {
      id: "golive",
      title: "Testing, SEO & go-live",
      covers: "Quality testing, SEO basics, speed optimisation and deployment.",
      why: "Checkout is tested end to end before a real customer tries it.",
      price: 200,
    },
  ],
  steps: [
    {
      id: "scope",
      label: "Scope",
      title: "How much are you selling?",
      lead: "The size of the catalogue decides how much search, filtering and import work there is.",
      groups: [
        {
          id: "size",
          kind: "single",
          legend: "Catalogue",
          // The first size is the invoice as issued; the larger two are DRAFT.
          options: [
            { id: "size-small", label: "Up to 50 products", detail: "A focused range.", factor: 1 },
            { id: "size-medium", label: "50 to 500", detail: "Categories, filters and bulk import.", factor: 1.15 },
            { id: "size-large", label: "More than 500", detail: "Heavy search and stock handling.", factor: 1.35 },
          ],
        },
      ],
    },
    {
      id: "features",
      label: "Features",
      title: "What else should the store do?",
      lead: ADDS_A_LINE,
      groups: [
        {
          id: "shop-run",
          kind: "multi",
          legend: "Running it",
          hint: PICK_ANY,
          options: [
            // INVOICE line 07.
            addOn("shop-admin", "Admin dashboard", "Products, stock, orders and customers in one place.", ADMIN_DASHBOARD),
            addOn("shop-variants", "Variants & stock alerts", "Sizes and colours, each with its own stock.", {
              title: "Variants & stock",
              covers: "Sizes, colours and other options, each with its own price, stock count and SKU, and an alert when stock runs low.",
              why: "You asked to sell products that come in more than one version.",
              price: 150,
            }),
            addOn("shop-import", "Bulk import & export", "Products from a spreadsheet; orders out.", {
              title: "Bulk import & export",
              covers: "Products loaded and updated from a spreadsheet, with checks, and orders exported for your accountant.",
              why: "You asked to manage the range in bulk, not one product at a time.",
              price: 125,
            }),
            addOn("shop-vat", "VAT invoices", "VAT worked out, invoices sent with orders.", {
              title: "VAT & invoices",
              covers: "VAT worked out at checkout for each buyer's country, and a VAT invoice sent with every order, set to your VAT registration.",
              why: "You asked for the store to handle tax properly, not after the fact.",
              price: 125,
            }),
            addOn(
              "shop-sync",
              "Marketplace or till sync",
              "Stock kept in step with Amazon, Etsy or your till.",
              {
                title: "Marketplace & till sync",
                covers: "Stock and orders kept in step with one marketplace or point-of-sale system, such as Amazon, eBay, Etsy or Square.",
                why: "You asked to sell in more than one place without overselling.",
                price: 300,
              },
              ["tools"],
            ),
          ],
        },
        {
          id: "shop-sell",
          kind: "multi",
          legend: "Selling more",
          hint: PICK_ANY,
          options: [
            addOn("shop-discounts", "Discount codes", "Codes, sales and gift cards.", {
              title: "Discounts & gift cards",
              covers: "Discount codes, timed sales and gift cards, with the rules enforced at checkout.",
              why: "You asked to run promotions.",
              price: 125,
            }),
            addOn("shop-reviews", "Product reviews", "Ratings from verified buyers.", {
              title: "Product reviews",
              covers: "Ratings and reviews from verified buyers, with moderation and star ratings shown in search results.",
              why: "You asked for customers to leave reviews.",
              price: 100,
            }),
            addOn("shop-upsell", "Related products & bundles", "You may also like, bundles and add-ons.", {
              title: "Related products & bundles",
              covers: "Related products on every page, bundles at a set price, and add-on offers in the cart.",
              why: "You asked to raise the size of each order.",
              price: 125,
            }),
            addOn("shop-wishlist", "Wishlists", "Saved items and recently viewed.", {
              title: "Wishlists",
              covers: "Saved items and recently viewed products for each customer, with a back-in-stock email when something returns.",
              why: "You asked for customers to come back for what they nearly bought.",
              price: 100,
            }),
            addOn(
              "shop-abandoned",
              "Abandoned cart emails",
              "A reminder when a basket is left behind.",
              {
                title: "Abandoned cart emails",
                covers: "A timed reminder, and an optional second with an offer, when a signed-in customer leaves a full basket.",
                why: "You asked to win back sales that were nearly made.",
                price: 125,
              },
              ["messaging"],
            ),
            addOn("shop-loyalty", "Loyalty & referrals", "Points to spend; rewards for sharing.", {
              title: "Loyalty & referrals",
              covers: "Points earned on every order and spent at checkout, and a reward when a customer refers a friend.",
              why: "You asked to reward the customers who come back.",
              price: 250,
            }),
            addOn("shop-subscriptions", "Subscriptions", "Repeat orders billed on a schedule.", {
              title: "Subscriptions",
              covers: "Repeat orders billed on a schedule, with pause, skip and cancel for the customer.",
              why: "You asked to sell on subscription.",
              price: 250,
            }),
          ],
        },
        {
          id: "shop-fulfil",
          kind: "multi",
          legend: "Paying & delivery",
          hint: PICK_ANY,
          options: [
            addOn("shop-wallets", "Apple Pay & pay later", "Express wallets and instalments.", {
              title: "Wallets & pay later",
              covers: "Apple Pay and Google Pay for one-tap checkout, and Klarna or Clearpay instalments where they suit your range.",
              why: "You asked for a faster checkout. Fewer steps means fewer abandoned baskets.",
              price: 100,
            }),
            addOn(
              "shop-delivery",
              "Delivery rates & tracking",
              "Rates by region, tracking sent to the buyer.",
              {
                title: "Delivery rates & tracking",
                covers: "Delivery prices by region and weight, and tracking updates sent to the buyer.",
                why: "You asked for delivery to be priced and followed inside the store.",
                price: 150,
              },
              ["messaging"],
            ),
            addOn("shop-collect", "Click & collect", "Collection or local delivery slots.", {
              title: "Click & collect",
              covers: "Collection from your shop or local delivery, with time slots and a ready-to-collect message.",
              why: "You asked to serve customers near you without a courier.",
              price: 100,
            }),
            addOn("shop-returns", "Returns & refunds", "Customers request; you approve and refund.", {
              title: "Returns & refunds",
              covers: "A returns request for customers with reasons and labels, and refunds issued from the dashboard.",
              why: "You asked for returns to be handled inside the store, not by email.",
              price: 125,
            }),
            addOn("shop-currency", "More than one currency", "Prices shown and charged in the buyer's currency.", {
              title: "Multi-currency",
              covers: "Prices shown and charged in the buyer's currency, with rates kept current.",
              why: "You asked to sell across borders.",
              price: 150,
            }),
            addOn("shop-trade", "Trade & wholesale", "Approved accounts with their own prices.", {
              title: "Trade accounts",
              covers: "Approved trade accounts that see their own prices, minimum orders and pay-by-invoice.",
              why: "You asked to sell to businesses as well as the public.",
              price: 200,
            }),
          ],
        },
      ],
    },
  ],
  shared: ["look", "launch", "timeline"],
  running: ["domain", "hosting", "payments", "messaging"],
};
