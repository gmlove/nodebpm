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
        spellcheck: true,
        indentUnit: 4,
        theme: 'base16-light'
    };

    var dataEditor = CodeMirror.fromTextArea(
        document.getElementById("data"),
        _.merge(commonOpts, { mode: "application/ld+json" })
    );
    dataEditor.setSize(null, 150);

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

    var submitBtn = $('#run-test-btn'),
        successMsg = $('#success-msg'),
        errorMsg = $('#error-msg');


    function hideMessage() {
        successMsg.hide();
        errorMsg.hide();
    }

    function showError(msg) {
        successMsg.hide();
        errorMsg.text(msg);
        errorMsg.show();
    }

    function showSuccess(msg) {
        errorMsg.hide();
        successMsg.text(msg);
        successMsg.show();
    }

    submitBtn.click(function() {
        submitBtn.prop('disabled', true);
        hideMessage();
        let data = null;
        try {
            data = JSON.parse(dataEditor.getValue());
        } catch (err) {
            submitBtn.prop('disabled', false);
            showError('Unable to parse the initial data as json: ' + err.message);
            return;
        }

        let success = false;
        fetch('bp/test', {
            method: 'POST',
            body: JSON.stringify({ content: contentEditor.getValue(), script: scriptEditor.getValue(), data: data }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            success = response.status === 200;
            return response.json();
        })
        .then(result => {
            submitBtn.prop('disabled', false);
            if (success) {
                showSuccess('Test success! Result: ' + result.result);
            } else {
                showError('Test failed, please check your input! Error: ' + result.message);
            }
        })
        .catch(err => {
            submitBtn.prop('disabled', false);
            showError('Test failed: ' + err.message);
        });

    });


})(_, $)
