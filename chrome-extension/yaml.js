// Small YAML 1.1 subset parser for kubeconfig and Kubernetes manifests.
// Supports maps, lists, quoted scalars, comments, |/> blocks, and --- docs.
// No anchors, tags, or merge keys.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.parseYaml = api.parseYaml;
    root.parseYamlDocuments = api.parseYamlDocuments;
  }
})(typeof self !== "undefined" ? self : this, function () {
  function parseYaml(text) {
    const docs = parseYamlDocuments(text);
    if (docs.length === 0) {
      return null;
    }
    return docs.length === 1 ? docs[0] : docs;
  }

  function parseYamlDocuments(text) {
    const normalized = String(text || "").replace(/\r\n/g, "\n");
    const chunks = [];
    let current = [];

    function flush() {
      const body = current.join("\n").trim();
      current = [];
      if (body && body !== "---" && body !== "...") {
        chunks.push(body);
      }
    }

    for (const line of normalized.split("\n")) {
      if (/^\s*---\s*$/.test(line) || /^\s*\.\.\.\s*$/.test(line)) {
        flush();
        continue;
      }
      current.push(line);
    }
    flush();

    return chunks
      .map((chunk) => parseDocument(chunk))
      .filter((doc) => doc !== undefined);
  }

  function parseDocument(text) {
    const lines = tokenize(text);
    if (lines.length === 0) {
      return undefined;
    }
    const result = parseNode(lines, 0, 0);
    return result.value;
  }

  function tokenize(text) {
    const lines = [];
    for (const raw of text.split("\n")) {
      if (/^\s*$/.test(raw) || /^\s*#/.test(raw)) {
        continue;
      }
      const indent = raw.match(/^ */)[0].length;
      const content = stripInlineComment(raw.slice(indent));
      if (!content) {
        continue;
      }
      lines.push({ indent, content });
    }
    return lines;
  }

  function stripInlineComment(value) {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle && value[i - 1] !== "\\") {
        inDouble = !inDouble;
      } else if (ch === "#" && !inSingle && !inDouble) {
        if (i === 0 || /\s/.test(value[i - 1])) {
          return value.slice(0, i).trimEnd();
        }
      }
    }
    return value;
  }

  function parseNode(lines, index, minIndent) {
    if (index >= lines.length || lines[index].indent < minIndent) {
      return { value: null, next: index };
    }
    if (lines[index].content.startsWith("- ") || lines[index].content === "-") {
      return parseSequence(lines, index, lines[index].indent);
    }
    return parseMapping(lines, index, lines[index].indent);
  }

  function parseSequence(lines, index, indent) {
    const items = [];
    let i = index;
    while (i < lines.length) {
      const line = lines[i];
      if (line.indent !== indent || !(line.content.startsWith("- ") || line.content === "-")) {
        break;
      }
      const rest = line.content === "-" ? "" : line.content.slice(2);
      if (!rest) {
        if (i + 1 < lines.length && lines[i + 1].indent > indent) {
          const nested = parseNode(lines, i + 1, indent + 1);
          items.push(nested.value);
          i = nested.next;
        } else {
          items.push(null);
          i += 1;
        }
        continue;
      }
      if (isBlockIndicator(rest)) {
        const block = parseBlockScalar(lines, i + 1, indent + 1, rest);
        items.push(block.value);
        i = block.next;
        continue;
      }
      if (looksLikeMappingKey(rest)) {
        const fake = [{ indent: indent + 2, content: rest }];
        let j = i + 1;
        while (j < lines.length && lines[j].indent > indent) {
          fake.push(lines[j]);
          j += 1;
        }
        items.push(parseMapping(fake, 0, indent + 2).value);
        i = j;
        continue;
      }
      items.push(parseScalar(rest));
      i += 1;
    }
    return { value: items, next: i };
  }

  function parseMapping(lines, index, indent) {
    const map = {};
    let i = index;
    while (i < lines.length) {
      const line = lines[i];
      if (line.indent < indent) {
        break;
      }
      if (line.indent !== indent) {
        break;
      }
      if (line.content.startsWith("- ") || line.content === "-") {
        break;
      }
      const split = splitKeyValue(line.content);
      if (!split) {
        break;
      }
      const { key, value } = split;
      if (isBlockIndicator(value)) {
        const block = parseBlockScalar(lines, i + 1, indent + 1, value);
        map[key] = block.value;
        i = block.next;
        continue;
      }
      if (value !== "") {
        map[key] = parseScalar(value);
        i += 1;
        continue;
      }
      if (i + 1 < lines.length && lines[i + 1].indent > indent) {
        const nested = parseNode(lines, i + 1, indent + 1);
        map[key] = nested.value;
        i = nested.next;
      } else if (
        i + 1 < lines.length &&
        lines[i + 1].indent === indent &&
        (lines[i + 1].content.startsWith("- ") || lines[i + 1].content === "-")
      ) {
        // Compact sequence: key at the same indent as its "-" items (kubeconfig).
        const nested = parseSequence(lines, i + 1, indent);
        map[key] = nested.value;
        i = nested.next;
      } else {
        map[key] = null;
        i += 1;
      }
    }
    return { value: map, next: i };
  }

  function looksLikeMappingKey(text) {
    return Boolean(splitKeyValue(text));
  }

  function splitKeyValue(text) {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle && text[i - 1] !== "\\") {
        inDouble = !inDouble;
      } else if (ch === ":" && !inSingle && !inDouble) {
        const next = text[i + 1];
        if (next === undefined || /\s/.test(next)) {
          return {
            key: parseScalar(text.slice(0, i).trim()),
            value: text.slice(i + 1).trim(),
          };
        }
      }
    }
    return null;
  }

  function isBlockIndicator(value) {
    return /^[|>][+-]?\d*$/.test(value);
  }

  function parseBlockScalar(lines, index, minIndent, indicator) {
    const folded = indicator.startsWith(">");
    const chomp = indicator.includes("-") ? "strip" : indicator.includes("+") ? "keep" : "clip";
    const collected = [];
    let i = index;
    while (i < lines.length && lines[i].indent >= minIndent) {
      collected.push(" ".repeat(lines[i].indent - minIndent) + lines[i].content);
      i += 1;
    }
    let text = folded ? collected.join(" ").replace(/ +/g, " ") : collected.join("\n");
    if (chomp === "strip") {
      text = text.replace(/\n+$/, "");
    } else if (chomp === "clip") {
      text = text.replace(/\n+$/, "\n");
    }
    return { value: text, next: i };
  }

  function parseScalar(raw) {
    if (raw === "" || raw === "null" || raw === "Null" || raw === "NULL" || raw === "~") {
      return null;
    }
    if (raw === "true" || raw === "True" || raw === "TRUE") {
      return true;
    }
    if (raw === "false" || raw === "False" || raw === "FALSE") {
      return false;
    }
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      return unquote(raw);
    }
    if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(raw)) {
      return Number(raw);
    }
    return raw;
  }

  function unquote(raw) {
    if (raw.startsWith("'")) {
      return raw.slice(1, -1).replace(/''/g, "'");
    }
    return raw
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }

  return { parseYaml, parseYamlDocuments };
});
