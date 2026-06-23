import { PackagePermissionsManager } from "@/features/package-info/PackagePermissionsManager";
import { DEFAULT_PACKAGE_INFO } from "@/lib/packageInfoData";

async function getPackageInfo() {
  // Replace this mock with the package-info API call when the endpoint is ready.
  return DEFAULT_PACKAGE_INFO;
}

export default async function PackagePermissionsPage({ params }) {
  const packages = await getPackageInfo();
  const { packageId } = await params;

  return (
    <PackagePermissionsManager
      initialPackages={packages}
      packageId={packageId}
    />
  );
}
