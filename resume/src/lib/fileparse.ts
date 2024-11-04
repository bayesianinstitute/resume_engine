import { PrepResource } from "@/types/interview";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { marked } from "marked";

export function parsePreparationResources(text: string): PrepResource[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const resources: PrepResource[] = [];

  let currentType: "topic" | "question" | "tip" | null = null;
  let buffer: string[] = [];
  let currentTitle: string = "";

  lines.forEach((line) => {
    if (line.startsWith("**Key Skills:**")) {
      if (buffer.length && currentType) {
        resources.push({
          title: currentTitle,
          content: buffer.join("\n"),
          type: currentType,
        });
      }
      currentType = "topic";
      currentTitle = "Key Skills";
      buffer = [];
    } else if (line.startsWith("**Interview Questions:**")) {
      if (buffer.length && currentType) {
        resources.push({
          title: currentTitle,
          content: buffer.join("\n"),
          type: currentType,
        });
      }
      currentType = "question";
      currentTitle = "Interview Questions";
      buffer = [];
    } else if (line.startsWith("**Preparation Tips:**")) {
      if (buffer.length && currentType) {
        resources.push({
          title: currentTitle,
          content: buffer.join("\n"),
          type: currentType,
        });
      }
      currentType = "tip";
      currentTitle = "Preparation Tips";
      buffer = [];
    } else {
      buffer.push(line);
    }
  });

  if (buffer.length && currentType) {
    resources.push({
      title: currentTitle,
      content: buffer.join("\n"),
      type: currentType,
    });
  }

  return resources;
}

export const downloadPrepResourcePDF = (prepResources: PrepResource[]) => {
  if (!prepResources || prepResources.length === 0) {
    alert("No preparation resources to download.");
    return;
  }

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text("Interview Preparation Resources", 10, 10);
  doc.setFontSize(12);
  doc.text("Tailored resources based on the job description:", 10, 20);

  // Starting vertical position
  let verticalPosition = 30; // Start below the title

  // Add each resource to the PDF
  prepResources.forEach((resource) => {
    doc.setFontSize(14);
    doc.text(resource.title, 10, verticalPosition);
    verticalPosition += 5; // Add a small space after the title

    doc.setFontSize(12);
    const splitContent = doc.splitTextToSize(resource.content, 190); // Split text to fit the page width
    doc.text(splitContent, 10, verticalPosition);
    verticalPosition += splitContent.length * 5 + 10; // Update position for the next resource
  });

  // Save the PDF
  doc.save("interview_preparation_resources.pdf");
};

const convertMarkdownToParagraphs = async (markdown: string): Promise<Paragraph[]> => {
  const htmlContent =await marked(markdown);
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const paragraphs = Array.from(doc.body.childNodes).filter(
    (node): node is Element => node.nodeType === Node.ELEMENT_NODE
  );

  return paragraphs.flatMap((element) => {
    if (element.nodeName === "P") {
      return new Paragraph({
        children: [new TextRun(element.textContent || "")],
      });
    } else if (element.nodeName === "UL") {
      return Array.from(element.children).map(
        (li) =>
          new Paragraph({
            children: [new TextRun(`• ${li.textContent || ""}`)],
          })
      );
    } else {
      return [];
    }
  });
};

export const downloadPrepResourcesDocx = async (prepResources: PrepResource[]) => {
  if (!prepResources || prepResources.length === 0) {
    alert("No preparation resources to download.");
    return;
  }

  // Initialize sections with the title
  const sections = [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Interview Preparation Resources",
              bold: true,
              size: 32,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Tailored resources based on the job description:",
            }),
          ],
        }),
      ],
    },
  ];

  // Add each resource section
  for (const resource of prepResources) {
    const resourceContentParagraphs = await convertMarkdownToParagraphs(resource.content);
    sections.push({
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: resource.title,
              bold: true,
              size: 24,
            }),
          ],
        }),
        ...resourceContentParagraphs,
        new Paragraph({ text: "" }), // Add a blank line for spacing
      ],
    });
  }

  // Create the document with all sections at once
  const doc = new Document({
    sections,
  });

  // Save the document as a .docx file
  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "interview_preparation_resources.docx");
  });
};
