import { readFile, writeFile } from 'fs/promises'
import Listr, { ListrTask } from 'listr'
import { join } from 'path'

import { SRC_DIR } from '../constants'
import { walkDirectory } from '../utils'

const ignoredFiles = new RegExp('.*\\.(json|patch|md)')
const licenseIgnore = new RegExp('(//) Ignore license in this file', 'g')
const fixableFiles = [{ regex: new RegExp('.*\\.js'), comment: '// ' }]

export function checkFile(path: string, noFix: boolean): ListrTask<any> {
  return {
    skip: () => ignoredFiles.test(path),
    title: path.replace(SRC_DIR, ''),
    task: async () => {
      const contents = (await readFile(path, 'utf8')).split('\n')

      const lines = [contents[0], contents[1], contents[2]].join('\n')
      const hasLicense =
        (lines.includes('the Mozilla Public') &&
          lines.includes('If a copy of the MPL was') &&
          lines.includes('http://mozilla.org/MPL/2.0/')) ||
        licenseIgnore.test(contents.join('\n'))

      if (!hasLicense) {
        const fixable = fixableFiles.find(({ regex }) => regex.test(path))

        if (!fixable || noFix) {
          throw new Error(
            `${path} does not have a license. Please add the source code header`
          )
        } else {
          const mpl = await readFile(
            join(__dirname, 'license-check.txt'),
            'utf8'
          )
          const { comment } = fixable

          const header = mpl
            .split('\n')
            .map((ln) => comment + ln)
            .join('\n')

          await writeFile(path, header + '\n' + contents.join('\n'))
        }
      }
    },
  }
}

interface Options {
  noFix: boolean
}

export const licenseCheck = async (options: Options): Promise<void> => {
  const files = await walkDirectory(SRC_DIR)

  await new Listr(
    files.map((file) => checkFile(file, options.noFix)),
    {
      concurrent: true,
      exitOnError: false,
    }
  ).run()
}
