// import { PrismaClient } from '@prisma/client';
import os from 'os';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { input, confirm } from '@inquirer/prompts';
import { asyncForEach } from '../lib/asyncForEach.js';

// const prisma = new PrismaClient();
const HOME_DIR = os.homedir();
const CONFIG_FILE_NAME = '.notepack_config';
const CONFIG_FILE_PATH = path.resolve(os.homedir(), CONFIG_FILE_NAME);
const VALID_FILE_EXTNAME = '.md';
const README_BASENAME = 'readme';

function includedFoldersFormatter(includedFolders) {
  return `${includedFolders}`.split(',').map(includedFolder => includedFolder.trim());
}

function loadNotepackConfig() {
  if (existsSync(CONFIG_FILE_PATH)) {
    return JSON.parse(`${readFileSync(CONFIG_FILE_PATH)}`);
  }

  return false;
}

async function configureImport() {
  let configuration = {
    basePath: path.resolve(HOME_DIR, 'Notes'),
    includedFolders: ['Personal']
  };
  const notepackConfig = loadNotepackConfig();
  
  if (notepackConfig) {
    configuration.basePath = notepackConfig.appRootFolder;
    configuration.includedFolders = notepackConfig.baseFolders;
    configuration.teamFolder = notepackConfig.teamFolder;
  }

  configuration.basePath = await input({
    default: configuration.basePath,
    message: 'What is the path for your notepack-cli managed location?',
    validate: (answer) => {
      if (existsSync(answer)) {
        return true;
      }

      return `${answer} is not a valid file path`
    }
  });

  configuration.includedFolders = includedFoldersFormatter(await input({
    default: configuration.includedFolders.join(', '),
    message: 'What base folders do you want to include (leave blank to parse all folders)?'
  }));

  configuration.teamFolder = await input({
    default: configuration.teamFolder,
    message: 'What is the folder path for team notes?'
  });

  const proceed = await confirm({
    default: true,
    message: `You are about to import all notes, todos, projects, and persons from the ${configuration.includedFolders} folders in ${configuration.basePath}. This will take some time, are you sure you would like to proceed?`
  });

  if (proceed) {
    await processNotepack(configuration);
  } else {
    console.log('Aborted import!');
  }
}

async function processFile(filePath) {
  console.log(`PROCESSING FILE: ${filePath}`);

  let manifest = {
    path: filePath,
    status: 'pending'
  }

  try {
    manifest.content = `${readFileSync(manifest.path)}`;
    // TODO: Extract note title
    // TODO: Extract note content
    // TODO: Extract todos
    // TODO: Extract persons from @references in todos
  } catch (err) {
    manifest.status = 'invalid'
    manifest.error = err;
  }

  return manifest;
}

async function processFolder(folderPath) {
  console.log(`PROCESSING FOLDER: ${folderPath}`);

  const nodes = readdirSync(folderPath);
  let manifest = {
    path: folderPath,
    children: []
  };

  await asyncForEach(nodes, async (node) => {
    const nodePath = path.resolve(folderPath, node);
    const nodeExtname = path.extname(node);
    const nodeBasename = path.basename(node, nodeExtname);
    const nodeStats = statSync(nodePath);

    if (nodeStats.isDirectory()) {
      // TODO: Extract Project name
      // TODO: Extract Person name
      manifest.children.push(await processFolder(nodePath));
    } else if (nodeExtname == VALID_FILE_EXTNAME && nodeBasename.toLowerCase() !== README_BASENAME) {
      manifest.children.push(await processFile(nodePath));
    }
  });

  return manifest;
}

async function processNotepack({ basePath, includedFolders = [] }) {
  let folderPaths = includedFolders.map((includedFolder) => path.resolve(basePath, includedFolder));
  let manifest = [];

  if (!folderPaths.length) {
    folderPaths.push(basePath);
  }

  await asyncForEach(folderPaths, async (folderPath) => {
    const nodeStats = statSync(folderPath);

    if (existsSync(folderPath) && nodeStats.isDirectory()) {
      manifest.push(await processFolder(folderPath));
    }
  });

  console.log(JSON.stringify(manifest, null, 2));
}

async function seed() {
  const proceed = await confirm({
    default: true,
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
