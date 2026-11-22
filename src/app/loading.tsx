import { Splash } from "@/components/splash";

/** Affiché par Next.js pendant le chargement d'une page. */
export default function Loading() {
  return <Splash fullScreen={false} />;
}
