# About
Automatically copy go package path

Installation for VSCode: https://marketplace.visualstudio.com/items?itemName=xhd2015.copy-go-package-path

# Debug
Copy everything in vscode-init to .vscode, then Press 'F5'.

# Pack the extension
Pack the whole extension: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
```bash
# this command will generate the file:
#   some-0.0.1.vsix
vsce package
```

# Publish the extesion
See https://code.visualstudio.com/api/working-with-extensions/publishing-extension

```sh
npm install -g @vscode/vsce

# before package, should update version in package.json
vsce package

vsce login <publisher> # need input token
vsce publish
```



or package using docker
```sh
docker run -it --rm -v $PWD:/src node:20-alpine sh -xc 'npm install -g @vscode/vsce && cd src && vsce package'

docker run -it --rm -v $PWD:/src node:20-alpine sh -xc 'npm install -g @vscode/vsce && cd src && vsce login <publisher> && vsce publish'
```

Or you can also upload vsix file manually via https://marketplace.visualstudio.com/manage/publishers/<publisher> (right click on the extension you want to upload, click 'Update')