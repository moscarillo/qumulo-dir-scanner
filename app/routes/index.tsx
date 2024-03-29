import { useEffect, useMemo, useRef, useState } from 'react';
import { useActionData, useFetcher, useLoaderData, useSubmit } from '@remix-run/react';
import { json } from '@remix-run/node';

import { getDirectory } from '~/services/directory.server';
import type { ActionFunction, LoaderFunction, MetaFunction } from '@remix-run/node';

type ActionData = {
  items: Item[];
};

type LoaderData = {
  items: Item[];
};

type Item = {
  name: string;
  path: string;
  sizeMb: number;
  type: string;
};

type MemoryUsage = {
  totalMemMb: number;
  usedMemMb: number;
};

const pageTitle = 'Directory Viewer';

export const meta: MetaFunction = () => ({
  title: `${pageTitle}`,
});

export const loader: LoaderFunction = async ({ request }) => {
  const directoryPath = '/Users';
  const items = await getDirectory({ directoryPath });
  return json<LoaderData>({
    items,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const directoryPath = formData.get('directoryPath')?.toString() || '';
  const items = await getDirectory({ directoryPath });
  return json<ActionData>({
    items,
  });
};

const removeLastPathElement = (path: string): string => {
  if (path) {
    return path.split('/').slice(0, -1).join('/');
  }
  return path;
};

const circleClassName =
  'flex h-40 w-40 shrink-0 flex-col items-center justify-center rounded-[50%] bg-indigo-500 pb-4 font-bold text-white';
const circleTextHeaderClassName = 'text-xl tracking-widest text-indigo-200';

export default function Index() {
  const submit = useSubmit();
  const fetch = useFetcher();

  const formRef = useRef<HTMLFormElement>();

  const loaderData = useLoaderData();
  const actionData = useActionData();

  const [CPU, setCPU] = useState<number>(0.0);
  const [osUsage, setOsUsage] = useState<string>();
  const [totalProcesses, setTotalProcesses] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsage>({
    totalMemMb: 100,
    usedMemMb: 0.001,
  });
  const [directoryPath, setDirectoryPath] = useState<string>('/');
  const [directorySize, setDirectorySize] = useState<number>();
  const data = actionData ? actionData : loaderData;

  useEffect(() => {
    const fetchData = () => {
      fetch.submit({}, { method: 'get', action: '/cpu' });
    };
    const interval = setInterval(() => {
      fetchData();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetch]);

  useEffect(() => {
    if (fetch.type === 'done') {
      setMemoryUsage({
        totalMemMb: fetch.data.compInfo.memoryUsage.totalMemMb,
        usedMemMb: fetch.data.compInfo.memoryUsage.usedMemMb,
      });
      setCPU(fetch.data.compInfo.cpuUsage);
      setOsUsage(fetch.data.compInfo.osUsage);
      setTotalProcesses(fetch.data.compInfo.totalProcesses);
    }
  }, [fetch]);

  useMemo(() => {
    if (data.items && data.items.length > 0) {
      setDirectorySize(data.items.reduce((acc: number, curr: Item) => acc + curr.sizeMb, 0));
      setDirectoryPath(
        removeLastPathElement(data.items[0].path) ? removeLastPathElement(data.items[0].path) : '/'
      );
    }
    data.items.sort((a: Item, b: Item) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }, [data]);

  const handleClick = (item: Item) => {
    if (item.type === 'directory') {
      const formData = new FormData(formRef.current);
      formData.set('directoryPath', item.path);
      submit(
        formData, //Notice this change
        { method: 'post', action: '' }
      );
    }
  };

  const handleBackClick = () => {
    const newDirectoryPath = removeLastPathElement(directoryPath);
    const formData = new FormData(formRef.current);
    formData.set('directoryPath', !newDirectoryPath ? '/' : newDirectoryPath);
    submit(
      formData, //Notice this change
      { method: 'post', action: '' }
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex w-full bg-indigo-800 p-4">
        <div>
          <img className="w-[200px]" alt="qumulo logo" src="/images/qumulo-logo.png" />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-16 bg-indigo-900 py-8 md:flex-row">
        <div className={circleClassName}>
          <div className={circleTextHeaderClassName}>CPU%</div>
          <div className="text-3xl">{CPU?.toFixed(2)}%</div>
        </div>
        <div className={circleClassName}>
          <div className={circleTextHeaderClassName}>MEM USE</div>
          <div className="text-3xl">
            {memoryUsage && ((memoryUsage?.usedMemMb / memoryUsage?.totalMemMb) * 100).toFixed(2)}%
          </div>
          <div className={`${circleTextHeaderClassName} text-xs`}>
            {`${(memoryUsage?.usedMemMb / 1000).toFixed(2).toLocaleString()}GB / ${(
              memoryUsage?.totalMemMb / 1000
            )
              .toFixed(2)
              .toLocaleString()}GB`}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-10 bg-indigo-500 p-2 font-bold text-white">
        <div className="flex items-center">
          <div className="text-white">OS:</div>
          <div className="ml-2 text-white">{osUsage}</div>
        </div>
        <div className="flex items-center">
          <div className="text-white">Processes:</div>
          <div className="ml-2 text-white">{totalProcesses}</div>
        </div>
      </div>

      <div className="flex flex-col bg-indigo-900 p-4">
        <div className="flex w-full justify-between p-4">
          <div
            onClick={() => handleBackClick()}
            className="flex shrink-0 cursor-pointer items-center text-white"
          >
            <span className="mr-1 text-2xl">&laquo;</span>
            <span className="text-2xl">Back</span>
          </div>
          <div
            className="justify-center overflow-hidden text-ellipsis whitespace-nowrap px-4 text-2xl text-white text-white"
            title={directoryPath === '' ? '/' : directoryPath}
          >
            {directoryPath === '' ? '/' : directoryPath}
          </div>
          <div className="flex shrink-0 text-xl text-white">
            <div className="mr-1">Content Size:</div>
            {directorySize && directorySize > 1000
              ? `${directorySize?.toFixed(2)} GB`
              : `${directorySize?.toFixed(2)} MB`}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center">
            <div className="h-[16px] w-[16px] bg-indigo-400" />
            <div className="ml-2 text-white">Directory</div>
          </div>
          <div className="flex items-center">
            <div className="h-[16px] w-[16px] bg-indigo-300" />
            <div className="ml-2 text-white">File</div>
          </div>
        </div>
        <div className="max-w- m-auto flex w-full max-w-screen-lg flex-wrap gap-2 p-6">
          {data.items.map((item: Item, idx: number) => {
            const width = item.type === 'directory' ? '19%' : `${0.9 * item.sizeMb + 12}vw`;
            const height = item.type === 'directory' ? '15%' : `${0.9 * item.sizeMb + 12}vh`;
            return item.name.startsWith('.') ? null : (
              <div
                key={`${item.name}_${idx}`}
                onClick={() => handleClick(item)}
                style={{
                  width: `${width}`,
                  maxHeight: `${height}`,
                }}
                className={`${
                  item.type === 'directory'
                    ? 'cursor-pointer bg-indigo-400 text-white'
                    : 'break-all bg-indigo-300'
                }  text-xxs flex flex-col overflow-hidden rounded p-4 text-sm drop-shadow-lg`}
              >
                <div className="flex flex-1 font-bold" title={item.name}>
                  {item.name}
                </div>
                {item.type !== 'directory' && (
                  <div className="flex flex-1 font-bold">{item.sizeMb.toFixed(2)} MB</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
