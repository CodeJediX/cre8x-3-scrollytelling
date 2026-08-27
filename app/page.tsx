import { PublicExperience } from "@/components/public-experience";
import { getPublicContent } from "@/lib/content";

export default async function HomePage() {
  const content = await getPublicContent();
  return <PublicExperience content={content} />;
}
