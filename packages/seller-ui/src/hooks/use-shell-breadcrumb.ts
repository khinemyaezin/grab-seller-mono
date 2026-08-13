import { useEffect } from "react";
import { usePlatform } from "@/context";

export function useShellBreadcrumb(leaf: string | undefined) {
  const platform = usePlatform();

  useEffect(() => {
    if (!leaf) {
      return;
    }

    platform?.events.emit("shell:breadcrumb:v1", { leaf });

    return () => {
      platform?.events.emit("shell:breadcrumb:v1", { leaf: null });
    };
  }, [leaf]);
}
export function useShellBreadcrumbSegment(segmentPath: string, label: string | undefined) {
  const platform = usePlatform();

  useEffect(() => {
    if (!label) return;

    platform?.events.emit("shell:breadcrumb:v1", { segments: { [segmentPath]: label } });

    return () => {
      platform?.events.emit("shell:breadcrumb:v1", { segments: { [segmentPath]: null } });
    };
  }, [segmentPath, label]);
}
