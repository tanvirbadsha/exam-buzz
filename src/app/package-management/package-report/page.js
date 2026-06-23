import { PackageReportDashboard } from "@/features/package-management/PackageReportDashboard";
import { DEFAULT_PACKAGE_INFO } from "@/lib/packageInfoData";

async function getPackageReportPackages() {
  // Replace this mock with the package-report API when the endpoint is ready.
  return DEFAULT_PACKAGE_INFO;
}

export default async function PackageReportPage() {
  const packages = await getPackageReportPackages();

  return <PackageReportDashboard initialPackages={packages} />;
}
