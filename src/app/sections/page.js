import { SectionManager } from "@/features/sections/SectionManager";
import { DEFAULT_EXAMS } from "@/lib/examData";
import { DEFAULT_SECTIONS_RESPONSE } from "@/lib/sectionData";

async function getSectionsPageData() {
  // Replace these mocks with the sections and exams API calls when endpoints are ready.
  return {
    exams: DEFAULT_EXAMS,
    sections: DEFAULT_SECTIONS_RESPONSE.sections,
  };
}

export default async function SectionsPage() {
  const { exams, sections } = await getSectionsPageData();

  return <SectionManager initialExams={exams} initialSections={sections} />;
}
