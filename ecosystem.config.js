let _sys = require('./Global/Settings/_system.json');
let botcuk = [
    {
name: "Mainframe",
namespace: "ANDALEFX",
script: 'andale.js',
watch: false,
exec_mode: "cluster",
max_memory_restart: "2G",
cwd: "./Server/Voucher"
 },
{
    name: "Controller",
    namespace: "ANDALEFX",
    script: 'andale.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Server/Controller"
  },
  {
    name: "Statistics",
    namespace: "ANDALEFX",
    script: 'andale.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Server/Statistics"
  },
  {
    name: "Sync",
    namespace: "ANDALEFX",
    script: 'andale.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Server/Sync"
  },
  {
    name: "Security_I",
    namespace: "ANDALEFX",
    script: 'andale.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Server/Guard_I"
  },
  {
    name: "Security_II",
    namespace: "ANDALEFX",
    script: 'andale.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Server/Guard_II"
  },
  {
    name: "Distributors",
    namespace: "ANDALEFX",
    script: 'andale.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Server/Distributors"
  },

  ]
if(_sys.TOKENS.WELCOME.Active) {
    botcuk.push(
    {
    name: "Voices",
    namespace: "ANDALEFX",
    script: 'Start.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Server/Welcome"
  }
  )
}
module.exports = {
  apps: botcuk
};
