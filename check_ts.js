const ts = require('typescript');

const fileName = 'src/components/dashboard/DashboardGuide.tsx';
const program = ts.createProgram([fileName], {
    noEmit: true,
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.ES2020,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
});

const diagnostics = ts.getPreEmitDiagnostics(program);

for (const diagnostic of diagnostics) {
    if (diagnostic.file && diagnostic.file.fileName.includes(fileName)) {
        const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        console.log(`Error at ${fileName}:${line + 1}:${character + 1} - ${message}`);
    }
}
if (diagnostics.length === 0) {
    console.log("No errors found!");
}
