"use client";

import CustomSearch from "@/components/ui/CustomSearch";
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
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import {
  STUDENT_REQUEST_STATUS_FILTERS,
  STUDENT_REQUEST_STATUSES,
  studentRequestData,
  studentRequestStatusMeta,
} from "@/lib/studentRequestData";
import {
  CheckCircle2,
  Clock3,
  Inbox,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";

const STAT_CARDS = [
  {
    label: "Total requests",
    status: "all",
    icon: Inbox,
    tone: "bg-brand text-white",
  },
  {
    label: "Pending",
    status: "pending",
    icon: Clock3,
    tone: "bg-amber-500 text-white",
  },
  {
    label: "Resolved",
    status: "resolved",
    icon: CheckCircle2,
    tone: "bg-emerald-600 text-white",
  },
  {
    label: "Rejected",
    status: "rejected",
    icon: XCircle,
    tone: "bg-rose-600 text-white",
  },
];

function StatusBadge({ status }) {
  const meta = studentRequestStatusMeta[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export default function StudentRequestPage() {
  const [requests, setRequests] = useState(studentRequestData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityStatus, setPriorityStatus] = useState("pending");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const statusCounts = useMemo(() => {
    return requests.reduce(
      (counts, request) => {
        counts.total += 1;
        counts[request.status] += 1;
        return counts;
      },
      { total: 0, pending: 0, resolved: 0, rejected: 0 },
    );
  }, [requests]);

  const visibleRequests = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    const filteredRequests = requests.filter((request) => {
      const matchesSearch =
        !query ||
        [request.studentName, request.studentId].join(" ").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filteredRequests].sort((a, b) => {
      if (priorityStatus !== "all" && a.status !== b.status) {
        if (a.status === priorityStatus) return -1;
        if (b.status === priorityStatus) return 1;
      }

      return a.studentName.localeCompare(b.studentName);
    });
  }, [deferredSearchQuery, priorityStatus, requests, statusFilter]);

  const handleStatusChange = (requestId, nextStatus) => {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? { ...request, status: nextStatus }
          : request,
      ),
    );

    const statusLabel = studentRequestStatusMeta[nextStatus].label.toLowerCase();
    toast.success(`Request marked ${statusLabel}.`);
  };

  const handleStatClick = (status) => {
    setPriorityStatus(status);
    setStatusFilter("all");
  };

  const resetView = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityStatus("pending");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Student support
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Student Request
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review custom student requests, update status, and keep pending work
            visible for follow-up.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          const value =
            stat.status === "all"
              ? statusCounts.total
              : statusCounts[stat.status];
          const isActive = priorityStatus === stat.status;

          return (
            <button
              type="button"
              key={stat.label}
              onClick={() => handleStatClick(stat.status)}
              className={`surface-card p-5 text-left transition hover:border-brand/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                isActive ? "border-brand ring-2 ring-brand-soft" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Request list
              </h2>
              <p className="text-sm text-muted">
                {visibleRequests.length} of {requests.length} requests shown
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_14rem_auto] lg:items-end">
            <CustomSearch
              placeholder="Search by student name or ID..."
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              ariaLabel="Search student requests"
              wide
            />
            <CustomDropdown
              label="Status"
              options={STUDENT_REQUEST_STATUS_FILTERS}
              value={statusFilter}
              onChange={(option) => setStatusFilter(option.value)}
              placeholder="All statuses"
            />
            <button
              type="button"
              className="button button-secondary min-h-10 lg:self-end"
              onClick={resetView}
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Student Name &amp; ID</TableTh>
                <TableTh>Request</TableTh>
                <TableTh>Status</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {visibleRequests.length > 0 ? (
                visibleRequests.map((request, index) => (
                  <TableRow key={request.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </TableTd>
                    <TableTd className="min-w-56">
                      <p className="font-semibold text-foreground">
                        {request.studentName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {request.studentId}
                      </p>
                    </TableTd>
                    <TableTd className="min-w-96 max-w-3xl leading-6">
                      {request.request}
                    </TableTd>
                    <TableTd className="min-w-48">
                      <div className="flex flex-col gap-2">
                        <StatusBadge status={request.status} />
                        <select
                          aria-label={`Update ${request.studentName} request status`}
                          value={request.status}
                          onChange={(event) =>
                            handleStatusChange(request.id, event.target.value)
                          }
                          className="field-shell min-h-9 max-w-36 rounded-md px-2 text-xs font-semibold"
                        >
                          {STUDENT_REQUEST_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={4} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No requests found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search or status filter.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>
    </div>
  );
}
