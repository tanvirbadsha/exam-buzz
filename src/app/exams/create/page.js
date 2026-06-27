import { redirect } from "next/navigation";

export default function CreateExamRedirectPage() {
  redirect("/exams/create-written-exam");
}
