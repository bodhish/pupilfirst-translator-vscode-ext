const vscode = require('vscode');
const fs = require('fs');
const yaml = require('js-yaml');
var path = require("path");
var _ = require('lodash');

// copied from https://stackoverflow.com/a/7794127/8926926
function deepen(obj) {
	const result = {};

	// For each object path (property key) in the object
	for (const objectPath in obj) {
		// Split path into component parts
		const parts = objectPath.split('.');

		// Create sub-objects along path as needed
		let target = result;
		while (parts.length > 1) {
			const part = parts.shift();
			target = target[part] = target[part] || {};
		}

		// Set value at end of path
		target[parts[0]] = obj[objectPath]
	}

	return result;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('pupilfirst-translator.translate', async function () {
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;
			const textSelection = document.getText(selection);
			try {
				const file = vscode.workspace.getConfiguration().get('pupilfirst.translation.path');
				let fileContents = fs.readFileSync(file, 'utf8');
				if (fileContents !== undefined) {
					// convert yaml to json
					let data = yaml.load(fileContents);
					// Get file name
					let fileName = path.basename(vscode.window.activeTextEditor.document.fileName).split('.')[0]
					// Get key for user
					const keys = await vscode.window.showInputBox({
						placeHolder: 'Add key',
					});

					if (keys !== undefined) {
						// Processs the key to match the object shape
						let result = {}
						result[keys] = textSelection.replace("\"", "").replace("\"", "")
						// Create an empty object with file name if its not present
						if (data['en']['components'][fileName] === undefined) {
							data['en']['components'][fileName] = {}
						}
						// Add the result to json
						data['en']['components'][fileName] = _.merge(data['en']['components'][fileName], deepen(result))
						// Replace selection with key
						editor.edit(builder => builder.replace(selection, "t(\"" + keys + "\")"))
						// Write json to Yaml
						fs.writeFile(file, yaml.dump(data, { noCompatMode: true, lineWidth: 10000, sortKeys: true }), (err) => {
							if (err) {
								console.log(err);
							}
						});
					}
				} else {
					vscode.window.showInformationMessage("Error: Please configure pupilfirst.translation.path in your settings");
				}
			} catch (e) {
				vscode.window.showInformationMessage(e);
			}
			vscode.window.setStatusBarMessage('Translated successfully', 2000);
		}
		vscode.window.showInformationMessage('Done!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
