import { NoticeBoardManager } from "@/features/notice-board/NoticeBoardManager";
import { DEFAULT_NOTICE_BOARD } from "@/lib/noticeBoardData";

async function getNotices() {
  // Replace this mock with the notice-board API call when the endpoint is ready.
  return DEFAULT_NOTICE_BOARD;
}

export default async function NoticeBoardPage() {
  const notices = await getNotices();

  return <NoticeBoardManager initialNotices={notices} />;
}
