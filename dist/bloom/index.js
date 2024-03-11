// src/bloom/index.ts
function bloom(strings, ...expressions) {
  const { length } = strings;
  let html = "";
  let index = 0;
  for (;index < length; index += 1) {
    html += `${strings[index]}${expressions[index] ?? ""}`;
  }
  return html;
}
export {
  bloom
};
