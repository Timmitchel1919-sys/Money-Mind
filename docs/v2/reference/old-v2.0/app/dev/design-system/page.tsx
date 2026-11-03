import { notFound } from "next/navigation";
import { DesignSystemPreview } from "@/components/dev/DesignSystemPreview";

export const dynamic = "force-dynamic";

export default function DesignSystemPage(){
  if(process.env.NODE_ENV!=="development") notFound();
  return <DesignSystemPreview/>;
}
