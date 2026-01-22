// os stub for browser
const os = {
  platform: () => 'browser',
  type: () => 'Browser',
  arch: () => 'wasm',
  release: () => '1.0.0',
  hostname: () => 'localhost',
  homedir: () => '/',
  tmpdir: () => '/tmp',
  cpus: () => [{ model: 'Browser', speed: 0 }],
  totalmem: () => 0,
  freemem: () => 0,
  uptime: () => 0,
  loadavg: () => [0, 0, 0],
  networkInterfaces: () => ({}),
  userInfo: () => ({ username: 'browser', uid: -1, gid: -1, shell: null, homedir: '/' }),
  endianness: () => 'LE',
  EOL: '\n',
  constants: { signals: {}, errno: {} },
};
export default os;
export const { platform, type, arch, release, hostname, homedir, tmpdir, cpus, totalmem, freemem, uptime, loadavg, networkInterfaces, userInfo, endianness, EOL, constants } = os;
