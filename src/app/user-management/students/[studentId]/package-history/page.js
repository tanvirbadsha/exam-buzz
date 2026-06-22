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
import { StudentNotFound } from "@/features/users/student/StudentNotFound";
import { usePackageHistoryManagement } from "@/hooks/usePackageHistoryManagement";
import { useStudentManagement } from "@/hooks/useStudentManagement";
import {
  PAYMENT_METHOD_OPTIONS,
  formatPaymentDate,
} from "@/lib/packageHistoryData";
import { formatStudentCurrency } from "@/lib/studentData";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";

function buildPackageOptions(history) {
  const packages = [...new Set(history.map((item) => item.packageName))].sort();

  return [
    { label: "All packages", value: "all" },
    ...packages.map((packageName) => ({
      label: packageName,
      value: packageName,
    })),
  ];
}

export default function StudentPackageHistoryPage() {
  const { studentId } = useParams();
  const { getStudentById, isLoaded: isStudentLoaded } = useStudentManagement();
  const {
    deletePackageHistory,
    history,
    isLoaded: isHistoryLoaded,
  } = usePackageHistoryManagement(studentId);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const student = getStudentById(studentId);
  const isLoaded = isStudentLoaded && isHistoryLoaded;

  const packageOptions = useMemo(() => buildPackageOptions(history), [history]);

  const filteredHistory = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return history.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.packageName,
          item.paymentMethod,
          item.paymentMethodIdentity,
          item.paymentDate,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesPackage =
        packageFilter === "all" || item.packageName === packageFilter;
      const matchesMethod =
        paymentMethodFilter === "all" ||
        item.paymentMethod === paymentMethodFilter;

      return matchesSearch && matchesPackage && matchesMethod;
    });
  }, [deferredSearchQuery, history, packageFilter, paymentMethodFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setPackageFilter("all");
    setPaymentMethodFilter("all");
  };

  const handleDelete = (historyItem) => {
    const confirmed = window.confirm(
      `Delete ${historyItem.packageName} payment history?`,
    );
    if (!confirmed) return;

    const deleted = deletePackageHistory(historyItem.id);
    if (deleted) {
      toast.success("Package history deleted.");
      return;
    }

    toast.error("Package history could not be deleted.");
  };

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="surface-card h-64 animate-pulse" />
      </div>
    );
  }

  if (!student) return <StudentNotFound />;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <Link
          href={`/user-management/students/${student.id}/view`}
          className="back-link"
        >
          <ArrowLeft size={14} />
          Back to student
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Package history
        </h1>
      </div>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {student.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-muted">
                {student.userId} / {student.registrationId}
              </p>
            </div>
            <p className="text-sm text-muted">
              {filteredHistory.length} of {history.length} payments shown
            </p>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_15rem_13rem_auto] xl:items-end">
            <CustomSearch
              placeholder="Search package, method, identity, or date..."
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              ariaLabel="Search package history"
              wide
            />
            <CustomDropdown
              label="Package"
              options={packageOptions}
              value={packageFilter}
              onChange={(option) => setPackageFilter(option.value)}
              placeholder="All packages"
            />
            <CustomDropdown
              label="Payment method"
              options={PAYMENT_METHOD_OPTIONS}
              value={paymentMethodFilter}
              onChange={(option) => setPaymentMethodFilter(option.value)}
              placeholder="All methods"
            />
            <button
              type="button"
              className="button button-secondary min-h-10 xl:self-end"
              onClick={resetFilters}
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
                <TableTh>Package Name</TableTh>
                <TableTh className="text-right">Amount</TableTh>
                <TableTh>Payment Method</TableTh>
                <TableTh>Payment Method Identity</TableTh>
                <TableTh>Payment Date</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((historyItem) => (
                  <TableRow key={historyItem.id}>
                    <TableTd className="min-w-44 font-semibold text-foreground">
                      {historyItem.packageName}
                    </TableTd>
                    <TableTd className="whitespace-nowrap text-right font-semibold text-foreground">
                      {formatStudentCurrency(historyItem.amount)}
                    </TableTd>
                    <TableTd>{historyItem.paymentMethod}</TableTd>
                    <TableTd className="whitespace-nowrap font-mono text-xs text-muted">
                      {historyItem.paymentMethodIdentity}
                    </TableTd>
                    <TableTd className="whitespace-nowrap">
                      {formatPaymentDate(historyItem.paymentDate)}
                    </TableTd>
                    <TableTd>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="icon-button h-9 w-9 border border-border text-danger hover:bg-rose-50 hover:text-danger"
                          aria-label={`Delete ${historyItem.packageName} history`}
                          onClick={() => handleDelete(historyItem)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={6} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No package history found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search or filters.
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
