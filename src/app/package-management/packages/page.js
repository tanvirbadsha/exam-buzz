import { PackageInfoManager } from "@/features/package-info/PackageInfoManager";
import { DEFAULT_PACKAGE_INFO } from "@/lib/packageInfoData";

async function getPackageInfo() {
  // Replace this mock with the package-info API call when the endpoint is ready.
  return DEFAULT_PACKAGE_INFO;
}

export default async function PackageInfoPage() {
  const packages = await getPackageInfo();

  return <PackageInfoManager initialPackages={packages} />;
}

