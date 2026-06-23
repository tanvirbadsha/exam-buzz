"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  RotateCcw,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { usePackageAssignmentManagement } from "@/hooks/usePackageAssignmentManagement";
import { usePackageInfoManagement } from "@/hooks/usePackageInfoManagement";
import {
  formatAssignmentAmount,
  getPaymentMethodLabel,
} from "@/lib/packageAssignmentData";

const DATE_FILTER_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Custom range", value: "custom" },
  { label: "Day", value: "day" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

const chartColors = ["#262262", "#64c5b1", "#f59e0b", "#e11d48", "#0ea5e9"];

const defaultFilters = {
  packageId: "all",
  dateMode: "all",
  fromDate: "",
  toDate: "",
  day: "",
  month: "",
  year: String(new Date().getFullYear()),
};

function getDateInputBounds(filters) {
  if (filters.dateMode === "custom") {
    return {
      start: filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null,
      end: filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null,
    };
  }

  if (filters.dateMode === "day" && filters.day) {
    return {
      start: new Date(`${filters.day}T00:00:00`),
      end: new Date(`${filters.day}T23:59:59.999`),
    };
  }

  if (filters.dateMode === "month" && filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  if (filters.dateMode === "year" && filters.year) {
    const year = Number(filters.year);
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  return { start: null, end: null };
}

function formatChartAmount(value) {
  return `${Number(value || 0).toLocaleString("en-BD")} BDT`;
}

function getDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-CA");
}

function buildPackageOptions(packages, assignments) {
  const optionMap = new Map(
    packages.map((packageInfo) => [
      packageInfo.id,
      {
        label: packageInfo.title,
        value: packageInfo.id,
        searchText: `${packageInfo.title} ${packageInfo.packageType}`,
      },
    ]),
  );

  assignments.forEach((assignment) => {
    if (!assignment.packageId || optionMap.has(assignment.packageId)) return;

    optionMap.set(assignment.packageId, {
      label: assignment.packageTitle || "Unknown package",
      value: assignment.packageId,
      searchText: assignment.packageTitle || "Unknown package",
    });
  });

  return [{ label: "Overall report", value: "all" }, ...optionMap.values()];
}

function SummaryMetric({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-xl font-black text-foreground">{value}</p>
      {helper && <p className="mt-1 text-xs text-muted">{helper}</p>}
    </div>
  );
}

export function PackageReportDashboard({ initialPackages }) {
  const { assignments } = usePackageAssignmentManagement();
  const { packages } = usePackageInfoManagement(initialPackages);
  const [filters, setFilters] = useState(defaultFilters);

  const packageOptions = useMemo(
    () => buildPackageOptions(packages, assignments),
    [assignments, packages],
  );

  const filteredAssignments = useMemo(() => {
    const { start, end } = getDateInputBounds(filters);

    return [...assignments]
      .filter((assignment) => {
        const matchesPackage =
          filters.packageId === "all" || assignment.packageId === filters.packageId;
        const assignedAt = new Date(assignment.assignedAt);
        const matchesStart =
          !start ||
          (!Number.isNaN(assignedAt.getTime()) && assignedAt >= start);
        const matchesEnd =
          !end || (!Number.isNaN(assignedAt.getTime()) && assignedAt <= end);

        return matchesPackage && matchesStart && matchesEnd;
      })
      .sort((first, second) => {
        const firstDate = new Date(first.assignedAt).getTime();
        const secondDate = new Date(second.assignedAt).getTime();
        return secondDate - firstDate;
      });
  }, [assignments, filters]);

  const reportSummary = useMemo(() => {
    const totalAmount = filteredAssignments.reduce(
      (total, assignment) => total + Number(assignment.amount || 0),
      0,
    );

    return {
      totalAmount,
      totalAssignments: filteredAssignments.length,
      averageAmount:
        filteredAssignments.length > 0
          ? Math.round(totalAmount / filteredAssignments.length)
          : 0,
      packageCount: new Set(
        filteredAssignments.map((assignment) => assignment.packageId),
      ).size,
    };
  }, [filteredAssignments]);

  const packageChartData = useMemo(() => {
    const packageMap = new Map();

    filteredAssignments.forEach((assignment) => {
      const key = assignment.packageId || "unknown";
      const currentValue = packageMap.get(key) || {
        name: assignment.packageTitle || "Unknown package",
        assignments: 0,
        revenue: 0,
      };

      currentValue.assignments += 1;
      currentValue.revenue += Number(assignment.amount || 0);
      packageMap.set(key, currentValue);
    });

    return Array.from(packageMap.values()).sort(
      (first, second) => second.revenue - first.revenue,
    );
  }, [filteredAssignments]);

  const paymentChartData = useMemo(() => {
    const paymentMap = new Map();

    filteredAssignments.forEach((assignment) => {
      const label = getPaymentMethodLabel(assignment.paymentMethod);
      const currentValue = paymentMap.get(label) || {
        name: label,
        value: 0,
        revenue: 0,
      };

      currentValue.value += 1;
      currentValue.revenue += Number(assignment.amount || 0);
      paymentMap.set(label, currentValue);
    });

    return Array.from(paymentMap.values());
  }, [filteredAssignments]);

  const dailyChartData = useMemo(() => {
    const dailyMap = new Map();

    filteredAssignments.forEach((assignment) => {
      const key = getDateKey(assignment.assignedAt);
      const currentValue = dailyMap.get(key) || {
        date: key,
        assignments: 0,
        revenue: 0,
      };

      currentValue.assignments += 1;
      currentValue.revenue += Number(assignment.amount || 0);
      dailyMap.set(key, currentValue);
    });

    return Array.from(dailyMap.values()).sort((first, second) =>
      first.date.localeCompare(second.date),
    );
  }, [filteredAssignments]);

  const updateFilter = (field, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [field]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section>
        <p className="text-sm font-semibold text-brand-strong">
          Package Management
        </p>
        <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
          Package report
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Review package assignment revenue, payment methods and student
          purchases across all packages or a selected package.
        </p>
      </section>

      <section className="surface-card p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1.1fr)_12rem_1fr_auto] xl:items-end">
          <CustomDropdown
            label="Package"
            icon={PackageCheck}
            options={packageOptions}
            value={filters.packageId}
            onChange={(option) => updateFilter("packageId", option.value)}
            placeholder="Overall report"
            searchPlaceholder="Search packages..."
          />

          <CustomDropdown
            label="Date filter"
            icon={CalendarDays}
            options={DATE_FILTER_OPTIONS}
            value={filters.dateMode}
            onChange={(option) => updateFilter("dateMode", option.value)}
            placeholder="All time"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {filters.dateMode === "custom" && (
              <>
                <label className="field-group">
                  <span className="field-label">From date</span>
                  <span className="field-shell px-3">
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(event) =>
                        updateFilter("fromDate", event.target.value)
                      }
                      className="field-input"
                    />
                  </span>
                </label>
                <label className="field-group">
                  <span className="field-label">To date</span>
                  <span className="field-shell px-3">
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(event) =>
                        updateFilter("toDate", event.target.value)
                      }
                      className="field-input"
                    />
                  </span>
                </label>
              </>
            )}

            {filters.dateMode === "day" && (
              <label className="field-group sm:col-span-2">
                <span className="field-label">Day</span>
                <span className="field-shell px-3">
                  <input
                    type="date"
                    value={filters.day}
                    onChange={(event) => updateFilter("day", event.target.value)}
                    className="field-input"
                  />
                </span>
              </label>
            )}

            {filters.dateMode === "month" && (
              <label className="field-group sm:col-span-2">
                <span className="field-label">Month</span>
                <span className="field-shell px-3">
                  <input
                    type="month"
                    value={filters.month}
                    onChange={(event) =>
                      updateFilter("month", event.target.value)
                    }
                    className="field-input"
                  />
                </span>
              </label>
            )}

            {filters.dateMode === "year" && (
              <label className="field-group sm:col-span-2">
                <span className="field-label">Year</span>
                <span className="field-shell px-3">
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={filters.year}
                    onChange={(event) =>
                      updateFilter("year", event.target.value)
                    }
                    className="field-input"
                  />
                </span>
              </label>
            )}
          </div>

          <button
            type="button"
            className="button button-secondary min-h-11"
            onClick={resetFilters}
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          icon={CircleDollarSign}
          label="Revenue"
          value={formatAssignmentAmount(reportSummary.totalAmount)}
        />
        <SummaryMetric
          icon={Users}
          label="Assignments"
          value={reportSummary.totalAssignments.toLocaleString("en-BD")}
        />
        <SummaryMetric
          icon={CircleDollarSign}
          label="Average"
          value={formatAssignmentAmount(reportSummary.averageAmount)}
        />
        <SummaryMetric
          icon={PackageCheck}
          label="Packages"
          value={reportSummary.packageCount.toLocaleString("en-BD")}
          helper={filters.packageId === "all" ? "Included in current report" : "Selected package"}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card p-5">
          <h2 className="text-base font-bold text-foreground">
            Revenue by package
          </h2>
          <div className="mt-4 h-80">
            {packageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatChartAmount(value)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#262262" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
                No package revenue found for this filter.
              </div>
            )}
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-base font-bold text-foreground">
            Payment methods
          </h2>
          <div className="mt-4 h-80">
            {paymentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={96}
                    paddingAngle={3}
                  >
                    {paymentChartData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, item) => [
                      `${value} assignments · ${formatChartAmount(item.payload.revenue)}`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
                No payment data found for this filter.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-base font-bold text-foreground">Daily trend</h2>
        <div className="mt-4 h-80">
          {dailyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatChartAmount(value)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#64c5b1"
                  fill="#e8f7f4"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
              No daily trend found for this filter.
            </div>
          )}
        </div>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">
            Assignment records
          </h2>
        </div>
        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Student</TableTh>
                <TableTh>Package</TableTh>
                <TableTh>Payment</TableTh>
                <TableTh>Transaction</TableTh>
                <TableTh className="text-right">Amount</TableTh>
                <TableTh>Date</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableTd>
                      <p className="font-semibold text-foreground">
                        {assignment.studentName || assignment.registrationId}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {assignment.phoneNumber || "No phone"} ·{" "}
                        {assignment.registrationId}
                      </p>
                    </TableTd>
                    <TableTd className="font-semibold text-foreground">
                      {assignment.packageTitle}
                    </TableTd>
                    <TableTd>{getPaymentMethodLabel(assignment.paymentMethod)}</TableTd>
                    <TableTd>{assignment.transactionId || "Not set"}</TableTd>
                    <TableTd className="text-right font-black text-brand-strong">
                      {formatAssignmentAmount(assignment.amount)}
                    </TableTd>
                    <TableTd>
                      {assignment.assignedAt
                        ? new Date(assignment.assignedAt).toLocaleString()
                        : "Not set"}
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={6} className="py-12 text-center">
                    <p className="font-bold text-foreground">
                      No assignments found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Change the package or date filter to widen the report.
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
