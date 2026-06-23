import { AssignPackageForm } from "@/features/package-management/AssignPackageForm";
import { DEFAULT_PACKAGE_INFO } from "@/lib/packageInfoData";

async function getAssignablePackages() {
  // Replace this mock with the assignable-package API when the endpoint is ready.
  return DEFAULT_PACKAGE_INFO;
}

export default async function AssignPackagePage() {
  const packages = await getAssignablePackages();

  return <AssignPackageForm initialPackages={packages} />;
}
