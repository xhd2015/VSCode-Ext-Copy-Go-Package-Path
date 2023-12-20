// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from "child_process"
import { stat } from "fs/promises"
import { dirname } from "path"

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "copy-go-package-path" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('copy-go-package-path.copy-pakage-path', (uri: vscode.Uri) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const workDir = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || ''
		if (!workDir) {
			vscode.window.showWarningMessage('workspace not open');
			return
		}

		let relPath = uri.path
		if (!relPath.startsWith(workDir)) {
			vscode.window.showWarningMessage('selected file not in current workspace');
			return
		}
		relPath = relPath.slice(workDir.length)
		if (relPath.startsWith("/")) {
			relPath = relPath.slice(1)
		}
		const getGoModPath = () => {
			return new Promise((resolve, reject) => {
				child_process.exec("go mod edit -json", {
					cwd: workDir,
				}, (err, stdout) => {
					if (err) {
						reject(new Error('run go mod edit -json:' + err.message))
						return
					}
					const goMod = JSON.parse(stdout)
					resolve(goMod.Module?.Path)
				})
			})
		}
		const fn = async function () {
			const goModPath = await getGoModPath()
			const fileStat = await stat(uri.path)
			if (!fileStat.isDirectory()) {
				relPath = dirname(relPath)
			}
			vscode.env.clipboard.writeText(goModPath + "/" + relPath);
		}
		fn().catch(e => {
			vscode.window.showWarningMessage(e.message);
		})
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
