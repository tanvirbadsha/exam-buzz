"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TeacherForm } from "@/components/teacher/TeacherForm";
import { TeacherNotFound } from "@/components/teacher/TeacherNotFound";
import { useTeacherManagement } from "@/hooks/useTeacherManagement";

export default function EditTeacherPage() {
  const { teacherId } = useParams();
  const router = useRouter();
  const { getTeacherById, isLoaded, updateTeacher } = useTeacherManagement();
  const teacher = getTeacherById(teacherId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="surface-card h-96 animate-pulse" />
      </div>
    );
  }

  if (!teacher) return <TeacherNotFound />;

  const handleSubmit = (teacherInput) => {
    const updatedTeacher = updateTeacher(teacher.id, teacherInput);
    toast.success(`${updatedTeacher.fullName} updated.`);
    router.push(`/user-management/teacher/${teacher.id}/view`);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href="/user-management/teacher" className="back-link">
          <ArrowLeft size={14} />
          Back to teachers
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Edit teacher
        </h1>
        <p className="mt-2 text-sm text-muted">
          Update account details for {teacher.fullName}.
        </p>
      </div>

      <section className="surface-card p-5">
        <TeacherForm
          teacher={teacher}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          secondaryAction={
            <Link
              href={`/user-management/teacher/${teacher.id}/view`}
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
