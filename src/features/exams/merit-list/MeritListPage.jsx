"use client";

import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { mockMeritStudents } from "@/features/exams/merit-list/mockMeritData";
import {
  ArrowLeft,
  Download,
  FileText,
  Image as ImageIcon,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

function FilePill({ fileName, checked = false }) {
  const isPdf = /\.pdf$/i.test(fileName);

  return (
    <button
      type="button"
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-[11px] font-bold transition-colors ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-surface-muted text-foreground hover:border-brand"
      }`}
      onClick={() => toast("Preview will be connected when the API is ready.")}
    >
      {isPdf ? <FileText size={13} /> : <ImageIcon size={13} />}
      <span className="truncate">{fileName}</span>
    </button>
  );
}

function FileList({ emptyText, files, checked = false }) {
  if (!files.length) {
    return <span className="text-xs font-semibold text-muted">{emptyText}</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {files.map((fileName) => (
        <FilePill key={fileName} fileName={fileName} checked={checked} />
      ))}
    </div>
  );
}

export function MeritListPage({ examId }) {
  const totalStudents = mockMeritStudents.length;
  const publishedMarks = mockMeritStudents.filter(
    (student) => student.marksPublished,
  ).length;
  const evaluatedPapers = mockMeritStudents.filter(
    (student) => student.teacherUploads.length > 0,
  ).length;
  const submissionFiles = mockMeritStudents.reduce(
    (total, student) => total + student.submissions.length,
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-8xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link href="/exams/written-exams" className="back-link">
          <ArrowLeft size={16} />
          Back to exams
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-strong">
              Mock merit workspace
            </p>
            <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
              Merit list
            </h1>
            <p className="mt-1 text-sm text-muted">Exam ID: {examId}</p>
          </div>
          <button
            type="button"
            className="button button-primary w-full sm:w-auto"
            onClick={() =>
              toast("Download zip will be connected when the API is ready.")
            }
          >
            <Download size={16} />
            Download zip
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students attended" value={totalStudents} />
        <StatCard label="Marks published" value={publishedMarks} />
        <StatCard label="Submission files" value={submissionFiles} />
        <StatCard label="Teacher uploads" value={evaluatedPapers} />
      </section>

      <TableContainer>
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Trophy size={18} className="text-brand-strong" />
          <h2 className="text-base font-semibold text-foreground">
            Student merit list
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHead>
              <tr>
                <TableTh>Student</TableTh>
                <TableTh>Marks</TableTh>
                <TableTh>Student submission</TableTh>
                <TableTh>Teacher upload</TableTh>
                <TableTh>Assigned teacher</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {mockMeritStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableTd>
                    <div>
                      <p className="font-semibold text-foreground">
                        {student.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {student.roll}
                      </p>
                    </div>
                  </TableTd>
                  <TableTd>
                    {student.marksPublished ? (
                      <span className="rounded-md bg-brand-soft px-2 py-1 text-sm font-black text-brand-strong">
                        {student.marks}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-muted">
                        Not published
                      </span>
                    )}
                  </TableTd>
                  <TableTd>
                    <FileList
                      files={student.submissions}
                      emptyText="No submission"
                    />
                  </TableTd>
                  <TableTd>
                    <FileList
                      files={student.teacherUploads}
                      emptyText="No teacher upload"
                      checked
                    />
                  </TableTd>
                  <TableTd className="font-semibold text-foreground">
                    {student.teacher}
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
    </div>
  );
}
