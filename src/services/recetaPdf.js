export const downloadRecipePdf = async (recipe) => {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const textWidth = pageWidth - margin * 2;
  let y = 22;

  const addPageIfNeeded = (height = 8) => {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };
  const addSection = (title) => {
    addPageIfNeeded(14);
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(40, 112, 67);
    pdf.text(title.toLocaleUpperCase("es"), margin, y);
    y += 7;
  };
  const addParagraph = (text, options = {}) => {
    const { bold = false, indent = 0 } = options;
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(46, 58, 54);
    const lines = pdf.splitTextToSize(String(text || "-"), textWidth - indent);
    lines.forEach((line) => {
      addPageIfNeeded(6);
      pdf.text(line, margin + indent, y);
      y += 5;
    });
  };

  pdf.setFillColor(20, 103, 66);
  pdf.rect(0, 0, pageWidth, 37, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("RECETA NUTRICIONAL", margin, 17);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(pdf.splitTextToSize(recipe.nombre || "Receta", textWidth).slice(0, 1), margin, 27);
  y = 49;

  addParagraph(`Categoría: ${recipe.categoria || "-"}   |   Tipo: ${recipe.tipoComida || "-"}   |   Objetivo: ${recipe.objetivo || "-"}`);
  addParagraph(`Preparación: ${Number(recipe.tiempoPreparacion) || 0} min   |   ${Number(recipe.calorias) || 0} kcal por porción   |   Porciones: ${Number(recipe.porciones) || 1}`);
  if (recipe.descripcion) {
    addSection("Descripción");
    addParagraph(recipe.descripcion);
  }

  addSection("Ingredientes");
  (recipe.ingredientes || []).forEach((ingredient) => {
    const calories = (Number(ingredient.cantidad) * Number(ingredient.caloriasPor100) / 100) || 0;
    addParagraph(
      `${ingredient.nombre}: ${ingredient.cantidad} ${ingredient.unidad} — ${Math.round(calories)} kcal`,
      { indent: 2 },
    );
  });

  addSection("Preparación");
  (recipe.pasos || []).forEach((step, index) => {
    addParagraph(`${index + 1}. ${step.titulo} (${Number(step.minutos) || 0} min)`, { bold: true });
    addParagraph(step.descripcion, { indent: 4 });
  });

  const safeName = (recipe.nombre || "receta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  pdf.save(`receta-${safeName || "nutricional"}.pdf`);
};
