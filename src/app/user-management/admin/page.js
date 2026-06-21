"use client";

import { Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminActionMenu } from "@/components/admin/AdminActionMenu";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { CreateAdminModal } from "@/components/admin/CreateAdminModal";
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
import { useAdminManagement } from "@/hooks/useAdminManagement";
import { getRoleLabel } from "@/lib/adminData";

export default function AdminManagementPage() {
  const { admins, createAdmin, deleteAdmin } = useAdminManagement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredAdmins = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    if (!query) return admins;

    return admins.filter((admin) =>
      [admin.name, admin.phone, admin.email, admin.address, getRoleLabel(admin.role)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [admins, deferredSearchQuery]);

  const subAdminCount = admins.filter(
    (admin) => admin.role === "sub_admin",
  ).length;

  const handleCreate = (adminInput) => {
    const createdAdmin = createAdmin(adminInput);
    toast.success(`${createdAdmin.name} created.`);
  };

  const handleDelete = (admin) => {
    const confirmed = window.confirm(`Delete ${admin.name}?`);
    if (!confirmed) return;

    const deleted = deleteAdmin(admin.id);
    if (deleted) {
      toast.success(`${admin.name} deleted.`);
      return;
    }

    toast.error("The super admin account cannot be deleted.");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            User management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Admin accounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Create sub-admins, review account details, and control which admin
            panel menus each account can access.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={16} />
          Create admin
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="surface-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Super admin</p>
              <p className="mt-2 text-3xl font-bold text-foreground">1</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white">
              <ShieldCheck size={21} />
            </div>
          </div>
        </article>

        <article className="surface-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Sub admins</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {subAdminCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-accent text-sidebar">
              <UsersRound size={21} />
            </div>
          </div>
        </article>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Admin list
            </h2>
            <p className="text-sm text-muted">
              {filteredAdmins.length} of {admins.length} accounts shown
            </p>
          </div>
          <CustomSearch
            placeholder="Search admins..."
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            ariaLabel="Search admins"
          />
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Name</TableTh>
                <TableTh>Phone</TableTh>
                <TableTh>Email</TableTh>
                <TableTh>Address</TableTh>
                <TableTh>Image</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin, index) => (
                  <TableRow key={admin.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="min-w-44">
                        <p className="font-semibold text-foreground">
                          {admin.name}
                        </p>
                        <p className="mt-1 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-strong">
                          {getRoleLabel(admin.role)}
                        </p>
                      </div>
                    </TableTd>
                    <TableTd className="whitespace-nowrap">{admin.phone}</TableTd>
                    <TableTd>{admin.email}</TableTd>
                    <TableTd className="min-w-48">{admin.address}</TableTd>
                    <TableTd>
                      <AdminAvatar admin={admin} />
                    </TableTd>
                    <TableTd>
                      <AdminActionMenu admin={admin} onDelete={handleDelete} />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={7} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No admins found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search query or create a new admin.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <CreateAdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
