const fs = require('fs');

type Item = {
  name: string;
  path: string;
  sizeMb: number;
  type: string;
};

async function getAll(path: string, fileArr: Item[]) {
  const files = await fs.promises.readdir(path);
  if (!files || files.length === 0) return [];
  (await Promise.all(
    files.map(async (file: any) => {
      try {
        const fileWPath = path === '/' ? `/${file}` : `${path}/${file}`;
        const stats = await fs.promises.stat(fileWPath);
        fileArr.push({
          name: file,
          path: fileWPath,
          sizeMb: stats.size / (1024 * 1024),
          type: stats.isDirectory() ? 'directory' : 'file',
        });
        //use recursion to get all files in subdirectories
        /*
        if (stats.isDirectory()) {
          await getAll(path + '/' + file, fileArr);
        }
        */
      } catch (e) {
        console.log(e);
      }
    })
  )) as unknown as Promise<Item[]>;
  return fileArr;
}

export async function getDirectory(props: { directoryPath: string }): Promise<Item[]> {
  const { directoryPath } = props;
  const data = getAll(directoryPath, []);
  return data;
}
