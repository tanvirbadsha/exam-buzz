import { FolderManager } from "@/features/folders/FolderManager";
import { DEFAULT_FOLDERS } from "@/lib/folderData";

export default async function FoldersPage() {
  return <FolderManager initialFolders={DEFAULT_FOLDERS} />;
}
