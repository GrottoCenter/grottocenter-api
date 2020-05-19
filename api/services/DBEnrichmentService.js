/**
 */

let childProcess = require('child_process');

module.exports = {
  /**
   * Launches the execution of the database enrichment script
   * @param scriptPath (String) : path where the script is located
   * @param args ([String]) : arguments (country and type) specified for the script's execution's scope and type
   */
  runScript: (scriptPath, args, callback) => {
    // keep track of whether callback has been invoked to prevent multiple invocations
    let invoked = false;

    let process = childProcess.fork(scriptPath, args);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function(err) {
      if (invoked) return;
      invoked = true;
      callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function(code) {
      if (invoked) return;
      invoked = true;
      let err = code === 0 ? null : new Error('exit code ' + code);
      callback(err);
    });
  },

  /**
   * Returns a promise, true if a process with the script's name is running, false otherwise
   * @param processName (String) : The name of the script or process
   */
  isScriptRunning: async (processName) => {
    // specifies the right command to execute
    const cmd = (() => {
      switch (process.platform) {
        case 'win32':
          return `tasklist`;
        case 'darwin':
          return `ps -ax | grep ${processName}`;
        case 'linux':
          return `ps -A`;
        default:
          return false;
      }
    })();

    return new Promise((resolve, reject) => {
      require('child_process').exec(cmd, (err, stdout, stderr) => {
        if (err) reject(err);

        resolve(stdout.toLowerCase().indexOf(processName.toLowerCase()) > -1);
      });
    });
  },
};
