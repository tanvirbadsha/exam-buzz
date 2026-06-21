"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { StudentForm } from "@/components/student/StudentForm";
import { StudentNotFound } from "@/components/student/StudentNotFound";
import { useStudentManagement } from "@/hooks/useStudentManagement";

export default function EditStudentPage() {
  const { studentId } = useParams();
  const router = useRouter();
  const { getStudentById, isLoaded, updateStudent } = useStudentManagement();
  const student = getStudentById(studentId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="surface-card h-96 animate-pulse" />
      </div>
    );
  }

  if (!student) return <StudentNotFound />;

  const handleSubmit = (studentInput) => {
    const updatedStudent = updateStudent(student.id, studentInput);
    toast.success(`${updatedStudent.name} updated.`);
    router.push(`/user-management/students/${student.id}/view`);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href="/user-management/students" className="back-link">
          <ArrowLeft size={14} />
          Back to students
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Edit student
        </h1>
        <p className="mt-2 text-sm text-muted">
          Update account details for {student.name}.
        </p>
      </div>

      <section className="surface-card p-5">
        <StudentForm
          student={student}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          secondaryAction={
            <Link
              href={`/user-management/students/${student.id}/view`}
              className="button button-secondary"
            >
              Cancel
            </Link>
          }
        />
      </section>
    </div>
  );
}
