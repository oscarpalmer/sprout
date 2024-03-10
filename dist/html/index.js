// src/html/index.ts
function html(strings, ...expressions) {
  const { length } = strings;
  let html2 = "";
  let index = 0;
  for (;index < length; index += 1) {
    html2 += `${strings[index]}${expressions[index] ?? ""}`;
  }
  return html2;
}
export {
  html
};
