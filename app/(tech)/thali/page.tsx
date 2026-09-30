import { ThaliSheet } from "@/components/ThaliSheet";

export default async function ThaliPage({
  searchParams,
}: {
  searchParams: Promise<{ share?: string; pattern?: string }>;
}) {
  const sp = await searchParams;
  return (
    <ThaliSheet
      initialShare={sp.share ?? null}
      initialPattern={sp.pattern ?? null}
    />
  );
}
