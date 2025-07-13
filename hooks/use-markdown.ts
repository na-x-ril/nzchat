import { useState, useCallback } from "react";

export function useMarkdownToggle(initial = false) {
  const [markdownEnabled, setMarkdownEnabled] = useState(initial);

  const toggleMarkdown = useCallback(() => {
    setMarkdownEnabled((prev) => !prev);
  }, []);

  const enableMarkdown = useCallback(() => {
    setMarkdownEnabled(true);
  }, []);

  const disableMarkdown = useCallback(() => {
    setMarkdownEnabled(false);
  }, []);

  return {
    markdownEnabled,
    toggleMarkdown,
    enableMarkdown,
    disableMarkdown,
  };
}
