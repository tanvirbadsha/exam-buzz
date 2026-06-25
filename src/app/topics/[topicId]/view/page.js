"use client";

import { useSubjectManagement } from "@/hooks/useSubjectManagement";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";
import { ArrowLeft, BookMarked } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  const { subjectIndex, topics } = useSubjectManagement(
    DEFAULT_EXAM_SUBJECTS,
    DEFAULT_SUBJECT_TOPICS,
  );
  const topic = topics.find((currentTopic) => currentTopic.id === topicId);

  if (!topic) return <TopicNotFound />;

  const subject = subjectIndex.subjectsById.get(topic.subjectId);
  const statusLabel = topic.status === "active" ? "Active" : "Inactive";
  const responsePreview = {
    id: topic.id,
    subjectID: topic.subjectId,
    name: topic.name,
    status: topic.status === "active",
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    subject: subject
      ? {
          id: subject.id,
          parentID: subject.parentId,
          name: subject.name,
          icon: subject.icon,
          status: subject.status === "active",
        }
      : null,
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
                topic.status === "active"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <dl>
            <DetailRow label="Name" value={topic.name} />
            <DetailRow
              label="Subject"
              value={subject?.name || "Unknown subject"}
            />
            <DetailRow label="Status" value={statusLabel} />
            <DetailRow label="Created" value={formatDate(topic.createdAt)} />
            <DetailRow label="Updated" value={formatDate(topic.updatedAt)} />
          </dl>

          <aside className="rounded-lg border border-border bg-surface-muted p-4">
            <h3 className="text-sm font-bold text-foreground">
              Response preview
            </h3>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-border bg-surface p-3 text-xs leading-5 text-foreground">
              {JSON.stringify(responsePreview, null, 2)}
            </pre>
          </aside>
        </div>
      </section>
    </div>
  );
}
