export const PACKAGE_INFO_STORAGE_KEY = "exam-buzz-package-info";

export const PACKAGE_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Upcoming", value: "upcoming" },
];

export const PACKAGE_TYPE_OPTIONS = [
  { label: "Course Base", value: "Course Base" },
  { label: "Exam Limited", value: "Exam Limited" },
  { label: "Material Bundle", value: "Material Bundle" },
  { label: "Hybrid", value: "Hybrid" },
];

const bankWrittenDates = [
  "24-06-2026",
  "18-06-2026",
  "17-06-2026",
  "14-06-2026",
  "04-06-2026",
  "03-06-2026",
  "02-06-2026",
  "01-06-2026",
  "01-06-2026",
  "30-05-2026",
  "30-05-2026",
  "30-05-2026",
  "26-05-2026",
  "26-05-2026",
  "25-05-2026",
  "24-05-2026",
  "24-05-2026",
  "23-05-2026",
  "22-05-2026",
  "21-05-2026",
  "20-05-2026",
  "20-05-2026",
  "20-05-2026",
  "19-05-2026",
  "16-05-2026",
  "12-05-2026",
  "08-05-2026",
  "04-05-2026",
  "01-05-2026",
  "27-04-2026",
  "23-04-2026",
  "20-04-2026",
  "16-04-2026",
];

const bankWrittenPermissions = bankWrittenDates.map((date) => ({
  path: ["Bank", "Written", date],
  permission: "Permitted",
}));

export const DEFAULT_PACKAGE_INFO = [
  {
    id: "pkg-bank-written-permission-ledger",
    title: "Bank Written Permission Ledger",
    price: 1490,
    currency: "BDT",
    validityDays: 90,
    status: "active",
    packageType: "Course Base",
    packageTypeNote: "Long permission list for dated Bank Written exams",
    totalPurchased: 73,
    totalSellAmount: 108770,
    url: "https://exambuzz.live/packages/bank-written-permission-ledger",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=240&q=80",
    summary:
      "Bank written preparation package with dated written exams, material sheets, recent routine access and recorded revision classes.",
    rules: [
      "Students can access all permitted Bank Written exams listed in the access ledger.",
      "Duplicate dated exams are intentionally preserved because separate exam sets can share the same date.",
      "Material and routine permissions remain available during the full package validity period.",
      "Recorded revision class access is included for students who keep the package active.",
    ],
    permissions: [
      ...bankWrittenPermissions,
      {
        path: ["Material", "Bank", "৫৭&৫৮ ব্যাচ লিখিত শিট"],
        permission: "Permitted",
      },
      {
        path: ["Material", "Recent", "অনিবার্ণ ব্যাচ লিখিত রুটিন"],
        permission: "Permitted",
      },
      {
        path: ["Revision", "Recorded Class", "Recorded Class"],
        permission: "Included",
      },
    ],
  },
  {
    id: "pkg-officer-cash-59",
    title: "অফিসার ক্যাশ দিগন্ত - ৫৯ ব্যাচ",
    price: 397,
    currency: "BDT",
    validityDays: 60,
    status: "active",
    packageType: "Course Base",
    packageTypeNote: "Package without any limited exam",
    totalPurchased: 28,
    totalSellAmount: 10588,
    url: "https://t.me/+5a-SSkzyQm9hYjU1",
    imageUrl: "https://buzz.exambuzz.live/images/pac$package/1867960422283628.png",
    summary: "২০২৪ ভিত্তিক অফিসার ক্যাশ লিখিত ব্যাচের প্রস্তুতি, ডকুমেন্টস, গাইডলাইনস ও সাজেশন।",
    rules: [
      "ব্যাচটি শুধুমাত্র যারা অফিসার ক্যাশ লিখিত প্রস্তুতি নিতে চাচ্ছেন তাদের জন্য প্রযোজ্য।",
      "সমস্ত লিখিত ডকুমেন্টস প্রদান করা হবে, সাথে থাকবে গাইডলাইনস ও সাজেশন।",
      "অফিসার জেনারেল ব্যাচের অভিজ্ঞতার আলোকে প্রশ্ন প্রণয়ন করা হবে।",
      "পরীক্ষা শুরু: অফিসার ক্যাশ প্রিলি পরীক্ষার পর ৬ তারিখ থেকে।",
    ],
    permissions: [
      { path: ["BCS"], permission: "Permitted" },
      { path: ["Material", "Bank", "শিকড় ৫৬ ব্যাচ শিট"], permission: "Permitted" },
      { path: ["Written Exam", "Officer Cash"], permission: "Included" },
    ],
  },
  {
    id: "pkg-bcs-written-47",
    title: "BCS Written Intensive - ৪৭তম",
    price: 1250,
    currency: "BDT",
    validityDays: 120,
    status: "active",
    packageType: "Hybrid",
    packageTypeNote: "Course, material and limited model tests",
    totalPurchased: 146,
    totalSellAmount: 182500,
    url: "https://exambuzz.live/packages/bcs-written-47",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=240&q=80",
    summary: "Written syllabus coverage with live review, answer scripts, archived classes and model exams.",
    rules: [
      "Enrollment remains open until the final routine is published.",
      "Students can attend all written model exams during the validity period.",
      "PDF materials are downloadable, but live class links are restricted to active students.",
    ],
    permissions: [
      { path: ["BCS", "Written"], permission: "Included" },
      { path: ["Model Test", "Limited 30 exams"], permission: "Included" },
      { path: ["Material", "Answer format"], permission: "Permitted" },
    ],
  },
  {
    id: "pkg-bank-preli-rapid",
    title: "Bank Preli Rapid Revision",
    price: 699,
    currency: "BDT",
    validityDays: 45,
    status: "upcoming",
    packageType: "Exam Limited",
    packageTypeNote: "Limited exam access with revision sheets",
    totalPurchased: 0,
    totalSellAmount: 0,
    url: "https://exambuzz.live/packages/bank-preli-rapid",
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=240&q=80",
    summary: "Fast-track bank preliminary revision with scheduled exams and short solution notes.",
    rules: [
      "Package access begins after publication.",
      "Each exam allows one final submission and two practice attempts.",
      "Revision sheets unlock weekly according to the batch plan.",
    ],
    permissions: [
      { path: ["Bank", "Preliminary"], permission: "Included" },
      { path: ["Model Test", "20 exams"], permission: "Included" },
      { path: ["Material", "Weekly sheets"], permission: "Permitted" },
    ],
  },
];

export function createPackageId() {
  return `pkg-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function normalizePackageStatus(status) {
  if (status === "active" || status === "inactive" || status === "upcoming") {
    return status;
  }

  if (status === "draft") return "upcoming";
  if (status === "archived") return "inactive";

  return "inactive";
}

export function formatPackageCurrency(amount, currency = "BDT") {
  return `${Number(amount || 0).toLocaleString("en-BD")} ${currency}`;
}

export function packageRulesToHtml(rules = []) {
  if (typeof rules === "string" && /<\/?[a-z][\s\S]*>/i.test(rules)) {
    return rules;
  }

  const ruleList = Array.isArray(rules)
    ? rules
    : String(rules || "")
        .split("\n")
        .map((rule) => rule.trim())
        .filter(Boolean);

  if (ruleList.length === 0) return "<p></p>";

  return `<ol>${ruleList
    .map((rule) => `<li>${String(rule).replace(/[<>&]/g, (character) => {
      const entities = { "<": "&lt;", ">": "&gt;", "&": "&amp;" };
      return entities[character];
    })}</li>`)
    .join("")}</ol>`;
}

export function htmlToPackageRuleLines(html = "") {
  const blockSeparatedText = String(html)
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return blockSeparatedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
