import { json } from '@remix-run/node';

import { getComputerInformation } from '~/services/os.server';

import type { ActionFunction } from '@remix-run/node';

type ActionData = {
  compInfo: {
    cpuUsage: number;
    memoryUsage: {
      totalMemMb: string;
      usedMemMb: string;
      freeMemMb: string;
      freeMemPercentage: string;
    };
    osUsage: string;
    totalProcesses: number;
  };
};

export const loader: ActionFunction = async () => {
  const compInfo = await getComputerInformation();
  console.log('jmo', compInfo);
  return json<ActionData>({ compInfo }, 200);
};
