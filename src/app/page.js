import {
  BookOpenCheck,
  CalendarDays,
  CircleCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableResponsive,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { ApiStatusBadge } from "@/components/ui/ApiStatusBadge";

const stats = [
  {
    label: "Active Exams",
    value: "24",
    icon: BookOpenCheck,
    tone: "bg-brand text-white",
  },
  {
    label: "Students",
    value: "1,284",
    icon: Users,
    tone: "bg-brand-accent text-sidebar",
  },
  {
    label: "Courses",
    value: "42",
    icon: GraduationCap,
    tone: "bg-slate-900 text-white",
  },
  {
    label: "Completed Today",
    value: "318",
    icon: CircleCheck,
    tone: "bg-emerald-600 text-white",
  },
];

const upcomingExams = [
  {
    title: "Physics Model Test",
    course: "HSC Science",
    date: "Jun 24, 2026",
    students: 184,
    status: "Published",
  },
  {
    title: "English Grammar",
    course: "SSC Batch",
    date: "Jun 26, 2026",
    students: 256,
    status: "Draft",
  },
  {
    title: "BCS Preliminary",
    course: "Job Preparation",
    date: "Jun 29, 2026",
    students: 412,
    status: "Scheduled",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
            Exam operations overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage exams, students, courses, and results from one responsive
            admin workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ApiStatusBadge />
          <button type="button" className="button button-primary">
            <CalendarDays size={16} />
            <span>Schedule Exam</span>
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article key={stat.label} className="surface-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <TableContainer>
          <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Upcoming exams
              </h2>
              <p className="text-sm text-muted">Next scheduled assessments</p>
            </div>
          </div>
          <TableResponsive>
            <Table>
              <TableHead>
                <tr>
                  <TableTh>Exam</TableTh>
                  <TableTh>Course</TableTh>
                  <TableTh>Date</TableTh>
                  <TableTh>Students</TableTh>
                  <TableTh>Status</TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {upcomingExams.map((exam) => (
                  <TableRow key={exam.title}>
                    <TableTd className="font-semibold text-foreground">
                      {exam.title}
                    </TableTd>
                    <TableTd>{exam.course}</TableTd>
                    <TableTd>{exam.date}</TableTd>
                    <TableTd>{exam.students}</TableTd>
                    <TableTd>
                      <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong">
                        {exam.status}
                      </span>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableResponsive>
        </TableContainer>

        <aside className="surface-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            Readiness checklist
          </h2>
          <div className="mt-4 space-y-3">
            {[
              "Responsive layout shell",
              "Theme tokens configured",
              "Redux store provider mounted",
              "RTK Query middleware enabled",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                  <CircleCheck size={14} />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
