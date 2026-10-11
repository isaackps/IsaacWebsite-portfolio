// Single source of truth for facts shown on the site.
// Sources: Isaac's CV, supplied privately (roles, dates, project descriptions, education; not published on the site),
// Isaac's brief to the team (DEX is an IMDA subsidiary; secondment; My Sister Bakes co-founded with his wife),
// and the W3C "Verifiable Credential Rendering Methods v1.0" spec header (Isaac is listed as an Editor).
// Nothing here is invented: anything not in those sources is left out.

export const PERSON = {
  name: "Isaac Koh",
  first: "Isaac",
  email: "isaac.kps@gmail.com",
  linkedin: "https://www.linkedin.com/in/isaackoh89/",
  linkedinLabel: "in/isaackoh89",
  github: "https://github.com/isaackps",
  githubLabel: "isaackps",
};

export type Project = {
  slug: string;
  name: string;
  description: string; // CV wording, lightly edited
  pose: number; // hero frame slot shown beside the list while this row is hovered
};

export const PROJECTS: Project[] = [
  {
    slug: "trustvc",
    name: "TrustVC",
    description: "An open-source library for issuing and verifying W3C Verifiable Credentials.",
    pose: 50,
  },
  {
    slug: "tradetrust",
    name: "TradeTrust",
    description: "A framework for digitising trade documents using blockchain and distributed-ledger technology.",
    pose: 48,
  },
  {
    slug: "opencerts",
    name: "OpenCerts",
    description:
      "Part of Singapore's Smart Nation initiative: issuing and verifying tamper-resistant digital academic certificates, used by Singapore's universities, polytechnics and ITE.",
    pose: 44,
  },
];

export const SPEC = {
  title: "Verifiable Credential Rendering Methods v1.0",
  body: "W3C",
  role: "Editor", // exactly as listed under "Editors:" in the spec header
  affiliation: "Infocomm Media Development Authority of Singapore", // as listed in the spec
  url: "https://www.w3.org/TR/vc-render-method/",
};

export const ROLES = [
  { group: "Leading", items: [
    { when: "Apr 2026 - now", title: "Technical Lead", org: "DEX Digital Technologies, an IMDA subsidiary (on secondment from IMDA)", note: "Technical direction and system architecture for TrustVC, TradeTrust and OpenCerts, including AI-powered features. Also Scrum Master." },
    { when: "Jul 2023 - Mar 2026", title: "Lead Technical Product Manager", org: "Infocomm Media Development Authority (IMDA)", note: "Architecture, roadmap and Scrum Master for TrustVC and TradeTrust." },
  ]},
  { group: "Building", items: [
    { when: "Mar 2020 - Jul 2023", title: "Senior Software Engineer", org: "Cognizant Singapore", note: "Engineering on TradeTrust." },
    { when: "Oct 2017 - Feb 2020", title: "Full Stack Developer", org: "PALO IT, Singapore", note: "Web products for banking and government clients, including DBS, Standard Chartered and MOM." },
  ]},
  { group: "Before", items: [
    { when: "Dec 2014 - May 2017", title: "Co-founder", org: "Lim Koh Pi LLP (My Sister Bakes)", note: "Built and ran the e-commerce site; also accounts, budgeting and training new staff." },
    { when: "Jul 2012 - Jul 2014", title: "Bachelor of Digital Media: Web Design and Animation", org: "UNSW College of Fine Arts (COFA), Sydney", note: "Awarded an International High Achiever Scholarship." },
    { when: "Feb 2007 - Feb 2010", title: "Diploma in Interactive Media Informatics: Digital Media", org: "Temasek Polytechnic, Singapore", note: "" },
  ]},
];
