import * as fs from "fs/promises"
import * as path from "path"
import * as child_process from "child_process"

export async function getPkgPath(file: string): Promise<string | undefined> {
    let absDir = path.resolve(file)
    const stat = await fs.stat(absDir)
    if (!stat.isDirectory()) {
        absDir = path.dirname(absDir)
    }
    const absGoModDir = await findGoMod(absDir)
    if (!absGoModDir) {
        return undefined
    }
    const vendorDir = path.join(absGoModDir, "vendor")
    const vendorStat = await fs.stat(vendorDir).catch(e => null)
    if (vendorStat != null && vendorStat.isDirectory() && absDir.startsWith(vendorDir)) {
        // file under vendor
        return path.relative(vendorDir, absDir)
    }

    let modPath: string | undefined
    const useFile = true
    if (!useFile) {
        const goModOutput = await exec("go mod edit -json", absGoModDir)
        const goMod = JSON.parse(goModOutput)
        modPath = goMod.Module?.Path
    } else {
        modPath = await parseModPathFromGoMod(path.join(absGoModDir, "go.mod"))
    }
    if (!modPath) {
        return undefined
    }
    let relPath = path.relative(absGoModDir, absDir)
    if (path.sep !== '/') {
        relPath = relPath.replace(path.sep, "/")
    }
    if (!relPath) {
        return modPath
    }
    return modPath + "/" + relPath
}

// module github.com/xhd2015/..
async function parseModPathFromGoMod(file: string): Promise<string | undefined> {
    const MODULE = "module"
    const content = await fs.readFile(file, { encoding: 'utf-8' })
    const lines = content.split("\n")
    for (const line of lines) {
        const stripLine = line.trim()
        if (!stripLine.startsWith(MODULE)) {
            continue
        }
        const c = stripLine.at(MODULE.length)
        if (c !== ' ' && c !== '\t') {
            continue
        }
        let remain = stripLine.slice(MODULE.length + 1)
        if (!remain) {
            continue
        }
        let commentIdx = remain.indexOf("//")
        let spaceIdx = remain.indexOf(" ")
        let tabIdx = remain.indexOf("\t")

        let endIdx = commentIdx
        if (endIdx < 0 || (spaceIdx >= 0 && spaceIdx < endIdx)) {
            endIdx = spaceIdx
        }
        if (endIdx < 0 || (tabIdx >= 0 && tabIdx < endIdx)) {
            endIdx = tabIdx
        }
        if (endIdx >= 0) {
            return remain.slice(0, endIdx)
        }
        return remain
    }
    return undefined
}

async function findGoMod(dir: string): Promise<string | undefined> {
    if (!dir) {
        return undefined
    }
    while (true) {
        const file = path.join(dir, "go.mod")
        const stat = await fs.stat(file).catch(e => null)
        if (stat != null && stat.isFile()) {
            return dir
        }
        const newDir = path.dirname(dir)
        if (newDir === dir) {
            return undefined
        }
        dir = newDir
    }
}
async function exec(cmd: string, dir: string): Promise<string> {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, {
            cwd: dir,
        }, (err, stdout) => {
            if (err) {
                reject(new Error('run go mod edit -json:' + err.message))
                return
            }
            resolve(stdout)
        })
    })

}