import { PublicExperienceV2 } from "@/components/public-experience-v2";
import { getPublicContent } from "@/lib/content";

export default async function HomePage() {
  const content = await getPublicContent();
  return <PublicExperienceV2 content={content} />;
}
