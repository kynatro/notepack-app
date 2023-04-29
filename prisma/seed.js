// import { PrismaClient } from '@prisma/client';
import os from 'os';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

// const prisma = new PrismaClient();
const CONFIG_FILE_NAME = '.notepack_config';
const CONFIG_FILE_PATH = path.resolve(os.homedir(), CONFIG_FILE_NAME);

function loadNotepackConfig() {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    return JSON.parse(`${fs.readFileSync(CONFIG_FILE_PATH)}`);
  }

  return false;
}

async function configureImport() {
  let configuration = {};
  const notepackConfig = loadNotepackConfig();

  if (notepackConfig) {
    configuration.path = notepackConfig.appRootFolder;
    configuration.baseFolders = notepackConfig.baseFolders;
  }

  configuration = {
    ...configuration,
    ...await inquirer.prompt({
      name: 'path',
      type: 'input',
      default: configuration.path,
      message: 'What is the path for your notepack-cli managed location?',
      validate: (answer) => {
        if (fs.existsSync(answer)) {
          return true;
        }

        return `${answer} is not a valid file path`
      }
    }),
    ...await inquirer.prompt({
      name: 'baseFolders',
      type: 'input',
      default: configuration.baseFolders.join(', '),
      message: 'What base folders do you want to include?'
    })
  }

  const { proceed } = await inquirer.prompt({
    type: 'confirm',
    name: 'proceed',
    message: `You are about to import all notes, todos, projects, and persons from the ${configuration.baseFolders} folders in ${configuration.path}. This will take some time, are you sure you would like to proceed?`
  });

  if (proceed) {
    await processNotepack(configuration);
  } else {
    console.log('Aborted import!');
  }
}

async function processNotepack({ path, baseFolders }) {
  console.log('processNotepack', path, baseFolders);
}

async function seed() {
  const { proceed } = await inquirer.prompt({
    type: 'confirm',
    name: 'proceed',
    message: 'Would you like to import notes from an existing notepack-cli managed location?'
  });

  if (proceed) {
    await configureImport();
  }

  return false;
}

seed()
  // .then(async () => {
  //   await prisma.$disconnect();
  // })
  // .catch(async (e) => {
  //   console.error(e)
  //   await prisma.$disconnect();
  //   process.exit(1);
  // });
