import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

export function postbuild(): void {
  if (existsSync('package.json')) {
    const outputs: [string, string, string][] = [];
    const packageText: string = readFileSync('package.json').toString();
    const packageJson: { exports: string[] } = JSON.parse(packageText);

    for (const sourcePath of packageJson.exports) {
      const sourceFile: string = join(sourcePath, 'package.json');

      if (existsSync(sourceFile)) {
        const sourceText: string = readFileSync(sourceFile).toString();
        const sourceJson: Record<string, any> = JSON.parse(sourceText);
        const targetList: Record<string, string> = { };

        for (const [key, value] of Object.entries(sourceJson)) {
          switch (key) {
            case 'bin':
            case 'main':
            case 'module':
            case 'types':
            case 'unpkg':
              targetList[key] = value;
              break;

            case 'source':
              delete sourceJson[key];
              break;
          }
        }

        if (Object.keys(targetList).length > 1) {
          const sorted: string[] = Object.values(targetList).sort();
          const [a, b]: [string, string] = [sorted.shift()!, sorted.pop()!];

          let i = 0; while (i < a.length && a[i] === b[i]) i++;
          const targetPath: string = join(sourcePath, a.substring(0, i));
          const targetFile: string = join(targetPath, 'package.json');

          for (const key in targetList) {
            const originPath: string = join(sourcePath, targetList[key]);
            targetList[key] = relative(targetPath, originPath);
          }

          const targetJson: object = { ...sourceJson, ...targetList };
          const targetText: string = JSON.stringify(targetJson);
          outputs.push([sourceFile, targetFile, targetText]);
        }
      }
    }

    if (outputs.length) {
      console.log('Replicating exported package.json');
      const [_, g, b] = ['\x1b[0m', '\x1b[32m', '\x1b[34m'];
      for (const [sourceFile, targetFile, targetText] of outputs) {
        console.log(b, sourceFile, g, '→', b, targetFile, _);
        writeFileSync(targetFile, targetText);
      }
    }
  }
}
