import fs from "fs";
import path from "path";
import handlebars from "handlebars";

export const renderTemplate = (templateName, data) => {
  try {

    const templatePath = path.join(
      process.cwd(),
      "src",
      "view",
      `${templateName}.hbs`
    );

    const source = fs.readFileSync(templatePath, "utf8");

    const template = handlebars.compile(source);

    const html = template(data);

    return html;

  } catch (error) {
    console.error("Template rendering error:", error);
    throw new Error("Failed to render email template");
  }
};