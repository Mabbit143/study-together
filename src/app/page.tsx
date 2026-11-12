import { Landing } from "@/components/landing/landing";
import { StudyRoom } from "@/components/study/study-room";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";

type HomeProps = {
  searchParams: Promise<{ room?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  if (params.room === OLD_ENGLISH_DEMO.id) {
    return <StudyRoom session={OLD_ENGLISH_DEMO} />;
  }

  return <Landing />;
}
