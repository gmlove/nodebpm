(function (_, $) {

    var commonOpts = {
        matchBrackets: true,
        autoCloseBrackets: true,
        matchTags: { bothTags: true },
        autoCloseTags: true,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        lint: true,
        lineNumbers: true,
        lineWrapping: true,
        spellcheck: true,
        indentUnit: 4,
        theme: 'base16-light'
    };

    var codeEditor = CodeMirror.fromTextArea(
        document.getElementById("data"),
        _.merge(commonOpts, { mode: "application/ld+json" })
    );
    codeEditor.setSize(null, 150);

    var contentEditor = CodeMirror.fromTextArea(
        document.getElementById("content"),
        _.merge(commonOpts, { mode: "text/html" })
    );
    contentEditor.setSize(null, 450);

    var scriptEditor = CodeMirror.fromTextArea(
        document.getElementById("script"),
        _.merge(commonOpts, { mode: "javascript" })
    );
    scriptEditor.setSize(null, 450);


    $.ajax({
        url: "bp.html",
        context: document.body
    }).done(function () {
        console.log('done');
    });

})(_, $)
