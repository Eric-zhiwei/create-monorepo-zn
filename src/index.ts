#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'node:path';
import inquirer from 'inquirer';

const TEMPLATE_DIR = path.join(__dirname, '../templates');

async function createMonorepo(): Promise<void> {
  try {
    console.log('Creating a Monorepo project scaffold...\n');

    const { folderName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'folderName',
        message: 'Please enter the project folder name:',
        default: 'my-monorepo-project',
        validate: (input: string) => {
          if (!input || !input.trim()) {
            return 'Folder name is required.';
          }

          const trimmedInput = input.trim();

          if (/[A-Z]/.test(trimmedInput)) {
            return 'Folder name must use lowercase characters only.';
          }

          if (!/^[a-z0-9-]+$/.test(trimmedInput)) {
            return 'Folder name can only contain lowercase letters, numbers, and hyphens.';
          }

          if (fs.existsSync(path.join(process.cwd(), trimmedInput))) {
            return 'The folder already exists. Please choose another name.';
          }

          return true;
        },
        filter: (input: string) => (input ? input.toLowerCase().trim() : ''),
      },
    ]);

    if (!folderName) {
      console.error('Folder name is required.');
      process.exit(1);
    }

    const targetDir = path.join(process.cwd(), folderName);
    const packageName = folderName.toLowerCase().trim();

    console.log(`Creating project: ${folderName}`);

    await fs.ensureDir(targetDir);

    console.log('Copying template files...');
    await fs.copy(TEMPLATE_DIR, targetDir);

    const rootPackageJsonPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(rootPackageJsonPath)) {
      console.log('Updating root package.json...');
      const rootPackageJson = await fs.readJson(rootPackageJsonPath);
      rootPackageJson.name = packageName;
      await fs.writeJson(rootPackageJsonPath, rootPackageJson, { spaces: 2 });
    }

    console.log('Updating workspace package names...');
    await updateSubpackages(targetDir, packageName);

    console.log('\nProject created successfully.');
    console.log(`Package name: ${packageName}`);
    console.log(`Workspace scope: @${packageName}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\nFailed to create the project:', errorMessage);
    process.exit(1);
  }
}

async function updateSubpackages(rootDir: string, packageName: string): Promise<void> {
  const subpackagesDirs = ['apps', 'packages'];

  for (const dir of subpackagesDirs) {
    const subpackagesPath = path.join(rootDir, dir);

    if (!(await fs.pathExists(subpackagesPath))) {
      continue;
    }

    const subdirs = await fs.readdir(subpackagesPath);

    for (const subdir of subdirs) {
      const packageJsonPath = path.join(subpackagesPath, subdir, 'package.json');

      if (!(await fs.pathExists(packageJsonPath))) {
        continue;
      }

      const packageJson = await fs.readJson(packageJsonPath);

      if (!packageJson.name) {
        continue;
      }

      let subPackageName = subdir;

      if (packageJson.name.includes('/')) {
        subPackageName = packageJson.name.split('/').pop() ?? subdir;
      } else if (!packageJson.name.startsWith('@')) {
        subPackageName = packageJson.name;
      }

      packageJson.name = `@${packageName}/${subPackageName.toLowerCase()}`;

      updatePackageDependencies(packageJson, packageName);

      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }
  }
}

type PackageJsonWithDependencies = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function updatePackageDependencies(
  packageJson: PackageJsonWithDependencies,
  packageName: string,
): void {
  const dependencyTypes: Array<keyof PackageJsonWithDependencies> = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ];

  for (const depType of dependencyTypes) {
    if (!packageJson[depType]) {
      continue;
    }

    const updatedDeps: Record<string, string> = {};

    for (const [depName, version] of Object.entries(packageJson[depType])) {
      if (depName.startsWith('@template/')) {
        const subPackageName = depName.split('@template/')[1];
        updatedDeps[`@${packageName}/${subPackageName.toLowerCase()}`] = version;
      } else {
        updatedDeps[depName] = version;
      }
    }

    packageJson[depType] = updatedDeps;
  }
}

void createMonorepo();
