import { useEffect } from "react";

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export function useMetaDescription(description: string | undefined) {
  useEffect(() => {
    if (!description) return;

    const ensure = (selector: string, attrName: string, attrValue: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      const previous = el.getAttribute("content");
      el.setAttribute("content", description);
      return () => {
        if (previous === null) el.remove();
        else el.setAttribute("content", previous);
      };
    };

    const cleanupName = ensure(
      'meta[name="description"]',
      "name",
      "description",
    );
    const cleanupOg = ensure(
      'meta[property="og:description"]',
      "property",
      "og:description",
    );

    return () => {
      cleanupName();
      cleanupOg();
    };
  }, [description]);
}
