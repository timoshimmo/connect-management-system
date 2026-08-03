import { useMemo, useState } from "react";

interface Document {
  type: string;
  department: string;
  title: string;
  docId: string;
  publishedDate: string;
  /** Drawing Register-only — absent/empty for Read Site documents. */
  discipline?: string;
}

const TAB_TYPE_MAP: { [key: string]: string } = {
  onshore: "Onshore",
  "offshore-mayo-abo": "Offshore – Mayo ABO",
};

type SortValue = "newest" | "oldest" | "title";

interface DocumentFilters {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  department: string;
  setDepartment: React.Dispatch<React.SetStateAction<string>>;
  type: string;
  setType: React.Dispatch<React.SetStateAction<string>>;
  discipline: string;
  setDiscipline: React.Dispatch<React.SetStateAction<string>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  sortValue: SortValue;
  setSortValue: React.Dispatch<React.SetStateAction<SortValue>>;
  filteredDocuments: Document[];
  clearFilters: () => void;
}

/**
 * Encapsulates all filter/sort/tab state for the document list so the
 * ReadSite page component stays focused on layout/composition.
 */
export function useDocumentFilters(
  allDocuments: Document[],
  initialDepartment: string = "all"
): DocumentFilters {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState(initialDepartment);
  const [type, setType] = useState("all");
  const [discipline, setDiscipline] = useState("all");
  const [activeTab, setActiveTab] = useState("recently-updated");
  const [sortValue, setSortValue] = useState<SortValue>("newest");

  const filteredDocuments = useMemo(() => {
    let result: Document[] = [...allDocuments];

    const tabType = TAB_TYPE_MAP[activeTab];
    if (tabType) {
      // A document whose location is "Both" belongs on both the Onshore and
      // Offshore tabs, not neither — plain equality would silently exclude it.
      result = result.filter((doc) => doc.type === tabType || doc.type === 'Both');
    }

    if (department !== "all") {
      result = result.filter(
        (doc) =>
          doc.department.toLowerCase().replace(/\s+&\s+|\s+/g, "-") ===
          department,
      );
    }

    if (type !== "all") {
      result = result.filter((doc) => doc.type === type);
    }

    if (discipline !== "all") {
      result = result.filter((doc) => doc.discipline === discipline);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.docId.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (sortValue === "newest") {
        return (
          new Date(b.publishedDate).getTime() -
          new Date(a.publishedDate).getTime()
        );
      }
      if (sortValue === "oldest") {
        return (
          new Date(a.publishedDate).getTime() -
          new Date(b.publishedDate).getTime()
        );
      }
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [allDocuments, activeTab, department, type, discipline, query, sortValue]);

  const clearFilters = () => {
    setQuery("");
    setDepartment("all");
    setType("all");
    setDiscipline("all");
  };

  return {
    query,
    setQuery,
    department,
    setDepartment,
    type,
    setType,
    discipline,
    setDiscipline,
    activeTab,
    setActiveTab,
    sortValue,
    setSortValue,
    filteredDocuments,
    clearFilters,
  };
}
