const osu = require('node-os-utils');
const cpu = osu.cpu;
const memory = osu.mem;
const os = osu.os;
const proc = osu.proc;

export const getComputerInformation = async () => {
  const cpuUsage = await cpu.usage();
  const memoryUsage = await memory.info();
  const totalProcesses = await proc.totalProcesses();
  const osUsage = await os.oos();
  const all = {
    cpuUsage,
    memoryUsage,
    totalProcesses,
    osUsage,
  };
  return all;
};
