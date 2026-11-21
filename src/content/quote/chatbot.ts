import { ADDS_A_LINE, PICK_ANY, addOn, careStep, type ProjectType } from "./shared";

/** An assistant that answers for you, day and night. All DRAFT. */
export const chatbot: ProjectType = {
  id: "chatbot",
  code: "BOT",
  label: "Chatbot",
  detail: "An assistant that answers for you, day and night.",
  base: [
    {
      id: "discovery",
      title: "Discovery & project scope",
      covers: "The questions it must answer, the ones it must never answer, and the tone it speaks in.",
      why: "It fixes what the assistant is for before it says a word to a customer.",
      price: 150,
    },
    {
      id: "design",
      title: "Conversation design",
      covers: "The assistant's instructions, its fallbacks and what it does when it does not know.",
      why: "A good assistant is written, not left to chance.",
      price: 250,
      scales: true,
    },
    {
      id: "build",
      title: "Chatbot build",
      covers: "The assistant built and placed on your website as a chat window matched to your brand, usable by keyboard and screen reader.",
      why: "This is the assistant itself, and the window your visitors talk to.",
      price: 500,
      scales: true,
    },
    {
      id: "golive",
      title: "Testing & evaluation",
      covers: "Tested against real questions, awkward ones included, before it goes in front of customers.",
      why: "Wrong answers given in your name cost more than this line.",
      price: 150,
    },
  ],
  steps: [
    {
      id: "scope",
      label: "Scope",
      title: "What should it be able to do?",
      lead: "How much it has to know. Bookings, order lookups and other actions are added on the next step.",
      groups: [
        {
          id: "size",
          kind: "single",
          legend: "Knowledge",
          options: [
            { id: "size-small", label: "Common questions", detail: "Hours, prices, how things work.", factor: 0.8 },
            { id: "size-medium", label: "Your documents", detail: "Policies, manuals, a product range.", factor: 1.2 },
            { id: "size-large", label: "A large library", detail: "Hundreds of documents, a whole catalogue.", factor: 1.7 },
          ],
        },
      ],
    },
    {
      id: "features",
      label: "Features",
      title: "Where and how should it work?",
      lead: ADDS_A_LINE,
      groups: [
        {
          id: "bot-where",
          kind: "multi",
          legend: "Where",
          hint: "Your website is included. Choose any, or none.",
          options: [
            addOn(
              "bot-channels",
              "WhatsApp or Messenger",
              "The same assistant where your customers already are.",
              {
                title: "Messaging channel",
                covers: "The same assistant connected to WhatsApp or Messenger, approved and tested.",
                why: "You asked for it to answer outside your website.",
                price: 250,
              },
              ["messaging"],
            ),
            addOn("bot-email", "Email", "Replies to routine enquiries by email.", {
              title: "Email replies",
              covers: "Routine enquiries to your inbox answered by the assistant, with anything unusual left for a person.",
              why: "You asked for it to work through the inbox as well as the chat window.",
              price: 200,
            }),
            addOn(
              "bot-voice",
              "Phone calls",
              "Answers the phone in a natural voice.",
              {
                title: "Phone assistant",
                covers: "Calls answered in a natural voice, questions answered, messages taken and urgent calls passed to a person.",
                why: "You asked for the phone to be answered when nobody can pick it up.",
                price: 600,
              },
              ["messaging"],
            ),
            addOn("bot-app", "Inside your app or portal", "For signed-in customers.", {
              title: "In-app assistant",
              covers: "The assistant inside your app or customer portal, aware of who is signed in and answering about their own account.",
              why: "You asked for it to help customers with their own details, not just general questions.",
              price: 250,
            }),
          ],
        },
        {
          id: "bot-does",
          kind: "multi",
          legend: "What it handles",
          hint: PICK_ANY,
          options: [
            addOn("bot-handoff", "Hand over to a person", "It knows when to stop and who to call.", {
              title: "Hand-over to a person",
              covers: "A clean hand-over to a member of your team, with the conversation so far.",
              why: "You asked for people to reach a person when they need one.",
              price: 150,
            }),
            addOn(
              "bot-leads",
              "Capture leads",
              "Names and needs sent to your inbox or CRM.",
              {
                title: "Lead capture",
                covers: "Contact details and what the person needs, sent to your inbox or CRM.",
                why: "You asked for conversations to turn into enquiries.",
                price: 125,
              },
              ["tools"],
            ),
            addOn(
              "bot-booking",
              "Book appointments",
              "Finds a free slot and books it.",
              {
                title: "Bookings",
                covers: "Free slots found in your calendar, the booking made and confirmed, and changes or cancellations handled in the chat.",
                why: "You asked for it to book people in, not just tell them how.",
                price: 250,
              },
              ["tools"],
            ),
            addOn("bot-orders", "Order lookups", "Status, tracking and returns.", {
              title: "Order lookups",
              covers: "Order status, tracking and returns from your store or system, after the customer has been verified.",
              why: "You asked for it to answer the question customers ask most: where is my order?",
              price: 250,
            }),
            addOn("bot-languages", "More than one language", "Replies in the language it is asked in.", {
              title: "Multi-language",
              covers: "Replies in the language the question is asked in, checked in each one.",
              why: "You asked for it to serve customers in more than one language.",
              price: 150,
            }),
          ],
        },
        {
          id: "bot-control",
          kind: "multi",
          legend: "Character & control",
          hint: PICK_ANY,
          options: [
            addOn("bot-persona", "A character of its own", "A name, an avatar and a voice.", {
              title: "Character & avatar",
              covers: "A name, a designed avatar and a written voice for the assistant, with the chat window styled to match.",
              why: "You asked for an assistant people remember, not a grey box.",
              price: 200,
            }),
            addOn("bot-editor", "Edit its answers yourself", "Your team adds and corrects answers.", {
              title: "Answer editor",
              covers: "A simple page where your team adds, corrects and retires the answers it gives, without a developer.",
              why: "You asked to keep it current yourself as prices and policies change.",
              price: 200,
            }),
            addOn("bot-guardrails", "Guardrails & compliance", "Off-limits topics; data handled properly.", {
              title: "Guardrails & compliance",
              covers: "Topics it refuses, personal data handled under UK GDPR, chats kept for a set time, and a clear note that people are talking to an AI.",
              why: "You asked for it to stay safe in your name, whatever it is asked.",
              price: 200,
            }),
            addOn("bot-dashboard", "Conversation dashboard", "What people ask, and where it struggled.", {
              title: "Conversation dashboard",
              covers: "A dashboard of what people ask, what it answered and where it struggled.",
              why: "You asked to see what your customers are saying.",
              price: 250,
            }),
            addOn("bot-evals", "Accuracy checks", "Real questions rerun after every change.", {
              title: "Accuracy checks",
              covers: "The launch test questions kept as a permanent suite and rerun after every change to its knowledge or instructions, with the results kept.",
              why: "You asked to know it stays right after launch, as it changes.",
              price: 150,
            }),
          ],
        },
      ],
    },
    careStep("bot", {
      title: "Hosting & monitoring setup",
      covers: "Accounts opened in your name, the assistant deployed, and an alert to you if it stops answering.",
    }),
  ],
  shared: ["timeline"],
  running: ["ai", "hosting"],
};
