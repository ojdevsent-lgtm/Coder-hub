const $ = s => document.querySelector(s);

const SNIPPETS = {
  javascript: [
    ['Function', 'function name(params) {\n  // code\n}'],
    ['Async function', 'async function name() {\n  try {\n    // await work\n  } catch (error) {\n    console.error(error);\n  }\n}'],
    ['Fetch API', 'const response = await fetch(url);\nconst data = await response.json();'],
    ['For loop', 'for (let i = 0; i < items.length; i++) {\n  console.log(items[i]);\n}'],
    ['Arrow function', 'const name = (value) => {\n  return value;\n};'],
    ['Try / catch', 'try {\n  // code\n} catch (error) {\n  console.error(error);\n}']
  ],
  typescript: [
    ['Interface', 'interface User {\n  id: string;\n  name: string;\n}'],
    ['Function', 'function name(value: string): string {\n  return value;\n}'],
    ['Async function', 'async function load(): Promise<void> {\n  // await work\n}'],
    ['Type alias', 'type Status = "idle" | "loading" | "success" | "error";']
  ],
  python: [
    ['Function', 'def function_name(value):\n    """Describe the function."""\n    return value'],
    ['Class', 'class User:\n    def __init__(self, name):\n        self.name = name'],
    ['For loop', 'for item in items:\n    print(item)'],
    ['List comprehension', '[item for item in items if item]'],
    ['Try / except', 'try:\n    # code\nexcept Exception as error:\n    print(error)']
  ],
  java: [
    ['Class', 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'],
    ['Method', 'public static void method(String value) {\n    // code\n}'],
    ['For loop', 'for (int i = 0; i < items.length; i++) {\n    System.out.println(items[i]);\n}'],
    ['Try / catch', 'try {\n    // code\n} catch (Exception e) {\n    e.printStackTrace();\n}']
  ],
  kotlin: [
    ['Function', 'fun functionName(value: String): String {\n    return value\n}'],
    ['Data class', 'data class User(val id: String, val name: String)'],
    ['Coroutine', 'suspend fun loadData() {\n    // suspend work\n}']
  ],
  c: [
    ['Main', '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}'],
    ['Function', 'void function_name(int value) {\n    /* code */\n}'],
    ['For loop', 'for (int i = 0; i < count; i++) {\n    printf("%d\\n", i);\n}']
  ],
  cpp: [
    ['Main', '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!\\n";\n    return 0;\n}'],
    ['Function', 'void functionName(int value) {\n    // code\n}'],
    ['Class', 'class User {\npublic:\n    std::string name;\n};']
  ],
  csharp: [
    ['Main', 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}'],
    ['Class', 'public class User {\n    public string Name { get; set; }\n}'],
    ['Async', 'public async Task LoadAsync() {\n    await Task.CompletedTask;\n}']
  ],
  go: [
    ['Main', 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'],
    ['Function', 'func functionName(value string) string {\n    return value\n}'],
    ['Struct', 'type User struct {\n    ID   string\n    Name string\n}']
  ],
  rust: [
    ['Main', 'fn main() {\n    println!("Hello, World!");\n}'],
    ['Function', 'fn function_name(value: &str) -> &str {\n    value\n}'],
    ['Struct', 'struct User {\n    id: String,\n    name: String,\n}']
  ],
  php: [
    ['Page', '<?php\n\necho "Hello, World!";'],
    ['Function', 'function functionName($value) {\n    return $value;\n}'],
    ['Class', 'class User {\n    public function __construct(public string $name) {}\n}']
  ],
  ruby: [
    ['Method', 'def method_name(value)\n  value\nend'],
    ['Class', 'class User\n  def initialize(name)\n    @name = name\n  end\nend'],
    ['Each loop', 'items.each do |item|\n  puts item\nend']
  ],
  swift: [
    ['Function', 'func functionName(_ value: String) -> String {\n    return value\n}'],
    ['Struct', 'struct User {\n    let id: String\n    let name: String\n}'],
    ['Async', 'func loadData() async throws {\n    // await work\n}']
  ],
  dart: [
    ['Main', 'void main() {\n  print("Hello, World!");\n}'],
    ['Function', 'String functionName(String value) {\n  return value;\n}'],
    ['Class', 'class User {\n  final String name;\n  User(this.name);\n}']
  ],
  r: [
    ['Function', 'function_name <- function(value) {\n  return(value)\n}'],
    ['Data frame', 'data <- data.frame(\n  name = c("Ada", "Grace"),\n  score = c(95, 98)\n)'],
    ['For loop', 'for (item in items) {\n  print(item)\n}']
  ],
  scala: [
    ['Object', 'object Main extends App {\n  println("Hello, World!")\n}'],
    ['Function', 'def functionName(value: String): String = {\n  value\n}'],
    ['Case class', 'case class User(id: String, name: String)']
  ],
  lua: [
    ['Function', 'function functionName(value)\n  return value\nend'],
    ['For loop', 'for i = 1, #items do\n  print(items[i])\nend'],
    ['Table', 'local user = {\n  name = "Developer",\n  active = true\n}']
  ],
  perl: [
    ['Script', '#!/usr/bin/perl\nuse strict;\nuse warnings;\n\nprint "Hello, World!\\n";'],
    ['Function', 'sub function_name {\n    my ($value) = @_;\n    return $value;\n}']
  ],
  shell: [
    ['Script', '#!/usr/bin/env bash\nset -euo pipefail\n\necho "Hello, World!"'],
    ['Variable', 'NAME="Coder Hub"\necho "$NAME"'],
    ['Loop', 'for item in "${items[@]}"; do\n  echo "$item"\ndone']
  ],
  sql: [
    ['Select', 'SELECT id, name\nFROM users\nWHERE active = true\nORDER BY created_at DESC;'],
    ['Create table', 'CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name VARCHAR(120) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);'],
    ['Insert', 'INSERT INTO users (name)\nVALUES (\'Developer\');'],
    ['Join', 'SELECT u.name, p.title\nFROM users u\nJOIN projects p ON p.owner_id = u.id;']
  ],
  html: [
    ['HTML5 page', '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>'],
    ['Form', '<form>\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required>\n  <button type="submit">Submit</button>\n</form>'],
    ['Card', '<article class="card">\n  <h2>Title</h2>\n  <p>Description</p>\n</article>']
  ],
  css: [
    ['Responsive block', '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 1rem;\n}'],
    ['Flex layout', '.row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n}'],
    ['Media query', '@media (max-width: 768px) {\n  .container {\n    padding: 0.75rem;\n  }\n}'],
    ['Button', '.button {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0.7rem 1rem;\n  border-radius: 0.5rem;\n  cursor: pointer;\n}']
  ],
  scss: [['Nested component', '.card {\n  padding: 1rem;\n  .title {\n    font-weight: 700;\n  }\n  &:hover {\n    transform: translateY(-2px);\n  }\n}']],
  json: [['Object', '{\n  "name": "Coder Hub",\n  "version": "1.0.0",\n  "enabled": true\n}']],
  yaml: [['Config', 'name: coder-hub\nversion: 1.0.0\nservices:\n  app:\n    enabled: true']],
  markdown: [['Document', '# Title\n\n## Section\n\nWrite your content here.\n\n- Item one\n- Item two']],
  sqlserver: [['Query', 'SELECT TOP 10 *\nFROM users\nORDER BY created_at DESC;']],
  postgres: [['Query', 'SELECT id, name\nFROM users\nWHERE active = TRUE\nLIMIT 20;']],
  graphql: [['Query', 'query GetUsers {\n  users {\n    id\n    name\n    email\n  }\n}'], ['Type', 'type User {\n  id: ID!\n  name: String!\n  email: String!\n}']],
  kotlin_script: [['Script', 'println("Hello, World!")']],
  objectivec: [['Class', '@interface User : NSObject\n@property(nonatomic, copy) NSString *name;\n@end']],
  vue: [['Component', '<script setup>\nconst message = "Hello, Vue!"\n</script>\n\n<template>\n  <h1>{{ message }}</h1>\n</template>']],
  svelte: [['Component', '<script>\n  let count = 0;\n</script>\n\n<button on:click={() => count++}>\n  Clicked {count} times\n</button>']],
  jsx: [['Component', 'function App() {\n  return (\n    <main>\n      <h1>Hello, World!</h1>\n    </main>\n  );\n}']],
  tsx: [['Component', 'export default function App() {\n  return (\n    <main>\n      <h1>Hello, World!</h1>\n    </main>\n  );\n}']],
  angular: [['Component', '@Component({\n  selector: "app-root",\n  template: `<h1>Hello, World!</h1>`\n})\nexport class AppComponent {}']],
  solidity: [['Contract', 'pragma solidity ^0.8.0;\n\ncontract Counter {\n  uint256 public count;\n\n  function increment() public {\n    count += 1;\n  }\n}']],
  haskell: [['Function', 'functionName :: String -> String\nfunctionName value = value']],
  elixir: [['Module', 'defmodule User do\n  def hello(name) do\n    "Hello, #{name}!"\n  end\nend']],
  groovy: [['Class', 'class User {\n  String name\n}']],
  zig: [['Main', 'const std = @import("std");\n\npub fn main() !void {\n    const stdout = std.io.getStdOut().writer();\n    try stdout.print("Hello, World!\\n", .{});\n}']],
  raku: [['Function', 'sub function-name(Str $value) {\n  $value\n}']]
};

const EXTENSIONS = {
  js:'javascript', mjs:'javascript', cjs:'javascript', ts:'typescript', tsx:'tsx', jsx:'jsx',
  py:'python', java:'java', kt:'kotlin', kts:'kotlin_script', c:'c', h:'c', cc:'cpp', cpp:'cpp', hpp:'cpp',
  cs:'csharp', go:'go', rs:'rust', php:'php', rb:'ruby', swift:'swift', dart:'dart', r:'r', scala:'scala',
  lua:'lua', pl:'perl', pm:'perl', sh:'shell', bash:'shell', zsh:'shell', sql:'sql', html:'html', htm:'html',
  css:'css', scss:'scss', sass:'scss', json:'json', yml:'yaml', yaml:'yaml', md:'markdown', markdown:'markdown',
  graphql:'graphql', gql:'graphql', m:'objectivec', mm:'objectivec', vue:'vue', svelte:'svelte', sol:'solidity',
  hs:'haskell', ex:'elixir', exs:'elixir', groovy:'groovy', zig:'zig', raku:'raku'
};

function currentLanguage() {
  const label = $('#fileLabel')?.textContent?.trim() || 'main.js';
  const ext = label.includes('.') ? label.split('.').pop().toLowerCase() : 'js';
  return EXTENSIONS[ext] || 'javascript';
}

function insertSnippet(text) {
  const editor = document.querySelector('#codeEditor .cm-content');
  if (!editor) return false;
  editor.focus();
  try {
    const ok = document.execCommand('insertText', false, text);
    if (ok) return true;
  } catch (_) {}
  return false;
}

function copySnippet(text, button) {
  navigator.clipboard?.writeText(text).then(() => {
    const old = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => button.textContent = old, 900);
  }).catch(() => {});
}

function renderSnippets() {
  const lang = currentLanguage();
  const list = SNIPPETS[lang] || SNIPPETS.javascript;
  const title = $('#snippetLanguage');
  if (title) title.textContent = lang.toUpperCase();
  const box = $('#snippetList');
  if (!box) return;
  box.innerHTML = list.map((item, i) => `<div class="snippet-item"><div class="snippet-copy"><strong>${item[0]}</strong><code>${item[1].split('\n')[0].replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></div><button class="snippet-insert" data-snippet="${i}">Insert</button></div>`).join('');
  box.querySelectorAll('[data-snippet]').forEach(btn => btn.onclick = () => {
    const snippet = list[Number(btn.dataset.snippet)][1];
    if (!insertSnippet(snippet)) copySnippet(snippet, btn);
  });
}

function mount() {
  if ($('#snippetPanel')) return;
  const editorPanel = $('.editor-panel');
  if (!editorPanel) return;
  const panel = document.createElement('aside');
  panel.id = 'snippetPanel';
  panel.className = 'snippet-panel';
  panel.innerHTML = `<div class="snippet-head"><div><span class="snippet-kicker">CODE SNIPPETS</span><strong id="snippetLanguage">JAVASCRIPT</strong></div><button id="snippetClose" class="snippet-close" title="Close snippets">×</button></div><div id="snippetList" class="snippet-list"></div>`;
  editorPanel.parentNode.insertBefore(panel, editorPanel.nextSibling);
  $('#snippetClose').onclick = () => panel.classList.toggle('snippet-hidden');
  renderSnippets();
  new MutationObserver(() => renderSnippets()).observe($('#fileLabel'), {childList:true,characterData:true,subtree:true});
}

const boot = setInterval(() => { if ($('#fileLabel') && $('.editor-panel')) { clearInterval(boot); mount(); } }, 250);
window.CoderHubSnippets = { render: renderSnippets, insert: insertSnippet };
