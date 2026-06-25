export const SECTION_STORAGE_KEY = "exam-buzz-sections";

export const ALL_SECTIONS_EXAM_VALUE = "__all_section_exams__";

export const DEFAULT_SECTIONS_RESPONSE = {
  status: 200,
  message: "Sections retrieved successfully",
  sections: [
    {
      id: 2,
      examID: 2,
      name: "Paper Section A",
      maxPapers: 3,
      createdAt: "2026-06-25T10:25:19.000Z",
      updatedAt: "2026-06-25T10:25:19.000Z",
      exam: {
        id: 2,
        name: "BCS Preliminary Model Test 01",
        categoryID: 17,
        durationIntMinutes: 60,
        passMark: 40,
        publishedDate: "24-06-2026",
        publishedTime: "10:30",
        expiredDate: "30-06-2026",
        expiredTime: "23:59",
        status: true,
      },
    },
  ],
};

export function createSectionId(sections) {
  const highestNumericId = sections.reduce(
    (maxId, section) => Math.max(maxId, Number(section.id) || 0),
    0,
  );

  return highestNumericId + 1;
}

export function getSectionExamId(section) {
  return section?.examID ?? section?.examId ?? "";
}

export function getSectionStatus(section) {
  return typeof section?.status === "boolean" ? section.status : true;
}

export function formatSectionDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
