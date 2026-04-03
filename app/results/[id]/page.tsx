import { getWorkflowPage } from "@/lib/notion";
import { notFound } from "next/navigation";
import ResultsClient from "./ResultsClient";

export default async function ResultsPage({ params }: { params: { id: string } }) {
  let record;
  try {
    record = await getWorkflowPage(params.id);
  } catch {
    notFound();
  }
  return <ResultsClient record={record} />;
}
