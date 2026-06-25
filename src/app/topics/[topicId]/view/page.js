"use client";

import { useGetAllSubjectQuery } from "@/features/subjects/api/subjectsApi";
import { useGetTopicByIdQuery } from "@/features/topics/api/topicsApi";
import { useUpdateTopicMutation } from "@/features/topics/api/topicsApi";
import { TopicModal } from "@/features/topics/TopicModal";
import { buildSubjectOptions } from "@/features/topics/topicUtils";
import { ArrowLeft, BookMarked, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const SUBJECT_OPTIONS_LIMIT = 1000;

function formatDate(value) {
  if (!value) return "Not updated";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function TopicNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Link href="/topics" className="back-link">
        <ArrowLeft size={14} />
        Back to topics
      </Link>
      <section className="surface-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-surface-muted text-muted">
          <BookMarked size={22} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          Topic not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          The topic may have been deleted or the link is no longer valid.
        </p>
      </section>
    </div>
  );
}

export default function ViewTopicPage() {
  const { topicId } = useParams();
  const { data, error, isLoading, refetch } = useGetTopicByIdQuery(topicId);
  const { data: subjectsData, isFetching: isFetchingSubjects } =
    useGetAllSubjectQuery({
      page: 1,
      limit: SUBJECT_OPTIONS_LIMIT,
    });
  const [updateTopic, { isLoading: isUpdating }] = useUpdateTopicMutation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const topic = data?.topic;
  const subjectOptions = useMemo(
    () => buildSubjectOptions([...(subjectsData?.subjects || []), topic?.subject]),
    [subjectsData, topic],
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="surface-card h-72 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <Link href="/topics" className="back-link">
          <ArrowLeft size={14} />
          Back to topics
        </Link>
        <section className="surface-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-danger">
            <BookMarked size={22} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Topic could not be loaded
          </h1>
          <p className="mt-2 text-sm text-muted">
            Try loading the topic details again.
          </p>
          <button
            type="button"
            className="button button-secondary mt-5"
            onClick={refetch}
          >
            Retry
          </button>
        </section>
      </div>
    );
  }

  if (!topic) return <TopicNotFound />;

  const statusLabel = topic.status ? "Active" : "Inactive";

  const handleTopicSubmit = async (topicInput) => {
    try {
      const updatedTopic = await updateTopic({
        id: topic.id,
        subjectID: topicInput.subjectID,
        name: topicInput.name,
      }).unwrap();
      toast.success(`${updatedTopic?.topic?.name || topicInput.name} updated.`);
      setIsEditModalOpen(false);
    } catch {
      toast.error("Topic could not be updated.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/topics" className="back-link">
            <ArrowLeft size={14} />
            Back to topics
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Topic details
          </h1>
          <p className="mt-2 text-sm text-muted">
            View the selected topic and its assigned subject.
          </p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={() => setIsEditModalOpen(true)}
          disabled={isFetchingSubjects || subjectOptions.length === 0}
        >
          <Pencil size={16} />
          Edit topic
        </button>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <BookMarked size={22} />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground">
                  {topic.name}
                </h2>
                <p className="mt-1 font-mono text-xs text-muted">
                  ID: {topic.id}
                </p>
              </div>
            </div>
            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                topic.status
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="p-5">
          <dl>
            <DetailRow label="Name" value={topic.name} />
            <DetailRow
              label="Subject"
              value={topic.subject?.name || "Unknown subject"}
            />
            <DetailRow label="Status" value={statusLabel} />
            <DetailRow label="Created" value={formatDate(topic.createdAt)} />
            <DetailRow label="Updated" value={formatDate(topic.updatedAt)} />
          </dl>
        </div>
      </section>

      <TopicModal
        isOpen={isEditModalOpen}
        mode="edit"
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleTopicSubmit}
        isSubmitting={isUpdating}
        subjectOptions={subjectOptions}
        topic={topic}
      />
    </div>
  );
}
