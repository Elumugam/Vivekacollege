// Application export utilities – PDF (jspdf) and Excel (xlsx)
// These run entirely in the browser; no server calls needed.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ApplicationRow {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  courseTitle?: string;
  course?: string;
  courseId?: string;
  courseType?: string;
  dob?: string;
  gender?: string;
  address?: string;
  qualification?: string;
  documents?: any[];
  created_at?: string;
}

const HEADERS = [
  "Name",
  "Email",
  "Phone",
  "Course",
  "Course Type",
  "DOB",
  "Gender",
  "Address",
  "Qualification",
  "Documents",
  "Submission Date",
];

const toRow = (r: ApplicationRow): string[] => [
  r.fullName || r.name || "",
  r.email || "",
  r.mobile || r.phone || "",
  r.courseTitle || r.course || r.courseId || "",
  r.courseType || "",
  r.dob || "",
  r.gender || "",
  r.address || "",
  r.qualification || "",
  Array.isArray(r.documents) && r.documents.length
    ? r.documents
        .map((d: any) => d.originalName || d.fileName || d.filePath || "")
        .filter(Boolean)
        .join(", ")
    : "",
  r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "",
];

export function exportApplicationsPdf(rows: ApplicationRow[], filename = "applications.pdf") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Viveka College – Applications", 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN")}   Total: ${rows.length}`,
    14,
    21
  );

  autoTable(doc, {
    head: [HEADERS],
    body: rows.map(toRow),
    startY: 26,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [10, 45, 90], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 239, 230] },
    margin: { left: 14, right: 14 },
  });

  doc.save(filename);
}

export function exportApplicationsXlsx(rows: ApplicationRow[], filename = "applications.xlsx") {
  const wsData: string[][] = [HEADERS, ...rows.map(toRow)];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 22 }, // Name
    { wch: 28 }, // Email
    { wch: 18 }, // Phone
    { wch: 24 }, // Course
    { wch: 14 }, // Course Type
    { wch: 12 }, // DOB
    { wch: 10 }, // Gender
    { wch: 32 }, // Address
    { wch: 20 }, // Qualification
    { wch: 30 }, // Documents
    { wch: 16 }, // Submission Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applications");
  XLSX.writeFile(wb, filename);
}
