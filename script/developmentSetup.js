/* eslint no-console: "off" */
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const scriptPath = __dirname;
const dockerConfFolder = path.join(scriptPath, '../docker/');

function hasBin(name) {
  // https://github.com/springernature/hasbin/blob/master/lib/hasbin.js
  function fileExistsSync(filePath) {
    try {
      return fs.statSync(filePath).isFile();
    } catch (error) {
      return false;
    }
  }
  function getPaths(bin) {
    const envPath = process.env.PATH || '';
    const envExt = process.env.PATHEXT || '';
    return envPath
      .replace(/["]+/g, '')
      .split(path.delimiter)
      .map((chunk) =>
        envExt.split(path.delimiter).map((ext) => path.join(chunk, bin + ext))
      )
      .flat();
  }

  for (const aPath of getPaths(name)) {
    if (fileExistsSync(aPath)) return true;
  }
  return false;
}

function run(cwd, name, args) {
  childProcess.spawnSync(name, args, {
    cwd,
    stdio: 'inherit',
  });
}

function checkIfNotInstalled(name) {
  process.stdout.write(`Is "${name}" installed: `);
  if (!hasBin(name)) {
    console.log('Not found');
    console.log(
      `Error: Make sure "${name}" is installed and available in the path`
    );
    return true;
  }
  console.log('Found');
  return false;
}

function upCommand() {
  console.log('Will launch the developement environment for Grottocenter API');

  if (checkIfNotInstalled('docker')) return;
  if (checkIfNotInstalled('docker-compose')) return;

  process.stdout.write('Checking development env: ');
  const dockerEnvPath = path.join(scriptPath, '../docker/.env');
  if (!fs.existsSync(dockerEnvPath)) {
    const dockerEnvSamplePath = path.join(scriptPath, '../docker/sample.env');
    fs.copyFileSync(dockerEnvSamplePath, dockerEnvPath);
    console.log('Created');
  }
  console.log('Ok');

  console.log(
    'Launching docker containers: docker-compose up --remove-orphans -d'
  );
  run(dockerConfFolder, 'docker-compose', ['up', '--remove-orphans', '-d']);
  console.log('All containers started');
}

function stopCommand() {
  console.log('Will remove the developement environment for Grottocenter API');

  if (checkIfNotInstalled('docker')) process.exit(1);
  if (checkIfNotInstalled('docker-compose')) process.exit(1);

  console.log('Stoping docker containers: docker-compose stop');
  run(dockerConfFolder, 'docker-compose', ['stop']);
  console.log('All containers are stoped');
}

function downCommand() {
  console.log('Will remove the developement environment for Grottocenter API');

  if (checkIfNotInstalled('docker')) process.exit(1);
  if (checkIfNotInstalled('docker-compose')) process.exit(1);

  console.log('Stoping docker containers: docker-compose down');
  run(dockerConfFolder, 'docker-compose', ['down']);
  console.log('All containers where removed');
}

function main() {
  const command = process.argv[2];
  if (!['up', 'stop', 'down'].includes(command)) {
    console.log(`Usage: ${process.argv.slice(0, 2).join(' ')} up|stop|down`);
    console.log();
    console.log(
      'Launch, stop or remove the developement setup required for Grottocenter API'
    );
    console.log('Note: Docker and Docker-compose must be installed');
    return;
  }

  if (command === 'up') upCommand();
  if (command === 'stop') stopCommand();
  if (command === 'down') downCommand();
}
main();
