import type { Project } from "./types";

/**
 * Research and study work: Swarm Routing, the Delivery Drone and Mini Bank.
 * Swarm Routing's tools are the ones its notebook actually imports and its
 * algorithms the ones its code actually runs (read 20 Nov 2026); the results
 * line is the owner's own, from the copy doc. Mini Bank is described from its
 * source files.
 *
 * TODO(owner): the Delivery Drone has no report, code or parts list on record.
 * Its story is written from the owner's own descriptions of the build and
 * names no part by model. Send the parts list (frame, motors, speed
 * controllers, battery, flight controller, Arduino board, gimbal) and the
 * story and stack can name them.
 */

export const swarmRouting: Project = {
  slug: "swarm-routing",
  title: "Swarm Routing",
  subtitle: "AI that teaches delivery drones to share the work",
  tagline: "AI route optimisation for autonomous delivery-drone swarms",
  tag: "Python",
  year: "2025",
  kind: "Research",
  plate: "swarm",
  figure: "Sixty drop-offs, six zones, one swarm. Block a point and watch it think again.",
  // A still of that live demo (19 Nov 2026), for the index. The case study shows the demo itself.
  thumb: "/projects/swarm-routing.webp",
  summary:
    "My MSc dissertation at Birmingham City University: an AI system that routes swarms of delivery drones, tested from 2 to 50 drones.",
  story:
    "One drone following a fixed route is easy. Fifty drones sharing a city, with blocked drop-offs, shifting weather and draining batteries, is not. I built the whole system in Python. I generated delivery points, split the city into zones with spectral clustering, planned a route inside each zone, then trained the drones with Q-learning to adapt when things went wrong. The work won the PGXPO 2025 Research Innovation Award and the Faculty Award for Dissertation Excellence.",
  does: [
    "Generates realistic delivery points across an urban layout",
    "Turns the city into a graph of points and distances",
    "Splits the graph into delivery zones with spectral clustering",
    "Plans a route inside each zone",
    "Assigns a zone to each drone in the swarm",
    "Re-routes when a delivery point is blocked",
    "Adapts to weather shifts and battery depletion",
    "Measures completion rate and delivery time for every run",
  ],
  solved: [
    "Started with a nearest-neighbour route as the baseline to beat",
    "Partitioned the delivery graph with spectral clustering so drones stop competing for the same points",
    "Trained drones with Q-learning over 500 episodes, then scaled to multi-agent reinforcement learning",
    "Added disruptions mid-run to test how the swarm recovers",
    "Scaled from 2 to 50 drones to prove it holds up",
  ],
  results:
    "30% higher task completion than static routing, 25% shorter delivery times, and a further 15% gain in completion under disruption.",
  stack: [
    { group: "Language", items: ["Python 3.10"] },
    { group: "Libraries", items: ["NumPy", "pandas", "SciPy (spatial distance)", "scikit-learn", "Matplotlib"] },
    {
      group: "Routing",
      items: ["Travelling salesman problem", "Nearest-neighbour heuristic", "Distance matrices", "Graph adjacency matrix", "Per-zone re-solving"],
    },
    { group: "Clustering", items: ["Spectral clustering", "Precomputed affinity graph", "k-means label assignment"] },
    {
      group: "Reinforcement learning",
      items: ["Tabular Q-learning", "Epsilon-greedy exploration", "Custom training environment", "Multi-agent RL (independent learners)", "Reward shaping"],
    },
    { group: "Simulation", items: ["Seeded delivery-point generation", "Battery and recharge model", "No-fly zones", "Blocked-point disruptions"] },
    { group: "Tools", items: ["Google Colab", "Jupyter Notebook"] },
  ],
  tags: ["ai", "reinforcement-learning", "drones", "python", "research"],
};

export const deliveryDrone: Project = {
  slug: "delivery-drone",
  title: "Delivery Drone",
  subtitle: "The drone I designed, wired and flew for my BEng",
  tagline: "The drone I built for my BEng final project",
  tag: "Arduino",
  year: "2021",
  kind: "Research",
  plate: "plain",
  summary:
    "My final-year project for a BEng in Electrical and Electronics Engineering: the design, construction and implementation of a delivery drone. I bought the parts, designed the circuit, built it and flew it.",
  story:
    "Before I wrote software for a living, I built a machine that had to leave the ground. The brief I set myself was simple to say and hard to do: a drone that can carry a parcel and stay level while it does. I started on paper, with a power budget. Every gram a drone carries costs battery, and every extra cell of battery adds grams, so the motors, the battery and the payload had to be chosen together, not one at a time. Then came the parts: the frame, the motors and their speed controllers, the propellers, the battery, the flight controller with its inertial sensors, an Arduino board, and a gimbal. I designed the electrical circuit that ties them together and built the power distribution by hand. The Arduino took the jobs the flight controller does not do, and the gimbal held the load steady while the airframe tilted round it. Most of the project happened on the bench: testing each motor, checking each connection, calibrating the sensors, and finding out why it would not hover level. Then it flew. That project is why I still think like an electrical engineer: budget first, test on the bench, and trust nothing until it has been measured.",
  does: [
    "Lifts off, hovers and flies",
    "Carries a payload and keeps it level on a gimbal",
    "Holds itself steady using a flight controller and inertial sensors",
    "Runs its own extra logic on an Arduino board",
    "Feeds every motor from one battery through a hand-built power circuit",
  ],
  solved: [
    "Worked out the power budget first, so the motors, battery and payload were sized against each other",
    "Chose every part against a tight weight limit, because each gram costs flight time",
    "Designed the electrical circuit from the battery to the motors, speed controllers, flight controller and Arduino",
    "Soldered and assembled the power distribution by hand",
    "Mounted a gimbal so the load stays level while the airframe tilts to move",
    "Bench-tested each motor and connection before the first flight",
    "Calibrated the sensors and tuned the controller until the drone hovered level",
  ],
  results: "It flew. Designed on paper, built by hand and tested on the bench until it left the ground with its load.",
  stack: [
    { group: "Flight", items: ["Flight controller", "Inertial sensors", "Motors", "Electronic speed controllers", "Propellers"] },
    { group: "Electronics", items: ["Arduino", "Gimbal", "Power distribution", "Battery", "Hand-built circuit"] },
    { group: "Design and test", items: ["Circuit design", "Power budgeting", "Bench testing", "Sensor calibration"] },
  ],
  tags: ["hardware", "arduino", "electronics", "embedded", "drones"],
};

export const miniBank: Project = {
  slug: "mini-bank",
  title: "Mini Bank",
  subtitle: "A banking system in plain Python",
  tagline: "Python banking system: accounts, deposits, withdrawals, transfers",
  tag: "Python",
  year: "2024",
  kind: "Personal project",
  plate: "plain",
  summary:
    "A banking system written in pure Python for my MSc software development module: accounts, deposits, withdrawals, transfers and management reports, run from the command line with no libraries beyond the standard one.",
  story:
    "A bank is a good test of a programmer, because money forgives nothing. A balance cannot go missing, a withdrawal cannot exceed what is there, and not every member of staff should see every figure. I built Mini Bank to get those rules right with the fewest tools possible: Python, its standard library and a terminal. The design is object-oriented. A customer account guards its own balance behind private fields, so nothing outside the account can change it except a deposit or a withdrawal that passes the checks. An admin signs in and works through a menu: move money between customers, update or close an account, print one customer or all of them, and save the whole bank to a file. A management report adds it up, with the number of customers, the total held, the interest due over a year and the overdrafts outstanding, and only an admin with full rights may run it. Then I tried to break it, with twenty written test cases covering good input and bad, and it held.",
  does: [
    "Signs admins in with a username and password",
    "Deposits to and withdraws from any customer account",
    "Transfers money between two customers",
    "Updates a customer's details, or closes the account",
    "Prints one customer's record, or every customer's",
    "Saves all accounts to a CSV file and loads them back",
    "Produces a management report: customers, total balance, yearly interest and overdrafts",
  ],
  solved: [
    "Modelled the bank as three classes: the bank system, the customer account and the admin",
    "Kept each balance private to its account, reachable only through deposit and withdraw",
    "Rejected bad money at the door: no zero or negative amounts, and no withdrawal above the balance",
    "Checked the sender's balance before a transfer moves a penny",
    "Caught bad input and missing files, so a typing slip never crashes the program",
    "Restricted the management report to admins with full rights",
    "Stored the data with Python's own csv module, so the system runs anywhere Python does",
    "Wrote a 20-case test table, from a failed login to a refused transfer, and passed every case",
  ],
  results: "20 of 20 test cases passed, on nothing but the Python standard library.",
  stack: [
    { group: "Language", items: ["Python 3"] },
    { group: "Standard library", items: ["csv", "Exception handling", "File input and output"] },
    { group: "Design", items: ["Object-oriented programming", "Encapsulation", "Role-based access", "Menu-driven command line"] },
    { group: "Testing", items: ["Manual test-case table", "Input validation tests"] },
  ],
  tags: ["python", "oop", "command-line", "banking", "csv"],
};
