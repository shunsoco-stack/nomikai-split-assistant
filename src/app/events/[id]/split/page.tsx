import { EventScreen } from "@/components/event-screen";

export function generateStaticParams() {
  return [{ id: "local" }];
}

export default function SplitPage() {
  return <EventScreen />;
}
