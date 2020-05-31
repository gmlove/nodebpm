var codeEditor = CodeMirror.fromTextArea(document.getElementById("data"), {
    matchBrackets: true,
    autoCloseBrackets: true,
    matchTags: {bothTags: true},
    autoCloseTags: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lint: true,
    mode: "application/ld+json",
    lineNumbers: true,
    lineWrapping: true,
    spellcheck: true,
    indentUnit: 4,
    theme: 'base16-light'
});
codeEditor.setSize(null, 150);

var contentEditor = CodeMirror.fromTextArea(document.getElementById("content"), {
    mode: "text/html",
    matchBrackets: true,
    autoCloseBrackets: true,
    matchTags: {bothTags: true},
    autoCloseTags: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lint: true,
    lineNumbers: true,
    spellcheck: true,
    indentUnit: 4,
    theme: 'base16-light'
});
contentEditor.setSize(null, 450);

var scriptEditor = CodeMirror.fromTextArea(document.getElementById("script"), {
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    matchTags: {bothTags: true},
    autoCloseTags: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lint: true,
    spellcheck: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    indentUnit: 4,
    theme: 'base16-light'
});
scriptEditor.setSize(null, 450);

